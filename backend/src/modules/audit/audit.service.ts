import { prisma } from '../../config/prisma';
import { RealtimeEvents } from '../../shared';
import { emitToUser } from '../../realtime/socket';

export interface CreateAuditLogParams {
  userId: string;
  action: 'DELETE' | 'UPDATE' | 'BALANCE_ADJUST' | 'RESTORE' | 'TRANSFER';
  entity: 'TRANSACTION' | 'ACCOUNT' | 'THIRD_PARTY' | 'PROJECT' | 'PROJECT_ITEM' | 'TRANSFER';
  entityId: string;
  description: string;
  previousData?: any;
  newData?: any;
}

export class AuditService {
  static async log(params: CreateAuditLogParams, txClient?: any) {
    const db = txClient || prisma;
    const entry = await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        description: params.description,
        previousData: params.previousData ? JSON.stringify(params.previousData) : null,
        newData: params.newData ? JSON.stringify(params.newData) : null,
      },
    });

    emitToUser(params.userId, RealtimeEvents.AUDIT_LOG_CREATED, entry);
    return entry;
  }

  static async getAuditDashboard(userId: string) {
    const [logs, deletedTransactions] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.transaction.findMany({
        where: { userId, isDeleted: true },
        orderBy: { deletedAt: 'desc' },
        include: {
          account: true,
          thirdParty: true,
          project: true,
          splits: {
            include: { thirdParty: true },
          },
        },
      }),
    ]);

    return {
      logs,
      deletedTransactions,
    };
  }

  static async restoreTransaction(userId: string, transactionId: string) {
    const existing = await prisma.transaction.findFirst({
      where: { id: transactionId, userId, isDeleted: true },
      include: {
        account: true,
        thirdParty: true,
        project: true,
        splits: { include: { thirdParty: true } },
      },
    });

    if (!existing) {
      throw new Error('El registro eliminado no fue encontrado o ya fue restaurado.');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Re-aplicar impacto en la moneda nativa de la cuenta financiera
      let nativeAmount = existing.amountOriginal;
      if (existing.currency !== existing.account.currency) {
        if (existing.account.currency === 'USD') {
          nativeAmount = existing.amountUSD;
        } else if (existing.currency === 'USD') {
          nativeAmount = Number((existing.amountOriginal * (existing.exchangeRate || 1)).toFixed(2));
        }
      }
      const balanceApply = existing.type === 'INCOME' ? nativeAmount : -nativeAmount;
      const updatedAccount = await tx.account.update({
        where: { id: existing.accountId },
        data: {
          balance: { increment: balanceApply },
        },
      });

      const restored = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
        include: {
          account: true,
          thirdParty: true,
          project: true,
          splits: { include: { thirdParty: true } },
        },
      });

      await AuditService.log(
        {
          userId,
          action: 'RESTORE',
          entity: 'TRANSACTION',
          entityId: restored.id,
          description: `Restauración de movimiento "${restored.title}" (${restored.type === 'INCOME' ? '+' : '-'}${restored.amountOriginal} ${restored.currency}) en cuenta ${restored.account.name}`,
          previousData: { isDeleted: true, deletedAt: existing.deletedAt },
          newData: { isDeleted: false, balanceRestored: balanceApply },
        },
        tx
      );

      return { restored, updatedAccount };
    });

    emitToUser(userId, RealtimeEvents.TRANSACTION_CREATED, result.restored);
    emitToUser(userId, RealtimeEvents.ACCOUNT_UPDATED, { account: result.updatedAccount });
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return result.restored;
  }
}

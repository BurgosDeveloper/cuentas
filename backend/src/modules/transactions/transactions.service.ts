import { prisma } from '../../config/prisma';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  FilterTransactions,
  RealtimeEvents,
} from '../../shared';
import { emitToUser } from '../../realtime/socket';
import { AuditService } from '../audit/audit.service';

export class TransactionsService {
  private static computeNativeAccountAmount(
    amountOriginal: number,
    txCurrency: string,
    amountUSD: number,
    exchangeRate: number,
    accountCurrency: string
  ): number {
    if (txCurrency === accountCurrency) {
      return Number(amountOriginal.toFixed(2));
    }
    if (accountCurrency === 'USD') {
      return Number(amountUSD.toFixed(2));
    }
    if (txCurrency === 'USD') {
      return Number((amountOriginal * (exchangeRate || 1)).toFixed(2));
    }
    return Number(amountOriginal.toFixed(2));
  }

  static async getTransactions(userId: string, filters: FilterTransactions) {
    const where: any = { userId, isDeleted: false };

    if (filters.status === 'pending') {
      where.isSettled = false;
    } else if (filters.status === 'settled') {
      where.isSettled = true;
    }

    if (filters.type && filters.type !== 'all') {
      where.type = filters.type;
    }

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.thirdPartyId) {
      where.OR = [
        { thirdPartyId: filters.thirdPartyId },
        { splits: { some: { thirdPartyId: filters.thirdPartyId } } },
      ];
    }

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: { id: true, name: true, currency: true, color: true },
        },
        thirdParty: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, name: true, color: true },
        },
        splits: {
          include: {
            thirdParty: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: [{ isSettled: 'asc' }, { date: 'desc' }, { createdAt: 'desc' }],
    });

    return transactions;
  }

  static async createTransaction(userId: string, data: CreateTransactionInput) {
    const account = await prisma.account.findFirst({
      where: { id: data.accountId, userId },
    });

    if (!account) {
      throw new Error('Cuenta financiera no encontrada.');
    }

    const rate = data.currency === 'USD' ? 1.0 : data.exchangeRate || 1.0;
    const amountUSD =
      data.currency === 'USD'
        ? data.amountOriginal
        : Number((data.amountOriginal / rate).toFixed(2));

    const nativeAmount = this.computeNativeAccountAmount(
      data.amountOriginal,
      data.currency,
      amountUSD,
      rate,
      account.currency
    );

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId,
          title: data.title.trim(),
          type: data.type,
          amountOriginal: data.amountOriginal,
          currency: data.currency,
          exchangeRate: rate,
          amountUSD,
          accountId: data.accountId,
          thirdPartyId: data.thirdPartyId || null,
          projectId: data.projectId || null,
          isSettled: data.isSettled,
          settledAt: data.isSettled ? new Date() : null,
          date: data.date ? new Date(data.date) : new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          note: data.note?.trim() || null,
        },
      });

      if (data.splits && data.splits.length > 0) {
        await tx.transactionSplit.createMany({
          data: data.splits.map((s) => ({
            transactionId: transaction.id,
            thirdPartyId: s.thirdPartyId,
            amount: s.amount,
            note: s.note?.trim() || null,
          })),
        });
      }

      const balanceChange = data.type === 'INCOME' ? nativeAmount : -nativeAmount;
      const updatedAccount = await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: { increment: balanceChange },
        },
      });

      const fullTransaction = await tx.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          account: true,
          thirdParty: true,
          project: true,
          splits: {
            include: { thirdParty: true },
          },
        },
      });

      return { transaction: fullTransaction!, updatedAccount };
    });

    emitToUser(userId, RealtimeEvents.TRANSACTION_CREATED, result.transaction);
    emitToUser(userId, RealtimeEvents.ACCOUNT_UPDATED, { account: result.updatedAccount });
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return result.transaction;
  }

  static async updateTransaction(userId: string, id: string, data: UpdateTransactionInput) {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId, isDeleted: false },
      include: {
        account: true,
        thirdParty: true,
        project: true,
        splits: { include: { thirdParty: true } },
      },
    });

    if (!existing) {
      throw new Error('Transacción no encontrada.');
    }

    const nextType = data.type ?? existing.type;
    const nextAmountOriginal = data.amountOriginal ?? existing.amountOriginal;
    const nextCurrency = data.currency ?? existing.currency;
    const nextExchangeRate =
      nextCurrency === 'USD' ? 1.0 : data.exchangeRate ?? existing.exchangeRate ?? 1.0;
    const nextAccountId = data.accountId ?? existing.accountId;
    const nextAmountUSD =
      nextCurrency === 'USD'
        ? nextAmountOriginal
        : Number((nextAmountOriginal / nextExchangeRate).toFixed(2));
    const nextIsSettled = data.isSettled ?? existing.isSettled;

    const targetAccount = await prisma.account.findFirst({
      where: { id: nextAccountId, userId },
    });
    if (!targetAccount) {
      throw new Error('La cuenta seleccionada no es válida.');
    }

    const oldNativeAmount = this.computeNativeAccountAmount(
      existing.amountOriginal,
      existing.currency,
      existing.amountUSD,
      existing.exchangeRate,
      existing.account.currency
    );

    const newNativeAmount = this.computeNativeAccountAmount(
      nextAmountOriginal,
      nextCurrency,
      nextAmountUSD,
      nextExchangeRate,
      targetAccount.currency
    );

    const result = await prisma.$transaction(async (tx) => {
      // 1. Revertir el efecto anterior en la cuenta original
      const oldRevert = existing.type === 'INCOME' ? -oldNativeAmount : oldNativeAmount;
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: oldRevert } },
      });

      // 2. Aplicar el nuevo efecto en la cuenta destino
      const newApply = nextType === 'INCOME' ? newNativeAmount : -newNativeAmount;
      const updatedAccount = await tx.account.update({
        where: { id: nextAccountId },
        data: { balance: { increment: newApply } },
      });

      // 3. Actualizar splits si fueron enviados
      if (data.splits !== undefined) {
        await tx.transactionSplit.deleteMany({
          where: { transactionId: id },
        });
        if (data.splits.length > 0) {
          await tx.transactionSplit.createMany({
            data: data.splits.map((s) => ({
              transactionId: id,
              thirdPartyId: s.thirdPartyId,
              amount: s.amount,
              note: s.note?.trim() || null,
            })),
          });
        }
      }

      // 4. Actualizar registro de transacción
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          title: data.title !== undefined ? data.title.trim() : existing.title,
          type: nextType,
          amountOriginal: nextAmountOriginal,
          currency: nextCurrency,
          exchangeRate: nextExchangeRate,
          amountUSD: nextAmountUSD,
          accountId: nextAccountId,
          thirdPartyId:
            data.thirdPartyId !== undefined ? data.thirdPartyId : existing.thirdPartyId,
          projectId: data.projectId !== undefined ? data.projectId : existing.projectId,
          isSettled: nextIsSettled,
          settledAt:
            nextIsSettled !== existing.isSettled
              ? nextIsSettled
                ? new Date()
                : null
              : existing.settledAt,
          note: data.note !== undefined ? (data.note ? data.note.trim() : null) : existing.note,
        },
        include: {
          account: true,
          thirdParty: true,
          project: true,
          splits: { include: { thirdParty: true } },
        },
      });

      // 5. Registrar en Auditoría
      await AuditService.log(
        {
          userId,
          action: 'UPDATE',
          entity: 'TRANSACTION',
          entityId: updated.id,
          description: `Edición de movimiento "${existing.title}" -> "${updated.title}" (${updated.type === 'INCOME' ? '+' : '-'}${updated.amountOriginal} ${updated.currency})`,
          previousData: {
            title: existing.title,
            type: existing.type,
            amountOriginal: existing.amountOriginal,
            currency: existing.currency,
            exchangeRate: existing.exchangeRate,
            amountUSD: existing.amountUSD,
            accountName: existing.account.name,
            thirdPartyName: existing.thirdParty?.name || null,
            projectName: existing.project?.name || null,
            note: existing.note,
          },
          newData: {
            title: updated.title,
            type: updated.type,
            amountOriginal: updated.amountOriginal,
            currency: updated.currency,
            exchangeRate: updated.exchangeRate,
            amountUSD: updated.amountUSD,
            accountName: updated.account.name,
            thirdPartyName: updated.thirdParty?.name || null,
            projectName: updated.project?.name || null,
            note: updated.note,
          },
        },
        tx
      );

      return { updated, updatedAccount };
    });

    emitToUser(userId, RealtimeEvents.TRANSACTION_UPDATED, result.updated);
    emitToUser(userId, RealtimeEvents.ACCOUNT_UPDATED, { account: result.updatedAccount });
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return result.updated;
  }

  static async toggleSettled(userId: string, id: string, isSettled: boolean) {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!existing) {
      throw new Error('Transacción no encontrada.');
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        isSettled,
        settledAt: isSettled ? new Date() : null,
      },
      include: {
        account: true,
        thirdParty: true,
        project: true,
        splits: { include: { thirdParty: true } },
      },
    });

    emitToUser(userId, RealtimeEvents.TRANSACTION_SETTLED_TOGGLED, updated);
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return updated;
  }

  static async deleteTransaction(userId: string, id: string, reason?: string) {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId, isDeleted: false },
      include: {
        account: true,
        thirdParty: true,
        project: true,
        splits: { include: { thirdParty: true } },
      },
    });

    if (!existing) {
      throw new Error('Transacción no encontrada o ya eliminada.');
    }

    const nativeAmount = this.computeNativeAccountAmount(
      existing.amountOriginal,
      existing.currency,
      existing.amountUSD,
      existing.exchangeRate,
      existing.account.currency
    );

    const result = await prisma.$transaction(async (tx) => {
      // 1. Revertir el saldo en la cuenta asociada
      const balanceRevert = existing.type === 'INCOME' ? -nativeAmount : nativeAmount;
      const updatedAccount = await tx.account.update({
        where: { id: existing.accountId },
        data: {
          balance: { increment: balanceRevert },
        },
      });

      // 2. Soft Delete (Nunca se pierde en la base de datos)
      const softDeleted = await tx.transaction.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // 3. Guardar registro inmutable en AuditLog
      const reasonNote = reason?.trim() ? ` | Motivo: ${reason.trim()}` : '';
      await AuditService.log(
        {
          userId,
          action: 'DELETE',
          entity: 'TRANSACTION',
          entityId: existing.id,
          description: `Eliminación de movimiento "${existing.title}" (${existing.type === 'INCOME' ? '+' : '-'}${existing.amountOriginal} ${existing.currency} ≈ $${existing.amountUSD} USD) de cuenta ${existing.account.name}${reasonNote}`,
          previousData: {
            id: existing.id,
            title: existing.title,
            type: existing.type,
            amountOriginal: existing.amountOriginal,
            currency: existing.currency,
            exchangeRate: existing.exchangeRate,
            amountUSD: existing.amountUSD,
            accountName: existing.account.name,
            thirdPartyName: existing.thirdParty?.name || null,
            projectName: existing.project?.name || null,
            isSettled: existing.isSettled,
            date: existing.date,
            note: existing.note,
            splits: existing.splits,
          },
          newData: {
            isDeleted: true,
            deletedAt: softDeleted.deletedAt,
            reason: reason || null,
          },
        },
        tx
      );

      return { deletedId: id, updatedAccount };
    });

    emitToUser(userId, RealtimeEvents.TRANSACTION_DELETED, { id });
    emitToUser(userId, RealtimeEvents.ACCOUNT_UPDATED, { account: result.updatedAccount });
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return { success: true, message: 'Transacción eliminada y registrada en auditoría' };
  }
}

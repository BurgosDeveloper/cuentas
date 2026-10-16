import { prisma } from '../../config/prisma';
import { CreateTransactionInput, FilterTransactions, RealtimeEvents } from '../../shared';
import { emitToUser } from '../../realtime/socket';

export class TransactionsService {
  static async getTransactions(userId: string, filters: FilterTransactions) {
    const where: any = { userId };

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
        account: true,
        thirdParty: true,
        project: true,
        splits: {
          include: {
            thirdParty: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return transactions;
  }

  static async createTransaction(userId: string, data: CreateTransactionInput) {
    const {
      title,
      type,
      amountOriginal,
      currency,
      exchangeRate,
      accountId,
      thirdPartyId,
      projectId,
      isSettled,
      date,
      dueDate,
      note,
      splits,
    } = data;

    // Validación de existencia de cuenta bancaria/billetera
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) {
      throw new Error('La cuenta financiera especificada no existe.');
    }

    // Calcular el monto equivalente exacto en USD para cuadre general
    const rate = exchangeRate > 0 ? exchangeRate : 1.0;
    const amountUSD = currency === 'USD' ? amountOriginal : Number((amountOriginal / rate).toFixed(2));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el movimiento
      const transaction = await tx.transaction.create({
        data: {
          userId,
          title: title.trim(),
          type,
          amountOriginal,
          currency,
          exchangeRate: rate,
          amountUSD,
          accountId,
          thirdPartyId: thirdPartyId || null,
          projectId: projectId || null,
          isSettled: isSettled || false,
          settledAt: isSettled ? new Date() : null,
          date: date ? new Date(date) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          note: note?.trim() || null,
        },
      });

      // 2. Registrar splits si existen (repartición de gastos con terceros)
      if (splits && splits.length > 0) {
        await tx.transactionSplit.createMany({
          data: splits.map((split) => ({
            transactionId: transaction.id,
            thirdPartyId: split.thirdPartyId,
            amount: split.amount,
            note: split.note?.trim() || null,
          })),
        });
      }

      // 3. Afectar el saldo real de la cuenta financiera vinculada
      const balanceChange = type === 'INCOME' ? amountOriginal : -amountOriginal;
      const updatedAccount = await tx.account.update({
        where: { id: accountId },
        data: {
          balance: { increment: balanceChange },
        },
      });

      // Recuperar la transacción completa con sus relaciones
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

    // Notificaciones en tiempo real
    emitToUser(userId, RealtimeEvents.TRANSACTION_CREATED, result.transaction);
    emitToUser(userId, RealtimeEvents.ACCOUNT_UPDATED, { account: result.updatedAccount });
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return result.transaction;
  }

  static async toggleSettled(userId: string, id: string, isSettled: boolean) {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
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
        splits: {
          include: { thirdParty: true },
        },
      },
    });

    emitToUser(userId, RealtimeEvents.TRANSACTION_SETTLED_TOGGLED, updated);
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return updated;
  }

  static async deleteTransaction(userId: string, id: string) {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Transacción no encontrada.');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Revertir el saldo en la cuenta
      const balanceRevert = existing.type === 'INCOME' ? -existing.amountOriginal : existing.amountOriginal;
      const updatedAccount = await tx.account.update({
        where: { id: existing.accountId },
        data: {
          balance: { increment: balanceRevert },
        },
      });

      await tx.transaction.delete({
        where: { id },
      });

      return { deletedId: id, updatedAccount };
    });

    emitToUser(userId, RealtimeEvents.TRANSACTION_DELETED, { id });
    emitToUser(userId, RealtimeEvents.ACCOUNT_UPDATED, { account: result.updatedAccount });
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return { success: true, message: 'Transacción eliminada' };
  }
}

import { prisma } from '../../config/prisma';
import {
  CreateAccountInput,
  TransferFundsInput,
  AdjustAccountBalanceInput,
  RealtimeEvents,
} from '../../shared';
import { emitToUser } from '../../realtime/socket';
import { AuditService } from '../audit/audit.service';

export class AccountsService {
  static async getAccounts(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return accounts;
  }

  static async getTransfers(userId: string) {
    return await prisma.accountTransfer.findMany({
      where: { userId },
      include: {
        fromAccount: true,
        toAccount: true,
      },
      orderBy: { date: 'desc' },
      take: 30,
    });
  }

  static async createAccount(userId: string, data: CreateAccountInput) {
    const account = await prisma.account.create({
      data: {
        userId,
        name: data.name.trim(),
        currency: data.currency,
        balance: data.initialBalance,
        color: data.color,
        icon: data.icon,
      },
    });

    emitToUser(userId, RealtimeEvents.ACCOUNT_UPDATED, { account, action: 'created' });
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return account;
  }

  static async adjustBalance(userId: string, accountId: string, data: AdjustAccountBalanceInput) {
    const existing = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!existing) {
      throw new Error('Cuenta financiera no encontrada.');
    }

    const oldBalance = existing.balance;
    const newBalance = Number(data.balance.toFixed(2));

    const updated = await prisma.$transaction(async (tx) => {
      const acc = await tx.account.update({
        where: { id: accountId },
        data: { balance: newBalance },
      });

      const reasonNote = data.reason?.trim() ? ` | Motivo: ${data.reason.trim()}` : '';
      await AuditService.log(
        {
          userId,
          action: 'BALANCE_ADJUST',
          entity: 'ACCOUNT',
          entityId: acc.id,
          description: `Ajuste de saldo base en "${acc.name}": de ${oldBalance.toFixed(2)} ${acc.currency} a ${newBalance.toFixed(2)} ${acc.currency}${reasonNote}`,
          previousData: { name: existing.name, currency: existing.currency, balance: oldBalance },
          newData: { name: acc.name, currency: acc.currency, balance: newBalance, reason: data.reason || null },
        },
        tx
      );

      return acc;
    });

    emitToUser(userId, RealtimeEvents.ACCOUNT_UPDATED, { account: updated, action: 'adjusted' });
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return updated;
  }

  static async deleteAccount(userId: string, accountId: string, reason?: string) {
    const existing = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!existing) {
      throw new Error('Cuenta financiera no encontrada.');
    }

    await prisma.$transaction(async (tx) => {
      await AuditService.log(
        {
          userId,
          action: 'DELETE',
          entity: 'ACCOUNT',
          entityId: existing.id,
          description: `Eliminación de cuenta "${existing.name}" (Saldo al eliminar: ${existing.balance} ${existing.currency})`,
          previousData: existing,
          newData: { deleted: true, reason: reason || null },
        },
        tx
      );

      await tx.account.delete({
        where: { id: accountId },
      });
    });

    emitToUser(userId, RealtimeEvents.ACCOUNT_UPDATED, { deletedId: accountId, action: 'deleted' });
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return { success: true };
  }

  static async transferFunds(userId: string, data: TransferFundsInput) {
    const { fromAccountId, toAccountId, amountFrom, exchangeRate, note, date } = data;

    if (fromAccountId === toAccountId) {
      throw new Error('La cuenta de origen y destino no pueden ser la misma.');
    }

    const fromAcc = await prisma.account.findFirst({
      where: { id: fromAccountId, userId },
    });
    const toAcc = await prisma.account.findFirst({
      where: { id: toAccountId, userId },
    });

    if (!fromAcc || !toAcc) {
      throw new Error('Una o ambas cuentas no fueron encontradas.');
    }

    const calculatedAmountTo = Number((amountFrom * exchangeRate).toFixed(2));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Descontar de cuenta origen
      const updatedFrom = await tx.account.update({
        where: { id: fromAccountId },
        data: {
          balance: { decrement: amountFrom },
        },
      });

      // 2. Acreditar en cuenta destino
      const updatedTo = await tx.account.update({
        where: { id: toAccountId },
        data: {
          balance: { increment: calculatedAmountTo },
        },
      });

      // 3. Registrar comprobante de traspaso
      const transfer = await tx.accountTransfer.create({
        data: {
          userId,
          fromAccountId,
          toAccountId,
          amountFrom,
          amountTo: calculatedAmountTo,
          exchangeRate,
          note: note?.trim() || null,
          date: date ? new Date(date) : new Date(),
        },
        include: {
          fromAccount: true,
          toAccount: true,
        },
      });

      return { transfer, updatedFrom, updatedTo };
    });

    // Notificar en tiempo real a todos los dispositivos
    emitToUser(userId, RealtimeEvents.TRANSFER_CREATED, result.transfer);
    emitToUser(userId, RealtimeEvents.ACCOUNT_UPDATED, { accounts: [result.updatedFrom, result.updatedTo] });
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return result;
  }
}

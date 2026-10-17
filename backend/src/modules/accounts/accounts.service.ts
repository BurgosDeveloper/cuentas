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
    const {
      fromAccountId,
      toAccountId,
      amountFrom,
      amountTo,
      exchangeRate,
      conversionMode,
      note,
      date,
    } = data;

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

    if (fromAcc.balance < amountFrom) {
      throw new Error(
        `Saldo insuficiente en "${fromAcc.name}". Disponible: ${fromAcc.balance.toFixed(2)} ${fromAcc.currency}`
      );
    }

    let calculatedAmountTo: number;
    let effectiveRate = exchangeRate || 1.0;

    if (fromAcc.currency === toAcc.currency) {
      calculatedAmountTo = Number(amountFrom.toFixed(2));
      effectiveRate = 1.0;
    } else if (amountTo !== undefined && amountTo > 0) {
      calculatedAmountTo = Number(amountTo.toFixed(2));
    } else if (conversionMode === 'DIVIDE') {
      calculatedAmountTo = Number((amountFrom / effectiveRate).toFixed(2));
    } else if (conversionMode === 'MULTIPLY') {
      calculatedAmountTo = Number((amountFrom * effectiveRate).toFixed(2));
    } else {
      // Detección inteligente: si sale de VES o COP hacia USD y la tasa es > 1, se divide
      if (fromAcc.currency !== 'USD' && toAcc.currency === 'USD' && effectiveRate > 1) {
        calculatedAmountTo = Number((amountFrom / effectiveRate).toFixed(2));
      } else {
        calculatedAmountTo = Number((amountFrom * effectiveRate).toFixed(2));
      }
    }

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
          exchangeRate: effectiveRate,
          note: note?.trim() || null,
          date: date ? new Date(date) : new Date(),
        },
        include: {
          fromAccount: true,
          toAccount: true,
        },
      });

      // 4. Registrar en Bitácora de Auditoría
      await AuditService.log(
        {
          userId,
          action: 'TRANSFER',
          entity: 'TRANSFER',
          entityId: transfer.id,
          description: `Traspaso de "${fromAcc.name}" (-${amountFrom.toFixed(2)} ${fromAcc.currency}) hacia "${toAcc.name}" (+${calculatedAmountTo.toFixed(2)} ${toAcc.currency})${note?.trim() ? ` | Nota: ${note.trim()}` : ''}`,
          previousData: {
            fromAccount: { name: fromAcc.name, balanceBefore: fromAcc.balance },
            toAccount: { name: toAcc.name, balanceBefore: toAcc.balance },
          },
          newData: {
            fromAccount: { name: fromAcc.name, balanceAfter: updatedFrom.balance },
            toAccount: { name: toAcc.name, balanceAfter: updatedTo.balance },
            amountFrom,
            amountTo: calculatedAmountTo,
            exchangeRate: effectiveRate,
          },
        },
        tx
      );

      return { transfer, updatedFrom, updatedTo };
    });

    // Notificar en tiempo real a todos los dispositivos
    emitToUser(userId, RealtimeEvents.TRANSFER_CREATED, result.transfer);
    emitToUser(userId, RealtimeEvents.ACCOUNT_UPDATED, { accounts: [result.updatedFrom, result.updatedTo] });
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return result;
  }

  static async deleteTransfer(userId: string, transferId: string, reason?: string) {
    const existing = await prisma.accountTransfer.findFirst({
      where: { id: transferId, userId },
      include: {
        fromAccount: true,
        toAccount: true,
      },
    });

    if (!existing) {
      throw new Error('Traspaso no encontrado.');
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Devolver dinero a la cuenta de origen
      const updatedFrom = await tx.account.update({
        where: { id: existing.fromAccountId },
        data: {
          balance: { increment: existing.amountFrom },
        },
      });

      // 2. Descontar el dinero acreditado en la cuenta destino
      const updatedTo = await tx.account.update({
        where: { id: existing.toAccountId },
        data: {
          balance: { decrement: existing.amountTo },
        },
      });

      // 3. Eliminar comprobante de traspaso
      await tx.accountTransfer.delete({
        where: { id: transferId },
      });

      // 4. Registrar reversión en Auditoría
      await AuditService.log(
        {
          userId,
          action: 'DELETE',
          entity: 'TRANSFER',
          entityId: transferId,
          description: `Reversión de traspaso: devueltos +${existing.amountFrom.toFixed(2)} ${existing.fromAccount.currency} a "${existing.fromAccount.name}" y descontados -${existing.amountTo.toFixed(2)} ${existing.toAccount.currency} de "${existing.toAccount.name}"${reason ? ` — Motivo: ${reason}` : ''}`,
          previousData: existing,
        },
        tx
      );

      return { deletedId: transferId, updatedFrom, updatedTo };
    });

    emitToUser(userId, RealtimeEvents.TRANSFER_DELETED, { id: transferId });
    emitToUser(userId, RealtimeEvents.ACCOUNT_UPDATED, { accounts: [result.updatedFrom, result.updatedTo] });
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return { deleted: true, id: transferId };
  }
}


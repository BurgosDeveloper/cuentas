"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsService = void 0;
const prisma_1 = require("../../config/prisma");
const shared_1 = require("@cuentas/shared");
const socket_1 = require("../../realtime/socket");
class AccountsService {
    static async getAccounts(userId) {
        const accounts = await prisma_1.prisma.account.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
        return accounts;
    }
    static async createAccount(userId, data) {
        const account = await prisma_1.prisma.account.create({
            data: {
                userId,
                name: data.name.trim(),
                currency: data.currency,
                balance: data.initialBalance,
                color: data.color,
                icon: data.icon,
            },
        });
        (0, socket_1.emitToUser)(userId, shared_1.RealtimeEvents.ACCOUNT_UPDATED, { account, action: 'created' });
        (0, socket_1.emitToUser)(userId, shared_1.RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });
        return account;
    }
    static async transferFunds(userId, data) {
        const { fromAccountId, toAccountId, amountFrom, exchangeRate, note, date } = data;
        if (fromAccountId === toAccountId) {
            throw new Error('La cuenta de origen y destino no pueden ser la misma.');
        }
        const fromAcc = await prisma_1.prisma.account.findFirst({
            where: { id: fromAccountId, userId },
        });
        const toAcc = await prisma_1.prisma.account.findFirst({
            where: { id: toAccountId, userId },
        });
        if (!fromAcc || !toAcc) {
            throw new Error('Una o ambas cuentas no fueron encontradas.');
        }
        const calculatedAmountTo = Number((amountFrom * exchangeRate).toFixed(2));
        const result = await prisma_1.prisma.$transaction(async (tx) => {
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
        (0, socket_1.emitToUser)(userId, shared_1.RealtimeEvents.TRANSFER_CREATED, result.transfer);
        (0, socket_1.emitToUser)(userId, shared_1.RealtimeEvents.ACCOUNT_UPDATED, { accounts: [result.updatedFrom, result.updatedTo] });
        (0, socket_1.emitToUser)(userId, shared_1.RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });
        return result;
    }
}
exports.AccountsService = AccountsService;

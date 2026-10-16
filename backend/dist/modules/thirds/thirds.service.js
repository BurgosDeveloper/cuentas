"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThirdsService = void 0;
const prisma_1 = require("../../config/prisma");
const shared_1 = require("@cuentas/shared");
const socket_1 = require("../../realtime/socket");
class ThirdsService {
    static async getThirds(userId) {
        const thirds = await prisma_1.prisma.thirdParty.findMany({
            where: { userId },
            include: {
                transactions: {
                    where: { isSettled: false },
                    select: {
                        id: true,
                        type: true,
                        amountUSD: true,
                        title: true,
                    },
                },
                splits: {
                    where: {
                        transaction: { isSettled: false },
                    },
                    select: {
                        id: true,
                        amount: true,
                        transaction: {
                            select: {
                                id: true,
                                type: true,
                                title: true,
                                exchangeRate: true,
                            },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        return thirds.map((third) => {
            // Ingresos directos no saldados donde este tercero nos debe
            const directReceivables = third.transactions
                .filter((t) => t.type === 'INCOME')
                .reduce((sum, t) => sum + t.amountUSD, 0);
            // Egresos directos no saldados donde nosotros le debemos al tercero
            const directPayables = third.transactions
                .filter((t) => t.type === 'EXPENSE')
                .reduce((sum, t) => sum + t.amountUSD, 0);
            // Splits asignados a este tercero
            const splitPayables = third.splits
                .filter((s) => s.transaction.type === 'EXPENSE')
                .reduce((sum, s) => sum + (s.amount / (s.transaction.exchangeRate || 1)), 0);
            const splitReceivables = third.splits
                .filter((s) => s.transaction.type === 'INCOME')
                .reduce((sum, s) => sum + (s.amount / (s.transaction.exchangeRate || 1)), 0);
            const totalTheyOweUs = Number((directReceivables + splitReceivables).toFixed(2));
            const totalWeOweThem = Number((directPayables + splitPayables).toFixed(2));
            const netBalance = Number((totalTheyOweUs - totalWeOweThem).toFixed(2));
            return {
                id: third.id,
                name: third.name,
                phone: third.phone,
                notes: third.notes,
                totalTheyOweUs, // Cuentas por cobrar a su favor
                totalWeOweThem, // Cuentas por pagar hacia él
                netBalance, // Positivo = Nos debe; Negativo = Le debemos
            };
        });
    }
    static async createThird(userId, data) {
        const third = await prisma_1.prisma.thirdParty.create({
            data: {
                userId,
                name: data.name.trim(),
                phone: data.phone?.trim() || null,
                notes: data.notes?.trim() || null,
            },
        });
        (0, socket_1.emitToUser)(userId, shared_1.RealtimeEvents.THIRD_UPDATED, { third, action: 'created' });
        return third;
    }
    static async getThirdStatement(userId, thirdId) {
        const third = await prisma_1.prisma.thirdParty.findFirst({
            where: { id: thirdId, userId },
            include: {
                transactions: {
                    orderBy: { date: 'desc' },
                    include: { account: true },
                },
                splits: {
                    include: {
                        transaction: {
                            include: { account: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!third) {
            throw new Error('Tercero no encontrado.');
        }
        return third;
    }
}
exports.ThirdsService = ThirdsService;

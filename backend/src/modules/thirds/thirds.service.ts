import { prisma } from '../../config/prisma';
import { CreateThirdPartyInput, UpdateThirdPartyWithCodeInput, RealtimeEvents } from '../../shared';
import { emitToUser } from '../../realtime/socket';
import { AuditService } from '../audit/audit.service';

export class ThirdsService {
  static async getThirds(userId: string) {
    const thirds = await prisma.thirdParty.findMany({
      where: { userId },
      include: {
        transactions: {
          where: { isSettled: false, isDeleted: false },
          select: {
            id: true,
            type: true,
            amountUSD: true,
            title: true,
          },
        },
        splits: {
          where: {
            transaction: { isSettled: false, isDeleted: false },
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
        netBalance,     // Positivo = Nos debe; Negativo = Le debemos
      };
    });
  }

  static async createThird(userId: string, data: CreateThirdPartyInput) {
    const third = await prisma.thirdParty.create({
      data: {
        userId,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });

    emitToUser(userId, RealtimeEvents.THIRD_UPDATED, { third, action: 'created' });
    return third;
  }

  static async updateThird(userId: string, thirdId: string, data: UpdateThirdPartyWithCodeInput) {
    const existing = await prisma.thirdParty.findFirst({
      where: { id: thirdId, userId },
    });
    if (!existing) {
      throw new Error('Tercero no encontrado.');
    }

    const updated = await prisma.thirdParty.update({
      where: { id: thirdId },
      data: {
        name: data.name !== undefined ? data.name.trim() : existing.name,
        phone: data.phone !== undefined ? (data.phone?.trim() || null) : existing.phone,
        notes: data.notes !== undefined ? (data.notes?.trim() || null) : existing.notes,
      },
    });

    await AuditService.log({
      userId,
      action: 'UPDATE',
      entity: 'THIRD_PARTY',
      entityId: thirdId,
      description: `Tercero editado: "${existing.name}" → "${updated.name}"`,
      previousData: { name: existing.name, phone: existing.phone, notes: existing.notes },
      newData: { name: updated.name, phone: updated.phone, notes: updated.notes },
    });

    emitToUser(userId, RealtimeEvents.THIRD_UPDATED, { third: updated, action: 'updated' });
    return updated;
  }

  static async deleteThird(userId: string, thirdId: string, reason?: string) {
    const existing = await prisma.thirdParty.findFirst({
      where: { id: thirdId, userId },
    });
    if (!existing) {
      throw new Error('Tercero no encontrado.');
    }

    await prisma.thirdParty.delete({
      where: { id: thirdId },
    });

    await AuditService.log({
      userId,
      action: 'DELETE',
      entity: 'THIRD_PARTY',
      entityId: thirdId,
      description: `Tercero eliminado: "${existing.name}"${reason ? ` — Motivo: ${reason}` : ''}`,
      previousData: existing,
    });

    emitToUser(userId, RealtimeEvents.THIRD_DELETED, { id: thirdId });
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });
    return { deleted: true, id: thirdId };
  }

  static async getThirdStatement(userId: string, thirdId: string) {
    const third = await prisma.thirdParty.findFirst({
      where: { id: thirdId, userId },
      include: {
        transactions: {
          where: { isDeleted: false },
          orderBy: { date: 'desc' },
          include: { account: true },
        },
        splits: {
          where: { transaction: { isDeleted: false } },
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

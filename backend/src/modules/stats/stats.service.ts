import { prisma } from '../../config/prisma';
import { MoodStatus } from '../../shared';

export class StatsService {
  static async getDashboardStats(userId: string) {
    const [accounts, transactions] = await Promise.all([
      prisma.account.findMany({ where: { userId } }),
      prisma.transaction.findMany({
        where: { userId, isDeleted: false },
        orderBy: { date: 'asc' },
        include: { thirdParty: true },
      }),
    ]);

    // 1. Cuadre Activo (Ítems pendientes [ ])
    const pendingTransactions = transactions.filter((t) => !t.isSettled);
    const pendingIncomes = pendingTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amountUSD, 0);

    const pendingExpenses = pendingTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amountUSD, 0);

    const cuadreNet = Number((pendingIncomes - pendingExpenses).toFixed(2));

    // 2. Totales Saldados ([x])
    const settledTransactions = transactions.filter((t) => t.isSettled);
    const settledIncomes = settledTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amountUSD, 0);

    const settledExpenses = settledTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amountUSD, 0);

    // 3. Saldos por Cuenta y Totales por Moneda
    let totalUSD = 0;
    let totalVES = 0;
    let totalCOP = 0;

    for (const acc of accounts) {
      if (acc.currency === 'USD') totalUSD += acc.balance;
      else if (acc.currency === 'VES') totalVES += acc.balance;
      else if (acc.currency === 'COP') totalCOP += acc.balance;
    }

    // 4. Estado de Ánimo Financiero Inteligente
    let mood: {
      status: MoodStatus;
      emoji: string;
      icon: string;
      color: string;
      label: string;
      message: string;
    };

    if (cuadreNet < 0) {
      mood = {
        status: 'CRITICAL',
        emoji: '😟',
        icon: 'alert-circle',
        color: '#FF5252',
        label: 'Déficit en Cuadre',
        message: 'Tus egresos pendientes superan tus cobros pendientes. Atención a cuentas por pagar.',
      };
    } else if (cuadreNet === 0) {
      mood = {
        status: 'NEUTRAL',
        emoji: '😐',
        icon: 'remove-circle-outline',
        color: '#FFD700',
        label: 'Punto de Equilibrio',
        message: 'Tus cuentas están perfectamente empatadas sin sobrantes ni faltantes.',
      };
    } else if (cuadreNet > 0 && cuadreNet <= 30) {
      mood = {
        status: 'GOOD',
        emoji: '🙂',
        icon: 'checkmark-circle-outline',
        color: '#00E676',
        label: 'Superávit Moderado',
        message: 'Tienes saldo positivo a favor en tu cuadre actual. Flujo controlado.',
      };
    } else {
      mood = {
        status: 'PROSPEROUS',
        emoji: '🤑',
        icon: 'trending-up',
        color: '#FFD700',
        label: 'Prosperidad Alta',
        message: 'Excelente rendimiento financiero. Margen a favor sólido y cuentas con liquidez.',
      };
    }

    // 5. Datos para Gráficos Financieros (Últimos 14 días + ventana mínima garantizada de 7 días calendario)
    const dateMap = new Map<string, { date: string; income: number; expense: number }>();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dateMap.set(key, { date: key, income: 0, expense: 0 });
    }

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    for (const t of transactions) {
      if (t.date < thirtyDaysAgo && dateMap.size >= 14) continue;
      const dateKey = t.date.toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: dateKey, income: 0, expense: 0 });
      }
      const entry = dateMap.get(dateKey)!;
      if (t.type === 'INCOME') {
        entry.income = Number((entry.income + t.amountUSD).toFixed(2));
      } else {
        entry.expense = Number((entry.expense + t.amountUSD).toFixed(2));
      }
    }

    const chartDaily = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return {
      cuadre: {
        pendingIncomes: Number(pendingIncomes.toFixed(2)),
        pendingExpenses: Number(pendingExpenses.toFixed(2)),
        cuadreNet,
        pendingCount: pendingTransactions.length,
      },
      settled: {
        settledIncomes: Number(settledIncomes.toFixed(2)),
        settledExpenses: Number(settledExpenses.toFixed(2)),
        settledCount: settledTransactions.length,
      },
      wallets: {
        totalUSD: Number(totalUSD.toFixed(2)),
        totalVES: Number(totalVES.toFixed(2)),
        totalCOP: Number(totalCOP.toFixed(2)),
        accounts,
      },
      mood,
      chartDaily,
    };
  }
}

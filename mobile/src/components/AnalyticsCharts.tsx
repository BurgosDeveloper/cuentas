import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { AnimatedProgressBar } from './AnimatedWidgets';

interface PortfolioDistributionProps {
  accounts: any[];
  rates?: { ves?: number; cop?: number };
}

export const PortfolioDistributionChart: React.FC<PortfolioDistributionProps> = ({
  accounts = [],
  rates,
}) => {
  const vesRate = rates?.ves && rates.ves > 0 ? rates.ves : 50;
  const copRate = rates?.cop && rates.cop > 0 ? rates.cop : 4200;

  const breakdown = useMemo(() => {
    const items = accounts.map((acc) => {
      const bal = Number(acc.balance) || 0;
      let usdEq = bal;
      if (acc.currency === 'VES') usdEq = bal / vesRate;
      else if (acc.currency === 'COP') usdEq = bal / copRate;
      return {
        id: acc.id,
        name: acc.name,
        currency: acc.currency,
        balance: bal,
        usdEq: Math.max(0, Number(usdEq.toFixed(2))),
        color:
          acc.color ||
          (acc.currency === 'USD'
            ? Colors.usd
            : acc.currency === 'VES'
            ? Colors.ves
            : Colors.cop),
      };
    });

    const totalUSD = items.reduce((s, i) => s + i.usdEq, 0);

    return {
      totalUSD: Number(totalUSD.toFixed(2)),
      items: items
        .sort((a, b) => b.usdEq - a.usdEq)
        .map((i) => ({
          ...i,
          pct: totalUSD > 0 ? Math.round((i.usdEq / totalUSD) * 100) : 0,
        })),
    };
  }, [accounts, vesRate, copRate]);

  if (accounts.length === 0) return null;

  return (
    <View style={styles.cardContent}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="pie-chart-outline" size={17} color={Colors.accentGold} />
          <Text style={styles.title}>Distribución Patrimonial (Equiv. USD)</Text>
        </View>
        <Text style={styles.totalBadge}>≈ ${breakdown.totalUSD.toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD</Text>
      </View>

      {/* Barra Segmentada Multicolor */}
      <View style={styles.stackedBar}>
        {breakdown.totalUSD <= 0 ? (
          <View style={[styles.stackedSegment, { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' }]} />
        ) : (
          breakdown.items.map((item) =>
            item.usdEq > 0 ? (
              <View
                key={item.id}
                style={[
                  styles.stackedSegment,
                  {
                    flex: Math.max(item.pct, 4),
                    backgroundColor: item.color,
                  },
                ]}
              />
            ) : null
          )
        )}
      </View>

      {/* Lista de Participación por Cuenta */}
      <View style={styles.itemsList}>
        {breakdown.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.itemCurr}>({item.currency})</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemUsd}>≈ ${item.usdEq.toFixed(2)}</Text>
              <View style={[styles.pctPill, { borderColor: `${item.color}66` }]}>
                <Text style={[styles.pctText, { color: item.color }]}>{item.pct}%</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

interface CashflowAnatomyProps {
  transactions: any[];
}

export const CashflowAnatomyChart: React.FC<CashflowAnatomyProps> = ({
  transactions = [],
}) => {
  const stats = useMemo(() => {
    let totalInc = 0;
    let totalExp = 0;
    let projectVol = 0;
    let thirdPartyVol = 0;
    let directVol = 0;
    let usdCount = 0;
    let vesCount = 0;
    let copCount = 0;

    for (const tx of transactions) {
      const usd = Number(tx.amountUSD) || 0;
      if (tx.type === 'INCOME') totalInc += usd;
      else totalExp += usd;

      if (tx.projectId) projectVol += usd;
      else if (tx.thirdPartyId || (tx.splits && tx.splits.length > 0)) thirdPartyVol += usd;
      else directVol += usd;

      if (tx.currency === 'USD') usdCount += usd;
      else if (tx.currency === 'VES') vesCount += usd;
      else if (tx.currency === 'COP') copCount += usd;
    }

    const totalFlow = totalInc + totalExp || 1;
    const totalCat = projectVol + thirdPartyVol + directVol || 1;
    const totalCurr = usdCount + vesCount + copCount || 1;

    return {
      totalInc: Number(totalInc.toFixed(2)),
      totalExp: Number(totalExp.toFixed(2)),
      incPct: Math.round((totalInc / totalFlow) * 100),
      expPct: Math.round((totalExp / totalFlow) * 100),
      projectVol: Number(projectVol.toFixed(2)),
      thirdPartyVol: Number(thirdPartyVol.toFixed(2)),
      directVol: Number(directVol.toFixed(2)),
      projectPct: Math.round((projectVol / totalCat) * 100),
      thirdPct: Math.round((thirdPartyVol / totalCat) * 100),
      directPct: Math.round((directVol / totalCat) * 100),
      usdPct: Math.round((usdCount / totalCurr) * 100),
      vesPct: Math.round((vesCount / totalCurr) * 100),
      copPct: Math.round((copCount / totalCurr) * 100),
    };
  }, [transactions]);

  return (
    <View style={styles.cardContent}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="analytics-outline" size={17} color={Colors.accentGold} />
          <Text style={styles.title}>Anatomía de Movimientos & Categorías</Text>
        </View>
        <Text style={styles.subBadge}>{transactions.length} movs</Text>
      </View>

      {/* Desglose por Destino Operativo */}
      <View style={styles.barsSection}>
        <View style={styles.barRow}>
          <View style={styles.barHeader}>
            <View style={styles.barTitleWrap}>
              <Ionicons name="swap-vertical" size={13} color={Colors.success} />
              <Text style={styles.barLabel}>Flujo Operativo Directo</Text>
            </View>
            <Text style={styles.barValue}>
              ${stats.directVol.toFixed(2)} ({stats.directPct}%)
            </Text>
          </View>
          <AnimatedProgressBar progress={stats.directPct} color={Colors.success} height={7} />
        </View>

        <View style={styles.barRow}>
          <View style={styles.barHeader}>
            <View style={styles.barTitleWrap}>
              <Ionicons name="people-outline" size={13} color={Colors.info} />
              <Text style={styles.barLabel}>Terceros, Préstamos & Splits</Text>
            </View>
            <Text style={styles.barValue}>
              ${stats.thirdPartyVol.toFixed(2)} ({stats.thirdPct}%)
            </Text>
          </View>
          <AnimatedProgressBar progress={stats.thirdPct} color={Colors.info} height={7} />
        </View>

        <View style={styles.barRow}>
          <View style={styles.barHeader}>
            <View style={styles.barTitleWrap}>
              <Ionicons name="briefcase-outline" size={13} color={Colors.accentGold} />
              <Text style={styles.barLabel}>Proyectos & Bienes Asignados</Text>
            </View>
            <Text style={styles.barValue}>
              ${stats.projectVol.toFixed(2)} ({stats.projectPct}%)
            </Text>
          </View>
          <AnimatedProgressBar progress={stats.projectPct} color={Colors.accentGold} height={7} />
        </View>
      </View>

      {/* Píldoras de Volumen por Divisa Operada */}
      <View style={styles.currencyPillsRow}>
        <View style={styles.currPill}>
          <View style={[styles.colorDot, { backgroundColor: Colors.usd }]} />
          <Text style={styles.currPillText}>USD {stats.usdPct}%</Text>
        </View>
        <View style={styles.currPill}>
          <View style={[styles.colorDot, { backgroundColor: Colors.ves }]} />
          <Text style={styles.currPillText}>VES {stats.vesPct}%</Text>
        </View>
        <View style={styles.currPill}>
          <View style={[styles.colorDot, { backgroundColor: Colors.cop }]} />
          <Text style={styles.currPillText}>COP {stats.copPct}%</Text>
        </View>
      </View>
    </View>
  );
};

interface ThirdsBalanceChartProps {
  thirds: any[];
}

export const ThirdsBalanceChart: React.FC<ThirdsBalanceChartProps> = ({ thirds = [] }) => {
  const summary = useMemo(() => {
    let receivable = 0;
    let payable = 0;
    for (const t of thirds) {
      receivable += Number(t.totalTheyOweUs) || 0;
      payable += Number(t.totalWeOweThem) || 0;
    }
    const net = receivable - payable;
    const total = receivable + payable || 1;
    const recPct = Math.round((receivable / total) * 100);
    return {
      receivable: Number(receivable.toFixed(2)),
      payable: Number(payable.toFixed(2)),
      net: Number(net.toFixed(2)),
      recPct,
      payPct: 100 - recPct,
    };
  }, [thirds]);

  return (
    <View style={styles.cardContent}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="stats-chart-outline" size={16} color={Colors.accentGold} />
          <Text style={styles.title}>Balance Global de Cartera (Terceros)</Text>
        </View>
        <Text
          style={[
            styles.totalBadge,
            { color: summary.net >= 0 ? Colors.success : Colors.danger },
          ]}
        >
          Neto: {summary.net >= 0 ? `+$${summary.net.toFixed(2)}` : `-$${Math.abs(summary.net).toFixed(2)}`}
        </Text>
      </View>

      <View style={styles.thirdsMetricsRow}>
        <View style={styles.thirdsMetricCol}>
          <Text style={styles.thirdsMetricLabel}>Total por Cobrar</Text>
          <Text style={[styles.thirdsMetricVal, { color: Colors.success }]}>
            +${summary.receivable.toFixed(2)}
          </Text>
        </View>
        <View style={styles.thirdsMetricColRight}>
          <Text style={styles.thirdsMetricLabel}>Total por Pagar</Text>
          <Text style={[styles.thirdsMetricVal, { color: Colors.danger }]}>
            -${summary.payable.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Barra Tug-of-War Cobrar vs Pagar */}
      <View style={styles.tugBar}>
        <View
          style={{
            flex: Math.max(summary.recPct, 5),
            backgroundColor: Colors.success,
            height: '100%',
          }}
        />
        <View
          style={{
            flex: Math.max(summary.payPct, 5),
            backgroundColor: Colors.danger,
            height: '100%',
          }}
        />
      </View>
      <View style={styles.tugLegend}>
        <Text style={[styles.tugText, { color: Colors.success }]}>
          A tu favor ({summary.recPct}%)
        </Text>
        <Text style={[styles.tugText, { color: Colors.danger }]}>
          Compromisos ({summary.payPct}%)
        </Text>
      </View>
    </View>
  );
};

interface ProjectsOverviewChartProps {
  projects: any[];
}

export const ProjectsOverviewChart: React.FC<ProjectsOverviewChartProps> = ({
  projects = [],
}) => {
  const summary = useMemo(() => {
    let activeSpent = 0;
    let pendingBudget = 0;
    let totalItems = 0;
    let completedItems = 0;

    for (const p of projects) {
      activeSpent += Number(p.activeTotal) || 0;
      pendingBudget += Number(p.budgetPendingTotal) || 0;
      if (Array.isArray(p.items)) {
        totalItems += p.items.length;
        completedItems += p.items.filter((i: any) => i.isCompleted).length;
      }
    }

    const completionPct =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      activeSpent: Number(activeSpent.toFixed(2)),
      pendingBudget: Number(pendingBudget.toFixed(2)),
      totalItems,
      completedItems,
      completionPct,
    };
  }, [projects]);

  const size = 68;
  const r = 27;
  const c = 2 * Math.PI * r;
  const offset = c - (c * Math.max(4, summary.completionPct)) / 100;

  return (
    <View style={styles.cardContent}>
      <View style={styles.projSummaryRow}>
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={7}
                fill="transparent"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={Colors.accentGold}
                strokeWidth={7}
                strokeDasharray={`${c} ${c}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                fill="transparent"
              />
            </G>
          </Svg>
          <Text style={styles.ringMiniPct}>{summary.completionPct}%</Text>
        </View>

        <View style={{ flex: 1, marginLeft: 14, gap: 6 }}>
          <Text style={styles.title}>Ejecución Global de Proyectos</Text>
          <View style={styles.projStatsMiniRow}>
            <View>
              <Text style={styles.thirdsMetricLabel}>Invertido Activo</Text>
              <Text style={[styles.thirdsMetricVal, { color: Colors.danger, fontSize: 15 }]}>
                ${summary.activeSpent.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text style={styles.thirdsMetricLabel}>Por Ejecutar</Text>
              <Text style={[styles.thirdsMetricVal, { color: Colors.accentGold, fontSize: 15 }]}>
                ${summary.pendingBudget.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text style={styles.thirdsMetricLabel}>Metas</Text>
              <Text style={[styles.thirdsMetricVal, { color: Colors.success, fontSize: 15 }]}>
                {summary.completedItems}/{summary.totalItems}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContent: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  totalBadge: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.accentGold,
  },
  subBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    gap: 2,
    marginBottom: 12,
  },
  stackedSegment: {
    height: '100%',
    borderRadius: 3,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    maxWidth: '65%',
  },
  itemCurr: {
    fontSize: 10.5,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemUsd: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  pctPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 38,
    alignItems: 'center',
  },
  pctText: {
    fontSize: 10,
    fontWeight: '800',
  },
  barsSection: {
    gap: 11,
  },
  barRow: {
    gap: 5,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  barLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  barValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  currencyPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  currPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(7, 10, 18, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  currPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  thirdsMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  thirdsMetricCol: {
    alignItems: 'flex-start',
  },
  thirdsMetricColRight: {
    alignItems: 'flex-end',
  },
  thirdsMetricLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  thirdsMetricVal: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  tugBar: {
    flexDirection: 'row',
    height: 9,
    borderRadius: 4.5,
    overflow: 'hidden',
    gap: 2,
    marginBottom: 6,
  },
  tugLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tugText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  projSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringMiniPct: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '900',
    color: Colors.accentGold,
  },
  projStatsMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});

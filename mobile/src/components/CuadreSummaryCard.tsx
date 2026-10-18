import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { Colors } from '../theme/colors';
import { AnimatedProgressBar } from './AnimatedWidgets';

interface CuadreSummaryProps {
  pendingIncomes: number;
  pendingExpenses: number;
  cuadreNet: number;
  dateStr?: string;
  pendingCount?: number;
}

export const CuadreSummaryCard: React.FC<CuadreSummaryProps> = ({
  pendingIncomes,
  pendingExpenses,
  cuadreNet,
  dateStr = new Date().toLocaleDateString('es-ES'),
  pendingCount = 0,
}) => {
  const isPositive = cuadreNet >= 0;
  const totalVolume = pendingIncomes + pendingExpenses;
  const incomeRatio = totalVolume > 0 ? Math.round((pendingIncomes / totalVolume) * 100) : 50;

  return (
    <GlassCard isGoldHighlighted={isPositive && cuadreNet > 0}>
      <View style={styles.topRow}>
        <View style={styles.titleWrapper}>
          <Ionicons name="calculator-outline" size={18} color={Colors.accentGold} />
          <Text style={styles.titleText}>Cuadre al {dateStr}</Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="time-outline" size={11} color={Colors.accentGold} />
          <Text style={styles.badgeText}>{pendingCount} pendientes</Text>
        </View>
      </View>

      <View style={styles.mainBalanceWrapper}>
        <Text style={styles.balanceLabel}>Cuadre Neto a Liquidar</Text>
        <Text
          style={[
            styles.balanceAmount,
            { color: isPositive ? Colors.success : Colors.danger },
          ]}
        >
          {isPositive ? `+$${cuadreNet.toFixed(2)}` : `-$${Math.abs(cuadreNet).toFixed(2)}`}
        </Text>
      </View>

      {/* Barra Visual de Cobertura de Ingresos vs Egresos */}
      <View style={styles.coverageWrapper}>
        <View style={styles.coverageLabelsRow}>
          <Text style={styles.coverageLabel}>
            Cobertura de Liquidez: <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>{incomeRatio}%</Text>
          </Text>
          <Text
            style={[
              styles.coverageStatus,
              { color: isPositive ? Colors.success : Colors.danger },
            ]}
          >
            {isPositive ? 'Superávit Operativo' : 'Requiere Cobertura'}
          </Text>
        </View>
        <AnimatedProgressBar
          progress={incomeRatio}
          color={isPositive ? Colors.success : Colors.danger}
          height={6}
          trackColor="rgba(255, 82, 82, 0.25)"
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <Ionicons name="arrow-down-circle" size={16} color={Colors.success} />
            <Text style={styles.metricLabel}>Ingresos Pendientes</Text>
          </View>
          <Text style={[styles.metricValue, { color: Colors.success }]}>
            +${pendingIncomes.toFixed(2)}
          </Text>
        </View>

        <View style={styles.metricSeparator} />

        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <Ionicons name="arrow-up-circle" size={16} color={Colors.danger} />
            <Text style={styles.metricLabel}>Egresos Pendientes</Text>
          </View>
          <Text style={[styles.metricValue, { color: Colors.danger }]}>
            -${pendingExpenses.toFixed(2)}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentGold,
  },
  mainBalanceWrapper: {
    alignItems: 'center',
    marginVertical: 4,
  },
  balanceLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  coverageWrapper: {
    marginTop: 10,
    gap: 5,
  },
  coverageLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coverageLabel: {
    fontSize: 10.5,
    color: Colors.textSecondary,
  },
  coverageStatus: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderGlass,
    marginVertical: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricSeparator: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderGlass,
  },
});

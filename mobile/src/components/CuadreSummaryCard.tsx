import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { Colors } from '../theme/colors';

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

  return (
    <GlassCard isGoldHighlighted={isPositive && cuadreNet > 0}>
      <View style={styles.topRow}>
        <View style={styles.titleWrapper}>
          <Ionicons name="calculator-outline" size={18} color={Colors.accentGold} />
          <Text style={styles.titleText}>Cuadre para el {dateStr}</Text>
        </View>
        <View style={styles.badge}>
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
    marginBottom: 12,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    marginVertical: 6,
  },
  balanceLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderGlass,
    marginVertical: 14,
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
    fontWeight: '700',
  },
  metricSeparator: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderGlass,
  },
});

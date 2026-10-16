import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Colors } from '../theme/colors';

interface DailyData {
  date: string;
  income: number;
  expense: number;
}

interface FinancialChartProps {
  data?: DailyData[];
}

const screenWidth = Dimensions.get('window').width;

export const FinancialChart: React.FC<FinancialChartProps> = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Registra movimientos para ver tu gráfica de productividad</Text>
      </View>
    );
  }

  // Preparar data agrupada por pares (Ingreso vs Egreso) para BarChart
  const barData: any[] = [];
  const recentDays = data.slice(-7); // Últimos 7 días

  recentDays.forEach((item) => {
    const dayLabel = item.date.slice(8); // '15', '16'
    barData.push(
      {
        value: item.income,
        label: dayLabel,
        spacing: 4,
        labelWidth: 26,
        labelTextStyle: { color: Colors.textSecondary, fontSize: 10 },
        frontColor: Colors.success,
      },
      {
        value: item.expense,
        frontColor: Colors.danger,
      }
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Ingresos ($)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: Colors.danger }]} />
          <Text style={styles.legendText}>Egresos ($)</Text>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <BarChart
          data={barData}
          barWidth={10}
          initialSpacing={12}
          spacing={16}
          barBorderRadius={4}
          noOfSections={4}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={Colors.borderGlass}
          yAxisTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
          width={screenWidth - 80}
          height={160}
          isAnimated
          hideRules
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

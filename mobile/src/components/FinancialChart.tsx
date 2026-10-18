import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  LayoutChangeEvent,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Line,
  Path,
  Circle,
  G,
  Text as SvgText,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { AnimatedProgressBar } from './AnimatedWidgets';

export interface DailyData {
  date: string;
  income: number;
  expense: number;
}

interface FinancialChartProps {
  data?: DailyData[];
  transactions?: any[];
  cuadreStats?: {
    pendingIncomes?: number;
    pendingExpenses?: number;
    pendingCount?: number;
  };
  settledStats?: {
    settledIncomes?: number;
    settledExpenses?: number;
    settledCount?: number;
  };
}

type ChartMode = 'bars' | 'trend' | 'ring';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function formatCompactUSD(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  if (val >= 100) return `$${Math.round(val)}`;
  if (val > 0 && val < 1) return `$${val.toFixed(2)}`;
  return `$${Math.round(val)}`;
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX.toFixed(1)} ${p0.y.toFixed(1)}, ${midX.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}

export const FinancialChart: React.FC<FinancialChartProps> = ({
  data = [],
  transactions = [],
  cuadreStats,
  settledStats,
}) => {
  const [mode, setMode] = useState<ChartMode>('bars');
  const [containerWidth, setContainerWidth] = useState<number>(310);
  const [selectedIndex, setSelectedIndex] = useState<number>(6);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Construir siempre una ventana limpia y exacta de los últimos 7 días calendario
  const normalizedDays = useMemo(() => {
    const map = new Map<string, { date: string; income: number; expense: number }>();

    // 1. Pre-poblar los últimos 7 días calendario
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      map.set(key, { date: key, income: 0, expense: 0 });
    }

    // 2. Si tenemos transacciones en memoria, calcular por día para precisión instantánea
    if (transactions && transactions.length > 0) {
      for (const tx of transactions) {
        if (!tx.date) continue;
        const rawDate = typeof tx.date === 'string' ? tx.date.slice(0, 10) : '';
        if (map.has(rawDate)) {
          const entry = map.get(rawDate)!;
          const usd = Number(tx.amountUSD) || 0;
          if (tx.type === 'INCOME') {
            entry.income = Number((entry.income + usd).toFixed(2));
          } else {
            entry.expense = Number((entry.expense + usd).toFixed(2));
          }
        }
      }
    } else if (data && data.length > 0) {
      // 3. Respaldo desde stats.chartDaily
      for (const item of data) {
        const key = item.date.slice(0, 10);
        if (map.has(key)) {
          map.set(key, {
            date: key,
            income: Number((Number(item.income) || 0).toFixed(2)),
            expense: Number((Number(item.expense) || 0).toFixed(2)),
          });
        }
      }
    }

    const result = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Si hay días históricos con actividad fuera de los últimos 7 días y los últimos 7 están vacíos,
    // mostrar los últimos 7 registros con actividad + días recientes
    const hasActivityInWindow = result.some((d) => d.income > 0 || d.expense > 0);
    if (!hasActivityInWindow && data.length > 0) {
      const recentActive = data.slice(-7);
      while (recentActive.length < 7) {
        const refDate = recentActive[0]?.date
          ? new Date(`${recentActive[0].date}T12:00:00`)
          : new Date();
        refDate.setDate(refDate.getDate() - 1);
        const key = refDate.toISOString().slice(0, 10);
        recentActive.unshift({ date: key, income: 0, expense: 0 });
      }
      return recentActive.map((item, idx) => {
        const dObj = new Date(`${item.date.slice(0, 10)}T12:00:00`);
        const dayName = Number.isNaN(dObj.getTime()) ? 'Día' : DAY_NAMES[dObj.getDay()];
        const dayNum = item.date.slice(8, 10);
        return {
          ...item,
          income: Number(item.income) || 0,
          expense: Number(item.expense) || 0,
          shortLabel: idx === 6 ? 'Hoy' : `${dayName} ${dayNum}`,
          dayOnly: dayName,
          numOnly: dayNum,
        };
      });
    }

    return result.map((item, idx) => {
      const dObj = new Date(`${item.date}T12:00:00`);
      const dayName = Number.isNaN(dObj.getTime()) ? 'Día' : DAY_NAMES[dObj.getDay()];
      const dayNum = item.date.slice(8, 10);
      return {
        ...item,
        shortLabel: idx === 6 ? `Hoy ${dayNum}` : `${dayName} ${dayNum}`,
        dayOnly: idx === 6 ? 'HOY' : dayName,
        numOnly: dayNum,
      };
    });
  }, [data, transactions]);

  useEffect(() => {
    // Seleccionar por defecto el último día con actividad o Hoy (índice 6)
    let lastActive = 6;
    for (let i = normalizedDays.length - 1; i >= 0; i--) {
      if (normalizedDays[i].income > 0 || normalizedDays[i].expense > 0) {
        lastActive = i;
        break;
      }
    }
    setSelectedIndex(lastActive);
  }, [normalizedDays]);

  const handleModeChange = (nextMode: ChartMode) => {
    if (nextMode === mode) return;
    Haptics.selectionAsync().catch(() => {});
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.25,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    setMode(nextMode);
  };

  const handleSelectDay = (idx: number) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedIndex(idx);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - containerWidth) > 2) {
      setContainerWidth(w);
    }
  };

  // Métricas consolidadas del período
  const metrics = useMemo(() => {
    const totalIncome = normalizedDays.reduce((acc, d) => acc + d.income, 0);
    const totalExpense = normalizedDays.reduce((acc, d) => acc + d.expense, 0);
    const netFlow = totalIncome - totalExpense;
    const totalVolume = totalIncome + totalExpense;

    // Índice de Productividad Financiera (0 - 100%)
    let productivityScore = 50;
    if (totalVolume > 0) {
      productivityScore = Math.round((totalIncome / totalVolume) * 100);
    } else if ((cuadreStats?.pendingIncomes || 0) + (cuadreStats?.pendingExpenses || 0) > 0) {
      const pInc = cuadreStats?.pendingIncomes || 0;
      const pExp = cuadreStats?.pendingExpenses || 0;
      productivityScore = Math.round((pInc / (pInc + pExp)) * 100);
    }

    // Mejor día
    let bestDay = normalizedDays[normalizedDays.length - 1];
    for (const d of normalizedDays) {
      if (d.income - d.expense > bestDay.income - bestDay.expense) {
        bestDay = d;
      }
    }

    const pendingCount = cuadreStats?.pendingCount || 0;
    const settledCount = settledStats?.settledCount || 0;
    const totalCount = pendingCount + settledCount;
    const settledRate = totalCount > 0 ? Math.round((settledCount / totalCount) * 100) : 100;

    return {
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      netFlow: Number(netFlow.toFixed(2)),
      productivityScore,
      settledRate,
      bestDay,
    };
  }, [normalizedDays, cuadreStats, settledStats]);

  const activeDay = normalizedDays[selectedIndex] || normalizedDays[normalizedDays.length - 1];
  const activeDayNet = (activeDay?.income || 0) - (activeDay?.expense || 0);

  // Dimensiones SVG seguras al 100%
  const svgWidth = Math.max(240, containerWidth);
  const svgHeight = 195;
  const padLeft = 40;
  const padRight = 12;
  const padTop = 18;
  const padBottom = 38;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const rawMax = Math.max(
    ...normalizedDays.map((d) => Math.max(d.income, d.expense)),
    10
  );
  // Redondear techo del eje Y para grillas limpias
  const yMax = useMemo(() => {
    if (rawMax <= 10) return 10;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const normalized = rawMax / magnitude;
    if (normalized <= 1.5) return 1.5 * magnitude;
    if (normalized <= 2) return 2 * magnitude;
    if (normalized <= 3) return 3 * magnitude;
    if (normalized <= 5) return 5 * magnitude;
    return 10 * magnitude;
  }, [rawMax]);

  const yTicks = [0, 0.33, 0.66, 1].map((t) => ({
    ratio: t,
    val: yMax * t,
    y: padTop + plotHeight * (1 - t),
  }));

  const stepX = plotWidth / normalizedDays.length;

  // Puntos para modo Tendencia (Curva Bezier)
  const incomePoints = normalizedDays.map((d, idx) => ({
    x: padLeft + stepX * idx + stepX / 2,
    y: padTop + plotHeight * (1 - Math.min(d.income / yMax, 1)),
  }));
  const expensePoints = normalizedDays.map((d, idx) => ({
    x: padLeft + stepX * idx + stepX / 2,
    y: padTop + plotHeight * (1 - Math.min(d.expense / yMax, 1)),
  }));

  const incomeLinePath = buildSmoothPath(incomePoints);
  const expenseLinePath = buildSmoothPath(expensePoints);

  const baselineY = padTop + plotHeight;
  const incomeAreaPath =
    incomePoints.length > 1
      ? `${incomeLinePath} L ${incomePoints[incomePoints.length - 1].x.toFixed(1)} ${baselineY} L ${incomePoints[0].x.toFixed(1)} ${baselineY} Z`
      : '';
  const expenseAreaPath =
    expensePoints.length > 1
      ? `${expenseLinePath} L ${expensePoints[expensePoints.length - 1].x.toFixed(1)} ${baselineY} L ${expensePoints[0].x.toFixed(1)} ${baselineY} Z`
      : '';

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* Cabecera de Selector de Gráfico + Score */}
      <View style={styles.topControlsRow}>
        <View style={styles.scoreBadge}>
          <Ionicons
            name={metrics.productivityScore >= 50 ? 'trending-up' : 'trending-down'}
            size={15}
            color={metrics.productivityScore >= 50 ? Colors.success : Colors.warning}
          />
          <Text style={styles.scoreLabel}>Eficiencia:</Text>
          <Text
            style={[
              styles.scoreValue,
              {
                color:
                  metrics.productivityScore >= 60
                    ? Colors.success
                    : metrics.productivityScore >= 40
                    ? Colors.accentGold
                    : Colors.danger,
              },
            ]}
          >
            {metrics.productivityScore}%
          </Text>
        </View>

        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'bars' && styles.modeTabActive]}
            onPress={() => handleModeChange('bars')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="bar-chart"
              size={13}
              color={mode === 'bars' ? Colors.bgDark : Colors.textSecondary}
            />
            <Text style={[styles.modeTabText, mode === 'bars' && styles.modeTabTextActive]}>
              Barras
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'trend' && styles.modeTabActive]}
            onPress={() => handleModeChange('trend')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="pulse"
              size={13}
              color={mode === 'trend' ? Colors.bgDark : Colors.textSecondary}
            />
            <Text style={[styles.modeTabText, mode === 'trend' && styles.modeTabTextActive]}>
              Curva
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'ring' && styles.modeTabActive]}
            onPress={() => handleModeChange('ring')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="pie-chart"
              size={13}
              color={mode === 'ring' ? Colors.bgDark : Colors.textSecondary}
            />
            <Text style={[styles.modeTabText, mode === 'ring' && styles.modeTabTextActive]}>
              Anillo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tarjetas KPI de 7 Días */}
      <View style={styles.kpiStrip}>
        <View style={styles.kpiBox}>
          <View style={styles.kpiHeaderRow}>
            <View style={[styles.dot, { backgroundColor: Colors.success }]} />
            <Text style={styles.kpiTitle}>Ingresos 7D</Text>
          </View>
          <Text style={[styles.kpiAmount, { color: Colors.success }]}>
            +${metrics.totalIncome.toFixed(2)}
          </Text>
        </View>

        <View style={styles.kpiDivider} />

        <View style={styles.kpiBox}>
          <View style={styles.kpiHeaderRow}>
            <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
            <Text style={styles.kpiTitle}>Egresos 7D</Text>
          </View>
          <Text style={[styles.kpiAmount, { color: Colors.danger }]}>
            -${metrics.totalExpense.toFixed(2)}
          </Text>
        </View>

        <View style={styles.kpiDivider} />

        <View style={styles.kpiBox}>
          <View style={styles.kpiHeaderRow}>
            <View style={[styles.dot, { backgroundColor: Colors.accentGold }]} />
            <Text style={styles.kpiTitle}>Flujo Neto</Text>
          </View>
          <Text
            style={[
              styles.kpiAmount,
              { color: metrics.netFlow >= 0 ? Colors.accentGold : Colors.danger },
            ]}
          >
            {metrics.netFlow >= 0
              ? `+$${metrics.netFlow.toFixed(2)}`
              : `-$${Math.abs(metrics.netFlow).toFixed(2)}`}
          </Text>
        </View>
      </View>

      <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
        {mode === 'bars' && (
          <View>
            <Svg width={svgWidth} height={svgHeight}>
              <Defs>
                <SvgLinearGradient id="incBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#00E676" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#00964B" stopOpacity="0.82" />
                </SvgLinearGradient>
                <SvgLinearGradient id="expBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#FF5252" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#B71C1C" stopOpacity="0.82" />
                </SvgLinearGradient>
                <SvgLinearGradient id="selectedColGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.16" />
                  <Stop offset="100%" stopColor="#FFD700" stopOpacity="0.02" />
                </SvgLinearGradient>
              </Defs>

              {/* Líneas horizontales de escala Y */}
              {yTicks.map((t, i) => (
                <G key={`grid-${i}`}>
                  <Line
                    x1={padLeft}
                    y1={t.y}
                    x2={svgWidth - padRight}
                    y2={t.y}
                    stroke={i === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)'}
                    strokeWidth={i === 0 ? 1.2 : 1}
                    strokeDasharray={i === 0 ? undefined : '4,4'}
                  />
                  <SvgText
                    x={padLeft - 6}
                    y={t.y + 3.5}
                    fontSize="9.5"
                    fontWeight="600"
                    fill={Colors.textMuted}
                    textAnchor="end"
                  >
                    {formatCompactUSD(t.val)}
                  </SvgText>
                </G>
              ))}

              {/* Barras Agrupadas por Día */}
              {normalizedDays.map((item, idx) => {
                const groupX = padLeft + stepX * idx;
                const centerX = groupX + stepX / 2;
                const isSelected = idx === selectedIndex;

                const barW = Math.min(11, Math.max(7, (stepX - 10) / 2));
                const gap = 3;

                const incRatio = Math.min(item.income / yMax, 1);
                const expRatio = Math.min(item.expense / yMax, 1);

                const incH = item.income > 0 ? Math.max(6, incRatio * plotHeight) : 3;
                const expH = item.expense > 0 ? Math.max(6, expRatio * plotHeight) : 3;

                const incY = padTop + plotHeight - incH;
                const expY = padTop + plotHeight - expH;

                const incX = centerX - barW - gap / 2;
                const expX = centerX + gap / 2;

                return (
                  <G key={item.date} onPress={() => handleSelectDay(idx)}>
                    {/* Fondo resaltado del día seleccionado */}
                    {isSelected && (
                      <Rect
                        x={groupX + 2}
                        y={padTop - 4}
                        width={stepX - 4}
                        height={plotHeight + 36}
                        rx={8}
                        fill="url(#selectedColGrad)"
                        stroke="rgba(255, 215, 0, 0.35)"
                        strokeWidth={1}
                      />
                    )}

                    {/* Barra Ingreso */}
                    <Rect
                      x={incX}
                      y={incY}
                      width={barW}
                      height={incH}
                      rx={barW / 2}
                      fill={item.income > 0 ? 'url(#incBarGrad)' : 'rgba(255,255,255,0.1)'}
                    />

                    {/* Barra Egreso */}
                    <Rect
                      x={expX}
                      y={expY}
                      width={barW}
                      height={expH}
                      rx={barW / 2}
                      fill={item.expense > 0 ? 'url(#expBarGrad)' : 'rgba(255,255,255,0.1)'}
                    />

                    {/* Etiqueta Día (Lun, Mar, HOY) */}
                    <SvgText
                      x={centerX}
                      y={padTop + plotHeight + 15}
                      fontSize="9.5"
                      fontWeight={isSelected ? '800' : '600'}
                      fill={isSelected ? Colors.accentGold : Colors.textSecondary}
                      textAnchor="middle"
                    >
                      {item.dayOnly}
                    </SvgText>

                    {/* Número de Día */}
                    <SvgText
                      x={centerX}
                      y={padTop + plotHeight + 27}
                      fontSize="9"
                      fontWeight={isSelected ? '700' : '500'}
                      fill={isSelected ? Colors.textPrimary : Colors.textMuted}
                      textAnchor="middle"
                    >
                      {item.numOnly}
                    </SvgText>

                    {/* Área táctil invisible de columna completa */}
                    <Rect
                      x={groupX}
                      y={padTop}
                      width={stepX}
                      height={plotHeight + padBottom}
                      fill="transparent"
                    />
                  </G>
                );
              })}
            </Svg>
          </View>
        )}

        {mode === 'trend' && (
          <View>
            <Svg width={svgWidth} height={svgHeight}>
              <Defs>
                <SvgLinearGradient id="incAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#00E676" stopOpacity="0.40" />
                  <Stop offset="100%" stopColor="#00E676" stopOpacity="0.0" />
                </SvgLinearGradient>
                <SvgLinearGradient id="expAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#FF5252" stopOpacity="0.34" />
                  <Stop offset="100%" stopColor="#FF5252" stopOpacity="0.0" />
                </SvgLinearGradient>
              </Defs>

              {/* Grilla Horizontal */}
              {yTicks.map((t, i) => (
                <G key={`tgrid-${i}`}>
                  <Line
                    x1={padLeft}
                    y1={t.y}
                    x2={svgWidth - padRight}
                    y2={t.y}
                    stroke={i === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)'}
                    strokeWidth={1}
                    strokeDasharray={i === 0 ? undefined : '4,4'}
                  />
                  <SvgText
                    x={padLeft - 6}
                    y={t.y + 3.5}
                    fontSize="9.5"
                    fontWeight="600"
                    fill={Colors.textMuted}
                    textAnchor="end"
                  >
                    {formatCompactUSD(t.val)}
                  </SvgText>
                </G>
              ))}

              {/* Línea Guía Vertical del Día Seleccionado */}
              {incomePoints[selectedIndex] && (
                <Line
                  x1={incomePoints[selectedIndex].x}
                  y1={padTop}
                  x2={incomePoints[selectedIndex].x}
                  y2={baselineY}
                  stroke={Colors.accentGold}
                  strokeWidth={1.2}
                  strokeDasharray="3,3"
                />
              )}

              {/* Áreas Rellenas Suaves */}
              {incomeAreaPath ? <Path d={incomeAreaPath} fill="url(#incAreaGrad)" /> : null}
              {expenseAreaPath ? <Path d={expenseAreaPath} fill="url(#expAreaGrad)" /> : null}

              {/* Curvas Principales */}
              {incomeLinePath ? (
                <Path
                  d={incomeLinePath}
                  fill="none"
                  stroke={Colors.success}
                  strokeWidth={2.6}
                />
              ) : null}
              {expenseLinePath ? (
                <Path
                  d={expenseLinePath}
                  fill="none"
                  stroke={Colors.danger}
                  strokeWidth={2.4}
                />
              ) : null}

              {/* Nodos Interactivos y Etiquetas X */}
              {normalizedDays.map((item, idx) => {
                const incPt = incomePoints[idx];
                const expPt = expensePoints[idx];
                const isSelected = idx === selectedIndex;
                const groupX = padLeft + stepX * idx;

                return (
                  <G key={`pt-${item.date}`} onPress={() => handleSelectDay(idx)}>
                    <Circle
                      cx={incPt.x}
                      cy={incPt.y}
                      r={isSelected ? 5.5 : 3.5}
                      fill={isSelected ? Colors.accentGold : Colors.success}
                      stroke="#070A12"
                      strokeWidth={1.5}
                    />
                    <Circle
                      cx={expPt.x}
                      cy={expPt.y}
                      r={isSelected ? 5.5 : 3.5}
                      fill={isSelected ? Colors.accentGold : Colors.danger}
                      stroke="#070A12"
                      strokeWidth={1.5}
                    />
                    <SvgText
                      x={incPt.x}
                      y={padTop + plotHeight + 15}
                      fontSize="9.5"
                      fontWeight={isSelected ? '800' : '600'}
                      fill={isSelected ? Colors.accentGold : Colors.textSecondary}
                      textAnchor="middle"
                    >
                      {item.dayOnly}
                    </SvgText>
                    <SvgText
                      x={incPt.x}
                      y={padTop + plotHeight + 27}
                      fontSize="9"
                      fill={isSelected ? Colors.textPrimary : Colors.textMuted}
                      textAnchor="middle"
                    >
                      {item.numOnly}
                    </SvgText>
                    <Rect
                      x={groupX}
                      y={padTop}
                      width={stepX}
                      height={plotHeight + padBottom}
                      fill="transparent"
                    />
                  </G>
                );
              })}
            </Svg>
          </View>
        )}

        {mode === 'ring' && (
          <View style={styles.ringModeContainer}>
            {/* Anillo Doble Concéntrico SVG */}
            <View style={styles.ringChartBox}>
              {(() => {
                const size = 148;
                const center = size / 2;
                const outerR = 58;
                const innerR = 42;
                const outerCircumference = 2 * Math.PI * outerR;
                const innerCircumference = 2 * Math.PI * innerR;

                const outerProgress = Math.max(
                  4,
                  Math.min(100, metrics.productivityScore)
                );
                const innerProgress = Math.max(4, Math.min(100, metrics.settledRate));

                const outerStrokeDashoffset =
                  outerCircumference - (outerCircumference * outerProgress) / 100;
                const innerStrokeDashoffset =
                  innerCircumference - (innerCircumference * innerProgress) / 100;

                return (
                  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                    <Svg width={size} height={size}>
                      <G rotation="-90" origin={`${center}, ${center}`}>
                        {/* Pista Exterior (Egresos / Base) */}
                        <Circle
                          cx={center}
                          cy={center}
                          r={outerR}
                          stroke="rgba(255, 82, 82, 0.25)"
                          strokeWidth={11}
                          fill="transparent"
                        />
                        {/* Progreso Exterior (Productividad Ingresos) */}
                        <Circle
                          cx={center}
                          cy={center}
                          r={outerR}
                          stroke={Colors.success}
                          strokeWidth={11}
                          strokeDasharray={`${outerCircumference} ${outerCircumference}`}
                          strokeDashoffset={outerStrokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                        />

                        {/* Pista Interior (Liquidación Cuadre) */}
                        <Circle
                          cx={center}
                          cy={center}
                          r={innerR}
                          stroke="rgba(255, 215, 0, 0.16)"
                          strokeWidth={8}
                          fill="transparent"
                        />
                        {/* Progreso Interior (Saldados %) */}
                        <Circle
                          cx={center}
                          cy={center}
                          r={innerR}
                          stroke={Colors.accentGold}
                          strokeWidth={8}
                          strokeDasharray={`${innerCircumference} ${innerCircumference}`}
                          strokeDashoffset={innerStrokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                        />
                      </G>
                    </Svg>
                    <View style={styles.ringCenterOverlay}>
                      <Text style={styles.ringCenterPct}>{metrics.productivityScore}%</Text>
                      <Text style={styles.ringCenterSub}>PRODUCTIVIDAD</Text>
                    </View>
                  </View>
                );
              })()}
            </View>

            {/* Indicadores Laterales del Anillo */}
            <View style={styles.ringDetailsCol}>
              <View style={styles.ringDetailItem}>
                <View style={styles.ringDetailHeader}>
                  <Text style={styles.ringDetailTitle}>Ratio Ingresos vs Gastos</Text>
                  <Text style={[styles.ringDetailVal, { color: Colors.success }]}>
                    {metrics.productivityScore}%
                  </Text>
                </View>
                <AnimatedProgressBar
                  progress={metrics.productivityScore}
                  color={Colors.success}
                  height={6}
                />
              </View>

              <View style={styles.ringDetailItem}>
                <View style={styles.ringDetailHeader}>
                  <Text style={styles.ringDetailTitle}>Tasa de Liquidación Cuadre</Text>
                  <Text style={[styles.ringDetailVal, { color: Colors.accentGold }]}>
                    {metrics.settledRate}%
                  </Text>
                </View>
                <AnimatedProgressBar
                  progress={metrics.settledRate}
                  color={Colors.accentGold}
                  height={6}
                />
              </View>

              <View style={styles.bestDayBox}>
                <Ionicons name="trophy-outline" size={14} color={Colors.accentGold} />
                <Text style={styles.bestDayText}>
                  Mejor día: <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>{metrics.bestDay?.shortLabel}</Text> (
                  {metrics.bestDay && metrics.bestDay.income - metrics.bestDay.expense >= 0
                    ? `+$${(metrics.bestDay.income - metrics.bestDay.expense).toFixed(2)}`
                    : `-$${Math.abs((metrics.bestDay?.income || 0) - (metrics.bestDay?.expense || 0)).toFixed(2)}`}
                  )
                </Text>
              </View>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Inspector Interactivo del Día Seleccionado (En modo Barras y Curva) */}
      {mode !== 'ring' && activeDay && (
        <View style={styles.dayInspector}>
          <View style={styles.dayInspectorLeft}>
            <Ionicons name="calendar-outline" size={14} color={Colors.accentGold} />
            <Text style={styles.dayInspectorDate}>{activeDay.shortLabel}:</Text>
          </View>
          <View style={styles.dayInspectorMetrics}>
            <Text style={[styles.dayInspectorVal, { color: Colors.success }]}>
              +${activeDay.income.toFixed(2)}
            </Text>
            <Text style={styles.dayInspectorSep}>/</Text>
            <Text style={[styles.dayInspectorVal, { color: Colors.danger }]}>
              -${activeDay.expense.toFixed(2)}
            </Text>
            <View
              style={[
                styles.dayNetPill,
                {
                  backgroundColor:
                    activeDayNet >= 0
                      ? 'rgba(0, 230, 118, 0.14)'
                      : 'rgba(255, 82, 82, 0.14)',
                },
              ]}
            >
              <Text
                style={[
                  styles.dayNetPillText,
                  { color: activeDayNet >= 0 ? Colors.success : Colors.danger },
                ]}
              >
                Neto: {activeDayNet >= 0 ? `+$${activeDayNet.toFixed(2)}` : `-$${Math.abs(activeDayNet).toFixed(2)}`}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  topControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  scoreLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(7, 10, 18, 0.65)',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },
  modeTabActive: {
    backgroundColor: Colors.accentGold,
  },
  modeTabText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modeTabTextActive: {
    color: Colors.bgDark,
    fontWeight: '800',
  },
  kpiStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(7, 10, 18, 0.48)',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  kpiTitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  kpiAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  kpiDivider: {
    width: 1,
    height: 26,
    backgroundColor: Colors.borderGlass,
    alignSelf: 'center',
  },
  ringModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 14,
  },
  ringChartBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterPct: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  ringCenterSub: {
    fontSize: 7.5,
    fontWeight: '800',
    color: Colors.accentGold,
    letterSpacing: 0.6,
    marginTop: 1,
  },
  ringDetailsCol: {
    flex: 1,
    gap: 10,
  },
  ringDetailItem: {
    gap: 4,
  },
  ringDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ringDetailTitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  ringDetailVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  bestDayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  bestDayText: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    flex: 1,
  },
  dayInspector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.07)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayInspectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dayInspectorDate: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.accentGold,
  },
  dayInspectorMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayInspectorVal: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  dayInspectorSep: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  dayNetPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dayNetPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
});

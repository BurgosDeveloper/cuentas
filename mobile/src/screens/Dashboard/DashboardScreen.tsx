import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { MoodBadge } from '../../components/MoodBadge';
import { CuadreSummaryCard } from '../../components/CuadreSummaryCard';
import { AccountCard } from '../../components/AccountCard';
import { FinancialChart } from '../../components/FinancialChart';
import {
  PortfolioDistributionChart,
  CashflowAnatomyChart,
} from '../../components/AnalyticsCharts';
import { FadeInSlide, PulseIndicator, ScalePressable } from '../../components/AnimatedWidgets';
import { TransactionItem } from '../../components/TransactionItem';
import { NewTransactionModal } from '../Cuadre/NewTransactionModal';
import { TransferModal } from '../Accounts/TransferModal';
import { CreatorCodeModal } from '../../components/CreatorCodeModal';
import { AdjustBalanceModal } from '../Accounts/AdjustBalanceModal';
import { AuditModal } from '../../components/AuditModal';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    stats,
    accounts,
    transactions,
    isLoading,
    refreshAll,
    toggleSettled,
    deleteTransaction,
    isOffline,
  } = useFinancial();
  const { lock } = useAuth();

  const [newTxVisible, setNewTxVisible] = useState(false);
  const [transferVisible, setTransferVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [deletingTx, setDeletingTx] = useState<any | null>(null);
  const [adjustingAcc, setAdjustingAcc] = useState<any | null>(null);
  const [auditVisible, setAuditVisible] = useState(false);

  const recentTransactions = transactions.slice(0, 6);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshAll}
            tintColor={Colors.accentGold}
          />
        }
      >
        {/* Top Header */}
        <FadeInSlide delay={0} distance={12}>
          <View style={styles.topHeader}>
            <View style={styles.brandRow}>
              <Image
                source={require('../../../assets/logos/logix_diminuto_logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.brandTitle}>CUENTAS</Text>
                <View style={styles.statusRow}>
                  <PulseIndicator
                    color={isOffline ? Colors.warning : Colors.success}
                    size={7}
                  />
                  <Text style={styles.statusText}>
                    {isOffline ? 'Modo Offline (Lectura)' : '100% Realtime • Protegido'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setAuditVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.accentGold} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={lock} activeOpacity={0.7}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.accentGold} />
              </TouchableOpacity>
            </View>
          </View>
        </FadeInSlide>

        {/* Estado de Ánimo Financiero */}
        {stats?.mood && (
          <FadeInSlide delay={50} distance={14}>
            <MoodBadge
              status={stats.mood.status}
              emoji={stats.mood.emoji}
              icon={stats.mood.icon}
              color={stats.mood.color}
              label={stats.mood.label}
              message={stats.mood.message}
            />
          </FadeInSlide>
        )}

        {/* Resumen del Cuadre */}
        <FadeInSlide delay={100} distance={16}>
          <CuadreSummaryCard
            pendingIncomes={stats?.cuadre?.pendingIncomes || 0}
            pendingExpenses={stats?.cuadre?.pendingExpenses || 0}
            cuadreNet={stats?.cuadre?.cuadreNet || 0}
            pendingCount={stats?.cuadre?.pendingCount || 0}
          />
        </FadeInSlide>

        {/* Barra de Acciones Rápidas */}
        <FadeInSlide delay={140} distance={16}>
          <View style={styles.quickActionsRow}>
            <ScalePressable
              style={styles.quickActionPrimary}
              onPress={() => {
                setEditingTx(null);
                setNewTxVisible(true);
              }}
            >
              <Ionicons name="add-circle" size={18} color={Colors.bgDark} />
              <Text style={styles.quickActionPrimaryText}>Nuevo Movimiento</Text>
            </ScalePressable>

            <ScalePressable
              style={styles.quickActionSecondary}
              onPress={() => setTransferVisible(true)}
            >
              <Ionicons name="swap-horizontal" size={17} color={Colors.accentGold} />
              <Text style={styles.quickActionSecondaryText}>Traspasar</Text>
            </ScalePressable>

            <ScalePressable
              style={styles.quickActionSecondary}
              onPress={() => setAuditVisible(true)}
            >
              <Ionicons name="shield-checkmark" size={16} color={Colors.accentGold} />
              <Text style={styles.quickActionSecondaryText}>Auditoría</Text>
            </ScalePressable>
          </View>
        </FadeInSlide>

        {/* Billeteras y Cuentas Principales */}
        <FadeInSlide delay={180} distance={18}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Billeteras & Cuentas (Toca para Ajustar)</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Cuentas')}>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.accountsGrid}>
            {accounts.map((acc) => (
              <AccountCard
                key={acc.id}
                name={acc.name}
                currency={acc.currency}
                balance={acc.balance}
                color={acc.color}
                icon={acc.icon}
                onAdjustPress={() => setAdjustingAcc(acc)}
                onTransferPress={() => setAdjustingAcc(acc)}
              />
            ))}
          </View>
        </FadeInSlide>

        {/* Gráfica de Productividad Financiera 3-en-1 */}
        <FadeInSlide delay={230} distance={20}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="bar-chart" size={16} color={Colors.accentGold} />
              <Text style={styles.sectionTitle}>Productividad Financiera (7 Días)</Text>
            </View>
            <Text style={styles.sectionBadge}>Interactivo</Text>
          </View>
          <GlassCard>
            <FinancialChart
              data={stats?.chartDaily || []}
              transactions={transactions}
              cuadreStats={stats?.cuadre}
              settledStats={stats?.settled}
            />
          </GlassCard>
        </FadeInSlide>

        {/* Nuevas Gráficas Analíticas: Distribución Patrimonial & Anatomía */}
        <FadeInSlide delay={280} distance={20}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="pie-chart" size={16} color={Colors.accentGold} />
              <Text style={styles.sectionTitle}>Inteligencia & Distribución Financiera</Text>
            </View>
          </View>
          <GlassCard>
            <PortfolioDistributionChart accounts={accounts} />
          </GlassCard>
          <GlassCard>
            <CashflowAnatomyChart transactions={transactions} />
          </GlassCard>
        </FadeInSlide>

        {/* Movimientos Recientes */}
        <FadeInSlide delay={330} distance={20}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Últimos Movimientos</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Cuadre')}>
              <Text style={styles.seeAllText}>Ver Cuadre</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <GlassCard>
              <Text style={styles.emptyText}>No hay movimientos registrados.</Text>
            </GlassCard>
          ) : (
            recentTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onToggleSettled={toggleSettled}
                onEdit={(item) => setEditingTx(item)}
                onDelete={(item) => setDeletingTx(item)}
              />
            ))
          )}
        </FadeInSlide>
      </ScrollView>

      <NewTransactionModal
        visible={newTxVisible || !!editingTx}
        editingTransaction={editingTx}
        onClose={() => {
          setNewTxVisible(false);
          setEditingTx(null);
        }}
      />

      <TransferModal
        visible={transferVisible}
        onClose={() => setTransferVisible(false)}
      />

      <CreatorCodeModal
        visible={!!deletingTx}
        title="Eliminar Movimiento"
        subtitle={
          deletingTx
            ? `Se eliminará "${deletingTx.title}" ($${deletingTx.amountOriginal.toFixed(
                2
              )} ${deletingTx.currency}) y quedará respaldado en la Bitácora de Auditoría BD.`
            : ''
        }
        actionLabel="Confirmar Eliminación"
        isDestructive
        onClose={() => setDeletingTx(null)}
        onConfirm={async (masterCode, reason) => {
          if (deletingTx) {
            await deleteTransaction(deletingTx.id, masterCode, reason);
          }
        }}
      />

      <AdjustBalanceModal
        visible={!!adjustingAcc}
        account={adjustingAcc}
        onClose={() => setAdjustingAcc(null)}
      />

      <AuditModal visible={auditVisible} onClose={() => setAuditVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 38,
    height: 38,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.accentGold,
    letterSpacing: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(27, 61, 129, 0.25)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  quickActionPrimary: {
    flex: 1.35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.accentGold,
    paddingVertical: 11,
    borderRadius: 13,
  },
  quickActionPrimaryText: {
    color: Colors.bgDark,
    fontSize: 12.5,
    fontWeight: '900',
  },
  quickActionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(27, 61, 129, 0.22)',
    paddingVertical: 11,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  quickActionSecondaryText: {
    color: Colors.accentGold,
    fontSize: 11.5,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accentGold,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  seeAllText: {
    fontSize: 12,
    color: Colors.accentGold,
    fontWeight: '700',
  },
  accountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    padding: 10,
  },
});

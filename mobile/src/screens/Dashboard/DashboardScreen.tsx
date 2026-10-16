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
import { TransactionItem } from '../../components/TransactionItem';
import { NewTransactionModal } from '../Cuadre/NewTransactionModal';
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
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshAll}
            tintColor={Colors.accentGold}
          />
        }
      >
        {/* Top Header */}
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
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isOffline ? Colors.warning : Colors.success },
                  ]}
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

        {/* Estado de Ánimo Financiero */}
        {stats?.mood && (
          <MoodBadge
            status={stats.mood.status}
            emoji={stats.mood.emoji}
            icon={stats.mood.icon}
            color={stats.mood.color}
            label={stats.mood.label}
            message={stats.mood.message}
          />
        )}

        {/* Resumen del Cuadre */}
        <CuadreSummaryCard
          pendingIncomes={stats?.cuadre?.pendingIncomes || 0}
          pendingExpenses={stats?.cuadre?.pendingExpenses || 0}
          cuadreNet={stats?.cuadre?.cuadreNet || 0}
          pendingCount={stats?.cuadre?.pendingCount || 0}
        />

        {/* Billeteras y Cuentas Principales */}
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

        {/* Gráfica de Productividad Financiera */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Productividad Financiera</Text>
        </View>
        <GlassCard>
          <FinancialChart data={stats?.chartDaily || []} />
        </GlassCard>

        {/* Movimientos Recientes */}
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
      </ScrollView>

      <NewTransactionModal
        visible={!!editingTx}
        editingTransaction={editingTx}
        onClose={() => setEditingTx(null)}
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
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: 12,
    color: Colors.accentGold,
    fontWeight: '600',
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

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { TransferModal } from './TransferModal';
import { useFinancial } from '../../context/FinancialContext';

export const AccountsScreen: React.FC = () => {
  const { accounts, stats, isLoading, refreshAll } = useFinancial();
  const [transferModalVisible, setTransferModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshAll}
            tintColor={Colors.accentGold}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>BILLETERAS & BANCOS</Text>
          <Text style={styles.headerSubtitle}>Saldos Reales en Custodia</Text>
        </View>

        {/* Resumen por Monedas */}
        <GlassCard isGoldHighlighted>
          <Text style={styles.summaryLabel}>Total Consolidado en Custodia</Text>
          <View style={styles.currencySummaryRow}>
            <View style={styles.currencySummaryItem}>
              <Text style={[styles.currencyAmount, { color: Colors.usd }]}>
                ${(stats?.wallets?.totalUSD || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.currencyTag}>USD Dólares</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.currencySummaryItem}>
              <Text style={[styles.currencyAmount, { color: Colors.ves }]}>
                Bs {(stats?.wallets?.totalVES || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.currencyTag}>VES Bolívares</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.currencySummaryItem}>
              <Text style={[styles.currencyAmount, { color: Colors.cop }]}>
                ${(stats?.wallets?.totalCOP || 0).toLocaleString('es-ES', { minimumFractionDigits: 0 })}
              </Text>
              <Text style={styles.currencyTag}>COP Pesos</Text>
            </View>
          </View>
        </GlassCard>

        {/* Botón Acción Rápida: Traspaso */}
        <TouchableOpacity
          style={styles.transferActionBtn}
          onPress={() => setTransferModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="swap-horizontal" size={20} color={Colors.bgDark} />
          <Text style={styles.transferActionText}>Realizar Traspaso / Cambio de Divisa</Text>
        </TouchableOpacity>

        {/* Lista Detallada de Cuentas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cuentas Activas</Text>
        </View>

        {accounts.map((acc) => (
          <GlassCard key={acc.id} style={styles.accountCard}>
            <View style={styles.accountCardRow}>
              <View style={[styles.accIconBox, { backgroundColor: `${acc.color || Colors.primary}25` }]}>
                <Ionicons
                  name={(acc.icon as any) || 'wallet-outline'}
                  size={24}
                  color={acc.color || Colors.primary}
                />
              </View>
              <View style={styles.accInfo}>
                <Text style={styles.accName}>{acc.name}</Text>
                <Text style={styles.accCurrency}>Moneda: {acc.currency}</Text>
              </View>
              <View style={styles.accBalanceWrapper}>
                <Text style={styles.accBalance}>
                  {acc.currency === 'USD' ? '$' : acc.currency === 'VES' ? 'Bs' : 'COP $'}{' '}
                  {acc.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </GlassCard>
        ))}
      </ScrollView>

      {/* Modal Traspaso */}
      <TransferModal
        visible={transferModalVisible}
        onClose={() => setTransferModalVisible(false)}
      />
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
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.accentGold,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },
  currencySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  currencySummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  currencyAmount: {
    fontSize: 17,
    fontWeight: '800',
  },
  currencyTag: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.borderGlass,
  },
  transferActionBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.accentGold,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 14,
  },
  transferActionText: {
    color: Colors.bgDark,
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  accountCard: {
    marginVertical: 6,
    padding: 16,
  },
  accountCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accInfo: {
    flex: 1,
  },
  accName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  accCurrency: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  accBalanceWrapper: {
    alignItems: 'flex-end',
  },
  accBalance: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
});

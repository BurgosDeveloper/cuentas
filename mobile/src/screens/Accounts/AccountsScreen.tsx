import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { TransferModal } from './TransferModal';
import { AdjustBalanceModal } from './AdjustBalanceModal';
import { AuditModal } from '../../components/AuditModal';
import { CreatorCodeModal } from '../../components/CreatorCodeModal';
import { useFinancial } from '../../context/FinancialContext';

export const AccountsScreen: React.FC = () => {
  const {
    accounts,
    transfers,
    stats,
    isLoading,
    refreshAll,
    createAccount,
    deleteAccount,
    deleteTransfer,
  } = useFinancial();
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedAccountForAdjust, setSelectedAccountForAdjust] = useState<any | null>(null);
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [newAccModalVisible, setNewAccModalVisible] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccCurrency, setNewAccCurrency] = useState<'USD' | 'VES' | 'COP'>('USD');
  const [newAccBalance, setNewAccBalance] = useState('');

  const [deletingTransfer, setDeletingTransfer] = useState<any | null>(null);
  const [deletingAcc, setDeletingAcc] = useState<any | null>(null);

  const handleCreateAccount = async () => {
    if (!newAccName.trim()) {
      Alert.alert('Validación', 'El nombre de la cuenta o banco es obligatorio.');
      return;
    }
    const bal = parseFloat(newAccBalance.replace(/,/g, '.')) || 0;
    try {
      await createAccount({
        name: newAccName.trim(),
        currency: newAccCurrency,
        initialBalance: bal,
        color: newAccCurrency === 'USD' ? '#00E676' : newAccCurrency === 'VES' ? '#448AFF' : '#FFD700',
        icon: 'wallet-outline',
      });
      setNewAccName('');
      setNewAccBalance('');
      setNewAccModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear la cuenta');
    }
  };

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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>BILLETERAS & BANCOS</Text>
            <Text style={styles.headerSubtitle}>Saldos Reales, Traspasos y Arqueo</Text>
          </View>
          <TouchableOpacity
            style={styles.auditBtn}
            onPress={() => setAuditModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark" size={16} color={Colors.accentGold} />
            <Text style={styles.auditBtnText}>Auditoría</Text>
          </TouchableOpacity>
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
          <Text style={styles.sectionTitle}>Cuentas Activas ({accounts.length})</Text>
          <TouchableOpacity
            style={styles.addAccBtn}
            onPress={() => setNewAccModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={15} color={Colors.accentGold} />
            <Text style={styles.addAccBtnText}>Nueva Cuenta</Text>
          </TouchableOpacity>
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
                <Text style={styles.accCurrency}>Moneda Base: {acc.currency}</Text>
              </View>
              <View style={styles.accBalanceWrapper}>
                <Text style={styles.accBalance}>
                  {acc.currency === 'USD' ? '$' : acc.currency === 'VES' ? 'Bs' : 'COP $'}{' '}
                  {acc.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              {accounts.length > 1 && (
                <TouchableOpacity
                  style={styles.deleteAccBtn}
                  onPress={() => setDeletingAcc(acc)}
                >
                  <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.adjustBalanceBtn}
                onPress={() => setSelectedAccountForAdjust(acc)}
                activeOpacity={0.75}
              >
                <Ionicons name="key-outline" size={14} color={Colors.accentGold} />
                <Text style={styles.adjustBalanceText}>
                  Modificar Saldo Base / Poner en 0.00
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}

        {/* Historial de Traspasos entre Bancos */}
        <View style={[styles.sectionHeader, { marginTop: 22 }]}>
          <Text style={styles.sectionTitle}>Historial de Traspasos entre Cuentas</Text>
          <Text style={styles.sectionHint}>{transfers.length} registros</Text>
        </View>

        {transfers.length === 0 ? (
          <GlassCard>
            <Text style={styles.emptyTransferText}>
              No se han registrado traspasos entre cuentas aún.
            </Text>
          </GlassCard>
        ) : (
          transfers.map((trf) => (
            <GlassCard key={trf.id} style={styles.transferHistoryCard}>
              <View style={styles.transferHistoryTop}>
                <View style={{ flex: 1 }}>
                  <View style={styles.transferFlowRow}>
                    <Text style={styles.transferAccName}>
                      {trf.fromAccount?.name || 'Origen'}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.accentGold} />
                    <Text style={styles.transferAccName}>
                      {trf.toAccount?.name || 'Destino'}
                    </Text>
                  </View>
                  <Text style={styles.transferAmountsText}>
                    Sale: -{trf.amountFrom.toFixed(2)} {trf.fromAccount?.currency || ''} ➔ Entra: +
                    {trf.amountTo.toFixed(2)} {trf.toAccount?.currency || ''}
                    {trf.exchangeRate && trf.exchangeRate !== 1
                      ? ` (Tasa: ${trf.exchangeRate})`
                      : ''}
                  </Text>
                  {trf.note ? <Text style={styles.transferNote}>{trf.note}</Text> : null}
                  <Text style={styles.transferDate}>
                    {new Date(trf.date).toLocaleString('es-VE', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.revertTransferBtn}
                  onPress={() => setDeletingTransfer(trf)}
                >
                  <Ionicons name="arrow-undo-outline" size={15} color={Colors.danger} />
                  <Text style={styles.revertTransferText}>Revertir</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Modal Traspaso */}
      <TransferModal
        visible={transferModalVisible}
        onClose={() => setTransferModalVisible(false)}
      />

      {/* Modal Ajustar Saldo Base con Código Único */}
      <AdjustBalanceModal
        visible={!!selectedAccountForAdjust}
        account={selectedAccountForAdjust}
        onClose={() => setSelectedAccountForAdjust(null)}
      />

      {/* Modal Bitácora de Auditoría */}
      <AuditModal
        visible={auditModalVisible}
        onClose={() => setAuditModalVisible(false)}
      />

      {/* Modal Revertir Traspaso con Código Único */}
      <CreatorCodeModal
        visible={!!deletingTransfer}
        title="Revertir Traspaso Bancario"
        subtitle={
          deletingTransfer
            ? `Se devolverán +${deletingTransfer.amountFrom.toFixed(2)} a "${
                deletingTransfer.fromAccount?.name
              }" y se descontarán -${deletingTransfer.amountTo.toFixed(2)} de "${
                deletingTransfer.toAccount?.name
              }". Quedará registrado en Auditoría BD.`
            : ''
        }
        actionLabel="Revertir Traspaso"
        isDestructive
        onClose={() => setDeletingTransfer(null)}
        onConfirm={async (masterCode, reason) => {
          if (deletingTransfer) {
            await deleteTransfer(deletingTransfer.id, masterCode, reason);
          }
        }}
      />

      {/* Modal Eliminar Cuenta con Código Único */}
      <CreatorCodeModal
        visible={!!deletingAcc}
        title="Eliminar Cuenta / Billetera"
        subtitle={
          deletingAcc
            ? `¿Confirmas eliminar la cuenta "${deletingAcc.name}"? Quedará registrado en la Bitácora de Auditoría BD.`
            : ''
        }
        actionLabel="Eliminar Cuenta"
        isDestructive
        onClose={() => setDeletingAcc(null)}
        onConfirm={async (masterCode, reason) => {
          if (deletingAcc) {
            await deleteAccount(deletingAcc.id, masterCode, reason);
          }
        }}
      />

      {/* Modal Crear Nueva Cuenta */}
      <Modal visible={newAccModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.newAccModal}>
            <View style={styles.newAccHeader}>
              <Text style={styles.newAccTitle}>Nueva Cuenta / Banco</Text>
              <TouchableOpacity onPress={() => setNewAccModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nombre del Banco o Billetera</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Zelle, Binance USDT, Banesco BS..."
              placeholderTextColor={Colors.textMuted}
              value={newAccName}
              onChangeText={setNewAccName}
            />

            <Text style={styles.inputLabel}>Moneda de la Cuenta</Text>
            <View style={styles.currSelectorRow}>
              {(['USD', 'VES', 'COP'] as const).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.currOption,
                    newAccCurrency === c && styles.currOptionActive,
                  ]}
                  onPress={() => setNewAccCurrency(c)}
                >
                  <Text
                    style={[
                      styles.currOptionText,
                      newAccCurrency === c && { color: Colors.bgDark, fontWeight: '800' },
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Saldo Inicial ({newAccCurrency})</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={newAccBalance}
              onChangeText={setNewAccBalance}
            />

            <TouchableOpacity style={styles.saveNewAccBtn} onPress={handleCreateAccount}>
              <Text style={styles.saveNewAccText}>Crear Cuenta</Text>
              <Ionicons name="checkmark-circle" size={18} color={Colors.bgDark} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  auditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 215, 0, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  auditBtnText: {
    color: Colors.accentGold,
    fontSize: 12,
    fontWeight: '800',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionHint: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  addAccBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  addAccBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentGold,
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
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  deleteAccBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  adjustBalanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  adjustBalanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentGold,
  },
  emptyTransferText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    padding: 8,
  },
  transferHistoryCard: {
    marginVertical: 4,
    padding: 12,
  },
  transferHistoryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  transferFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transferAccName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  transferAmountsText: {
    fontSize: 12,
    color: Colors.accentGold,
    fontWeight: '600',
    marginTop: 3,
  },
  transferNote: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  transferDate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  revertTransferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  revertTransferText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
  },
  newAccModal: {
    backgroundColor: '#0D1322',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.2,
    borderColor: Colors.borderGold,
    padding: 20,
  },
  newAccHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  newAccTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.accentGold,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: 'rgba(7, 10, 18, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
  },
  currSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  currOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
  },
  currOptionActive: {
    backgroundColor: Colors.accentGold,
    borderColor: Colors.accentGold,
  },
  currOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  saveNewAccBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.accentGold,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 10,
  },
  saveNewAccText: {
    color: Colors.bgDark,
    fontSize: 15,
    fontWeight: '800',
  },
});

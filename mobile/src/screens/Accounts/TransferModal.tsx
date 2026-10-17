import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme/colors';
import { useFinancial } from '../../context/FinancialContext';
import { TransferFundsSchema } from '@cuentas/shared';

interface TransferModalProps {
  visible: boolean;
  onClose: () => void;
}

const normalizeNumberStr = (val: string) => val.replace(/,/g, '.');

export const TransferModal: React.FC<TransferModalProps> = ({ visible, onClose }) => {
  const { accounts, transferFunds } = useFinancial();

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amountFrom, setAmountFrom] = useState('');
  const [exchangeRate, setExchangeRate] = useState('1.0');
  const [conversionMode, setConversionMode] = useState<'MULTIPLY' | 'DIVIDE' | 'SAME'>('SAME');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && accounts.length > 0) {
      const initialFrom = accounts[0]?.id || '';
      const initialTo = accounts[1]?.id || accounts[0]?.id || '';
      setFromAccountId((prev) => (prev && accounts.some((a) => a.id === prev) ? prev : initialFrom));
      setToAccountId((prev) => (prev && accounts.some((a) => a.id === prev) ? prev : initialTo));
      setAmountFrom('');
      setNote('');
      setLoading(false);
    }
  }, [visible, accounts]);

  const fromAcc = accounts.find((a) => a.id === fromAccountId);
  const toAcc = accounts.find((a) => a.id === toAccountId);

  // Ajustar modo de conversión automáticamente cuando cambian las cuentas
  useEffect(() => {
    if (!fromAcc || !toAcc) return;
    if (fromAcc.currency === toAcc.currency) {
      setConversionMode('SAME');
      setExchangeRate('1');
    } else if (fromAcc.currency === 'USD' && toAcc.currency !== 'USD') {
      setConversionMode('MULTIPLY');
    } else if (fromAcc.currency !== 'USD' && toAcc.currency === 'USD') {
      setConversionMode('DIVIDE');
    } else {
      setConversionMode('MULTIPLY');
    }
  }, [fromAcc?.currency, toAcc?.currency]);

  const parsedAmount = parseFloat(normalizeNumberStr(amountFrom)) || 0;
  const parsedRate = parseFloat(normalizeNumberStr(exchangeRate)) || 1.0;

  const calculatedToNumber = (() => {
    if ( parsedAmount <= 0) return 0;
    if (conversionMode === 'SAME' || fromAcc?.currency === toAcc?.currency) {
      return parsedAmount;
    }
    if (conversionMode === 'DIVIDE') {
      return parsedRate > 0 ? parsedAmount / parsedRate : 0;
    }
    return parsedAmount * parsedRate;
  })();

  const getSym = (curr?: string) => (curr === 'USD' ? '$' : curr === 'VES' ? 'Bs' : 'COP $');

  const handleSwapAccounts = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  };

  const handleUseFullBalance = () => {
    if (!fromAcc || fromAcc.balance <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmountFrom(String(fromAcc.balance));
  };

  const handleTransfer = async () => {
    if (!fromAcc || !toAcc) {
      Alert.alert('Validación', 'Selecciona la cuenta de origen y destino.');
      return;
    }
    if (fromAccountId === toAccountId) {
      Alert.alert('Validación', 'La cuenta de origen y destino no pueden ser iguales.');
      return;
    }
    if (parsedAmount <= 0) {
      Alert.alert('Validación', 'El monto a transferir debe ser mayor a 0.');
      return;
    }
    if (parsedAmount > fromAcc.balance) {
      Alert.alert(
        'Saldo Insuficiente',
        `La cuenta "${fromAcc.name}" tiene disponible ${getSym(fromAcc.currency)} ${fromAcc.balance.toFixed(
          2
        )} y estás intentando transferir ${getSym(fromAcc.currency)} ${parsedAmount.toFixed(2)}.`
      );
      return;
    }
    if (fromAcc.currency !== toAcc.currency && parsedRate <= 0) {
      Alert.alert('Validación', 'Ingresa una tasa de cambio válida mayor a 0.');
      return;
    }

    const payload = {
      fromAccountId,
      toAccountId,
      amountFrom: Number(parsedAmount.toFixed(2)),
      amountTo: Number(calculatedToNumber.toFixed(2)),
      exchangeRate: fromAcc.currency === toAcc.currency ? 1.0 : parsedRate,
      conversionMode,
      note: note.trim() || undefined,
    };

    const validation = TransferFundsSchema.safeParse(payload);
    if (!validation.success) {
      Alert.alert('Error', validation.error.errors[0]?.message || 'Datos inválidos');
      return;
    }

    setLoading(true);
    try {
      await transferFunds(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAmountFrom('');
      setNote('');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo realizar el traspaso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Traspaso / Cambio de Divisa</Text>
              <Text style={styles.modalSubtitle}>
                Transferencia inmediata con auditoría automática
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Cuenta Origen */}
            <Text style={styles.label}>1. Cuenta de Origen (Sale dinero)</Text>
            <View style={styles.accountsRow}>
              {accounts.map((acc) => {
                const isSelected = fromAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[styles.accPill, isSelected && styles.accPillActive]}
                    onPress={() => setFromAccountId(acc.id)}
                  >
                    <Text style={[styles.accPillName, isSelected && { color: Colors.accentGold }]}>
                      {acc.name}
                    </Text>
                    <Text style={styles.accPillBalance}>
                      {getSym(acc.currency)} {acc.balance.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botón Invertir Origen <-> Destino */}
            <View style={styles.swapRow}>
              <View style={styles.swapLine} />
              <TouchableOpacity style={styles.swapBtn} onPress={handleSwapAccounts}>
                <Ionicons name="swap-vertical" size={16} color={Colors.accentGold} />
                <Text style={styles.swapBtnText}>Invertir Origen / Destino</Text>
              </TouchableOpacity>
              <View style={styles.swapLine} />
            </View>

            {/* Cuenta Destino */}
            <Text style={styles.label}>2. Cuenta de Destino (Entra dinero)</Text>
            <View style={styles.accountsRow}>
              {accounts.map((acc) => {
                const isSelected = toAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[styles.accPill, isSelected && styles.accPillActive]}
                    onPress={() => setToAccountId(acc.id)}
                  >
                    <Text style={[styles.accPillName, isSelected && { color: Colors.accentGold }]}>
                      {acc.name}
                    </Text>
                    <Text style={styles.accPillBalance}>
                      {getSym(acc.currency)} {acc.balance.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Monto de Origen */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  Monto que sale ({fromAcc?.currency || 'USD'})
                </Text>
                {fromAcc && fromAcc.balance > 0 && (
                  <TouchableOpacity style={styles.maxBtn} onPress={handleUseFullBalance}>
                    <Text style={styles.maxBtnText}>
                      Usar 100% ({getSym(fromAcc.currency)} {fromAcc.balance.toFixed(2)})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={amountFrom}
                onChangeText={(v) => setAmountFrom(normalizeNumberStr(v))}
              />
            </View>

            {/* Tasa y Modo de Conversión si son monedas distintas */}
            {fromAcc && toAcc && fromAcc.currency !== toAcc.currency ? (
              <View style={styles.conversionCard}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    Tasa de Cambio ({fromAcc.currency} ➔ {toAcc.currency})
                  </Text>
                  <View style={styles.modeSwitchRow}>
                    <TouchableOpacity
                      style={[
                        styles.modeBtn,
                        conversionMode === 'MULTIPLY' && styles.modeBtnActive,
                      ]}
                      onPress={() => setConversionMode('MULTIPLY')}
                    >
                      <Text
                        style={[
                          styles.modeBtnText,
                          conversionMode === 'MULTIPLY' && styles.modeBtnTextActive,
                        ]}
                      >
                        × Multiplicar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modeBtn,
                        conversionMode === 'DIVIDE' && styles.modeBtnActive,
                      ]}
                      onPress={() => setConversionMode('DIVIDE')}
                    >
                      <Text
                        style={[
                          styles.modeBtnText,
                          conversionMode === 'DIVIDE' && styles.modeBtnTextActive,
                        ]}
                      >
                        ÷ Dividir
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Ej. 50 (Bs/$) o 4200 (COP/$)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  value={exchangeRate}
                  onChangeText={(v) => setExchangeRate(normalizeNumberStr(v))}
                />

                <Text style={styles.formulaHint}>
                  Fórmula: {parsedAmount.toFixed(2)} {fromAcc.currency}{' '}
                  {conversionMode === 'DIVIDE' ? '÷' : '×'} {parsedRate} ={' '}
                  {calculatedToNumber.toFixed(2)} {toAcc.currency}
                </Text>
              </View>
            ) : (
              <View style={styles.sameCurrencyBadge}>
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
                <Text style={styles.sameCurrencyText}>
                  Misma moneda ({fromAcc?.currency || 'USD'}) • Traspaso directo 1 a 1
                </Text>
              </View>
            )}

            {/* Resumen de Cálculo Resultante */}
            <View style={styles.calcBox}>
              <Text style={styles.calcLabel}>
                Monto que se acreditará en {toAcc?.name || 'Destino'}:
              </Text>
              <Text style={styles.calcValue}>
                +{getSym(toAcc?.currency)} {calculatedToNumber.toFixed(2)} {toAcc?.currency}
              </Text>
              {fromAcc && parsedAmount > 0 && (
                <Text
                  style={[
                    styles.remainingText,
                    fromAcc.balance - parsedAmount < 0 && { color: Colors.danger },
                  ]}
                >
                  Saldo restante en {fromAcc.name}: {getSym(fromAcc.currency)}{' '}
                  {(fromAcc.balance - parsedAmount).toFixed(2)}
                </Text>
              )}
            </View>

            {/* Nota */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nota / Referencia de Transferencia (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="ej. Cambio de divisas, retiro efectivo..."
                placeholderTextColor={Colors.textMuted}
                value={note}
                onChangeText={setNote}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleTransfer}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.bgDark} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Ejecutar Traspaso Ahora</Text>
                  <Ionicons name="swap-horizontal" size={20} color={Colors.bgDark} />
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0D1322',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.2,
    borderColor: Colors.borderGold,
    maxHeight: '92%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.accentGold,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  accountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  accPill: {
    width: '48%',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  accPillActive: {
    borderColor: Colors.accentGold,
    backgroundColor: 'rgba(255, 215, 0, 0.14)',
  },
  accPillName: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  accPillBalance: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  swapLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderGlass,
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  swapBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentGold,
  },
  maxBtn: {
    backgroundColor: 'rgba(0, 230, 118, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.35)',
  },
  maxBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.success,
  },
  inputGroup: {
    marginTop: 8,
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'rgba(7, 10, 18, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 15,
    fontWeight: '700',
  },
  conversionCard: {
    backgroundColor: 'rgba(27, 61, 129, 0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginVertical: 6,
  },
  modeSwitchRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  modeBtnActive: {
    backgroundColor: Colors.accentGold,
    borderColor: Colors.accentGold,
  },
  modeBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modeBtnTextActive: {
    color: Colors.bgDark,
  },
  formulaHint: {
    fontSize: 11,
    color: Colors.accentGold,
    marginTop: 6,
    fontWeight: '600',
  },
  sameCurrencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  sameCurrencyText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  calcBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    padding: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  calcLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  calcValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.accentGold,
    marginTop: 2,
  },
  remainingText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.accentGold,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: Colors.bgDark,
    fontSize: 15,
    fontWeight: '800',
  },
});

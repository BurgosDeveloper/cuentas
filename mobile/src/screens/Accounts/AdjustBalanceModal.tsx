import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme/colors';
import { useFinancial } from '../../context/FinancialContext';
import { MASTER_CREATOR_CODE } from '@cuentas/shared';

interface AdjustBalanceModalProps {
  visible: boolean;
  account: {
    id: string;
    name: string;
    currency: 'USD' | 'VES' | 'COP';
    balance: number;
    color?: string;
  } | null;
  onClose: () => void;
}

export const AdjustBalanceModal: React.FC<AdjustBalanceModalProps> = ({
  visible,
  account,
  onClose,
}) => {
  const { adjustAccountBalance } = useFinancial();
  const [newBalance, setNewBalance] = useState('');
  const [reason, setReason] = useState('');
  const [masterCode, setMasterCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && account) {
      setNewBalance(String(account.balance));
      setReason('');
      setMasterCode('');
      setError('');
      setLoading(false);
    }
  }, [visible, account]);

  if (!account) return null;

  const currencySymbol =
    account.currency === 'USD' ? '$' : account.currency === 'VES' ? 'Bs' : 'COP $';

  const handleSetZero = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNewBalance('0');
    if (!reason) {
      setReason('Reinicio de saldo base a 0.00');
    }
  };

  const handleSave = async () => {
    const parsedBalance = parseFloat(newBalance.replace(/,/g, '.'));
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      setError('Ingresa un monto numérico válido mayor o igual a 0.');
      return;
    }

    if (masterCode.trim() !== MASTER_CREATOR_CODE) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Código único de programador inválido.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await adjustAccountBalance(
        account.id,
        parsedBalance,
        masterCode.trim(),
        reason.trim() || undefined
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Saldo Base Actualizado',
        `El saldo de ${account.name} fue fijado en ${currencySymbol} ${parsedBalance.toFixed(2)} y registrado en auditoría.`
      );
      onClose();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.message || 'No se pudo ajustar el saldo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="options" size={22} color={Colors.accentGold} />
              <View>
                <Text style={styles.title}>Modificar Saldo Base</Text>
                <Text style={styles.subtitle}>
                  {account.name} ({account.currency})
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.currentBalanceBox}>
            <Text style={styles.currentLabel}>Saldo Actual Registrado:</Text>
            <Text style={styles.currentValue}>
              {currencySymbol}{' '}
              {account.balance.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Nuevo Saldo Base ({account.currency})</Text>
              <TouchableOpacity style={styles.zeroBtn} onPress={handleSetZero}>
                <Ionicons name="refresh-outline" size={13} color={Colors.accentGold} />
                <Text style={styles.zeroBtnText}>Colocar en 0.00</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={newBalance}
              onChangeText={setNewBalance}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Motivo del Ajuste (Auditoría)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Arqueo inicial, puesta en 0, ajuste de caja..."
              placeholderTextColor={Colors.textMuted}
              value={reason}
              onChangeText={setReason}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código Único de Programador</Text>
            <View style={styles.codeInputWrapper}>
              <Ionicons name="key-outline" size={18} color={Colors.accentGold} />
              <TextInput
                style={styles.codeInput}
                placeholder="Código de creador"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                secureTextEntry
                value={masterCode}
                onChangeText={(v) => {
                  setMasterCode(v);
                  if (error) setError('');
                }}
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.bgDark} />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={18} color={Colors.bgDark} />
                <Text style={styles.saveBtnText}>Autorizar y Guardar Saldo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0D1322',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderColor: Colors.borderGold,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.accentGold,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  currentBalanceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(27, 61, 129, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  currentLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  inputGroup: {
    marginBottom: 14,
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
    marginBottom: 4,
  },
  zeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
  },
  zeroBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.accentGold,
  },
  amountInput: {
    backgroundColor: 'rgba(7, 10, 18, 0.8)',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: Colors.accentGold,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 20,
    fontWeight: '800',
  },
  input: {
    backgroundColor: 'rgba(7, 10, 18, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
  },
  codeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 10, 18, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  codeInput: {
    flex: 1,
    color: Colors.accentGold,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.accentGold,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  saveBtnText: {
    color: Colors.bgDark,
    fontSize: 15,
    fontWeight: '800',
  },
});

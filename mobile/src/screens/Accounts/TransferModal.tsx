import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useFinancial } from '../../context/FinancialContext';
import { TransferFundsSchema } from '@cuentas/shared';

interface TransferModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ visible, onClose }) => {
  const { accounts, transferFunds } = useFinancial();

  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [amountFrom, setAmountFrom] = useState('');
  const [exchangeRate, setExchangeRate] = useState('1.0');
  const [note, setNote] = useState('');

  const parsedAmount = parseFloat(amountFrom) || 0;
  const parsedRate = parseFloat(exchangeRate) || 1.0;
  const calculatedTo = (parsedAmount * parsedRate).toFixed(2);

  const handleTransfer = async () => {
    if (fromAccountId === toAccountId) {
      Alert.alert('Validación', 'La cuenta de origen y destino no pueden ser iguales.');
      return;
    }
    if (parsedAmount <= 0) {
      Alert.alert('Validación', 'El monto debe ser mayor a 0.');
      return;
    }

    const payload = {
      fromAccountId,
      toAccountId,
      amountFrom: parsedAmount,
      exchangeRate: parsedRate,
      note: note.trim() || undefined,
    };

    const validation = TransferFundsSchema.safeParse(payload);
    if (!validation.success) {
      Alert.alert('Error', validation.error.errors[0]?.message || 'Datos inválidos');
      return;
    }

    try {
      await transferFunds(payload);
      setAmountFrom('');
      setNote('');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo realizar el traspaso');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Traspaso / Cambio de Divisa</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Cuenta Origen */}
          <Text style={styles.label}>Cuenta de Origen (Sale dinero)</Text>
          <View style={styles.accountsRow}>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.accPill,
                  fromAccountId === acc.id && styles.accPillActive,
                ]}
                onPress={() => setFromAccountId(acc.id)}
              >
                <Text style={styles.accPillText}>{acc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cuenta Destino */}
          <Text style={styles.label}>Cuenta de Destino (Entra dinero)</Text>
          <View style={styles.accountsRow}>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.accPill,
                  toAccountId === acc.id && styles.accPillActive,
                ]}
                onPress={() => setToAccountId(acc.id)}
              >
                <Text style={styles.accPillText}>{acc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Monto y Tasa */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Monto Origen</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={amountFrom}
                onChangeText={setAmountFrom}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Tasa de Cambio</Text>
              <TextInput
                style={styles.input}
                placeholder="1.0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={exchangeRate}
                onChangeText={setExchangeRate}
              />
            </View>
          </View>

          {/* Cálculo resultante */}
          <View style={styles.calcBox}>
            <Text style={styles.calcLabel}>Monto acreditado resultante:</Text>
            <Text style={styles.calcValue}>{calculatedTo}</Text>
          </View>

          {/* Nota */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nota / Referencia de Transferencia</Text>
            <TextInput
              style={styles.input}
              placeholder="ej. Cambio de USD a Bolívares..."
              placeholderTextColor={Colors.textMuted}
              value={note}
              onChangeText={setNote}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleTransfer} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Ejecutar Traspaso</Text>
            <Ionicons name="swap-horizontal" size={20} color={Colors.bgDark} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0D1322',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.2,
    borderColor: Colors.borderGlass,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.accentGold,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 6,
  },
  accountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  accPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  accPillActive: {
    borderColor: Colors.accentGold,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  accPillText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(7, 10, 18, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
  },
  calcBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    padding: 10,
    alignItems: 'center',
    marginVertical: 8,
  },
  calcLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  calcValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.accentGold,
    marginTop: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.accentGold,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: Colors.bgDark,
    fontSize: 15,
    fontWeight: '800',
  },
});

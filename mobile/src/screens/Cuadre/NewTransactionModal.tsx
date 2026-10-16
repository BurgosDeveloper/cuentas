import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useFinancial } from '../../context/FinancialContext';
import { CreateTransactionSchema } from '@cuentas/shared';

interface NewTransactionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({ visible, onClose }) => {
  const { accounts, thirds, projects, createTransaction } = useFinancial();

  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'VES' | 'COP'>('USD');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [selectedThirdId, setSelectedThirdId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSettled, setIsSettled] = useState(false);
  const [note, setNote] = useState('');

  // Splits dinámicos (ej. Servidor = 30$ -> arow 25 - basilico 5)
  const [splits, setSplits] = useState<Array<{ thirdPartyId: string; amount: string; note: string }>>([]);

  const addSplit = () => {
    if (thirds.length === 0) {
      Alert.alert('Terceros', 'Primero registra al menos un tercero en la pestaña Terceros.');
      return;
    }
    setSplits([...splits, { thirdPartyId: thirds[0].id, amount: '', note: '' }]);
  };

  const removeSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const updateSplit = (index: number, field: string, value: string) => {
    const updated = [...splits];
    (updated[index] as any)[field] = value;
    setSplits(updated);
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    const parsedRate = parseFloat(exchangeRate) || 1.0;

    if (!title.trim()) {
      Alert.alert('Validación', 'El concepto es obligatorio.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validación', 'El monto debe ser mayor a 0.');
      return;
    }
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }

    const payload = {
      title: title.trim(),
      type,
      amountOriginal: parsedAmount,
      currency,
      exchangeRate: parsedRate,
      accountId: selectedAccountId || accounts[0]?.id,
      thirdPartyId: selectedThirdId || null,
      projectId: selectedProjectId || null,
      isSettled,
      note: note.trim() || null,
      splits: splits
        .filter((s) => parseFloat(s.amount) > 0)
        .map((s) => ({
          thirdPartyId: s.thirdPartyId,
          amount: parseFloat(s.amount),
          note: s.note?.trim() || undefined,
        })),
    };

    const validation = CreateTransactionSchema.safeParse(payload);
    if (!validation.success) {
      Alert.alert('Error', validation.error.errors[0]?.message || 'Datos inválidos');
      return;
    }

    try {
      await createTransaction(payload);
      // Reset
      setTitle('');
      setAmount('');
      setSplits([]);
      setNote('');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nuevo Movimiento</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Selector Tipo: Ingreso / Egreso */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'EXPENSE' && { backgroundColor: Colors.danger },
                ]}
                onPress={() => setType('EXPENSE')}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={16}
                  color={type === 'EXPENSE' ? Colors.bgDark : Colors.danger}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    type === 'EXPENSE' && { color: Colors.bgDark, fontWeight: '800' },
                  ]}
                >
                  Egreso (Gasto)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'INCOME' && { backgroundColor: Colors.success },
                ]}
                onPress={() => setType('INCOME')}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={16}
                  color={type === 'INCOME' ? Colors.bgDark : Colors.success}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    type === 'INCOME' && { color: Colors.bgDark, fontWeight: '800' },
                  ]}
                >
                  Ingreso (Cobro)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Concepto */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Concepto / Descripción</Text>
              <TextInput
                style={styles.input}
                placeholder="ej. Servidor, Tortas, Kenyer, Moto..."
                placeholderTextColor={Colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Monto y Moneda */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1.2 }]}>
                <Text style={styles.label}>Monto</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Moneda</Text>
                <View style={styles.currencyRow}>
                  {(['USD', 'VES', 'COP'] as const).map((curr) => (
                    <TouchableOpacity
                      key={curr}
                      style={[
                        styles.currPill,
                        currency === curr && styles.currPillActive,
                      ]}
                      onPress={() => setCurrency(curr)}
                    >
                      <Text
                        style={[
                          styles.currPillText,
                          currency === curr && styles.currPillTextActive,
                        ]}
                      >
                        {curr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Tasa si no es USD */}
            {currency !== 'USD' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tasa de cambio hacia USD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ej. 3200 (COP) o 1000 (VES)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  value={exchangeRate}
                  onChangeText={setExchangeRate}
                />
              </View>
            )}

            {/* Cuenta Vinculada */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cuenta Financiera Afectada</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                {accounts.map((acc) => (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.accountPill,
                      (selectedAccountId === acc.id || (!selectedAccountId && acc === accounts[0])) &&
                        styles.accountPillActive,
                    ]}
                    onPress={() => setSelectedAccountId(acc.id)}
                  >
                    <Ionicons name="wallet-outline" size={14} color={Colors.accentGold} />
                    <Text style={styles.accountPillText}>{acc.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Tercero Asociado (opcional si es directo) */}
            {thirds.length > 0 && splits.length === 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Asignar a Tercero (Opcional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                  <TouchableOpacity
                    style={[styles.thirdPill, !selectedThirdId && styles.thirdPillActive]}
                    onPress={() => setSelectedThirdId(null)}
                  >
                    <Text style={styles.thirdPillText}>Ninguno</Text>
                  </TouchableOpacity>
                  {thirds.map((th) => (
                    <TouchableOpacity
                      key={th.id}
                      style={[
                        styles.thirdPill,
                        selectedThirdId === th.id && styles.thirdPillActive,
                      ]}
                      onPress={() => setSelectedThirdId(th.id)}
                    >
                      <Text style={styles.thirdPillText}>{th.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Repartos / Splits */}
            <View style={styles.splitSection}>
              <View style={styles.splitHeader}>
                <Text style={styles.label}>Reparto de Gasto con Terceros (Splits)</Text>
                <TouchableOpacity style={styles.addSplitBtn} onPress={addSplit}>
                  <Ionicons name="add-circle" size={16} color={Colors.accentGold} />
                  <Text style={styles.addSplitText}>+ Añadir</Text>
                </TouchableOpacity>
              </View>

              {splits.map((s, idx) => (
                <View key={idx} style={styles.splitRow}>
                  <View style={{ flex: 1.5 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {thirds.map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          style={[
                            styles.splitThirdPill,
                            s.thirdPartyId === t.id && styles.splitThirdPillActive,
                          ]}
                          onPress={() => updateSplit(idx, 'thirdPartyId', t.id)}
                        >
                          <Text style={styles.splitThirdText}>{t.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <TextInput
                    style={[styles.input, { flex: 0.8, height: 38 }]}
                    placeholder="Monto $"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                    value={s.amount}
                    onChangeText={(val) => updateSplit(idx, 'amount', val)}
                  />
                  <TouchableOpacity onPress={() => removeSplit(idx)}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Proyectos */}
            {projects.length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Asignar a Proyecto (Opcional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                  <TouchableOpacity
                    style={[styles.thirdPill, !selectedProjectId && styles.thirdPillActive]}
                    onPress={() => setSelectedProjectId(null)}
                  >
                    <Text style={styles.thirdPillText}>Ninguno</Text>
                  </TouchableOpacity>
                  {projects.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.thirdPill,
                        selectedProjectId === p.id && styles.thirdPillActive,
                      ]}
                      onPress={() => setSelectedProjectId(p.id)}
                    >
                      <Text style={styles.thirdPillText}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Estado inicial */}
            <TouchableOpacity
              style={styles.settledToggleRow}
              onPress={() => setIsSettled(!isSettled)}
              activeOpacity={0.7}
            >
              <View style={[styles.settledBox, isSettled && styles.settledBoxChecked]}>
                {isSettled && <Ionicons name="checkmark" size={16} color={Colors.bgDark} />}
              </View>
              <View>
                <Text style={styles.settledTitle}>
                  {isSettled ? 'Marcado como Saldado / Pagado' : 'Pendiente por Cuadrar'}
                </Text>
                <Text style={styles.settledSubtitle}>
                  {isSettled
                    ? 'No impactará la suma del Cuadre Diario'
                    : 'Aparecerá activo en la lista del Cuadre'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Guardar Movimiento</Text>
              <Ionicons name="save-outline" size={18} color={Colors.bgDark} />
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0D1322',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.2,
    borderColor: Colors.borderGlass,
    maxHeight: '90%',
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
  formScroll: {
    marginBottom: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  typeBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 4,
    height: 46,
    alignItems: 'center',
  },
  currPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  currPillActive: {
    backgroundColor: Colors.accentGold,
    borderColor: Colors.accentGold,
  },
  currPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  currPillTextActive: {
    color: Colors.bgDark,
  },
  pillsScroll: {
    flexDirection: 'row',
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  accountPillActive: {
    borderColor: Colors.accentGold,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  accountPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  thirdPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginRight: 6,
  },
  thirdPillActive: {
    borderColor: Colors.accentGold,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  thirdPillText: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  splitSection: {
    marginVertical: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addSplitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addSplitText: {
    color: Colors.accentGold,
    fontSize: 12,
    fontWeight: '700',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  splitThirdPill: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginRight: 4,
  },
  splitThirdPillActive: {
    backgroundColor: Colors.accentGold,
    borderColor: Colors.accentGold,
  },
  splitThirdText: {
    fontSize: 11,
    color: Colors.textPrimary,
  },
  settledToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
  },
  settledBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settledBoxChecked: {
    backgroundColor: Colors.accentGold,
    borderColor: Colors.accentGold,
  },
  settledTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  settledSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.accentGold,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  saveBtnText: {
    color: Colors.bgDark,
    fontSize: 15,
    fontWeight: '800',
  },
});

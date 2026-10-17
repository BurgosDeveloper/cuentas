import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useFinancial } from '../../context/FinancialContext';
import { CreateProjectItemSchema } from '@cuentas/shared';

interface NewProjectItemModalProps {
  visible: boolean;
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export const NewProjectItemModal: React.FC<NewProjectItemModalProps> = ({
  visible,
  projectId,
  projectName,
  onClose,
}) => {
  const { createProjectItem } = useFinancial();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isActive, setIsActive] = useState(false); // false = recordatorio/presupuesto

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount.replace(/,/g, '.'));
    if (!title.trim()) {
      Alert.alert('Validación', 'El título del ítem es requerido.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validación', 'El monto debe ser mayor a 0.');
      return;
    }

    const payload = {
      projectId,
      title: title.trim(),
      amount: parsedAmount,
      currency: 'USD' as const,
      isActive,
    };

    const validation = CreateProjectItemSchema.safeParse(payload);
    if (!validation.success) {
      Alert.alert('Error', validation.error.errors[0]?.message || 'Datos inválidos');
      return;
    }

    try {
      await createProjectItem(payload);
      setTitle('');
      setAmount('');
      setIsActive(false);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo agregar el ítem');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Nuevo Ítem de Proyecto</Text>
              <Text style={styles.modalSubtitle}>{projectName}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Concepto / Repuesto / Servicio</Text>
            <TextInput
              style={styles.input}
              placeholder="ej. Martilleras, Válvulas, Mano de obra..."
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monto Estimado ($ USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* Switch Activo vs Recordatorio */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>
                {isActive ? 'Ítem Activo (Gasto Operativo)' : 'Recordatorio / Presupuesto'}
              </Text>
              <Text style={styles.switchDesc}>
                {isActive
                  ? 'Afectará los totales contables del proyecto de inmediato.'
                  : 'Permanecerá como recordatorio de compra futura sin descontar saldo.'}
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.accentGold }}
              thumbColor={isActive ? Colors.bgDark : Colors.textSecondary}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Añadir al Proyecto</Text>
            <Ionicons name="add-circle-outline" size={18} color={Colors.bgDark} />
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
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginVertical: 10,
    gap: 10,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  switchDesc: {
    fontSize: 11,
    color: Colors.textMuted,
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

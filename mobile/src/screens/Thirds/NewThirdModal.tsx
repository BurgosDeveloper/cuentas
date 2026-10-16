import React, { useState, useEffect } from 'react';
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
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme/colors';
import { useFinancial } from '../../context/FinancialContext';
import { CreateThirdPartySchema, MASTER_CREATOR_CODE } from '@cuentas/shared';

interface NewThirdModalProps {
  visible: boolean;
  editingThird?: any | null;
  onClose: () => void;
}

export const NewThirdModal: React.FC<NewThirdModalProps> = ({
  visible,
  editingThird = null,
  onClose,
}) => {
  const { createThird, updateThird } = useFinancial();
  const isEditing = !!editingThird;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [masterCode, setMasterCode] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (editingThird) {
      setName(editingThird.name || '');
      setPhone(editingThird.phone || '');
      setNotes(editingThird.notes || '');
      setMasterCode('');
    } else {
      setName('');
      setPhone('');
      setNotes('');
      setMasterCode('');
    }
  }, [visible, editingThird]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validación', 'El nombre del tercero es obligatorio.');
      return;
    }

    if (isEditing) {
      if (masterCode.trim() !== MASTER_CREATOR_CODE) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Código Requerido',
          'Debes ingresar el código único de programador para editar un tercero.'
        );
        return;
      }

      try {
        await updateThird(editingThird.id, {
          name: name.trim(),
          phone: phone.trim() || null,
          notes: notes.trim() || null,
          masterCode: masterCode.trim(),
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      } catch (err: any) {
        Alert.alert('Error', err.message || 'No se pudo actualizar el tercero');
      }
      return;
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const validation = CreateThirdPartySchema.safeParse(payload);
    if (!validation.success) {
      Alert.alert('Error', validation.error.errors[0]?.message || 'Datos inválidos');
      return;
    }

    try {
      await createThird(payload);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar el tercero');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Editar Tercero / Contacto' : 'Nuevo Tercero / Contacto'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre o Alias</Text>
            <TextInput
              style={styles.input}
              placeholder="ej. Luis, Arow, Basílico, Kenyer, Raquel..."
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="ej. +58 412..."
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notas adicionales</Text>
            <TextInput
              style={styles.input}
              placeholder="ej. Socio de negocio, proveedor..."
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {isEditing && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: Colors.accentGold }]}>
                Código Único de Programador
              </Text>
              <TextInput
                style={[styles.input, { borderColor: Colors.accentGold, color: Colors.accentGold, fontWeight: '800' }]}
                placeholder="Código de creador..."
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                secureTextEntry
                value={masterCode}
                onChangeText={setMasterCode}
              />
            </View>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>
              {isEditing ? 'Autorizar y Guardar Cambios' : 'Guardar Tercero'}
            </Text>
            <Ionicons
              name={isEditing ? 'shield-checkmark' : 'person-add-outline'}
              size={18}
              color={Colors.bgDark}
            />
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

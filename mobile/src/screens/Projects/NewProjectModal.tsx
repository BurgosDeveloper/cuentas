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
import { CreateProjectSchema } from '@cuentas/shared';

interface NewProjectModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ visible, onClose }) => {
  const { createProject } = useFinancial();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validación', 'El nombre del proyecto o bien es obligatorio.');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      color: '#FFD700',
      icon: 'briefcase-outline',
    };

    const validation = CreateProjectSchema.safeParse(payload);
    if (!validation.success) {
      Alert.alert('Error', validation.error.errors[0]?.message || 'Datos inválidos');
      return;
    }

    try {
      await createProject(payload);
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear el proyecto');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nuevo Proyecto / Bien</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Proyecto</Text>
            <TextInput
              style={styles.input}
              placeholder="ej. Gastos de la moto, Proyecto Arow..."
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción o Meta (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="ej. Reparaciones mecánicas, presupuesto..."
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Crear Proyecto</Text>
            <Ionicons name="briefcase-outline" size={18} color={Colors.bgDark} />
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

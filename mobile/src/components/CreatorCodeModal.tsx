import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { MASTER_CREATOR_CODE } from '@cuentas/shared';

interface CreatorCodeModalProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  isDestructive?: boolean;
  showReasonInput?: boolean;
  onClose: () => void;
  onConfirm: (masterCode: string, reason?: string) => Promise<void>;
}

export const CreatorCodeModal: React.FC<CreatorCodeModalProps> = ({
  visible,
  title = 'Autorización de Creador',
  subtitle = 'Ingresa el código único de programador para autorizar esta operación. Quedará registrada en la bitácora de auditoría.',
  actionLabel = 'Autorizar y Ejecutar',
  isDestructive = false,
  showReasonInput = true,
  onClose,
  onConfirm,
}) => {
  const [code, setCode] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setCode('');
      setReason('');
      setError('');
      setLoading(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    const trimmed = code.trim();
    if (trimmed !== MASTER_CREATOR_CODE) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Código de creador incorrecto. Acceso denegado.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onConfirm(trimmed, reason.trim() || undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.message || 'No se pudo completar la operación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: isDestructive
                    ? 'rgba(255, 82, 82, 0.15)'
                    : 'rgba(255, 215, 0, 0.15)',
                  borderColor: isDestructive ? Colors.danger : Colors.accentGold,
                },
              ]}
            >
              <Ionicons
                name={isDestructive ? 'shield-checkmark' : 'key'}
                size={22}
                color={isDestructive ? Colors.danger : Colors.accentGold}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.badgeText}>PROTECCIÓN DE AUDITORÍA</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código Único de Programador</Text>
            <View style={styles.codeInputWrapper}>
              <Ionicons name="keypad-outline" size={18} color={Colors.accentGold} />
              <TextInput
                style={styles.codeInput}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={12}
                value={code}
                onChangeText={(val) => {
                  setCode(val);
                  if (error) setError('');
                }}
                autoFocus
              />
            </View>
          </View>

          {showReasonInput && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Motivo / Nota de Auditoría (Opcional)</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Ej. Corrección de monto, ajuste de cierre..."
                placeholderTextColor={Colors.textMuted}
                value={reason}
                onChangeText={setReason}
              />
            </View>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: isDestructive ? Colors.danger : Colors.accentGold },
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={isDestructive ? '#FFF' : Colors.bgDark} />
              ) : (
                <>
                  <Ionicons
                    name={isDestructive ? 'trash-outline' : 'checkmark-circle'}
                    size={17}
                    color={isDestructive ? '#FFF' : Colors.bgDark}
                  />
                  <Text
                    style={[
                      styles.confirmBtnText,
                      { color: isDestructive ? '#FFF' : Colors.bgDark },
                    ]}
                  >
                    {actionLabel}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#0D1322',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.borderGold,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accentGold,
    letterSpacing: 1,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 10, 18, 0.8)',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: Colors.accentGold,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  codeInput: {
    flex: 1,
    color: Colors.accentGold,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 6,
  },
  reasonInput: {
    backgroundColor: 'rgba(7, 10, 18, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 0.8,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1.4,
    flexDirection: 'row',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});

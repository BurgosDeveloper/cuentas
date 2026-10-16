import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { GlassCard } from './GlassCard';
import { getServerUrl, setServerUrl, DEFAULT_API_URL } from '../api/config';

interface ServerConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({
  visible,
  onClose,
  onSaved,
}) => {
  const [url, setUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (visible) {
      getServerUrl().then((saved) => {
        setUrl(saved);
        setTestResult(null);
      });
    }
  }, [visible]);

  const handleTestConnection = async () => {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    if (!cleanUrl) {
      Alert.alert('Error', 'Ingresa una URL válida');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${cleanUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await res.json();
      if (res.ok && json.status === 'ok') {
        setTestResult({
          success: true,
          msg: `Conexión exitosa con el servidor (${json.service || 'Cuentas API'})`,
        });
      } else {
        setTestResult({
          success: false,
          msg: `El servidor respondió con código ${res.status}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: `No se pudo conectar: ${err.message || 'Error de red / Timeout'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      Alert.alert('Error', 'La URL debe comenzar con http:// o https://');
      return;
    }

    await setServerUrl(cleanUrl);
    Alert.alert('Guardado', 'URL del servidor actualizada correctamente.');
    if (onSaved) onSaved();
    onClose();
  };

  const handleReset = async () => {
    setUrl(DEFAULT_API_URL);
    await setServerUrl(DEFAULT_API_URL);
    setTestResult(null);
    Alert.alert('Restablecido', 'Se restableció la URL oficial de Railway.');
    if (onSaved) onSaved();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <GlassCard style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <Ionicons name="server-outline" size={20} color={Colors.accentGold} />
              <Text style={styles.modalTitle}>Configuración de Servidor</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Dirección del backend desplegado en Railway o servidor local:
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://..."
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {testResult && (
            <View
              style={[
                styles.resultBadge,
                testResult.success ? styles.resultSuccess : styles.resultError,
              ]}
            >
              <Ionicons
                name={testResult.success ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={testResult.success ? '#10B981' : Colors.danger}
              />
              <Text
                style={[
                  styles.resultText,
                  { color: testResult.success ? '#10B981' : Colors.danger },
                ]}
              >
                {testResult.msg}
              </Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color={Colors.accentGold} />
              ) : (
                <>
                  <Ionicons name="pulse-outline" size={16} color={Colors.accentGold} />
                  <Text style={styles.testBtnText}>Probar</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="save-outline" size={16} color={Colors.bgDark} />
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Ionicons name="refresh-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.resetBtnText}>Restablecer a Railway Oficial</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    padding: 20,
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accentGold,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  inputContainer: {
    backgroundColor: 'rgba(7, 10, 18, 0.8)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  input: {
    height: 44,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  resultSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  resultError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  resultText: {
    fontSize: 11,
    flex: 1,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accentGold,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  testBtnText: {
    color: Colors.accentGold,
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.accentGold,
  },
  saveBtnText: {
    color: Colors.bgDark,
    fontSize: 13,
    fontWeight: '800',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 6,
  },
  resetBtnText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});

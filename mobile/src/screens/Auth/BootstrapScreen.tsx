import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { BootstrapMasterSchema } from '@cuentas/shared';

export const BootstrapScreen: React.FC = () => {
  const { bootstrap, isLoading } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  // Paso 1
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');

  // Paso 2 (Saldos Iniciales de Bienvenida)
  const [bancamigaUSD, setBancamigaUSD] = useState('');
  const [bancamigaBS, setBancamigaBS] = useState('');
  const [efectivoUSD, setEfectivoUSD] = useState('');
  const [efectivoCOP, setEfectivoCOP] = useState('');

  const handleNextStep = () => {
    if (!username.trim() || username.length < 3) {
      Alert.alert('Atención', 'El usuario debe tener al menos 3 caracteres.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Atención', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      Alert.alert('Atención', 'El PIN debe ser exactamente de 6 dígitos numéricos.');
      return;
    }
    setStep(2);
  };

  const handleCompleteBootstrap = async () => {
    const payload = {
      username: username.trim(),
      password,
      pin,
      initialBalances: {
        bancamigaUSD: parseFloat(bancamigaUSD) || 0,
        bancamigaBS: parseFloat(bancamigaBS) || 0,
        efectivoUSD: parseFloat(efectivoUSD) || 0,
        efectivoCOP: parseFloat(efectivoCOP) || 0,
      },
    };

    const validation = BootstrapMasterSchema.safeParse(payload);
    if (!validation.success) {
      Alert.alert('Validación', validation.error.errors[0]?.message || 'Datos incompletos');
      return;
    }

    try {
      await bootstrap(payload);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo configurar la cuenta.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Image
          source={require('../../../assets/logos/logo_mediano_logix.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appTitle}>CUENTAS</Text>
        <Text style={styles.subtitle}>Configuración Inicial • Acceso VIP</Text>
      </View>

      <GlassCard isGoldHighlighted={step === 2}>
        {step === 1 ? (
          <View>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>PASO 1 DE 2</Text>
              </View>
              <Text style={styles.stepTitle}>Credenciales Maestras</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Usuario Maestro</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={Colors.accentGold} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ej. mi_usuario"
                  placeholderTextColor={Colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.accentGold} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PIN de Acceso Rápido (6 Dígitos)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="keypad-outline" size={18} color={Colors.accentGold} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ej. 123456"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry
                  value={pin}
                  onChangeText={setPin}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleNextStep} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Siguiente: Inicializar Billeteras</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.bgDark} />
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, { backgroundColor: 'rgba(0, 230, 118, 0.2)' }]}>
                <Text style={[styles.stepBadgeText, { color: Colors.success }]}>PASO 2 DE 2</Text>
              </View>
              <Text style={styles.stepTitle}>Saldos Iniciales de Bienvenida</Text>
            </View>
            <Text style={styles.stepDesc}>
              Ingresa el saldo real disponible en cada cuenta para comenzar 100% cuadrado:
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bancamiga USD ($)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="wallet-outline" size={18} color={Colors.usd} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  value={bancamigaUSD}
                  onChangeText={setBancamigaUSD}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bancamiga BS (Bs)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card-outline" size={18} color={Colors.ves} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  value={bancamigaBS}
                  onChangeText={setBancamigaBS}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Efectivo USD ($)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="cash-outline" size={18} color={Colors.usd} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  value={efectivoUSD}
                  onChangeText={setEfectivoUSD}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Efectivo COP ($)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="cash-outline" size={18} color={Colors.cop} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  value={efectivoCOP}
                  onChangeText={setEfectivoCOP}
                />
              </View>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setStep(1)}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
                <Text style={styles.secondaryButtonText}>Atrás</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={handleCompleteBootstrap}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.bgDark} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Activar Cuenta</Text>
                    <Ionicons name="checkmark-done" size={20} color={Colors.bgDark} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </GlassCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.bgDark,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.accentGold,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  stepBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accentGold,
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stepDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 10, 18, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.accentGold,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    shadowColor: Colors.accentGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: Colors.bgDark,
    fontSize: 15,
    fontWeight: '800',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

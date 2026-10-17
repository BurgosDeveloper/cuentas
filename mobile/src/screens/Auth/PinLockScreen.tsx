import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { PinPad } from '../../components/PinPad';
import { ServerConfigModal } from '../../components/ServerConfigModal';
import { useAuth } from '../../context/AuthContext';

interface PinLockScreenProps {
  onSwitchToLogin?: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onSwitchToLogin }) => {
  const { unlockWithPin, unlockWithBiometrics, hasBiometrics } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showServerModal, setShowServerModal] = useState(false);

  useEffect(() => {
    // Intentar biometría automáticamente al cargar la pantalla si está disponible
    if (hasBiometrics) {
      unlockWithBiometrics();
    }
  }, [hasBiometrics]);

  const handlePinComplete = async (pin: string) => {
    setErrorMsg('');
    setLoading(true);
    try {
      await unlockWithPin(pin);
    } catch (err: any) {
      setErrorMsg(err.message || 'PIN incorrecto');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometrics = async () => {
    setErrorMsg('');
    const success = await unlockWithBiometrics();
    if (!success) {
      setErrorMsg('No se reconoció la huella o rostro');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.serverFloatingBtn}
        onPress={() => setShowServerModal(true)}
      >
        <Ionicons name="server-outline" size={14} color={Colors.accentGold} />
        <Text style={styles.serverFloatingText}>Servidor</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Image
          source={require('../../../assets/logos/logo_mediano_logix.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>CUENTAS</Text>
        <Text style={styles.subtitle}>Introduce tu PIN de seguridad</Text>
      </View>

      {errorMsg ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={Colors.accentGold} />
          <Text style={styles.loadingText}>Verificando...</Text>
        </View>
      ) : (
        <PinPad
          onPinComplete={handlePinComplete}
          onBiometricPress={handleBiometrics}
          hasBiometrics={hasBiometrics}
          pinLength={6}
        />
      )}

      {onSwitchToLogin && (
        <TouchableOpacity style={styles.switchButton} onPress={onSwitchToLogin}>
          <Text style={styles.switchButtonText}>Iniciar con Usuario y Clave</Text>
        </TouchableOpacity>
      )}

      <ServerConfigModal
        visible={showServerModal}
        onClose={() => setShowServerModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  serverFloatingBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(27, 61, 129, 0.4)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  serverFloatingText: {
    color: Colors.accentGold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.accentGold,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 10,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  loadingWrapper: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  switchButton: {
    marginTop: 20,
    padding: 10,
  },
  switchButtonText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { useAuth } from '../../context/AuthContext';

interface LoginScreenProps {
  onSwitchToPin?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSwitchToPin }) => {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Atención', 'Por favor ingresa usuario y contraseña');
      return;
    }

    try {
      await login({ username: username.trim(), password });
    } catch (err: any) {
      Alert.alert('Acceso Denegado', err.message || 'Credenciales incorrectas');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../../assets/logos/logo_mediano_logix.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appTitle}>CUENTAS</Text>
        <Text style={styles.subtitle}>Acceso Corporativo</Text>
      </View>

      <GlassCard style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Usuario</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color={Colors.accentGold} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nombre de usuario"
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
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.bgDark} />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
              <Ionicons name="log-in-outline" size={20} color={Colors.bgDark} />
            </>
          )}
        </TouchableOpacity>

        {onSwitchToPin && (
          <TouchableOpacity style={styles.switchButton} onPress={onSwitchToPin}>
            <Ionicons name="keypad-outline" size={16} color={Colors.accentGold} />
            <Text style={styles.switchButtonText}>Desbloquear con PIN</Text>
          </TouchableOpacity>
        )}
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 68,
    height: 68,
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.accentGold,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
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
    marginTop: 8,
  },
  primaryButtonText: {
    color: Colors.bgDark,
    fontSize: 15,
    fontWeight: '800',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    padding: 6,
  },
  switchButtonText: {
    color: Colors.accentGold,
    fontSize: 13,
    fontWeight: '600',
  },
});

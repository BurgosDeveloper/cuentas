import React, { createContext, useContext, useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { apiRequest, setAuthToken, removeAuthToken, getAuthToken } from '../api/client';
import { initSocket, disconnectSocket } from '../api/socket';
import { BootstrapMaster, LoginInput, PinUnlockInput } from '@cuentas/shared';

interface AuthContextType {
  isLoading: boolean;
  isBootstrapped: boolean;
  isAuthenticated: boolean;
  isLocked: boolean;
  user: { id: string; username: string } | null;
  hasBiometrics: boolean;
  bootstrap: (data: BootstrapMaster) => Promise<void>;
  login: (data: LoginInput) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<void>;
  unlockWithBiometrics: () => Promise<boolean>;
  lock: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  useEffect(() => {
    checkInitialState();
  }, []);

  const checkInitialState = async () => {
    try {
      // 1. Verificar hardware biométrico
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometrics(compatible && enrolled);

      // 2. Consultar si la base de datos está configurada (bootstrapped)
      const { data: status } = await apiRequest<{ isBootstrapped: boolean }>('/api/auth/status', {
        cacheKey: 'system_status',
      });
      setIsBootstrapped(status.isBootstrapped);

      // 3. Si hay token previo guardado
      const token = await getAuthToken();
      if (token && status.isBootstrapped) {
        setIsAuthenticated(true);
        setIsLocked(true); // Requiere PIN o biometría para acceder a la vista
        try {
          const meRes = await apiRequest<{ id: string; username: string }>('/api/auth/me', {
            cacheKey: 'auth_me',
          });
          if (meRes.data?.id) {
            setUser({ id: meRes.data.id, username: meRes.data.username });
          }
        } catch {
          // Silencioso si está offline
        }
      }
    } catch (e) {
      console.warn('Error inicializando estado de autenticación:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const bootstrap = async (data: BootstrapMaster) => {
    setIsLoading(true);
    try {
      const response = await apiRequest<{ user: { id: string; username: string }; token: string }>(
        '/api/auth/bootstrap',
        { method: 'POST', body: data }
      );
      await setAuthToken(response.data.token);
      setUser(response.data.user);
      setIsBootstrapped(true);
      setIsAuthenticated(true);
      setIsLocked(false);
      await initSocket(response.data.user.id);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const response = await apiRequest<{ user: { id: string; username: string }; token: string }>(
        '/api/auth/login',
        { method: 'POST', body: data }
      );
      await setAuthToken(response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      setIsLocked(false);
      await initSocket(response.data.user.id);
    } finally {
      setIsLoading(false);
    }
  };

  const unlockWithPin = async (pin: string) => {
    const response = await apiRequest<{ user: { id: string; username: string }; token: string }>(
      '/api/auth/pin',
      { method: 'POST', body: { pin } }
    );
    await setAuthToken(response.data.token);
    setUser(response.data.user);
    setIsAuthenticated(true);
    setIsLocked(false);
    await initSocket(response.data.user.id);
  };

  const unlockWithBiometrics = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear Cuentas',
        fallbackLabel: 'Usar PIN de seguridad',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLocked(false);
        let activeUserId = user?.id;
        if (!activeUserId) {
          try {
            const meRes = await apiRequest<{ id: string; username: string }>('/api/auth/me', {
              cacheKey: 'auth_me',
            });
            if (meRes.data?.id) {
              setUser({ id: meRes.data.id, username: meRes.data.username });
              activeUserId = meRes.data.id;
            }
          } catch {
            // Ignorar en modo offline
          }
        }
        if (activeUserId) {
          await initSocket(activeUserId);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Error en biometría:', error);
      return false;
    }
  };

  const lock = () => {
    setIsLocked(true);
  };

  const logout = async () => {
    disconnectSocket();
    await removeAuthToken();
    setIsAuthenticated(false);
    setIsLocked(true);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isBootstrapped,
        isAuthenticated,
        isLocked,
        user,
        hasBiometrics,
        bootstrap,
        login,
        unlockWithPin,
        unlockWithBiometrics,
        lock,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

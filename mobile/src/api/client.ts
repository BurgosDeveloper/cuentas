import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getServerUrl } from './config';

const TOKEN_KEY = 'cuentas_auth_token';
const CACHE_PREFIX = '@cuentas_cache_';

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// Caché local para modo offline (solo lectura)
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setCachedData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn('Error guardando en caché offline:', e);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  body?: any;
  cacheKey?: string; // Si se provee, guarda la respuesta para visualización offline
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data: T; isOffline: boolean }> {
  const baseUrl = await getServerUrl();
  const token = await getAuthToken();

  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const method = options.method || 'GET';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 segundos de timeout

    const response = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || `Error del servidor (${response.status})`);
    }

    // Guardar en caché si se solicita
    if (options.cacheKey && method === 'GET') {
      await setCachedData(options.cacheKey, json);
    }

    return { data: json as T, isOffline: false };
  } catch (error: any) {
    // Si la llamada falló por conectividad y tenemos caché, servimos offline
    if (options.cacheKey && method === 'GET') {
      const cached = await getCachedData<T>(options.cacheKey);
      if (cached !== null) {
        console.log(`[Offline Mode] Servido desde caché local: ${options.cacheKey}`);
        return { data: cached, isOffline: true };
      }
    }

    throw error;
  }
}

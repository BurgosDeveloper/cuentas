import AsyncStorage from '@react-native-async-storage/async-storage';

// URL base de produccion en Railway
export const DEFAULT_API_URL = 'https://cuentas-production-7a81.up.railway.app';

const SERVER_URL_KEY = '@cuentas_server_url';

export async function getServerUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(SERVER_URL_KEY);
    return saved || DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}

export async function setServerUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(SERVER_URL_KEY, url.trim().replace(/\/+$/, ''));
}

import AsyncStorage from '@react-native-async-storage/async-storage';

// URL base predeterminada (IP local detectada de la máquina para pruebas en hardware físico por Wi-Fi)
export const DEFAULT_API_URL = 'http://192.168.0.118:4000';

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

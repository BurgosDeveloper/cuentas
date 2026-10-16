import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { FinancialProvider } from './src/context/FinancialContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { apiRequest } from './src/api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return;
      }

      // Obtener token FCM del dispositivo
      const tokenData = await Notifications.getDevicePushTokenAsync();
      if (tokenData?.data) {
        await apiRequest('/api/notifications/register-token', {
          method: 'POST',
          body: {
            token: tokenData.data,
            platform: Platform.OS === 'android' ? 'android' : 'ios',
          },
        });
        console.log('✅ Token FCM registrado en backend:', tokenData.data);
      }
    } catch (e) {
      // Ignorar en emulador sin Google Play Services
      console.log('Push notifications notice:', e);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#070A12" />
      <AuthProvider>
        <FinancialProvider>
          <RootNavigator />
        </FinancialProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

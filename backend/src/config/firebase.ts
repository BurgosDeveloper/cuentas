import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { env } from './env';

let firebaseApp: admin.app.App | null = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin inicializado desde variable de entorno');
  } else if (fs.existsSync(env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    const serviceAccount = JSON.parse(fs.readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin inicializado desde archivo de credenciales local');
  } else {
    console.warn('⚠️ No se encontró archivo de credenciales de Firebase. Notificaciones push desactivadas en modo simulado.');
  }
} catch (error) {
  console.error('❌ Error al inicializar Firebase Admin SDK:', error);
}

export const firebaseAdmin = firebaseApp;

export async function sendPushNotification(fcmToken: string, title: string, body: string, data?: Record<string, string>) {
  if (!firebaseAdmin) {
    console.log(`[FCM Mock] Push a ${fcmToken.substring(0, 10)}... | ${title}: ${body}`);
    return;
  }

  try {
    const response = await firebaseAdmin.messaging().send({
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'cuentas_financial_alerts',
          color: '#1B3D81',
        },
      },
    });
    console.log('✅ Notificación push enviada exitosamente:', response);
    return response;
  } catch (error) {
    console.error('❌ Error enviando notificación push:', error);
  }
}

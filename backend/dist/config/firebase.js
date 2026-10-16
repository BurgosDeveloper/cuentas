"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseAdmin = void 0;
exports.sendPushNotification = sendPushNotification;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("./env");
let firebaseApp = null;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        firebaseApp = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase Admin inicializado desde variable de entorno');
    }
    else if (fs_1.default.existsSync(env_1.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
        const serviceAccount = JSON.parse(fs_1.default.readFileSync(env_1.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
        firebaseApp = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase Admin inicializado desde archivo de credenciales local');
    }
    else {
        console.warn('⚠️ No se encontró archivo de credenciales de Firebase. Notificaciones push desactivadas en modo simulado.');
    }
}
catch (error) {
    console.error('❌ Error al inicializar Firebase Admin SDK:', error);
}
exports.firebaseAdmin = firebaseApp;
async function sendPushNotification(fcmToken, title, body, data) {
    if (!exports.firebaseAdmin) {
        console.log(`[FCM Mock] Push a ${fcmToken.substring(0, 10)}... | ${title}: ${body}`);
        return;
    }
    try {
        const response = await exports.firebaseAdmin.messaging().send({
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
    }
    catch (error) {
        console.error('❌ Error enviando notificación push:', error);
    }
}

# 📱 Cuentas — Sistema Financiero Corporativo Realtime

Aplicación móvil empresarial desarrollada para la gestión de flujos de caja, balances en tiempo real, cuadre interactivo de cobros y pagos, splits de gastos con terceros y presupuestos de proyectos.

---

## 🏛️ Arquitectura del Sistema

```
cuentas/
├── MEMORY.md                 # Fuente única de verdad técnica y funcional
├── assets/logos/             # Logos oficiales LogiX
├── shared/                   # Paquete de validación Zod y tipos compartidos
├── backend/                  # Servidor Fastify + Socket.io + Prisma + Firebase Admin
│   ├── src/                  # Módulos (Auth, Accounts, Transactions, Thirds, Projects, Stats)
│   ├── prisma/               # Esquema Neon PostgreSQL
│   └── railway.json          # Configuración de despliegue en Railway
└── mobile/                   # App React Native + Expo Bare (Android nativo)
    ├── android/              # Código nativo Android SDK (Gradle 8.8 + JDK 21)
    ├── build_apk.bat         # Compilación local del APK Release en 1 clic
    └── src/                  # Glassmorphism UI, Contextos y Pantallas
```

---

## 🚀 Despliegue del Backend en Railway

1. Crea un nuevo proyecto en **[Railway](https://railway.app)** conectado al repositorio oficial:
   ```
   https://github.com/BurgosDeveloper/cuentas.git
   ```
2. Configura las siguientes Variables de Entorno en el panel de Railway:
   - `DATABASE_URL`: `postgresql://neondb_owner:npg_1aYGWVSXhsz4@ep-wandering-field-b70fczoc-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require`
   - `JWT_SECRET`: Llave segura para firma de tokens de sesión.
   - `PORT`: `4000` (o la que asigne Railway automáticamente).
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: El contenido completo en JSON de `cuentas-bb27f-firebase-adminsdk-fbsvc-ef8b999e68.json`.
3. Railway compilará automáticamente con `npm run build` y activará el healthcheck en `/health`.

---

## 📲 Compilación del APK Local (Android SDK)

Para compilar el APK Release localmente en Windows:

### Opción 1: Con 1 Clic (Recomendada)
Haz doble clic en el archivo:
```
mobile\build_apk.bat
```

### Opción 2: Desde la Terminal PowerShell
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\Burgos\AppData\Local\Android\Sdk"
cd mobile\android
.\gradlew.bat assembleRelease
```

El APK compilado e instalable se genera directamente en:
```
mobile\android\app\build\outputs\apk\release\app-release.apk
```

---

## 💎 Características Principales

1. **Cuadre Diario Interactivo:**
   - Checkboxes dinámicos: `[ ]` = Pendiente (afecta el cálculo del Cuadre activo); `[x]` = Saldado/Pagado.
   - Fórmula en tiempo real: $\text{Cuadre} = \sum \text{Ingresos Pendientes} - \sum \text{Egresos Pendientes}$.
2. **Cuentas y Billeteras Reales:**
   - Bancamiga USD, Bancamiga BS, Efectivo USD, Efectivo COP.
   - Módulo de Traspasos / Cambios de Divisa con tasa de cambio registrada y actualización simultánea de saldos.
3. **Cuentas de Terceros y Desgloses (Splits):**
   - Egresos asignados a terceros son dinero adeudado; Ingresos son cuentas por cobrar.
   - Desglose múltiple por transacción (ej. `Servidor $30 -> Arow $25 - Basílico $5`).
4. **Proyectos y Bienes (ej. Gastos de la moto):**
   - Distinción entre Ítems Activos (gastos reales) e Ítems de Recordatorio (piezas o compras presupuestadas).
5. **Seguridad Sigilosa (Stealth Access):**
   - Onboarding inicial para configurar cuenta VIP y saldos de bienvenida.
   - Teclado PIN Glassmorphism de 6 dígitos con respuesta háptica y desbloqueo biométrico (Huella / FaceID).
6. **Estado de Ánimo Financiero:**
   - Algoritmo que analiza el superávit/déficit y proyecta la salud financiera con emojis e indicadores visuales dinámicos.
7. **Sincronización 100% Realtime & Modo Offline:**
   - WebSockets bidireccionales vía Socket.io: todo cambio en un dispositivo se refleja instantáneamente en los demás.
   - Modo Offline de solo lectura seguro cuando no hay conexión.

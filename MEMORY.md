# MEMORY.md — Sistema Maestro de Información y Estado: "Cuentas"

> **Propósito:** Este documento es la única y máxima fuente de verdad (Single Source of Truth) para el diseño, arquitectura, desarrollo, lógica de negocio y despliegue del ecosistema **Cuentas**. Cualquier decisión técnica o de negocio queda registrada y versionada aquí.

---

## 1. Visión General del Proyecto

- **Nombre de la Aplicación:** `Cuentas`
- **Identificador de Paquete Android:** `com.cuentas.app`
- **Repositorio Oficial:** `https://github.com/BurgosDeveloper/cuentas.git`
- **Tipo de Aplicación:** Aplicación móvil nativa en React Native (Expo Bare/Prebuild) con compilación de APK Release 100% local mediante Android SDK (`gradlew assembleRelease`).
- **Backend:** Node.js (TypeScript) + Fastify/Express + Prisma ORM + Socket.io + Firebase Admin SDK, preparado para Railway.
- **Base de Datos:** PostgreSQL en la nube (Neon Tech Serverless Pooler: `ep-wandering-field-b70fczoc-pooler.c-13.us-east-1.aws.neon.tech`).
- **Push Notifications:** Firebase Cloud Messaging (FCM) configurado con proyecto `cuentas-bb27f` (Proyecto nº `884038960962`).
- **Sincronización:** 100% Realtime bidireccional entre múltiples dispositivos simultáneos vía WebSockets / Socket.io.
- **Modo Offline:** Visualización en modo solo lectura de balances, cuentas y transacciones en caché seguro local. Las escrituras requieren conexión para consistencia 100% garantizada.
- **Validación Estricta:** 100% validado con **Zod** tanto en Frontend como en Backend (DTOs de entrada, eventos Socket, modelos de BD).

---

## 2. Sistema de Diseño & Identidad Visual (Corporate Dark Glassmorphism)

- **Modo de Color:** Exclusivamente **Dark Mode** corporativo y sobrio.
- **Paleta Oficial:**
  - **Azul Metálico Principal:** `#1B3D81` (acentos primarios, botones principales, cabeceras de cuentas).
  - **Dorado Imperial:** `#FFD700` (resaltados de valor, insignias, estado de abundancia, bordes activos).
  - **Fondo Base Obsidian:** `#070A12` a `#0C1222` (gradientes oscuros profundos).
  - **Superficies Glassmorphism:** Paneles translúcidos con `rgba(27, 61, 129, 0.15)` y `rgba(255, 255, 255, 0.05)`, desenfoque nativo (`BlurView`) y bordes satinados de `rgba(255, 255, 255, 0.1)`.
  - **Acentos de Estado Financiero:**
    - Verde Esmeralda (`#00E676`): Ingresos, saldo a favor, balance positivo.
    - Carmesí / Rubí (`#FF5252`): Egresos, deudas por pagar, saldo negativo.
    - Oro / Zafiro (`#FFD700` / `#448AFF`): Cuentas, traspasos y recordatorios.
- **Iconografía:** Ionicons (`@expo/vector-icons/Ionicons`) + Emojis de apoyo contextual.
- **Componente de Estado de Ánimo Financiero:**
  - Módulo dinámico en la cabecera que muestra una expresión / avatar vectorial / Ionicons según el balance y salud financiera:
    - 🔴 **Preocupado / Negativo** (Gastos superan ingresos o balance en rojo).
    - 🟡 **Neutro / Punto de Equilibrio** (Balance en 0 o cuadre ajustado).
    - 🟢 **Tranquilo / Positivo Leve** (Superávit moderado).
    - 🌟 **Próspero / Excelente** (Superávit alto y cuentas al día).
- **Gráficos Financieros Profesionales:**
  - Curvas de flujo de caja continuo (sin recortes ni desbordamientos de pantalla).
  - Comparativa mensual de Ingresos vs Egresos.
  - Distribución de saldo por billeteras/cuentas y por terceros.

---

## 3. Modelo de Negocio y Lógica de Dominio Financiero

### 3.1. Cuentas Financieras Reales (Wallets / Billeteras)
La app sincroniza el saldo real de 4 cuentas predeterminadas:
1. **Bancamiga USD** (Dólares en cuenta bancaria)
2. **Bancamiga BS** (Bolívares en cuenta bancaria)
3. **Efectivo USD** (Efectivo físico en divisas)
4. **Efectivo COP** (Efectivo físico en Pesos Colombianos)
*(Permite crear nuevas cuentas bancarias o billeteras si el usuario lo requiere).*

- **Traspasos / Cambios de Divisa entre Cuentas:**
  - Permite transferir fondos de una cuenta a otra (ej. Bancamiga USD -> Bancamiga BS, o Efectivo USD -> Efectivo COP).
  - Registra el monto de origen, la tasa de cambio pactada y el monto final acreditado en la cuenta destino.
  - Ambos saldos se actualizan simultáneamente de forma atómica en tiempo real.

### 3.2. Multimoneda con Tasa por Movimiento
- **Moneda Base de la App:** Dólares (**USD** `$`).
- **Conversión Histórica Inmutable:**
  - Cada transacción registrada en BS o COP almacena el monto en su moneda nativa, la **tasa de cambio exacta utilizada en ese momento** y el equivalente calculado en USD.
  - Esto garantiza que el cuadre general y los balances históricos nunca se descuadren por variaciones cambiarias futuras.

### 3.3. Terceros y Cuentas Corrientes (Deudores / Acreedores)
- Cada persona o entidad (ej. Arow, Basílico, Luis, Kenyer, Sam, Raquel, etc.) tiene una cuenta de tercero:
  - **En Egreso con Tercero Asignado:** Dinero que nosotros le debemos a ese tercero (Cuenta por pagar).
  - **En Ingreso con Tercero Asignado:** Dinero que ese tercero nos debe o nos va a pagar (Cuenta por cobrar).
  - **Sub-asignaciones (Split):** Un egreso global (ej. `Servidor = 30$`) puede desglosarse en aportes o deudas asociadas a terceros (`-> arow 25 - basilico 5`), afectando el estado de cuenta de cada uno.

### 3.4. El Sistema de "Cuadre" y Checkboxes
- **Checkboxes Interactivos:**
  - `[ ]` (No marcado): Movimiento **Pendiente** por liquidar/cobrar/pagar.
  - `[x]` (Marcado): Movimiento **Saldado / Pagado / Cobrado**.
- **Cálculo del Cuadre:**
  $$\text{Cuadre Diario} = \sum \text{Ingresos Pendientes} - \sum \text{Egresos Pendientes}$$
- Selector de filtros rápidos:
  - Ver Solo Pendientes (para el cuadre activo).
  - Ver Solo Saldados (histórico de lo pagado).
  - Ver Todos (visión global de flujo).

### 3.5. Proyectos y Bienes (ej. "Gastos de la moto", "Proyecto Arow")
- Proyectos independientes para control específico:
  - **Ítems Activos:** Ingresos y egresos operativos que se reflejan de inmediato en el balance principal y el cuadre diario.
  - **Ítems No Activos (Recordatorios / Presupuesto):** Piezas por comprar, mantenimientos futuros o cotizaciones. No afectan los saldos contables reales hasta que el usuario decida "activarlos".

### 3.6. Módulo Integral de Notificaciones y Recordatorios
- **Notificaciones Push (FCM):**
  - Recordatorios programados para fechas límites de pago (cuentas por pagar a terceros).
  - Recordatorios de cobros pendientes (terceros que nos deben dinero).
  - Alertas automáticas cuando un ítem no activo de un proyecto llega a su fecha de vencimiento/compra.
  - Notificaciones en tiempo real cuando otro dispositivo conectado realiza un cambio, pago o transferencia.

---

## 4. Seguridad, Autenticación y Flujo de Bienvenida Premium

1. **Flujo de Bienvenida Inicial (Cuenta Premium / Acceso VIP):**
   - Si no existe un usuario registrado en la base de datos (primer arranque), la app despliega un onboarding estilo "Crear Cuenta Maestra Premium":
     - Paso 1: Definición de Credenciales (Usuario, Contraseña y PIN secreto de 6 dígitos).
     - Paso 2: Inicialización de Saldos Reales (Bancamiga USD, Bancamiga BS, Efectivo USD, Efectivo COP) con diseño glassmorphism dorado y azul metálico.
   - Una vez configurada, la base de datos queda sellada y las 4 cuentas arrancan con el balance exacto de la vida real.
2. **Desbloqueo Sigiloso Rápido (Stealth Access):**
   - Teclado numérico Glassmorphism para **PIN de 6 dígitos**.
   - Integración nativa de Biometría (Huella dactilar / FaceID con `expo-local-authentication`).
   - Pantalla limpia, moderna y discreta sin sugerencias del sistema operativo que revelen identidades personales o bancarias.
3. **Almacenamiento en Dispositivo:**
   - Tokens y secretos guardados exclusivamente en `Expo SecureStore` (Android Keystore encriptado por hardware).

---

## 5. Estructura de Directorios del Proyecto

```
cuentas/
├── MEMORY.md                          # Fuente única de verdad del proyecto
├── google-services.json               # Configuración FCM Android
├── cuentas-bb27f-firebase-*.json      # Credenciales Firebase Admin SDK
├── assets/                            # Logos e isotipos oficiales LogiX
│   ├── logo_grande_logix.png
│   ├── logo_mediano_logix.png
│   ├── logix_pequeno_logo.png
│   └── logix_diminuto_logo.png
│
├── backend/                           # Servidor Fastify / Express + Socket.io + Prisma
│   ├── src/
│   │   ├── config/                    # Variables de entorno y DB pool
│   │   ├── modules/
│   │   │   ├── auth/                  # Login, PIN, JWT, seguridad
│   │   │   ├── accounts/              # Wallets (Bancamiga, Efectivo, traspasos)
│   │   │   ├── transactions/          # Ingresos, egresos, cuadre diario
│   │   │   ├── thirds/                # Cuentas de terceros (por cobrar/pagar)
│   │   │   ├── projects/              # Proyectos y bienes (activos vs no activos)
│   │   │   ├── notifications/         # Firebase Admin FCM y recordatorios
│   │   │   └── stats/                 # Métricas, productividad y gráficos
│   │   ├── realtime/                  # Sockets rooms, eventos broadcast
│   │   └── shared/                    # Zod schemas y validadores
│   ├── prisma/                        # Esquema de base de datos Neon PostgreSQL
│   └── package.json
│
├── mobile/                            # App React Native (Expo Prebuild / Android SDK)
│   ├── android/                       # Proyecto Android nativo autogenerado para APK local
│   ├── src/
│   │   ├── api/                       # Clientes HTTP y WebSocket
│   │   ├── components/                # Glassmorphism UI (Cards, Inputs, PIN Pad, Modales)
│   │   ├── screens/                   # Pantallas principales
│   │   │   ├── Auth/                  # Login Usuario/Pass y Teclado PIN Biométrico
│   │   │   ├── Dashboard/             # Resumen de cuentas, Estado de Ánimo, Balance
│   │   │   ├── Cuadre/                # Cuadre interactivo diario (Checkboxes)
│   │   │   ├── Accounts/              # Bancamiga USD/BS, Efectivo, Traspasos
│   │   │   ├── Thirds/                # Terceros y Cuentas por cobrar/pagar
│   │   │   ├── Projects/              # Proyectos (Moto, Arow, etc. activos/recordatorios)
│   │   │   ├── Stats/                 # Gráficos de productividad financiera
│   │   │   └── Notifications/         # Centro de recordatorios y alertas
│   │   ├── navigation/                # Navegación con animaciones suaves
│   │   ├── context/                   # Estado global con sincronización en tiempo real
│   │   └── utils/                     # Validaciones Zod y formateadores de moneda
│   ├── app.json                       # Configuración Expo, package com.cuentas.app
│   └── package.json
```

---

## 6. Esquemas de Datos Principales (Validación Zod)

### 6.1. Cuenta Financiera (Account / Wallet)
- `id`: UUID
- `name`: string (ej. "Bancamiga USD", "Bancamiga BS", "Efectivo USD", "Efectivo COP")
- `currency`: 'USD' | 'VES' | 'COP'
- `balance`: number (monto actual)
- `color`: string (acento hexadecimal)
- `icon`: string (nombre de Ionicons)

### 6.2. Traspaso / Cambio entre Cuentas (AccountTransfer)
- `id`: UUID
- `fromAccountId`: UUID (cuenta origen)
- `toAccountId`: UUID (cuenta destino)
- `amountFrom`: number (monto que sale)
- `amountTo`: number (monto que entra)
- `exchangeRate`: number (tasa aplicada en la operación)
- `note`: string opcional
- `date`: DateTime

### 6.3. Transacción / Movimiento (Transaction)
- `id`: UUID
- `title`: string (ej. "Servidor", "Tortas", "Basilico")
- `type`: 'INCOME' | 'EXPENSE'
- `amountOriginal`: number (monto registrado)
- `currency`: 'USD' | 'VES' | 'COP'
- `exchangeRate`: number (tasa utilizada respecto a USD, 1.0 si es USD)
- `amountUSD`: number (calculado para cuadre unificado)
- `accountId`: UUID (cuenta vinculada de origen o destino)
- `thirdPartyId`: UUID opcional (tercero asociado: deudor o acreedor)
- `projectId`: UUID opcional (proyecto asociado)
- `isSettled`: boolean (true = `[x]` saldado/tachado; false = `[ ]` pendiente de cuadre)
- `settledAt`: DateTime opcional
- `date`: DateTime
- `splits`: Array<{ thirdPartyId: UUID, amount: number, note: string }>

### 6.4. Proyecto / Bien (Project)
- `id`: UUID
- `name`: string (ej. "Gastos moto", "Proyecto Arow")
- `description`: string opcional
- `color`: string
- `icon`: string

### 6.5. Ítem de Proyecto (ProjectItem)
- `id`: UUID
- `projectId`: UUID
- `title`: string (ej. "Martilleras", "Válvulas", "Mano de obra")
- `amount`: number
- `currency`: 'USD' | 'VES' | 'COP'
- `isActive`: boolean (true = impacta el cuadre y cuentas reales; false = recordatorio / presupuesto)
- `isCompleted`: boolean
- `dueDate`: DateTime opcional (para recordatorios y notificaciones push)

---

## 7. Credenciales y Conexiones Activas

- **Neon PostgreSQL:**
  - Host: `ep-wandering-field-b70fczoc-pooler.c-13.us-east-1.aws.neon.tech`
  - Base de Datos: `neondb`
  - Usuario: `neondb_owner`
  - SSL: `require` (Prueba TCP exitosa en puerto 5432)
- **Firebase:**
  - Configuración Cliente: `google-services.json` (`com.cuentas.app`)
  - Admin SDK: `cuentas-bb27f-firebase-adminsdk-fbsvc-ef8b999e68.json`
- **Herramientas de Compilación Local:**
  - Node: `v22.15.1`
  - OpenJDK: `21.0.6` en `C:\Program Files\Android\Android Studio\jbr`
  - Android SDK: `C:\Users\Burgos\AppData\Local\Android\Sdk`

- **Backend en Producción (Railway):**
  - Dominio: `https://cuentas-production-7a81.up.railway.app`
  - Health Endpoint: `https://cuentas-production-7a81.up.railway.app/health`
  - Repositorio: `https://github.com/BurgosDeveloper/cuentas.git` (Rama `main`)

---

## 8. Estado de Entrega & APK Compilado

- [x] **Módulo 0: Definición, Análisis de Notas y Creación de MEMORY.md**
- [x] **Módulo 1: Setup del Monorepo / Estructura del Proyecto & Android SDK local**
- [x] **Módulo 2: Backend en Railway + Neon PostgreSQL + Zod Schemas + Socket.io**
- [x] **Módulo 3: Motor de Autenticación Criptográfica (Onboarding VIP, PIN de 6 dígitos y Biometría)**
- [x] **Módulo 4: UI/UX Móvil Glassmorphism & Sistema de Diseño (Ionicons, Cards, Paleta Dark)**
- [x] **Módulo 5: Módulo de Cuadre Diario, Ingresos y Egresos (Checklist interactivo, Totales dinámicos)**
- [x] **Módulo 6: Módulo de Split / Sub-asignaciones por persona (Arow, Basílico, Luis, Kenyer, etc.)**
- [x] **Módulo 7: Módulo de Sub-proyectos / Bienes (ej. Gastos de Moto, ítems activos vs recordatorios)**
- [x] **Módulo 8: Gráficos Empresariales sin desbordes, Estado de Ánimo Financiero y Billeteras**
- [x] **Módulo 9: Sincronización Realtime Multi-dispositivo (Socket.io) y Modo Offline de lectura**
- [x] **Módulo 10: Compilación local de APK Release con Android SDK y Gradle 8.8**
- [x] **Módulo 11: Selector Dinámico de Servidor (ServerConfigModal) & Producción Railway Integrada**

### Ubicación del APK Listo para Instalar:
- **Ruta de Entrega Oficial:** `export/Cuentas.apk` (~71.9 MB)
- **Ruta Versionada:** `export/Cuentas-v1.0.0.apk` (~71.9 MB)
- **Ruta de Compilación Gradle:** `mobile/android/app/build/outputs/apk/release/app-release.apk`
- **Características:** Conexión directa a Railway, botón de diagnóstico de servidor y selector dinámico de URL.


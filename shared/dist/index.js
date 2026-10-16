"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeEvents = exports.CreateReminderSchema = exports.RegisterFcmTokenSchema = exports.FilterTransactionsSchema = exports.ToggleSettledSchema = exports.CreateTransactionSchema = exports.TransactionSplitSchema = exports.UpdateProjectItemSchema = exports.CreateProjectItemSchema = exports.CreateProjectSchema = exports.UpdateThirdPartySchema = exports.CreateThirdPartySchema = exports.TransferFundsSchema = exports.CreateAccountSchema = exports.PinUnlockSchema = exports.LoginSchema = exports.BootstrapMasterSchema = exports.InitialBalancesSchema = exports.MoodStatusEnum = exports.TransactionTypeEnum = exports.CurrencyEnum = void 0;
const zod_1 = require("zod");
// ==========================================
// 1. ENUMS & CONSTANTS
// ==========================================
exports.CurrencyEnum = zod_1.z.enum(['USD', 'VES', 'COP']);
exports.TransactionTypeEnum = zod_1.z.enum(['INCOME', 'EXPENSE']);
exports.MoodStatusEnum = zod_1.z.enum(['CRITICAL', 'NEUTRAL', 'GOOD', 'PROSPEROUS']);
// ==========================================
// 2. AUTH & BOOTSTRAP SCHEMAS
// ==========================================
exports.InitialBalancesSchema = zod_1.z.object({
    bancamigaUSD: zod_1.z.number().min(0, 'El saldo no puede ser negativo').default(0),
    bancamigaBS: zod_1.z.number().min(0, 'El saldo no puede ser negativo').default(0),
    efectivoUSD: zod_1.z.number().min(0, 'El saldo no puede ser negativo').default(0),
    efectivoCOP: zod_1.z.number().min(0, 'El saldo no puede ser negativo').default(0),
});
exports.BootstrapMasterSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
    password: zod_1.z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    pin: zod_1.z.string().regex(/^\d{6}$/, 'El PIN debe contener exactamente 6 dígitos numéricos'),
    initialBalances: exports.InitialBalancesSchema,
});
exports.LoginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'El usuario es requerido'),
    password: zod_1.z.string().min(1, 'La contraseña es requerida'),
});
exports.PinUnlockSchema = zod_1.z.object({
    pin: zod_1.z.string().regex(/^\d{6}$/, 'El PIN debe ser de 6 dígitos numéricos'),
});
// ==========================================
// 3. ACCOUNTS & TRANSFERS SCHEMAS
// ==========================================
exports.CreateAccountSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'El nombre de la cuenta es requerido'),
    currency: exports.CurrencyEnum,
    initialBalance: zod_1.z.number().default(0),
    color: zod_1.z.string().optional().default('#1B3D81'),
    icon: zod_1.z.string().optional().default('wallet-outline'),
});
exports.TransferFundsSchema = zod_1.z.object({
    fromAccountId: zod_1.z.string().uuid('ID de cuenta origen inválido'),
    toAccountId: zod_1.z.string().uuid('ID de cuenta destino inválido'),
    amountFrom: zod_1.z.number().positive('El monto a transferir debe ser mayor a 0'),
    exchangeRate: zod_1.z.number().positive('La tasa de cambio debe ser positiva').default(1.0),
    note: zod_1.z.string().optional(),
    date: zod_1.z.string().optional(),
});
// ==========================================
// 4. THIRDS (TERCEROS / CUENTAS CORRIENTES)
// ==========================================
exports.CreateThirdPartySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'El nombre del tercero es requerido'),
    phone: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.UpdateThirdPartySchema = exports.CreateThirdPartySchema.partial();
// ==========================================
// 5. PROJECTS & BUDGETS
// ==========================================
exports.CreateProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'El nombre del proyecto es requerido'),
    description: zod_1.z.string().optional(),
    color: zod_1.z.string().optional().default('#FFD700'),
    icon: zod_1.z.string().optional().default('briefcase-outline'),
});
exports.CreateProjectItemSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid('ID de proyecto inválido'),
    title: zod_1.z.string().min(1, 'El título del ítem es requerido'),
    amount: zod_1.z.number().positive('El monto debe ser mayor a 0'),
    currency: exports.CurrencyEnum.default('USD'),
    isActive: zod_1.z.boolean().default(false), // true = afecta el cuadre hoy; false = presupuesto / recordatorio
    dueDate: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.UpdateProjectItemSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    amount: zod_1.z.number().positive().optional(),
    currency: exports.CurrencyEnum.optional(),
    isActive: zod_1.z.boolean().optional(),
    isCompleted: zod_1.z.boolean().optional(),
    dueDate: zod_1.z.string().nullable().optional(),
    notes: zod_1.z.string().nullable().optional(),
});
// ==========================================
// 6. TRANSACTIONS & CUADRE DIARIO
// ==========================================
exports.TransactionSplitSchema = zod_1.z.object({
    thirdPartyId: zod_1.z.string().uuid('ID de tercero inválido'),
    amount: zod_1.z.number().positive('El monto asignado debe ser mayor a 0'),
    note: zod_1.z.string().optional(),
});
exports.CreateTransactionSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'El concepto es requerido'),
    type: exports.TransactionTypeEnum,
    amountOriginal: zod_1.z.number().positive('El monto debe ser mayor a 0'),
    currency: exports.CurrencyEnum.default('USD'),
    exchangeRate: zod_1.z.number().positive('La tasa debe ser mayor a 0').default(1.0),
    accountId: zod_1.z.string().uuid('Debes asociar una cuenta financiera'),
    thirdPartyId: zod_1.z.string().uuid().optional().nullable(),
    projectId: zod_1.z.string().uuid().optional().nullable(),
    isSettled: zod_1.z.boolean().default(false), // false = [ ] pendiente en cuadre; true = [x] saldado
    date: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().optional().nullable(),
    note: zod_1.z.string().optional().nullable(),
    splits: zod_1.z.array(exports.TransactionSplitSchema).optional(),
});
exports.ToggleSettledSchema = zod_1.z.object({
    isSettled: zod_1.z.boolean(),
});
exports.FilterTransactionsSchema = zod_1.z.object({
    status: zod_1.z.enum(['all', 'pending', 'settled']).default('all'),
    type: zod_1.z.enum(['all', 'INCOME', 'EXPENSE']).default('all'),
    accountId: zod_1.z.string().uuid().optional(),
    thirdPartyId: zod_1.z.string().uuid().optional(),
    projectId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
});
// ==========================================
// 7. NOTIFICATIONS & PUSH SCHEMAS
// ==========================================
exports.RegisterFcmTokenSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'El token FCM es requerido'),
    platform: zod_1.z.enum(['android', 'ios', 'web']).default('android'),
});
exports.CreateReminderSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'El título del recordatorio es requerido'),
    message: zod_1.z.string().min(1, 'El mensaje es requerido'),
    scheduledDate: zod_1.z.string(), // ISO string
    relatedType: zod_1.z.enum(['TRANSACTION', 'THIRD_PARTY', 'PROJECT_ITEM', 'GENERAL']).default('GENERAL'),
    relatedId: zod_1.z.string().uuid().optional().nullable(),
});
// ==========================================
// 8. REALTIME WEBSOCKET EVENTS
// ==========================================
exports.RealtimeEvents = {
    // Transacciones
    TRANSACTION_CREATED: 'transaction:created',
    TRANSACTION_UPDATED: 'transaction:updated',
    TRANSACTION_DELETED: 'transaction:deleted',
    TRANSACTION_SETTLED_TOGGLED: 'transaction:settled_toggled',
    // Cuentas y Transferencias
    ACCOUNT_UPDATED: 'account:updated',
    TRANSFER_CREATED: 'transfer:created',
    // Terceros
    THIRD_UPDATED: 'third:updated',
    // Proyectos
    PROJECT_UPDATED: 'project:updated',
    PROJECT_ITEM_UPDATED: 'project_item:updated',
    // Dashboard & Notificaciones
    DASHBOARD_STATS_UPDATED: 'dashboard:stats_updated',
    REMINDER_TRIGGERED: 'reminder:triggered',
};

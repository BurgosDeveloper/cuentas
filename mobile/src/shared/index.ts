import { z } from 'zod';

// ==========================================
// 1. ENUMS & CONSTANTS
// ==========================================

export const MASTER_CREATOR_CODE = '32362846';

export const MasterCodeSchema = z
  .string({ required_error: 'El código de programador es obligatorio' })
  .refine((val) => val.trim() === MASTER_CREATOR_CODE, {
    message: 'Código único de programador inválido. Acción denegada.',
  });

export const CurrencyEnum = z.enum(['USD', 'VES', 'COP']);
export type Currency = z.infer<typeof CurrencyEnum>;

export const TransactionTypeEnum = z.enum(['INCOME', 'EXPENSE']);
export type TransactionType = z.infer<typeof TransactionTypeEnum>;

export const MoodStatusEnum = z.enum(['CRITICAL', 'NEUTRAL', 'GOOD', 'PROSPEROUS']);
export type MoodStatus = z.infer<typeof MoodStatusEnum>;

// ==========================================
// 2. AUTH & BOOTSTRAP SCHEMAS
// ==========================================

export const InitialBalancesSchema = z.object({
  bancamigaUSD: z.number().min(0, 'El saldo no puede ser negativo').default(0),
  bancamigaBS: z.number().min(0, 'El saldo no puede ser negativo').default(0),
  efectivoUSD: z.number().min(0, 'El saldo no puede ser negativo').default(0),
  efectivoCOP: z.number().min(0, 'El saldo no puede ser negativo').default(0),
});
export type InitialBalances = z.infer<typeof InitialBalancesSchema>;

export const BootstrapMasterSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  pin: z.string().regex(/^\d{6}$/, 'El PIN debe contener exactamente 6 dígitos numéricos'),
  initialBalances: InitialBalancesSchema,
});
export type BootstrapMaster = z.infer<typeof BootstrapMasterSchema>;

export const LoginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const PinUnlockSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, 'El PIN debe ser de 6 dígitos numéricos'),
});
export type PinUnlockInput = z.infer<typeof PinUnlockSchema>;

// ==========================================
// 3. ACCOUNTS & TRANSFERS SCHEMAS
// ==========================================

export const CreateAccountSchema = z.object({
  name: z.string().min(1, 'El nombre de la cuenta es requerido'),
  currency: CurrencyEnum,
  initialBalance: z.number().min(0, 'El saldo inicial no puede ser negativo').default(0),
  color: z.string().optional().default('#1B3D81'),
  icon: z.string().optional().default('wallet-outline'),
});
export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;

export const AdjustAccountBalanceSchema = z.object({
  balance: z.number().min(0, 'El saldo no puede ser negativo (mínimo 0.00)'),
  reason: z.string().optional(),
  masterCode: MasterCodeSchema,
});
export type AdjustAccountBalanceInput = z.infer<typeof AdjustAccountBalanceSchema>;

export const TransferFundsSchema = z.object({
  fromAccountId: z.string().uuid('ID de cuenta origen inválido'),
  toAccountId: z.string().uuid('ID de cuenta destino inválido'),
  amountFrom: z.number().positive('El monto a transferir debe ser mayor a 0'),
  amountTo: z.number().positive('El monto acreditado debe ser mayor a 0').optional(),
  exchangeRate: z.number().positive('La tasa de cambio debe ser positiva').default(1.0),
  conversionMode: z.enum(['MULTIPLY', 'DIVIDE', 'SAME']).optional(),
  note: z.string().optional(),
  date: z.string().optional(),
});
export type TransferFundsInput = z.infer<typeof TransferFundsSchema>;

// ==========================================
// 4. THIRDS (TERCEROS / CUENTAS CORRIENTES)
// ==========================================

export const CreateThirdPartySchema = z.object({
  name: z.string().min(1, 'El nombre del tercero es requerido'),
  phone: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateThirdPartyInput = z.infer<typeof CreateThirdPartySchema>;

export const UpdateThirdPartySchema = CreateThirdPartySchema.partial();
export type UpdateThirdPartyInput = z.infer<typeof UpdateThirdPartySchema>;

export const UpdateThirdPartyWithCodeSchema = z.object({
  name: z.string().min(1, 'El nombre del tercero es requerido').optional(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  masterCode: MasterCodeSchema,
});
export type UpdateThirdPartyWithCodeInput = z.infer<typeof UpdateThirdPartyWithCodeSchema>;

// ==========================================
// 5. PROJECTS & BUDGETS
// ==========================================

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es requerido'),
  description: z.string().optional(),
  color: z.string().optional().default('#FFD700'),
  icon: z.string().optional().default('briefcase-outline'),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const CreateProjectItemSchema = z.object({
  projectId: z.string().uuid('ID de proyecto inválido'),
  title: z.string().min(1, 'El título del ítem es requerido'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  currency: CurrencyEnum.default('USD'),
  isActive: z.boolean().default(false), // true = afecta el cuadre hoy; false = presupuesto / recordatorio
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateProjectItemInput = z.infer<typeof CreateProjectItemSchema>;

export const UpdateProjectItemSchema = z.object({
  title: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: CurrencyEnum.optional(),
  isActive: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  dueDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  masterCode: z.string().optional(),
});
export type UpdateProjectItemInput = z.infer<typeof UpdateProjectItemSchema>;

// ==========================================
// 6. TRANSACTIONS & CUADRE DIARIO
// ==========================================

export const TransactionSplitSchema = z.object({
  thirdPartyId: z.string().uuid('ID de tercero inválido'),
  amount: z.number().positive('El monto asignado debe ser mayor a 0'),
  note: z.string().optional(),
});
export type TransactionSplit = z.infer<typeof TransactionSplitSchema>;

export const CreateTransactionSchema = z.object({
  title: z.string().min(1, 'El concepto es requerido'),
  type: TransactionTypeEnum,
  amountOriginal: z.number().positive('El monto debe ser mayor a 0'),
  currency: CurrencyEnum.default('USD'),
  exchangeRate: z.number().positive('La tasa debe ser mayor a 0').default(1.0),
  accountId: z.string().uuid('Debes asociar una cuenta financiera'),
  thirdPartyId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  isSettled: z.boolean().default(false), // false = [ ] pendiente en cuadre; true = [x] saldado
  date: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  splits: z.array(TransactionSplitSchema).optional(),
});
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

export const UpdateTransactionSchema = z.object({
  title: z.string().min(1, 'El concepto es requerido').optional(),
  type: TransactionTypeEnum.optional(),
  amountOriginal: z.number().positive('El monto debe ser mayor a 0').optional(),
  currency: CurrencyEnum.optional(),
  exchangeRate: z.number().positive('La tasa debe ser mayor a 0').optional(),
  accountId: z.string().uuid('Debes asociar una cuenta financiera').optional(),
  thirdPartyId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  isSettled: z.boolean().optional(),
  note: z.string().optional().nullable(),
  splits: z.array(TransactionSplitSchema).optional(),
  masterCode: MasterCodeSchema,
});
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;

export const DeleteWithMasterCodeSchema = z.object({
  masterCode: MasterCodeSchema,
  reason: z.string().optional(),
});
export type DeleteWithMasterCodeInput = z.infer<typeof DeleteWithMasterCodeSchema>;

export const ToggleSettledSchema = z.object({
  isSettled: z.boolean(),
});
export type ToggleSettledInput = z.infer<typeof ToggleSettledSchema>;

export const FilterTransactionsSchema = z.object({
  status: z.enum(['all', 'pending', 'settled']).default('all'),
  type: z.enum(['all', 'INCOME', 'EXPENSE']).default('all'),
  accountId: z.string().uuid().optional(),
  thirdPartyId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type FilterTransactions = z.infer<typeof FilterTransactionsSchema>;

// ==========================================
// 7. NOTIFICATIONS & PUSH SCHEMAS
// ==========================================

export const RegisterFcmTokenSchema = z.object({
  token: z.string().min(1, 'El token FCM es requerido'),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
});
export type RegisterFcmTokenInput = z.infer<typeof RegisterFcmTokenSchema>;

export const CreateReminderSchema = z.object({
  title: z.string().min(1, 'El título del recordatorio es requerido'),
  message: z.string().min(1, 'El mensaje es requerido'),
  scheduledDate: z.string(), // ISO string
  relatedType: z.enum(['TRANSACTION', 'THIRD_PARTY', 'PROJECT_ITEM', 'GENERAL']).default('GENERAL'),
  relatedId: z.string().uuid().optional().nullable(),
});
export type CreateReminderInput = z.infer<typeof CreateReminderSchema>;

// ==========================================
// 8. REALTIME WEBSOCKET EVENTS
// ==========================================

export const RealtimeEvents = {
  // Transacciones
  TRANSACTION_CREATED: 'transaction:created',
  TRANSACTION_UPDATED: 'transaction:updated',
  TRANSACTION_DELETED: 'transaction:deleted',
  TRANSACTION_SETTLED_TOGGLED: 'transaction:settled_toggled',

  // Cuentas y Transferencias
  ACCOUNT_UPDATED: 'account:updated',
  TRANSFER_CREATED: 'transfer:created',
  TRANSFER_DELETED: 'transfer:deleted',

  // Terceros
  THIRD_UPDATED: 'third:updated',
  THIRD_DELETED: 'third:deleted',

  // Proyectos
  PROJECT_UPDATED: 'project:updated',
  PROJECT_DELETED: 'project:deleted',
  PROJECT_ITEM_UPDATED: 'project_item:updated',

  // Auditoría, Dashboard & Notificaciones
  AUDIT_LOG_CREATED: 'audit:created',
  DASHBOARD_STATS_UPDATED: 'dashboard:stats_updated',
  REMINDER_TRIGGERED: 'reminder:triggered',
} as const;

export type RealtimeEvent = (typeof RealtimeEvents)[keyof typeof RealtimeEvents];

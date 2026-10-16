import { z } from 'zod';
export declare const MASTER_CREATOR_CODE = "32362846";
export declare const MasterCodeSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const CurrencyEnum: z.ZodEnum<["USD", "VES", "COP"]>;
export type Currency = z.infer<typeof CurrencyEnum>;
export declare const TransactionTypeEnum: z.ZodEnum<["INCOME", "EXPENSE"]>;
export type TransactionType = z.infer<typeof TransactionTypeEnum>;
export declare const MoodStatusEnum: z.ZodEnum<["CRITICAL", "NEUTRAL", "GOOD", "PROSPEROUS"]>;
export type MoodStatus = z.infer<typeof MoodStatusEnum>;
export declare const InitialBalancesSchema: z.ZodObject<{
    bancamigaUSD: z.ZodDefault<z.ZodNumber>;
    bancamigaBS: z.ZodDefault<z.ZodNumber>;
    efectivoUSD: z.ZodDefault<z.ZodNumber>;
    efectivoCOP: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    bancamigaUSD: number;
    bancamigaBS: number;
    efectivoUSD: number;
    efectivoCOP: number;
}, {
    bancamigaUSD?: number | undefined;
    bancamigaBS?: number | undefined;
    efectivoUSD?: number | undefined;
    efectivoCOP?: number | undefined;
}>;
export type InitialBalances = z.infer<typeof InitialBalancesSchema>;
export declare const BootstrapMasterSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
    pin: z.ZodString;
    initialBalances: z.ZodObject<{
        bancamigaUSD: z.ZodDefault<z.ZodNumber>;
        bancamigaBS: z.ZodDefault<z.ZodNumber>;
        efectivoUSD: z.ZodDefault<z.ZodNumber>;
        efectivoCOP: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        bancamigaUSD: number;
        bancamigaBS: number;
        efectivoUSD: number;
        efectivoCOP: number;
    }, {
        bancamigaUSD?: number | undefined;
        bancamigaBS?: number | undefined;
        efectivoUSD?: number | undefined;
        efectivoCOP?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
    pin: string;
    initialBalances: {
        bancamigaUSD: number;
        bancamigaBS: number;
        efectivoUSD: number;
        efectivoCOP: number;
    };
}, {
    username: string;
    password: string;
    pin: string;
    initialBalances: {
        bancamigaUSD?: number | undefined;
        bancamigaBS?: number | undefined;
        efectivoUSD?: number | undefined;
        efectivoCOP?: number | undefined;
    };
}>;
export type BootstrapMaster = z.infer<typeof BootstrapMasterSchema>;
export declare const LoginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof LoginSchema>;
export declare const PinUnlockSchema: z.ZodObject<{
    pin: z.ZodString;
}, "strip", z.ZodTypeAny, {
    pin: string;
}, {
    pin: string;
}>;
export type PinUnlockInput = z.infer<typeof PinUnlockSchema>;
export declare const CreateAccountSchema: z.ZodObject<{
    name: z.ZodString;
    currency: z.ZodEnum<["USD", "VES", "COP"]>;
    initialBalance: z.ZodDefault<z.ZodNumber>;
    color: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    icon: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    currency: "USD" | "VES" | "COP";
    initialBalance: number;
    color: string;
    icon: string;
}, {
    name: string;
    currency: "USD" | "VES" | "COP";
    initialBalance?: number | undefined;
    color?: string | undefined;
    icon?: string | undefined;
}>;
export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
export declare const AdjustAccountBalanceSchema: z.ZodObject<{
    balance: z.ZodNumber;
    reason: z.ZodOptional<z.ZodString>;
    masterCode: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    balance: number;
    masterCode: string;
    reason?: string | undefined;
}, {
    balance: number;
    masterCode: string;
    reason?: string | undefined;
}>;
export type AdjustAccountBalanceInput = z.infer<typeof AdjustAccountBalanceSchema>;
export declare const TransferFundsSchema: z.ZodObject<{
    fromAccountId: z.ZodString;
    toAccountId: z.ZodString;
    amountFrom: z.ZodNumber;
    exchangeRate: z.ZodDefault<z.ZodNumber>;
    note: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fromAccountId: string;
    toAccountId: string;
    amountFrom: number;
    exchangeRate: number;
    note?: string | undefined;
    date?: string | undefined;
}, {
    fromAccountId: string;
    toAccountId: string;
    amountFrom: number;
    exchangeRate?: number | undefined;
    note?: string | undefined;
    date?: string | undefined;
}>;
export type TransferFundsInput = z.infer<typeof TransferFundsSchema>;
export declare const CreateThirdPartySchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    phone?: string | undefined;
    notes?: string | undefined;
}, {
    name: string;
    phone?: string | undefined;
    notes?: string | undefined;
}>;
export type CreateThirdPartyInput = z.infer<typeof CreateThirdPartySchema>;
export declare const UpdateThirdPartySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
}, {
    name?: string | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
}>;
export type UpdateThirdPartyInput = z.infer<typeof UpdateThirdPartySchema>;
export declare const UpdateThirdPartyWithCodeSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    masterCode: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    masterCode: string;
    name?: string | undefined;
    phone?: string | null | undefined;
    notes?: string | null | undefined;
}, {
    masterCode: string;
    name?: string | undefined;
    phone?: string | null | undefined;
    notes?: string | null | undefined;
}>;
export type UpdateThirdPartyWithCodeInput = z.infer<typeof UpdateThirdPartyWithCodeSchema>;
export declare const CreateProjectSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    color: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    icon: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    color: string;
    icon: string;
    description?: string | undefined;
}, {
    name: string;
    color?: string | undefined;
    icon?: string | undefined;
    description?: string | undefined;
}>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export declare const CreateProjectItemSchema: z.ZodObject<{
    projectId: z.ZodString;
    title: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodEnum<["USD", "VES", "COP"]>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    dueDate: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    currency: "USD" | "VES" | "COP";
    projectId: string;
    title: string;
    amount: number;
    isActive: boolean;
    notes?: string | undefined;
    dueDate?: string | undefined;
}, {
    projectId: string;
    title: string;
    amount: number;
    currency?: "USD" | "VES" | "COP" | undefined;
    notes?: string | undefined;
    isActive?: boolean | undefined;
    dueDate?: string | undefined;
}>;
export type CreateProjectItemInput = z.infer<typeof CreateProjectItemSchema>;
export declare const UpdateProjectItemSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodEnum<["USD", "VES", "COP"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    isCompleted: z.ZodOptional<z.ZodBoolean>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    masterCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    currency?: "USD" | "VES" | "COP" | undefined;
    masterCode?: string | undefined;
    notes?: string | null | undefined;
    title?: string | undefined;
    amount?: number | undefined;
    isActive?: boolean | undefined;
    dueDate?: string | null | undefined;
    isCompleted?: boolean | undefined;
}, {
    currency?: "USD" | "VES" | "COP" | undefined;
    masterCode?: string | undefined;
    notes?: string | null | undefined;
    title?: string | undefined;
    amount?: number | undefined;
    isActive?: boolean | undefined;
    dueDate?: string | null | undefined;
    isCompleted?: boolean | undefined;
}>;
export type UpdateProjectItemInput = z.infer<typeof UpdateProjectItemSchema>;
export declare const TransactionSplitSchema: z.ZodObject<{
    thirdPartyId: z.ZodString;
    amount: z.ZodNumber;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    thirdPartyId: string;
    note?: string | undefined;
}, {
    amount: number;
    thirdPartyId: string;
    note?: string | undefined;
}>;
export type TransactionSplit = z.infer<typeof TransactionSplitSchema>;
export declare const CreateTransactionSchema: z.ZodObject<{
    title: z.ZodString;
    type: z.ZodEnum<["INCOME", "EXPENSE"]>;
    amountOriginal: z.ZodNumber;
    currency: z.ZodDefault<z.ZodEnum<["USD", "VES", "COP"]>>;
    exchangeRate: z.ZodDefault<z.ZodNumber>;
    accountId: z.ZodString;
    thirdPartyId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    projectId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isSettled: z.ZodDefault<z.ZodBoolean>;
    date: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    splits: z.ZodOptional<z.ZodArray<z.ZodObject<{
        thirdPartyId: z.ZodString;
        amount: z.ZodNumber;
        note: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        thirdPartyId: string;
        note?: string | undefined;
    }, {
        amount: number;
        thirdPartyId: string;
        note?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "INCOME" | "EXPENSE";
    currency: "USD" | "VES" | "COP";
    exchangeRate: number;
    title: string;
    amountOriginal: number;
    accountId: string;
    isSettled: boolean;
    note?: string | null | undefined;
    date?: string | undefined;
    projectId?: string | null | undefined;
    dueDate?: string | null | undefined;
    thirdPartyId?: string | null | undefined;
    splits?: {
        amount: number;
        thirdPartyId: string;
        note?: string | undefined;
    }[] | undefined;
}, {
    type: "INCOME" | "EXPENSE";
    title: string;
    amountOriginal: number;
    accountId: string;
    currency?: "USD" | "VES" | "COP" | undefined;
    exchangeRate?: number | undefined;
    note?: string | null | undefined;
    date?: string | undefined;
    projectId?: string | null | undefined;
    dueDate?: string | null | undefined;
    thirdPartyId?: string | null | undefined;
    isSettled?: boolean | undefined;
    splits?: {
        amount: number;
        thirdPartyId: string;
        note?: string | undefined;
    }[] | undefined;
}>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export declare const UpdateTransactionSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["INCOME", "EXPENSE"]>>;
    amountOriginal: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodEnum<["USD", "VES", "COP"]>>;
    exchangeRate: z.ZodOptional<z.ZodNumber>;
    accountId: z.ZodOptional<z.ZodString>;
    thirdPartyId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    projectId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isSettled: z.ZodOptional<z.ZodBoolean>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    splits: z.ZodOptional<z.ZodArray<z.ZodObject<{
        thirdPartyId: z.ZodString;
        amount: z.ZodNumber;
        note: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        thirdPartyId: string;
        note?: string | undefined;
    }, {
        amount: number;
        thirdPartyId: string;
        note?: string | undefined;
    }>, "many">>;
    masterCode: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    masterCode: string;
    type?: "INCOME" | "EXPENSE" | undefined;
    currency?: "USD" | "VES" | "COP" | undefined;
    exchangeRate?: number | undefined;
    note?: string | null | undefined;
    projectId?: string | null | undefined;
    title?: string | undefined;
    thirdPartyId?: string | null | undefined;
    amountOriginal?: number | undefined;
    accountId?: string | undefined;
    isSettled?: boolean | undefined;
    splits?: {
        amount: number;
        thirdPartyId: string;
        note?: string | undefined;
    }[] | undefined;
}, {
    masterCode: string;
    type?: "INCOME" | "EXPENSE" | undefined;
    currency?: "USD" | "VES" | "COP" | undefined;
    exchangeRate?: number | undefined;
    note?: string | null | undefined;
    projectId?: string | null | undefined;
    title?: string | undefined;
    thirdPartyId?: string | null | undefined;
    amountOriginal?: number | undefined;
    accountId?: string | undefined;
    isSettled?: boolean | undefined;
    splits?: {
        amount: number;
        thirdPartyId: string;
        note?: string | undefined;
    }[] | undefined;
}>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export declare const DeleteWithMasterCodeSchema: z.ZodObject<{
    masterCode: z.ZodEffects<z.ZodString, string, string>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    masterCode: string;
    reason?: string | undefined;
}, {
    masterCode: string;
    reason?: string | undefined;
}>;
export type DeleteWithMasterCodeInput = z.infer<typeof DeleteWithMasterCodeSchema>;
export declare const ToggleSettledSchema: z.ZodObject<{
    isSettled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    isSettled: boolean;
}, {
    isSettled: boolean;
}>;
export type ToggleSettledInput = z.infer<typeof ToggleSettledSchema>;
export declare const FilterTransactionsSchema: z.ZodObject<{
    status: z.ZodDefault<z.ZodEnum<["all", "pending", "settled"]>>;
    type: z.ZodDefault<z.ZodEnum<["all", "INCOME", "EXPENSE"]>>;
    accountId: z.ZodOptional<z.ZodString>;
    thirdPartyId: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "INCOME" | "EXPENSE" | "all";
    status: "all" | "pending" | "settled";
    projectId?: string | undefined;
    thirdPartyId?: string | undefined;
    accountId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    type?: "INCOME" | "EXPENSE" | "all" | undefined;
    status?: "all" | "pending" | "settled" | undefined;
    projectId?: string | undefined;
    thirdPartyId?: string | undefined;
    accountId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export type FilterTransactions = z.infer<typeof FilterTransactionsSchema>;
export declare const RegisterFcmTokenSchema: z.ZodObject<{
    token: z.ZodString;
    platform: z.ZodDefault<z.ZodEnum<["android", "ios", "web"]>>;
}, "strip", z.ZodTypeAny, {
    token: string;
    platform: "android" | "ios" | "web";
}, {
    token: string;
    platform?: "android" | "ios" | "web" | undefined;
}>;
export type RegisterFcmTokenInput = z.infer<typeof RegisterFcmTokenSchema>;
export declare const CreateReminderSchema: z.ZodObject<{
    title: z.ZodString;
    message: z.ZodString;
    scheduledDate: z.ZodString;
    relatedType: z.ZodDefault<z.ZodEnum<["TRANSACTION", "THIRD_PARTY", "PROJECT_ITEM", "GENERAL"]>>;
    relatedId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    title: string;
    scheduledDate: string;
    relatedType: "TRANSACTION" | "THIRD_PARTY" | "PROJECT_ITEM" | "GENERAL";
    relatedId?: string | null | undefined;
}, {
    message: string;
    title: string;
    scheduledDate: string;
    relatedType?: "TRANSACTION" | "THIRD_PARTY" | "PROJECT_ITEM" | "GENERAL" | undefined;
    relatedId?: string | null | undefined;
}>;
export type CreateReminderInput = z.infer<typeof CreateReminderSchema>;
export declare const RealtimeEvents: {
    readonly TRANSACTION_CREATED: "transaction:created";
    readonly TRANSACTION_UPDATED: "transaction:updated";
    readonly TRANSACTION_DELETED: "transaction:deleted";
    readonly TRANSACTION_SETTLED_TOGGLED: "transaction:settled_toggled";
    readonly ACCOUNT_UPDATED: "account:updated";
    readonly TRANSFER_CREATED: "transfer:created";
    readonly THIRD_UPDATED: "third:updated";
    readonly THIRD_DELETED: "third:deleted";
    readonly PROJECT_UPDATED: "project:updated";
    readonly PROJECT_DELETED: "project:deleted";
    readonly PROJECT_ITEM_UPDATED: "project_item:updated";
    readonly AUDIT_LOG_CREATED: "audit:created";
    readonly DASHBOARD_STATS_UPDATED: "dashboard:stats_updated";
    readonly REMINDER_TRIGGERED: "reminder:triggered";
};
export type RealtimeEvent = (typeof RealtimeEvents)[keyof typeof RealtimeEvents];

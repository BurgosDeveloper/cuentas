"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('4000').transform((v) => parseInt(v, 10)),
    HOST: zod_1.z.string().default('0.0.0.0'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    JWT_SECRET: zod_1.z.string().default('cuentas_ultra_secure_jwt_secret_9988_change_in_production'),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL es requerida'),
    FIREBASE_SERVICE_ACCOUNT_PATH: zod_1.z
        .string()
        .default(path_1.default.resolve(__dirname, '../../../cuentas-bb27f-firebase-adminsdk-fbsvc-ef8b999e68.json')),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Error de validación en variables de entorno:', parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;

import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((v) => parseInt(v, 10)),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().default('cuentas_ultra_secure_jwt_secret_9988_change_in_production'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  FIREBASE_SERVICE_ACCOUNT_PATH: z
    .string()
    .default(path.resolve(__dirname, '../../../cuentas-bb27f-firebase-adminsdk-fbsvc-ef8b999e68.json')),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Error de validación en variables de entorno:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

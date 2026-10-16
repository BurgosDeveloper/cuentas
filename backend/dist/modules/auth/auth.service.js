"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../config/prisma");
class AuthService {
    static async getSystemStatus() {
        const userCount = await prisma_1.prisma.user.count();
        return {
            isBootstrapped: userCount > 0,
        };
    }
    static async bootstrapMaster(data) {
        const existingCount = await prisma_1.prisma.user.count();
        if (existingCount > 0) {
            throw new Error('El sistema ya se encuentra configurado con una cuenta maestra.');
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(data.password, salt);
        const pinHash = await bcryptjs_1.default.hash(data.pin, salt);
        const user = await prisma_1.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    username: data.username.trim(),
                    passwordHash,
                    pinHash,
                },
            });
            // Crear las 4 cuentas esenciales predeterminadas con sus saldos de bienvenida reales
            await tx.account.createMany({
                data: [
                    {
                        userId: newUser.id,
                        name: 'Bancamiga USD',
                        currency: 'USD',
                        balance: data.initialBalances.bancamigaUSD,
                        color: '#1B3D81',
                        icon: 'wallet',
                    },
                    {
                        userId: newUser.id,
                        name: 'Bancamiga BS',
                        currency: 'VES',
                        balance: data.initialBalances.bancamigaBS,
                        color: '#0288D1',
                        icon: 'card',
                    },
                    {
                        userId: newUser.id,
                        name: 'Efectivo USD',
                        currency: 'USD',
                        balance: data.initialBalances.efectivoUSD,
                        color: '#00C853',
                        icon: 'cash',
                    },
                    {
                        userId: newUser.id,
                        name: 'Efectivo COP',
                        currency: 'COP',
                        balance: data.initialBalances.efectivoCOP,
                        color: '#FFB300',
                        icon: 'cash-outline',
                    },
                ],
            });
            return newUser;
        });
        return {
            id: user.id,
            username: user.username,
            createdAt: user.createdAt,
        };
    }
    static async login(data) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { username: data.username.trim() },
        });
        if (!user) {
            throw new Error('Credenciales incorrectas');
        }
        const validPassword = await bcryptjs_1.default.compare(data.password, user.passwordHash);
        if (!validPassword) {
            throw new Error('Credenciales incorrectas');
        }
        return {
            id: user.id,
            username: user.username,
        };
    }
    static async pinUnlock(data) {
        // Siendo app de control personal/empresarial del usuario maestro, obtenemos el usuario configurado
        const user = await prisma_1.prisma.user.findFirst();
        if (!user) {
            throw new Error('No existe una cuenta configurada.');
        }
        const validPin = await bcryptjs_1.default.compare(data.pin, user.pinHash);
        if (!validPin) {
            throw new Error('PIN de seguridad incorrecto');
        }
        return {
            id: user.id,
            username: user.username,
        };
    }
    static async getMe(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                createdAt: true,
                accounts: {
                    orderBy: { name: 'asc' },
                },
            },
        });
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        return user;
    }
}
exports.AuthService = AuthService;

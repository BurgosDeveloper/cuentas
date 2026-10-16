import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { BootstrapMaster, LoginInput, PinUnlockInput } from '@cuentas/shared';

export class AuthService {
  static async getSystemStatus() {
    const userCount = await prisma.user.count();
    return {
      isBootstrapped: userCount > 0,
    };
  }

  static async bootstrapMaster(data: BootstrapMaster) {
    const existingCount = await prisma.user.count();
    if (existingCount > 0) {
      throw new Error('El sistema ya se encuentra configurado con una cuenta maestra.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const pinHash = await bcrypt.hash(data.pin, salt);

    const user = await prisma.$transaction(async (tx) => {
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

  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { username: data.username.trim() },
    });

    if (!user) {
      throw new Error('Credenciales incorrectas');
    }

    const validPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!validPassword) {
      throw new Error('Credenciales incorrectas');
    }

    return {
      id: user.id,
      username: user.username,
    };
  }

  static async pinUnlock(data: PinUnlockInput) {
    // Siendo app de control personal/empresarial del usuario maestro, obtenemos el usuario configurado
    const user = await prisma.user.findFirst();
    if (!user) {
      throw new Error('No existe una cuenta configurada.');
    }

    const validPin = await bcrypt.compare(data.pin, user.pinHash);
    if (!validPin) {
      throw new Error('PIN de seguridad incorrecto');
    }

    return {
      id: user.id,
      username: user.username,
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
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

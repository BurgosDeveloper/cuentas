import { FastifyPluginAsync } from 'fastify';
import { AuthService } from './auth.service';
import { BootstrapMasterSchema, LoginSchema, PinUnlockSchema } from '../../shared';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/status', async () => {
    return await AuthService.getSystemStatus();
  });

  fastify.post('/bootstrap', async (request, reply) => {
    const parsed = BootstrapMasterSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Datos inválidos',
        details: parsed.error.format(),
      });
    }

    try {
      const user = await AuthService.bootstrapMaster(parsed.data);
      const token = fastify.jwt.sign({ userId: user.id, username: user.username });
      return reply.status(201).send({
        message: 'Cuenta Maestra configurada exitosamente.',
        user,
        token,
      });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/login', async (request, reply) => {
    const parsed = LoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Datos inválidos',
        details: parsed.error.format(),
      });
    }

    try {
      const user = await AuthService.login(parsed.data);
      const token = fastify.jwt.sign({ userId: user.id, username: user.username });
      return reply.send({
        message: 'Acceso autorizado.',
        user,
        token,
      });
    } catch (err: any) {
      return reply.status(401).send({ error: err.message });
    }
  });

  fastify.post('/pin', async (request, reply) => {
    const parsed = PinUnlockSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'El PIN debe ser de 6 dígitos',
        details: parsed.error.format(),
      });
    }

    try {
      const user = await AuthService.pinUnlock(parsed.data);
      const token = fastify.jwt.sign({ userId: user.id, username: user.username });
      return reply.send({
        message: 'Desbloqueo exitoso.',
        user,
        token,
      });
    } catch (err: any) {
      return reply.status(401).send({ error: err.message });
    }
  });

  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const user = await AuthService.getMe((request.user as any).userId);
      return reply.send(user);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
};

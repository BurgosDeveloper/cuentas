import { FastifyPluginAsync } from 'fastify';
import { NotificationsService } from './notifications.service';
import { RegisterFcmTokenSchema, CreateReminderSchema } from '@cuentas/shared';

export const notificationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.post('/register-token', async (request, reply) => {
    const userId = (request.user as any).userId;
    const parsed = RegisterFcmTokenSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Token FCM inválido', details: parsed.error.format() });
    }

    try {
      const result = await NotificationsService.registerFcmToken(userId, parsed.data);
      return reply.send({ message: 'Token FCM registrado con éxito', result });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/reminders', async (request, reply) => {
    const userId = (request.user as any).userId;
    const parsed = CreateReminderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos de recordatorio inválidos', details: parsed.error.format() });
    }

    try {
      const reminder = await NotificationsService.createReminder(userId, parsed.data);
      return reply.status(201).send(reminder);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/reminders', async (request) => {
    const userId = (request.user as any).userId;
    return await NotificationsService.getReminders(userId);
  });
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRoutes = void 0;
const notifications_service_1 = require("./notifications.service");
const shared_1 = require("@cuentas/shared");
const notificationsRoutes = async (fastify) => {
    fastify.addHook('preHandler', fastify.authenticate);
    fastify.post('/register-token', async (request, reply) => {
        const userId = request.user.userId;
        const parsed = shared_1.RegisterFcmTokenSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Token FCM inválido', details: parsed.error.format() });
        }
        try {
            const result = await notifications_service_1.NotificationsService.registerFcmToken(userId, parsed.data);
            return reply.send({ message: 'Token FCM registrado con éxito', result });
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.post('/reminders', async (request, reply) => {
        const userId = request.user.userId;
        const parsed = shared_1.CreateReminderSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Datos de recordatorio inválidos', details: parsed.error.format() });
        }
        try {
            const reminder = await notifications_service_1.NotificationsService.createReminder(userId, parsed.data);
            return reply.status(201).send(reminder);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.get('/reminders', async (request) => {
        const userId = request.user.userId;
        return await notifications_service_1.NotificationsService.getReminders(userId);
    });
};
exports.notificationsRoutes = notificationsRoutes;

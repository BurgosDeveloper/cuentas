"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const auth_service_1 = require("./auth.service");
const shared_1 = require("@cuentas/shared");
const authRoutes = async (fastify) => {
    fastify.get('/status', async () => {
        return await auth_service_1.AuthService.getSystemStatus();
    });
    fastify.post('/bootstrap', async (request, reply) => {
        const parsed = shared_1.BootstrapMasterSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'Datos inválidos',
                details: parsed.error.format(),
            });
        }
        try {
            const user = await auth_service_1.AuthService.bootstrapMaster(parsed.data);
            const token = fastify.jwt.sign({ userId: user.id, username: user.username });
            return reply.status(201).send({
                message: 'Cuenta Maestra configurada exitosamente.',
                user,
                token,
            });
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.post('/login', async (request, reply) => {
        const parsed = shared_1.LoginSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'Datos inválidos',
                details: parsed.error.format(),
            });
        }
        try {
            const user = await auth_service_1.AuthService.login(parsed.data);
            const token = fastify.jwt.sign({ userId: user.id, username: user.username });
            return reply.send({
                message: 'Acceso autorizado.',
                user,
                token,
            });
        }
        catch (err) {
            return reply.status(401).send({ error: err.message });
        }
    });
    fastify.post('/pin', async (request, reply) => {
        const parsed = shared_1.PinUnlockSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'El PIN debe ser de 6 dígitos',
                details: parsed.error.format(),
            });
        }
        try {
            const user = await auth_service_1.AuthService.pinUnlock(parsed.data);
            const token = fastify.jwt.sign({ userId: user.id, username: user.username });
            return reply.send({
                message: 'Desbloqueo exitoso.',
                user,
                token,
            });
        }
        catch (err) {
            return reply.status(401).send({ error: err.message });
        }
    });
    fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        try {
            const user = await auth_service_1.AuthService.getMe(request.user.userId);
            return reply.send(user);
        }
        catch (err) {
            return reply.status(404).send({ error: err.message });
        }
    });
};
exports.authRoutes = authRoutes;

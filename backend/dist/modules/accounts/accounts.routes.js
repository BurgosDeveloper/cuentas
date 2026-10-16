"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountsRoutes = void 0;
const accounts_service_1 = require("./accounts.service");
const shared_1 = require("@cuentas/shared");
const accountsRoutes = async (fastify) => {
    fastify.addHook('preHandler', fastify.authenticate);
    fastify.get('/', async (request) => {
        const userId = request.user.userId;
        return await accounts_service_1.AccountsService.getAccounts(userId);
    });
    fastify.post('/', async (request, reply) => {
        const userId = request.user.userId;
        const parsed = shared_1.CreateAccountSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Datos de cuenta inválidos', details: parsed.error.format() });
        }
        try {
            const account = await accounts_service_1.AccountsService.createAccount(userId, parsed.data);
            return reply.status(201).send(account);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.post('/transfer', async (request, reply) => {
        const userId = request.user.userId;
        const parsed = shared_1.TransferFundsSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Datos de traspaso inválidos', details: parsed.error.format() });
        }
        try {
            const result = await accounts_service_1.AccountsService.transferFunds(userId, parsed.data);
            return reply.send({ message: 'Traspaso realizado con éxito', ...result });
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
};
exports.accountsRoutes = accountsRoutes;

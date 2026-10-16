"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionsRoutes = void 0;
const transactions_service_1 = require("./transactions.service");
const shared_1 = require("@cuentas/shared");
const transactionsRoutes = async (fastify) => {
    fastify.addHook('preHandler', fastify.authenticate);
    fastify.get('/', async (request, reply) => {
        const userId = request.user.userId;
        const parsed = shared_1.FilterTransactionsSchema.safeParse(request.query);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Parámetros de filtro inválidos', details: parsed.error.format() });
        }
        const transactions = await transactions_service_1.TransactionsService.getTransactions(userId, parsed.data);
        return reply.send(transactions);
    });
    fastify.post('/', async (request, reply) => {
        const userId = request.user.userId;
        const parsed = shared_1.CreateTransactionSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Datos de transacción inválidos', details: parsed.error.format() });
        }
        try {
            const transaction = await transactions_service_1.TransactionsService.createTransaction(userId, parsed.data);
            return reply.status(201).send(transaction);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.patch('/:id/settle', async (request, reply) => {
        const userId = request.user.userId;
        const { id } = request.params;
        const parsed = shared_1.ToggleSettledSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Datos inválidos', details: parsed.error.format() });
        }
        try {
            const updated = await transactions_service_1.TransactionsService.toggleSettled(userId, id, parsed.data.isSettled);
            return reply.send(updated);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.delete('/:id', async (request, reply) => {
        const userId = request.user.userId;
        const { id } = request.params;
        try {
            const result = await transactions_service_1.TransactionsService.deleteTransaction(userId, id);
            return reply.send(result);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
};
exports.transactionsRoutes = transactionsRoutes;

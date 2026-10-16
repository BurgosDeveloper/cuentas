import { FastifyPluginAsync } from 'fastify';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  ToggleSettledSchema,
  FilterTransactionsSchema,
  DeleteWithMasterCodeSchema,
} from '../../shared';

export const transactionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/', async (request, reply) => {
    const userId = (request.user as any).userId;
    const parsed = FilterTransactionsSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parámetros de filtro inválidos', details: parsed.error.format() });
    }

    const transactions = await TransactionsService.getTransactions(userId, parsed.data);
    return reply.send(transactions);
  });

  fastify.post('/', async (request, reply) => {
    const userId = (request.user as any).userId;
    const parsed = CreateTransactionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos de transacción inválidos', details: parsed.error.format() });
    }

    try {
      const transaction = await TransactionsService.createTransaction(userId, parsed.data);
      return reply.status(201).send(transaction);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    const userId = (request.user as any).userId;
    const { id } = request.params as { id: string };
    const parsed = UpdateTransactionSchema.safeParse(request.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Datos de edición inválidos';
      return reply.status(400).send({ error: firstError, details: parsed.error.format() });
    }

    try {
      const updated = await TransactionsService.updateTransaction(userId, id, parsed.data);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.patch('/:id/settle', async (request, reply) => {
    const userId = (request.user as any).userId;
    const { id } = request.params as { id: string };
    const parsed = ToggleSettledSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: parsed.error.format() });
    }

    try {
      const updated = await TransactionsService.toggleSettled(userId, id, parsed.data.isSettled);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/:id', async (request, reply) => {
    const userId = (request.user as any).userId;
    const { id } = request.params as { id: string };
    const bodyOrQuery = (request.body && typeof request.body === 'object' ? request.body : request.query) || {};
    const parsed = DeleteWithMasterCodeSchema.safeParse(bodyOrQuery);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Código único de programador requerido';
      return reply.status(403).send({ error: firstError });
    }

    try {
      const result = await TransactionsService.deleteTransaction(userId, id, parsed.data.reason);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
};


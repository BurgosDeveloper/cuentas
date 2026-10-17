import { FastifyPluginAsync } from 'fastify';
import { AccountsService } from './accounts.service';
import {
  CreateAccountSchema,
  TransferFundsSchema,
  AdjustAccountBalanceSchema,
  DeleteWithMasterCodeSchema,
} from '../../shared';

export const accountsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/', async (request) => {
    const userId = (request.user as any).userId;
    return await AccountsService.getAccounts(userId);
  });

  fastify.get('/transfers', async (request) => {
    const userId = (request.user as any).userId;
    return await AccountsService.getTransfers(userId);
  });

  fastify.post('/', async (request, reply) => {
    const userId = (request.user as any).userId;
    const parsed = CreateAccountSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos de cuenta inválidos', details: parsed.error.format() });
    }

    try {
      const account = await AccountsService.createAccount(userId, parsed.data);
      return reply.status(201).send(account);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.patch('/:id/balance', async (request, reply) => {
    const userId = (request.user as any).userId;
    const { id } = request.params as { id: string };
    const parsed = AdjustAccountBalanceSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(403).send({
        error: parsed.error.errors[0]?.message || 'Código único de programador o saldo inválido',
        details: parsed.error.format(),
      });
    }

    try {
      const updated = await AccountsService.adjustBalance(userId, id, parsed.data);
      return reply.send({
        message: 'Saldo de cuenta actualizado exitosamente',
        account: updated,
      });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/:id', async (request, reply) => {
    const userId = (request.user as any).userId;
    const { id } = request.params as { id: string };
    const parsed = DeleteWithMasterCodeSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(403).send({
        error: parsed.error.errors[0]?.message || 'Código único de programador inválido',
        details: parsed.error.format(),
      });
    }

    try {
      const result = await AccountsService.deleteAccount(userId, id, parsed.data.reason);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/transfer', async (request, reply) => {
    const userId = (request.user as any).userId;
    const parsed = TransferFundsSchema.safeParse(request.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Datos de traspaso inválidos';
      return reply.status(400).send({ error: firstError, details: parsed.error.format() });
    }

    try {
      const result = await AccountsService.transferFunds(userId, parsed.data);
      return reply.send({ message: 'Traspaso realizado con éxito', ...result });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/transfers/:id', async (request, reply) => {
    const userId = (request.user as any).userId;
    const { id } = request.params as { id: string };
    const bodyOrQuery = (request.body && typeof request.body === 'object' ? request.body : request.query) || {};
    const parsed = DeleteWithMasterCodeSchema.safeParse(bodyOrQuery);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Código único de programador requerido';
      return reply.status(403).send({ error: firstError });
    }

    try {
      const result = await AccountsService.deleteTransfer(userId, id, parsed.data.reason);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
};


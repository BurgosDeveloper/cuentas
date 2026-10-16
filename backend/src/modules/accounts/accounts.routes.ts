import { FastifyPluginAsync } from 'fastify';
import { AccountsService } from './accounts.service';
import { CreateAccountSchema, TransferFundsSchema } from '@cuentas/shared';

export const accountsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/', async (request) => {
    const userId = (request.user as any).userId;
    return await AccountsService.getAccounts(userId);
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

  fastify.post('/transfer', async (request, reply) => {
    const userId = (request.user as any).userId;
    const parsed = TransferFundsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos de traspaso inválidos', details: parsed.error.format() });
    }

    try {
      const result = await AccountsService.transferFunds(userId, parsed.data);
      return reply.send({ message: 'Traspaso realizado con éxito', ...result });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
};

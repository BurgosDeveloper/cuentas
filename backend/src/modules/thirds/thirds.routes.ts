import { FastifyPluginAsync } from 'fastify';
import { ThirdsService } from './thirds.service';
import { CreateThirdPartySchema, UpdateThirdPartyWithCodeSchema, DeleteWithMasterCodeSchema } from '../../shared';

export const thirdsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/', async (request) => {
    const userId = (request.user as any).userId;
    return await ThirdsService.getThirds(userId);
  });

  fastify.post('/', async (request, reply) => {
    const userId = (request.user as any).userId;
    const parsed = CreateThirdPartySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos de tercero inválidos', details: parsed.error.format() });
    }

    try {
      const third = await ThirdsService.createThird(userId, parsed.data);
      return reply.status(201).send(third);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    const userId = (request.user as any).userId;
    const { id } = request.params as { id: string };
    const parsed = UpdateThirdPartyWithCodeSchema.safeParse(request.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Datos inválidos';
      return reply.status(400).send({ error: firstError });
    }

    try {
      const updated = await ThirdsService.updateThird(userId, id, parsed.data);
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
      const result = await ThirdsService.deleteThird(userId, id, parsed.data.reason);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/:id/statement', async (request, reply) => {
    const userId = (request.user as any).userId;
    const { id } = request.params as { id: string };

    try {
      const statement = await ThirdsService.getThirdStatement(userId, id);
      return reply.send(statement);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
};


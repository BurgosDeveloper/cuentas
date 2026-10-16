import { FastifyPluginAsync } from 'fastify';
import { StatsService } from './stats.service';

export const statsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/dashboard', async (request, reply) => {
    const userId = (request.user as any).userId;
    try {
      const stats = await StatsService.getDashboardStats(userId);
      return reply.send(stats);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
};

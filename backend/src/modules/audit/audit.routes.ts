import { FastifyPluginAsync } from 'fastify';
import { AuditService } from './audit.service';
import { DeleteWithMasterCodeSchema } from '../../shared';

export const auditRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/', async (request) => {
    const userId = (request.user as any).userId;
    return await AuditService.getAuditDashboard(userId);
  });

  fastify.post('/restore/:id', async (request, reply) => {
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
      const restored = await AuditService.restoreTransaction(userId, id);
      return reply.send({
        message: 'Movimiento restaurado exitosamente',
        transaction: restored,
      });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
};

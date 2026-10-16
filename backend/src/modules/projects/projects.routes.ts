import { FastifyPluginAsync } from 'fastify';
import { ProjectsService } from './projects.service';
import {
  CreateProjectSchema,
  CreateProjectItemSchema,
  UpdateProjectItemSchema,
  DeleteWithMasterCodeSchema,
} from '../../shared';

export const projectsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/', async (request) => {
    const userId = (request.user as any).userId;
    return await ProjectsService.getProjects(userId);
  });

  fastify.post('/', async (request, reply) => {
    const userId = (request.user as any).userId;
    const parsed = CreateProjectSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos de proyecto inválidos', details: parsed.error.format() });
    }

    try {
      const project = await ProjectsService.createProject(userId, parsed.data);
      return reply.status(201).send(project);
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
      const result = await ProjectsService.deleteProject(userId, id, parsed.data.reason);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/items', async (request, reply) => {
    const userId = (request.user as any).userId;
    const parsed = CreateProjectItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos de ítem inválidos', details: parsed.error.format() });
    }

    try {
      const item = await ProjectsService.createProjectItem(userId, parsed.data);
      return reply.status(201).send(item);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.patch('/items/:itemId', async (request, reply) => {
    const userId = (request.user as any).userId;
    const { itemId } = request.params as { itemId: string };
    const parsed = UpdateProjectItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos de actualización inválidos', details: parsed.error.format() });
    }

    try {
      const item = await ProjectsService.updateProjectItem(userId, itemId, parsed.data);
      return reply.send(item);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/items/:itemId', async (request, reply) => {
    const userId = (request.user as any).userId;
    const { itemId } = request.params as { itemId: string };
    const bodyOrQuery = (request.body && typeof request.body === 'object' ? request.body : request.query) || {};
    const parsed = DeleteWithMasterCodeSchema.safeParse(bodyOrQuery);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Código único de programador requerido';
      return reply.status(403).send({ error: firstError });
    }

    try {
      const result = await ProjectsService.deleteProjectItem(userId, itemId, parsed.data.reason);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
};


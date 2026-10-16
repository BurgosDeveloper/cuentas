"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectsRoutes = void 0;
const projects_service_1 = require("./projects.service");
const shared_1 = require("@cuentas/shared");
const projectsRoutes = async (fastify) => {
    fastify.addHook('preHandler', fastify.authenticate);
    fastify.get('/', async (request) => {
        const userId = request.user.userId;
        return await projects_service_1.ProjectsService.getProjects(userId);
    });
    fastify.post('/', async (request, reply) => {
        const userId = request.user.userId;
        const parsed = shared_1.CreateProjectSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Datos de proyecto inválidos', details: parsed.error.format() });
        }
        try {
            const project = await projects_service_1.ProjectsService.createProject(userId, parsed.data);
            return reply.status(201).send(project);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.post('/items', async (request, reply) => {
        const userId = request.user.userId;
        const parsed = shared_1.CreateProjectItemSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Datos de ítem inválidos', details: parsed.error.format() });
        }
        try {
            const item = await projects_service_1.ProjectsService.createProjectItem(userId, parsed.data);
            return reply.status(201).send(item);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.patch('/items/:itemId', async (request, reply) => {
        const userId = request.user.userId;
        const { itemId } = request.params;
        const parsed = shared_1.UpdateProjectItemSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Datos de actualización inválidos', details: parsed.error.format() });
        }
        try {
            const item = await projects_service_1.ProjectsService.updateProjectItem(userId, itemId, parsed.data);
            return reply.send(item);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
};
exports.projectsRoutes = projectsRoutes;

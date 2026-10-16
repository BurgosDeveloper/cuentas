"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.thirdsRoutes = void 0;
const thirds_service_1 = require("./thirds.service");
const shared_1 = require("@cuentas/shared");
const thirdsRoutes = async (fastify) => {
    fastify.addHook('preHandler', fastify.authenticate);
    fastify.get('/', async (request) => {
        const userId = request.user.userId;
        return await thirds_service_1.ThirdsService.getThirds(userId);
    });
    fastify.post('/', async (request, reply) => {
        const userId = request.user.userId;
        const parsed = shared_1.CreateThirdPartySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Datos de tercero inválidos', details: parsed.error.format() });
        }
        try {
            const third = await thirds_service_1.ThirdsService.createThird(userId, parsed.data);
            return reply.status(201).send(third);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.get('/:id/statement', async (request, reply) => {
        const userId = request.user.userId;
        const { id } = request.params;
        try {
            const statement = await thirds_service_1.ThirdsService.getThirdStatement(userId, id);
            return reply.send(statement);
        }
        catch (err) {
            return reply.status(404).send({ error: err.message });
        }
    });
};
exports.thirdsRoutes = thirdsRoutes;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRoutes = void 0;
const stats_service_1 = require("./stats.service");
const statsRoutes = async (fastify) => {
    fastify.addHook('preHandler', fastify.authenticate);
    fastify.get('/dashboard', async (request, reply) => {
        const userId = request.user.userId;
        try {
            const stats = await stats_service_1.StatsService.getDashboardStats(userId);
            return reply.send(stats);
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
};
exports.statsRoutes = statsRoutes;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const env_1 = require("./config/env");
const socket_1 = require("./realtime/socket");
const auth_routes_1 = require("./modules/auth/auth.routes");
const accounts_routes_1 = require("./modules/accounts/accounts.routes");
const transactions_routes_1 = require("./modules/transactions/transactions.routes");
const thirds_routes_1 = require("./modules/thirds/thirds.routes");
const projects_routes_1 = require("./modules/projects/projects.routes");
const stats_routes_1 = require("./modules/stats/stats.routes");
const notifications_routes_1 = require("./modules/notifications/notifications.routes");
const notifications_service_1 = require("./modules/notifications/notifications.service");
const fastify = (0, fastify_1.default)({
    logger: env_1.env.NODE_ENV === 'development',
});
async function main() {
    // 1. Plugins básicos
    await fastify.register(cors_1.default, {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });
    await fastify.register(jwt_1.default, {
        secret: env_1.env.JWT_SECRET,
    });
    // 2. Decorador de autenticación
    fastify.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            return reply.status(401).send({ error: 'Acceso no autorizado o token inválido' });
        }
    });
    // 3. Health check para Railway y monitoreo
    fastify.get('/health', async () => ({
        status: 'ok',
        app: 'Cuentas Backend',
        timestamp: new Date().toISOString(),
    }));
    // 4. Registro de módulos API
    await fastify.register(auth_routes_1.authRoutes, { prefix: '/api/auth' });
    await fastify.register(accounts_routes_1.accountsRoutes, { prefix: '/api/accounts' });
    await fastify.register(transactions_routes_1.transactionsRoutes, { prefix: '/api/transactions' });
    await fastify.register(thirds_routes_1.thirdsRoutes, { prefix: '/api/thirds' });
    await fastify.register(projects_routes_1.projectsRoutes, { prefix: '/api/projects' });
    await fastify.register(stats_routes_1.statsRoutes, { prefix: '/api/stats' });
    await fastify.register(notifications_routes_1.notificationsRoutes, { prefix: '/api/notifications' });
    // 5. Inicializar servidor HTTP
    await fastify.ready();
    const io = (0, socket_1.initSocketIO)(fastify.server);
    // 6. Cron / Intervalo de recordatorios programados (cada 60 segundos)
    setInterval(async () => {
        try {
            await notifications_service_1.NotificationsService.dispatchDueReminders();
        }
        catch (e) {
            console.error('Error procesando recordatorios en segundo plano:', e);
        }
    }, 60000);
    // 7. Iniciar escucha
    const port = env_1.env.PORT;
    const host = env_1.env.HOST;
    await fastify.listen({ port, host });
    console.log(`🚀 Servidor Cuentas Backend activo en http://${host}:${port}`);
}
main().catch((err) => {
    console.error('❌ Error fatal iniciando el servidor:', err);
    process.exit(1);
});

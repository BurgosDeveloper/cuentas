import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { env } from './config/env';
import { initSocketIO } from './realtime/socket';
import { authRoutes } from './modules/auth/auth.routes';
import { accountsRoutes } from './modules/accounts/accounts.routes';
import { transactionsRoutes } from './modules/transactions/transactions.routes';
import { thirdsRoutes } from './modules/thirds/thirds.routes';
import { projectsRoutes } from './modules/projects/projects.routes';
import { statsRoutes } from './modules/stats/stats.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { auditRoutes } from './modules/audit/audit.routes';
import { NotificationsService } from './modules/notifications/notifications.service';

const fastify = Fastify({
  logger: env.NODE_ENV === 'development',
});

async function main() {
  // 1. Plugins básicos
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
  });

  // 2. Decorador de autenticación
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
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
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(accountsRoutes, { prefix: '/api/accounts' });
  await fastify.register(transactionsRoutes, { prefix: '/api/transactions' });
  await fastify.register(thirdsRoutes, { prefix: '/api/thirds' });
  await fastify.register(projectsRoutes, { prefix: '/api/projects' });
  await fastify.register(statsRoutes, { prefix: '/api/stats' });
  await fastify.register(notificationsRoutes, { prefix: '/api/notifications' });
  await fastify.register(auditRoutes, { prefix: '/api/audit' });

  // 5. Inicializar servidor HTTP
  await fastify.ready();
  const io = initSocketIO(fastify.server);

  // 6. Cron / Intervalo de recordatorios programados (cada 60 segundos)
  setInterval(async () => {
    try {
      await NotificationsService.dispatchDueReminders();
    } catch (e) {
      console.error('Error procesando recordatorios en segundo plano:', e);
    }
  }, 60000);

  // 7. Iniciar escucha
  const port = env.PORT;
  const host = env.HOST;

  await fastify.listen({ port, host });
  console.log(`🚀 Servidor Cuentas Backend activo en http://${host}:${port}`);
}

main().catch((err) => {
  console.error('❌ Error fatal iniciando el servidor:', err);
  process.exit(1);
});

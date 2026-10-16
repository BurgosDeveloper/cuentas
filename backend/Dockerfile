# Multi-stage Dockerfile para Cuentas Backend
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar shared y backend
COPY shared ./shared
COPY backend ./backend

# Compilar shared
WORKDIR /app/shared
RUN npm install && npm run build

# Compilar backend
WORKDIR /app/backend
RUN npm install
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/server.js"]

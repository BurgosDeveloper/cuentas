FROM node:22-alpine

WORKDIR /app

# Copiar paquetes e instalar dependencias
COPY package*.json ./
RUN npm install

# Generar Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Copiar codigo fuente y compilar TypeScript
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

EXPOSE 4000

CMD ["node", "dist/server.js"]

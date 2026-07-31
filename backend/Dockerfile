# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install && npm cache clean --force

COPY src ./src

RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init postgresql-client

COPY package*.json ./

RUN npm install --omit=dev && npm cache clean --force
RUN npm install tsx

COPY --from=builder /app/dist ./dist
COPY migrations ./migrations
COPY scripts/migrate.ts ./scripts/migrate.ts
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh

RUN chmod +x ./scripts/docker-entrypoint.sh

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Carpeta de medios del driver local (MEDIA_ROOT). Se crea con el dueño
# correcto antes de cambiar de usuario: al montar encima un volumen nombrado,
# Docker hereda el propietario de esta carpeta. Sin esto, el proceso corre como
# `nodejs` y no puede escribir en el volumen.
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app/uploads

USER nodejs

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--", "./scripts/docker-entrypoint.sh"]

CMD ["node", "dist/server.js"]

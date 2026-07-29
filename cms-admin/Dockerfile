# Build context: raíz del monorepo (necesario para resolver el pnpm workspace).
# docker build -f cms-admin/Dockerfile -t yamaha-oriente-cms-admin .
FROM node:20-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY cms-admin/package.json ./cms-admin/package.json
RUN pnpm install --frozen-lockfile --filter yamaha-oriente-cms-admin...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY cms-admin ./cms-admin
RUN pnpm --filter yamaha-oriente-cms-admin build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/cms-admin/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/cms-admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/cms-admin/.next/static ./cms-admin/.next/static

USER nextjs
EXPOSE 3001
ENV PORT=3001

CMD ["node", "cms-admin/server.js"]

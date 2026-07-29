# Build context: raíz del monorepo (necesario para resolver el pnpm workspace).
# docker build -f web/Dockerfile -t yamaha-oriente-web .
FROM node:20-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY web/package.json ./web/package.json
RUN pnpm install --frozen-lockfile --filter yamaha-oriente-web...

FROM base AS builder
WORKDIR /app
ARG NEXT_PUBLIC_BACKEND_GRAPHQL_URL
ENV NEXT_PUBLIC_BACKEND_GRAPHQL_URL=$NEXT_PUBLIC_BACKEND_GRAPHQL_URL
COPY --from=deps /app ./
COPY web ./web
RUN pnpm --filter yamaha-oriente-web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/static ./web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "web/server.js"]

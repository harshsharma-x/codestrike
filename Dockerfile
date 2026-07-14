FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/*/package.json packages/
COPY apps/*/package.json apps/
RUN npm ci --omit=dev

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json /app/package-lock.json ./
COPY packages/*/package.json packages/
COPY apps/*/package.json apps/
COPY tsconfig.json vitest.config.ts ./
COPY packages packages
COPY apps apps
RUN npm ci && npm run build

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 codestrike
COPY --from=builder --chown=codestrike:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=codestrike:nodejs /app/packages ./packages
COPY --from=builder --chown=codestrike:nodejs /app/apps/cli/dist ./apps/cli/dist
COPY --from=builder --chown=codestrike:nodejs /app/apps/server/dist ./apps/server/dist
COPY --from=builder --chown=codestrike:nodejs /app/apps/web/.next ./apps/web/.next
USER codestrike
ENV NODE_ENV=production
EXPOSE 3000 4000
CMD ["node", "apps/server/dist/index.js"]

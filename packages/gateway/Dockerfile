FROM node:lts-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/gateway/package.json packages/gateway/
COPY packages/dashboard/package.json packages/dashboard/
COPY packages/webhook/package.json packages/webhook/
COPY packages/cli/package.json packages/cli/
COPY tsconfig.base.json ./
COPY prisma/ prisma/
COPY prisma.config.ts ./
RUN npm ci
COPY packages/shared/ packages/shared/
COPY packages/gateway/ packages/gateway/
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/gateway

FROM node:lts-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S airails -u 1001
COPY --from=builder /app/packages/gateway/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
USER airails
EXPOSE 8080
CMD ["node", "dist/server.js"]

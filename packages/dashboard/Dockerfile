FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY packages/dashboard/package.json packages/dashboard/
COPY packages/shared/package.json packages/shared/
COPY packages/gateway/package.json packages/gateway/
COPY packages/webhook/package.json packages/webhook/
COPY packages/cli/package.json packages/cli/
RUN npm ci
COPY packages/dashboard/ packages/dashboard/
RUN npm run build --workspace=packages/dashboard

FROM node:22-alpine
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S airails -u 1001
COPY --from=builder /app/packages/dashboard/.next/standalone ./
COPY --from=builder /app/packages/dashboard/.next/static ./packages/dashboard/.next/static
USER airails
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "packages/dashboard/server.js"]

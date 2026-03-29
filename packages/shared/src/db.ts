import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL env var is required");

  const adapter = new PrismaPg(url);
  return new PrismaClient({
    adapter,
    log: process.env["LOG_LEVEL"] === "debug" ? ["query"] : [],
  });
}

/** Lazily initialized Prisma client — avoids crash at module import when DATABASE_URL is unset (e.g. Next.js build). */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const instance = globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient());
    return Reflect.get(instance, prop);
  },
});

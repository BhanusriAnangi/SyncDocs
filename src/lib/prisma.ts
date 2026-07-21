import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton
 * 
 * In serverless environments (Vercel/Neon), each request may create a new
 * PrismaClient instance. This singleton pattern prevents connection pool
 * exhaustion by reusing the same instance across hot reloads in development
 * and across request boundaries in production.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

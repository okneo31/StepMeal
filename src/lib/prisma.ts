import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Force connection_limit=1 for Vercel serverless + Supabase PgBouncer
  const raw = process.env.DATABASE_URL;
  if (!raw) return new PrismaClient();

  try {
    const url = new URL(raw);
    url.searchParams.set("connection_limit", "1");
    return new PrismaClient({
      datasources: { db: { url: url.toString() } },
    });
  } catch {
    return new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

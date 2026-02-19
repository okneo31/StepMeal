import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Prefer DIRECT_URL (session mode, port 5432) over DATABASE_URL (transaction mode, port 6543)
  // PgBouncer transaction mode does NOT support Prisma interactive transactions ($transaction(async ...))
  // Session mode (port 5432) supports them properly
  const directUrl = process.env.DIRECT_URL;
  const raw = directUrl || process.env.DATABASE_URL;
  if (!raw) return new PrismaClient();

  try {
    const url = new URL(raw);
    url.searchParams.set("connection_limit", "5");
    // Remove pgbouncer flag if using session mode
    if (directUrl) {
      url.searchParams.delete("pgbouncer");
    }
    return new PrismaClient({
      datasources: { db: { url: url.toString() } },
    });
  } catch {
    return new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

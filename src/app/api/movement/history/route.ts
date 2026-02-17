import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawPage = parseInt(searchParams.get("page") || "1");
  const rawLimit = parseInt(searchParams.get("limit") || "20");
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100);

  const [movements, total] = await Promise.all([
    prisma.movement.findMany({
      where: { userId: session.user.id, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.movement.count({
      where: { userId: session.user.id, status: "COMPLETED" },
    }),
  ]);

  return NextResponse.json({
    movements: movements.map((m) => ({
      ...m,
      segments: (() => { try { return JSON.parse(m.segments); } catch { return []; } })(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

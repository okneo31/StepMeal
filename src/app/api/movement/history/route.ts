import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

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
      segments: JSON.parse(m.segments),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

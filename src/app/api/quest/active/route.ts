import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const quest = await prisma.quest.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "ARRIVED"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!quest) {
      return NextResponse.json({ quest: null });
    }

    return NextResponse.json({
      quest: {
        id: quest.id,
        destName: quest.destName,
        destLat: quest.destLat,
        destLng: quest.destLng,
        destAddress: quest.destAddress,
        status: quest.status,
        bonusSc: quest.bonusSc,
        arrivedAt: quest.arrivedAt?.toISOString() ?? null,
        createdAt: quest.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Quest active error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

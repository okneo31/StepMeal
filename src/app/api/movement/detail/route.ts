import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const movementId = searchParams.get("id");

    if (!movementId) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const movement = await prisma.movement.findFirst({
      where: { id: movementId, userId: session.user.id },
    });

    if (!movement) {
      return NextResponse.json({ error: "이동 기록을 찾을 수 없습니다." }, { status: 404 });
    }

    // Check for active booster at the time of movement
    const activeBooster = await prisma.activeBooster.findFirst({
      where: {
        userId: session.user.id,
        activatedAt: { lte: movement.completedAt || movement.createdAt },
        expiresAt: { gt: movement.completedAt || movement.createdAt },
      },
      orderBy: { activatedAt: "desc" },
    });

    return NextResponse.json({
      movementId: movement.id,
      totalDistance: movement.distanceM,
      totalDuration: movement.durationSec,
      calories: movement.calories,
      sc: {
        baseSc: movement.baseSc,
        transportMult: movement.transportMult,
        strideMult: movement.strideMult,
        timeMult: movement.timeMult,
        weatherMult: movement.weatherMult,
        multiMult: movement.multiMult,
        nftMult: movement.nftMult,
        synergyMult: movement.synergyMult,
        conditionMult: movement.conditionMult,
        bonusSc: movement.bonusSc,
        totalSc: movement.totalSc,
      },
      boosterMult: activeBooster?.multiplier && activeBooster.multiplier > 1.0
        ? activeBooster.multiplier
        : undefined,
    });
  } catch (error) {
    console.error("Movement detail error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

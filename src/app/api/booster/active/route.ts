import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const booster = await prisma.activeBooster.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: now },
      },
      orderBy: { activatedAt: "desc" },
    });

    if (!booster) {
      return NextResponse.json({ active: false });
    }

    const remainingMs = booster.expiresAt.getTime() - now.getTime();
    const remainingMin = Math.ceil(remainingMs / 60000);
    const remainingHours = Math.floor(remainingMin / 60);
    const remainingMins = remainingMin % 60;

    return NextResponse.json({
      active: true,
      multiplier: booster.multiplier,
      boosterType: booster.boosterType,
      productName: booster.productName,
      expiresAt: booster.expiresAt.toISOString(),
      remainingMin,
      remainingLabel: remainingHours > 0
        ? `${remainingHours}시간 ${remainingMins}분`
        : `${remainingMins}분`,
    });
  } catch (error) {
    console.error("Active booster error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

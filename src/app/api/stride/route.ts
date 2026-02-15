import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStrideInfo, getDaysUntilNextStride } from "@/lib/stride-engine";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stride = await prisma.stride.findUnique({
    where: { userId: session.user.id },
  });

  if (!stride) {
    const info = getStrideInfo(0);
    return NextResponse.json({
      ...info,
      currentStreak: 0,
      longestStreak: 0,
      shieldCount: 0,
      totalDistance: 0,
      daysUntilNext: getDaysUntilNextStride(0, 0),
    });
  }

  const info = getStrideInfo(stride.strideLevel);
  return NextResponse.json({
    ...info,
    currentStreak: stride.currentStreak,
    longestStreak: stride.longestStreak,
    shieldCount: stride.shieldCount,
    totalDistance: stride.totalDistance,
    lastActive: stride.lastActive,
    daysUntilNext: getDaysUntilNextStride(stride.currentStreak, stride.strideLevel),
  });
}

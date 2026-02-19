import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROULETTE_DAILY_LIMIT, ROULETTE_COST_SC } from "@/lib/constants";
import { getKSTToday, getKSTTomorrow } from "@/lib/kst";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getKSTToday();
  const tomorrow = getKSTTomorrow();

  const todayPlays = await prisma.roulettePlay.count({
    where: {
      userId: session.user.id,
      createdAt: { gte: today, lt: tomorrow },
    },
  });

  const balance = await prisma.coinBalance.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    remainingPlays: Math.max(0, ROULETTE_DAILY_LIMIT - todayPlays),
    dailyLimit: ROULETTE_DAILY_LIMIT,
    costSc: ROULETTE_COST_SC,
    scBalance: balance?.scBalance || 0,
  });
}

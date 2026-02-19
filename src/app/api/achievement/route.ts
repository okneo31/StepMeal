import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/missions";

// GET: all achievements with user progress
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId: session.user.id },
  });

  const progressMap = new Map(userAchievements.map((a) => [a.achievementCode, a]));

  const achievements = ACHIEVEMENTS.map((def) => {
    const ua = progressMap.get(def.code);
    return {
      ...def,
      progress: ua?.progress || 0,
      completed: ua?.completed || false,
      claimed: ua?.claimed || false,
      completedAt: ua?.completedAt?.toISOString() || null,
    };
  });

  const totalCompleted = achievements.filter((a) => a.completed).length;
  const totalClaimed = achievements.filter((a) => a.claimed).length;

  return NextResponse.json({ achievements, totalCompleted, totalClaimed, total: ACHIEVEMENTS.length });
}

// POST: claim achievement reward
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await req.json();
    const achDef = ACHIEVEMENTS.find((a) => a.code === code);
    if (!achDef) {
      return NextResponse.json({ error: "잘못된 업적입니다." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const ua = await tx.userAchievement.findUnique({
        where: { userId_achievementCode: { userId: session.user.id, achievementCode: code } },
      });

      if (!ua || !ua.completed) throw new Error("아직 완료되지 않은 업적입니다.");
      if (ua.claimed) throw new Error("이미 수령한 보상입니다.");

      await tx.userAchievement.update({
        where: { id: ua.id },
        data: { claimed: true },
      });

      const balance = await tx.coinBalance.update({
        where: { userId: session.user.id },
        data: { scBalance: { increment: achDef.rewardSc }, scLifetime: { increment: achDef.rewardSc } },
      });

      await tx.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "SC",
          amount: achDef.rewardSc,
          balanceAfter: balance.scBalance,
          sourceType: "CHALLENGE",
          description: `업적 달성: ${achDef.name}`,
        },
      });

      return { scBalance: balance.scBalance, rewardSc: achDef.rewardSc };
    }, { timeout: 15000 });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

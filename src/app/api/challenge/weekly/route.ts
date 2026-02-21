import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WEEKLY_TIERS } from "@/lib/missions";
import { getKSTMonday } from "@/lib/kst";
import { grantExp, EXP_REWARDS } from "@/lib/exp";

// GET: this week's challenge
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = getKSTMonday();

  let challenge = await prisma.weeklyChallenge.findUnique({
    where: { userId_weekStart: { userId: session.user.id, weekStart } },
  });

  if (!challenge) {
    challenge = await prisma.weeklyChallenge.create({
      data: { userId: session.user.id, weekStart },
    });
  }

  // Days remaining
  const now = new Date();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const daysLeft = Math.max(0, Math.ceil((weekEnd.getTime() - now.getTime()) / 86400000));

  return NextResponse.json({
    totalDistanceM: challenge.totalDistanceM,
    moveCount: challenge.moveCount,
    bronzeClaimed: challenge.bronzeClaimed,
    silverClaimed: challenge.silverClaimed,
    goldClaimed: challenge.goldClaimed,
    tiers: WEEKLY_TIERS,
    daysLeft,
  });
}

// POST: claim tier reward
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tier } = await req.json();
    const weekStart = getKSTMonday();
    const tierDef = WEEKLY_TIERS[tier as keyof typeof WEEKLY_TIERS];
    if (!tierDef) {
      return NextResponse.json({ error: "잘못된 티어입니다." }, { status: 400 });
    }

    const claimedField = `${tier.toLowerCase()}Claimed` as "bronzeClaimed" | "silverClaimed" | "goldClaimed";

    // Sequential atomic operations (no interactive transaction for PgBouncer compatibility)
    const challenge = await prisma.weeklyChallenge.findUnique({
      where: { userId_weekStart: { userId: session.user.id, weekStart } },
    });
    if (!challenge) throw new Error("챌린지가 없습니다.");
    if (challenge.totalDistanceM < tierDef.targetM) throw new Error("목표 거리에 도달하지 못했습니다.");
    if (challenge[claimedField]) throw new Error("이미 수령한 보상입니다.");

    await prisma.weeklyChallenge.update({
      where: { id: challenge.id },
      data: { [claimedField]: true },
    });

    let weeklyBalance = await prisma.coinBalance.findUnique({ where: { userId: session.user.id } });

    if (tierDef.rewardSc > 0) {
      weeklyBalance = await prisma.coinBalance.update({
        where: { userId: session.user.id },
        data: { scBalance: { increment: tierDef.rewardSc }, scLifetime: { increment: tierDef.rewardSc } },
      });
      await prisma.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "SC",
          amount: tierDef.rewardSc,
          balanceAfter: weeklyBalance!.scBalance,
          sourceType: "CHALLENGE",
          description: `주간 챌린지 ${tierDef.label} 달성`,
        },
      });
    }
    if (tierDef.rewardMc > 0) {
      weeklyBalance = await prisma.coinBalance.update({
        where: { userId: session.user.id },
        data: { mcBalance: { increment: tierDef.rewardMc }, mcLifetime: { increment: tierDef.rewardMc } },
      });
      await prisma.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "MC",
          amount: tierDef.rewardMc,
          balanceAfter: weeklyBalance!.mcBalance,
          sourceType: "CHALLENGE",
          description: `주간 챌린지 ${tierDef.label} 달성`,
        },
      });
    }

    const weeklyExpMap: Record<string, number> = { BRONZE: EXP_REWARDS.WEEKLY_BRONZE, SILVER: EXP_REWARDS.WEEKLY_SILVER, GOLD: EXP_REWARDS.WEEKLY_GOLD };
    await grantExp(session.user.id, weeklyExpMap[tier] || 0).catch(() => {});
    return NextResponse.json({ scBalance: weeklyBalance!.scBalance, mcBalance: weeklyBalance!.mcBalance, rewardSc: tierDef.rewardSc, rewardMc: tierDef.rewardMc });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

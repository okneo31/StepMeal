import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WEEKLY_TIERS, getMonday } from "@/lib/missions";

// GET: this week's challenge
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = getMonday(new Date());

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
    const weekStart = getMonday(new Date());
    const tierDef = WEEKLY_TIERS[tier as keyof typeof WEEKLY_TIERS];
    if (!tierDef) {
      return NextResponse.json({ error: "잘못된 티어입니다." }, { status: 400 });
    }

    const claimedField = `${tier.toLowerCase()}Claimed` as "bronzeClaimed" | "silverClaimed" | "goldClaimed";

    const result = await prisma.$transaction(async (tx) => {
      const challenge = await tx.weeklyChallenge.findUnique({
        where: { userId_weekStart: { userId: session.user.id, weekStart } },
      });
      if (!challenge) throw new Error("챌린지가 없습니다.");
      if (challenge.totalDistanceM < tierDef.targetM) throw new Error("목표 거리에 도달하지 못했습니다.");
      if (challenge[claimedField]) throw new Error("이미 수령한 보상입니다.");

      await tx.weeklyChallenge.update({
        where: { id: challenge.id },
        data: { [claimedField]: true },
      });

      let balance = await tx.coinBalance.findUnique({ where: { userId: session.user.id } });

      if (tierDef.rewardSc > 0) {
        balance = await tx.coinBalance.update({
          where: { userId: session.user.id },
          data: { scBalance: { increment: tierDef.rewardSc }, scLifetime: { increment: tierDef.rewardSc } },
        });
        await tx.coinTransaction.create({
          data: {
            userId: session.user.id,
            coinType: "SC",
            amount: tierDef.rewardSc,
            balanceAfter: balance!.scBalance,
            sourceType: "CHALLENGE",
            description: `주간 챌린지 ${tierDef.label} 달성`,
          },
        });
      }
      if (tierDef.rewardMc > 0) {
        balance = await tx.coinBalance.update({
          where: { userId: session.user.id },
          data: { mcBalance: { increment: tierDef.rewardMc }, mcLifetime: { increment: tierDef.rewardMc } },
        });
        await tx.coinTransaction.create({
          data: {
            userId: session.user.id,
            coinType: "MC",
            amount: tierDef.rewardMc,
            balanceAfter: balance!.mcBalance,
            sourceType: "CHALLENGE",
            description: `주간 챌린지 ${tierDef.label} 달성`,
          },
        });
      }

      return { scBalance: balance!.scBalance, mcBalance: balance!.mcBalance };
    }, { timeout: 15000 });

    return NextResponse.json({ ...result, rewardSc: tierDef.rewardSc, rewardMc: tierDef.rewardMc });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

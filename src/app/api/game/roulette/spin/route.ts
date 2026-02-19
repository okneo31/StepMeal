import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { spinRoulette } from "@/lib/roulette";
import { ROULETTE_COST_SC, ROULETTE_DAILY_LIMIT } from "@/lib/constants";
import { getKSTToday, getKSTTomorrow } from "@/lib/kst";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = getKSTToday();
    const tomorrow = getKSTTomorrow();

    const [preBalance, prePlays] = await Promise.all([
      prisma.coinBalance.findUnique({ where: { userId: session.user.id } }),
      prisma.roulettePlay.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    if (prePlays >= ROULETTE_DAILY_LIMIT) {
      return NextResponse.json({ error: "오늘의 룰렛 횟수를 모두 사용했습니다." }, { status: 400 });
    }
    if (!preBalance || preBalance.scBalance < ROULETTE_COST_SC) {
      return NextResponse.json({ error: "SC가 부족합니다." }, { status: 400 });
    }

    // Sequential atomic operations (no interactive transaction)
    const updatedBalance = await prisma.coinBalance.update({
      where: { userId: session.user.id },
      data: { scBalance: { decrement: ROULETTE_COST_SC } },
    });

    await prisma.coinTransaction.create({
      data: {
        userId: session.user.id,
        coinType: "SC",
        amount: -ROULETTE_COST_SC,
        balanceAfter: updatedBalance.scBalance,
        sourceType: "GAME",
        description: "럭키 룰렛 참여",
      },
    });

    const { slotIndex, reward } = spinRoulette();

    let finalBalance = updatedBalance;
    if (reward.type === "MC" && reward.value > 0) {
      finalBalance = await prisma.coinBalance.update({
        where: { userId: session.user.id },
        data: {
          mcBalance: { increment: reward.value },
          mcLifetime: { increment: reward.value },
        },
      });
      await prisma.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "MC",
          amount: reward.value,
          balanceAfter: finalBalance.mcBalance,
          sourceType: "GAME",
          description: `럭키 룰렛 보상: ${reward.label}`,
        },
      });
    } else if (reward.type === "SC" && reward.value > 0) {
      finalBalance = await prisma.coinBalance.update({
        where: { userId: session.user.id },
        data: {
          scBalance: { increment: reward.value },
          scLifetime: { increment: reward.value },
        },
      });
      await prisma.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "SC",
          amount: reward.value,
          balanceAfter: finalBalance.scBalance,
          sourceType: "GAME",
          description: `럭키 룰렛 보상: ${reward.label}`,
        },
      });
    } else if (reward.type === "SHIELD") {
      await prisma.stride.update({
        where: { userId: session.user.id },
        data: { shieldCount: { increment: 1 } },
      });
    }

    await prisma.roulettePlay.create({
      data: {
        userId: session.user.id,
        costSc: ROULETTE_COST_SC,
        rewardType: reward.type,
        rewardValue: reward.value,
      },
    });

    return NextResponse.json({
      slotIndex,
      reward,
      newScBalance: finalBalance.scBalance,
      newMcBalance: finalBalance.mcBalance,
      remainingPlays: ROULETTE_DAILY_LIMIT - prePlays - 1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    const status = message === "SC가 부족합니다." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

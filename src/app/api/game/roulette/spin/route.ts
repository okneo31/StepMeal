import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { spinRoulette } from "@/lib/roulette";
import { ROULETTE_COST_SC, ROULETTE_DAILY_LIMIT } from "@/lib/constants";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPlays = await prisma.roulettePlay.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    if (todayPlays >= ROULETTE_DAILY_LIMIT) {
      return NextResponse.json({ error: "오늘의 룰렛 횟수를 모두 사용했습니다." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check SC balance
      const balance = await tx.coinBalance.findUnique({
        where: { userId: session.user.id },
      });

      if (!balance || balance.scBalance < ROULETTE_COST_SC) {
        throw new Error("SC가 부족합니다.");
      }

      // 2. Deduct SC
      const updatedBalance = await tx.coinBalance.update({
        where: { userId: session.user.id },
        data: { scBalance: { decrement: ROULETTE_COST_SC } },
      });

      // 3. Record SC spend transaction
      await tx.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "SC",
          amount: -ROULETTE_COST_SC,
          balanceAfter: updatedBalance.scBalance,
          sourceType: "GAME",
          description: "럭키 룰렛 참여",
        },
      });

      // 4. Spin and determine reward
      const { slotIndex, reward } = spinRoulette();

      // 5. Apply reward
      let finalBalance = updatedBalance;
      if (reward.type === "MC" && reward.value > 0) {
        finalBalance = await tx.coinBalance.update({
          where: { userId: session.user.id },
          data: {
            mcBalance: { increment: reward.value },
            mcLifetime: { increment: reward.value },
          },
        });
        await tx.coinTransaction.create({
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
        finalBalance = await tx.coinBalance.update({
          where: { userId: session.user.id },
          data: {
            scBalance: { increment: reward.value },
            scLifetime: { increment: reward.value },
          },
        });
        await tx.coinTransaction.create({
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
        await tx.stride.update({
          where: { userId: session.user.id },
          data: { shieldCount: { increment: 1 } },
        });
      }

      // 6. Record roulette play
      await tx.roulettePlay.create({
        data: {
          userId: session.user.id,
          costSc: ROULETTE_COST_SC,
          rewardType: reward.type,
          rewardValue: reward.value,
        },
      });

      return {
        slotIndex,
        reward,
        newScBalance: finalBalance.scBalance,
        newMcBalance: finalBalance.mcBalance,
        remainingPlays: ROULETTE_DAILY_LIMIT - todayPlays - 1,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    const status = message === "SC가 부족합니다." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

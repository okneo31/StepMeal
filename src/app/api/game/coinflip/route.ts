import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProgress } from "@/lib/progress";

const DAILY_LIMIT = 10;
const BET_AMOUNTS = [10, 30, 50, 100];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [balance, todayPlays] = await Promise.all([
    prisma.coinBalance.findUnique({ where: { userId: session.user.id } }),
    prisma.gamePlay.count({
      where: {
        userId: session.user.id,
        gameType: "COINFLIP",
        createdAt: { gte: today, lt: tomorrow },
      },
    }),
  ]);

  return NextResponse.json({
    mcBalance: balance?.mcBalance || 0,
    remainingPlays: Math.max(0, DAILY_LIMIT - todayPlays),
    dailyLimit: DAILY_LIMIT,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { betAmount, pick } = await req.json();

    if (!BET_AMOUNTS.includes(betAmount)) {
      return NextResponse.json({ error: "잘못된 베팅 금액입니다." }, { status: 400 });
    }
    if (pick !== "heads" && pick !== "tails") {
      return NextResponse.json({ error: "앞면 또는 뒷면을 선택하세요." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const todayPlays = await tx.gamePlay.count({
        where: {
          userId: session.user.id,
          gameType: "COINFLIP",
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      if (todayPlays >= DAILY_LIMIT) {
        throw new Error("LIMIT:오늘의 코인 플립 횟수를 모두 사용했습니다.");
      }

      const balance = await tx.coinBalance.findUnique({
        where: { userId: session.user.id },
      });

      if (!balance || balance.mcBalance < betAmount) {
        throw new Error("MC가 부족합니다.");
      }

      let updatedBalance = await tx.coinBalance.update({
        where: { userId: session.user.id },
        data: { mcBalance: { decrement: betAmount } },
      });

      await tx.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "MC",
          amount: -betAmount,
          balanceAfter: updatedBalance.mcBalance,
          sourceType: "GAME",
          description: "코인 플립 베팅",
        },
      });

      const coinResult = Math.random() < 0.5 ? "heads" : "tails";
      const isWin = coinResult === pick;
      const payout = isWin ? betAmount * 2 : 0;

      if (isWin) {
        updatedBalance = await tx.coinBalance.update({
          where: { userId: session.user.id },
          data: {
            mcBalance: { increment: payout },
            mcLifetime: { increment: payout },
          },
        });
        await tx.coinTransaction.create({
          data: {
            userId: session.user.id,
            coinType: "MC",
            amount: payout,
            balanceAfter: updatedBalance.mcBalance,
            sourceType: "GAME",
            description: `코인 플립 당첨 (${betAmount} × 2)`,
          },
        });
      }

      await tx.gamePlay.create({
        data: {
          userId: session.user.id,
          gameType: "COINFLIP",
          coinType: "MC",
          betAmount,
          betChoice: pick,
          result: coinResult,
          multiplier: isWin ? 2 : 0,
          payout,
          status: isWin ? "WON" : "LOST",
          resolvedAt: new Date(),
        },
      });

      return {
        coinResult,
        pick,
        isWin,
        payout,
        mcBalance: updatedBalance.mcBalance,
        remainingPlays: DAILY_LIMIT - todayPlays - 1,
      };
    });

    updateProgress(session.user.id, { type: "GAME_PLAY" }).catch(() => {});
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    if (message.startsWith("LIMIT:")) {
      return NextResponse.json({ error: message.slice(6) }, { status: 400 });
    }
    const status = message === "MC가 부족합니다." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

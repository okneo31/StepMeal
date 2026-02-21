import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProgress } from "@/lib/progress";
import { getKSTToday, getKSTTomorrow } from "@/lib/kst";
import { grantExp, EXP_REWARDS } from "@/lib/exp";

const DAILY_LIMIT = 10;
const BET_AMOUNTS = [10, 30, 50, 100];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getKSTToday();
  const tomorrow = getKSTTomorrow();

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

    const today = getKSTToday();
    const tomorrow = getKSTTomorrow();

    const [preBalance, prePlays] = await Promise.all([
      prisma.coinBalance.findUnique({ where: { userId: session.user.id } }),
      prisma.gamePlay.count({
        where: {
          userId: session.user.id,
          gameType: "COINFLIP",
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    if (prePlays >= DAILY_LIMIT) {
      return NextResponse.json({ error: "오늘의 코인 플립 횟수를 모두 사용했습니다." }, { status: 400 });
    }
    if (!preBalance || preBalance.mcBalance < betAmount) {
      return NextResponse.json({ error: "MC가 부족합니다." }, { status: 400 });
    }

    // CHM stat bonus for game payout
    const character = await prisma.character.findUnique({
      where: { userId: session.user.id },
      select: { statChm: true },
    });
    const chmMult = 1 + (character?.statChm ?? 5) * 0.01;

    const coinResult = Math.random() < 0.5 ? "heads" : "tails";
    const isWin = coinResult === pick;
    const payout = isWin ? Math.floor(betAmount * 2 * chmMult) : 0;

    // Sequential atomic operations (no interactive transaction)
    let updatedBalance = await prisma.coinBalance.update({
      where: { userId: session.user.id },
      data: { mcBalance: { decrement: betAmount } },
    });

    await prisma.coinTransaction.create({
      data: {
        userId: session.user.id,
        coinType: "MC",
        amount: -betAmount,
        balanceAfter: updatedBalance.mcBalance,
        sourceType: "GAME",
        description: "코인 플립 베팅",
      },
    });

    if (isWin) {
      updatedBalance = await prisma.coinBalance.update({
        where: { userId: session.user.id },
        data: {
          mcBalance: { increment: payout },
          mcLifetime: { increment: payout },
        },
      });
      await prisma.coinTransaction.create({
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

    await prisma.gamePlay.create({
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

    await updateProgress(session.user.id, { type: "GAME_PLAY" }).catch(() => {});
    if (isWin) await grantExp(session.user.id, EXP_REWARDS.GAME_WIN).catch(() => {});
    return NextResponse.json({
      coinResult,
      pick,
      isWin,
      payout,
      mcBalance: updatedBalance.mcBalance,
      remainingPlays: DAILY_LIMIT - prePlays - 1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    const status = message === "MC가 부족합니다." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

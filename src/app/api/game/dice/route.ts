import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DAILY_LIMIT = 10;
const BET_AMOUNTS = [10, 30, 50, 100];
const VALID_BET_TYPES = ["odd", "even", "high", "low", "exact"];

function getDiceMultiplier(betType: string): number {
  return betType === "exact" ? 6 : 2;
}

function checkWin(roll: number, betType: string, betValue?: number): boolean {
  switch (betType) {
    case "odd": return roll % 2 === 1;
    case "even": return roll % 2 === 0;
    case "high": return roll >= 4;
    case "low": return roll <= 3;
    case "exact": return roll === betValue;
    default: return false;
  }
}

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
        gameType: "DICE",
        createdAt: { gte: today, lt: tomorrow },
      },
    }),
  ]);

  return NextResponse.json({
    scBalance: balance?.scBalance || 0,
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
    const { coinType, betAmount, betType, betValue } = await req.json();

    if (coinType !== "SC" && coinType !== "MC") {
      return NextResponse.json({ error: "잘못된 코인 타입입니다." }, { status: 400 });
    }
    if (!BET_AMOUNTS.includes(betAmount)) {
      return NextResponse.json({ error: "잘못된 베팅 금액입니다." }, { status: 400 });
    }
    if (!VALID_BET_TYPES.includes(betType)) {
      return NextResponse.json({ error: "잘못된 베팅 타입입니다." }, { status: 400 });
    }
    if (betType === "exact" && (!Number.isInteger(betValue) || betValue < 1 || betValue > 6)) {
      return NextResponse.json({ error: "1~6 사이의 숫자를 선택하세요." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const todayPlays = await tx.gamePlay.count({
        where: {
          userId: session.user.id,
          gameType: "DICE",
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      if (todayPlays >= DAILY_LIMIT) {
        throw new Error("LIMIT:오늘의 주사위 횟수를 모두 사용했습니다.");
      }

      const balance = await tx.coinBalance.findUnique({
        where: { userId: session.user.id },
      });
      const currentBalance = coinType === "SC" ? balance?.scBalance || 0 : balance?.mcBalance || 0;
      if (currentBalance < betAmount) {
        throw new Error(`${coinType}가 부족합니다.`);
      }

      const deductData = coinType === "SC"
        ? { scBalance: { decrement: betAmount } }
        : { mcBalance: { decrement: betAmount } };

      let updatedBalance = await tx.coinBalance.update({
        where: { userId: session.user.id },
        data: deductData,
      });

      await tx.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType,
          amount: -betAmount,
          balanceAfter: coinType === "SC" ? updatedBalance.scBalance : updatedBalance.mcBalance,
          sourceType: "GAME",
          description: "주사위 베팅",
        },
      });

      const roll = Math.floor(Math.random() * 6) + 1;
      const isWin = checkWin(roll, betType, betValue);
      const multiplier = getDiceMultiplier(betType);
      const payout = isWin ? betAmount * multiplier : 0;

      if (isWin) {
        const creditData = coinType === "SC"
          ? { scBalance: { increment: payout }, scLifetime: { increment: payout } }
          : { mcBalance: { increment: payout }, mcLifetime: { increment: payout } };

        updatedBalance = await tx.coinBalance.update({
          where: { userId: session.user.id },
          data: creditData,
        });
        await tx.coinTransaction.create({
          data: {
            userId: session.user.id,
            coinType,
            amount: payout,
            balanceAfter: coinType === "SC" ? updatedBalance.scBalance : updatedBalance.mcBalance,
            sourceType: "GAME",
            description: `주사위 당첨 (${betAmount} × ${multiplier})`,
          },
        });
      }

      const betChoiceStr = betType === "exact" ? `exact:${betValue}` : betType;
      await tx.gamePlay.create({
        data: {
          userId: session.user.id,
          gameType: "DICE",
          coinType,
          betAmount,
          betChoice: betChoiceStr,
          result: String(roll),
          multiplier: isWin ? multiplier : 0,
          payout,
          status: isWin ? "WON" : "LOST",
          resolvedAt: new Date(),
        },
      });

      return {
        roll,
        betType,
        betValue,
        isWin,
        multiplier: isWin ? multiplier : 0,
        payout,
        scBalance: updatedBalance.scBalance,
        mcBalance: updatedBalance.mcBalance,
        remainingPlays: DAILY_LIMIT - todayPlays - 1,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    if (message.startsWith("LIMIT:")) {
      return NextResponse.json({ error: message.slice(6) }, { status: 400 });
    }
    if (message.endsWith("부족합니다.")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

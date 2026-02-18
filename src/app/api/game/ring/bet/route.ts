import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MIN_BET = 10;
const MAX_BET = 500;
const VALID_SLOTS = [2, 3, 5];
const SLOT_PAYOUT: Record<number, number> = { 2: 2, 3: 3, 5: 5 };
const NUMBER_PAYOUT = 50;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { coinType, betAmount, betType, betValue } = await req.json();

    // Validate coin type
    if (coinType !== "SC" && coinType !== "MC") {
      return NextResponse.json({ error: "코인 종류가 올바르지 않습니다." }, { status: 400 });
    }

    // Validate bet amount
    if (typeof betAmount !== "number" || betAmount < MIN_BET || betAmount > MAX_BET || !Number.isInteger(betAmount)) {
      return NextResponse.json({ error: `베팅 금액은 ${MIN_BET}~${MAX_BET} 사이 정수여야 합니다.` }, { status: 400 });
    }

    // Validate bet type
    if (betType !== "SLOT" && betType !== "NUMBER") {
      return NextResponse.json({ error: "베팅 종류가 올바르지 않습니다." }, { status: 400 });
    }

    // Validate bet value
    if (betType === "SLOT" && !VALID_SLOTS.includes(betValue)) {
      return NextResponse.json({ error: "슬롯 값은 2, 3, 5 중 하나여야 합니다." }, { status: 400 });
    }
    if (betType === "NUMBER" && (typeof betValue !== "number" || betValue < 1 || betValue > 54 || !Number.isInteger(betValue))) {
      return NextResponse.json({ error: "숫자는 1~54 사이 정수여야 합니다." }, { status: 400 });
    }

    // Get current round from external API
    const ringRes = await fetch("https://result.nex2games.com/v1/ring/last_result", { cache: "no-store" });
    const ringData = await ringRes.json();
    if (!ringData?.success || !ringData.r) {
      return NextResponse.json({ error: "게임 서버 연결에 실패했습니다." }, { status: 502 });
    }

    const nextRound = ringData.r + 1; // Bet on the NEXT round

    // Check if user already has a pending bet on this round
    const existingBet = await prisma.ringBet.findFirst({
      where: { userId: session.user.id, round: nextRound, status: "PENDING" },
    });
    if (existingBet) {
      return NextResponse.json({ error: "이미 이번 라운드에 베팅했습니다. 결과를 기다려주세요." }, { status: 409 });
    }

    // Check balance
    const balance = await prisma.coinBalance.findUnique({
      where: { userId: session.user.id },
    });

    if (!balance) {
      return NextResponse.json({ error: "잔액 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const currentBalance = coinType === "SC" ? balance.scBalance : balance.mcBalance;
    if (currentBalance < betAmount) {
      return NextResponse.json({ error: `${coinType} 잔액이 부족합니다. (보유: ${currentBalance})` }, { status: 400 });
    }

    // Calculate potential payout
    const multiplier = betType === "SLOT" ? SLOT_PAYOUT[betValue] : NUMBER_PAYOUT;

    // Deduct balance and create bet in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct bet amount
      const updateData = coinType === "SC"
        ? { scBalance: { decrement: betAmount } }
        : { mcBalance: { decrement: betAmount } };

      const updatedBalance = await tx.coinBalance.update({
        where: { userId: session.user.id },
        data: updateData,
      });

      // Record transaction
      await tx.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType,
          amount: -betAmount,
          balanceAfter: coinType === "SC" ? updatedBalance.scBalance : updatedBalance.mcBalance,
          sourceType: "GAME",
          description: `1분링 베팅 R${nextRound} (${betType === "SLOT" ? `${betValue}배` : `#${betValue}`})`,
        },
      });

      // Create bet record
      const bet = await tx.ringBet.create({
        data: {
          userId: session.user.id,
          round: nextRound,
          coinType,
          betAmount,
          betType,
          betValue,
        },
      });

      return { bet, updatedBalance };
    });

    return NextResponse.json({
      betId: result.bet.id,
      round: nextRound,
      coinType,
      betAmount,
      betType,
      betValue,
      multiplier,
      potentialPayout: betAmount * multiplier,
      newBalance: coinType === "SC" ? result.updatedBalance.scBalance : result.updatedBalance.mcBalance,
    });
  } catch (error) {
    console.error("Ring bet error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

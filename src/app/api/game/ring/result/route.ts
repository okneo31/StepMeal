import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SLOT_PAYOUT: Record<number, number> = { 2: 2, 3: 3, 5: 5 };
const NUMBER_PAYOUT = 50;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get latest result from external API
    const ringRes = await fetch("https://result.nex2games.com/v1/ring/last_result", { cache: "no-store" });
    const ringData = await ringRes.json();
    if (!ringData?.success) {
      return NextResponse.json({ error: "게임 서버 연결 실패" }, { status: 502 });
    }

    const currentRound = ringData.r;
    const resultNum = ringData.num;
    const resultSlot = ringData.slot;

    // Find user's pending bets for this round (or earlier unsettled rounds)
    const pendingBets = await prisma.ringBet.findMany({
      where: {
        userId: session.user.id,
        status: "PENDING",
        round: { lte: currentRound },
      },
    });

    const settledBets: Array<{
      betId: string;
      round: number;
      betType: string;
      betValue: number;
      resultNum: number;
      resultSlot: number;
      won: boolean;
      payout: number;
    }> = [];

    if (pendingBets.length > 0) {
      // Get results for all pending rounds
      const resultsRes = await fetch("https://result.nex2games.com/v1/ring/last_10_results", { cache: "no-store" });
      const resultsData: Array<{ r: number; num: number; slot: number; success: boolean }> = await resultsRes.json();
      const resultsMap = new Map(resultsData.map(r => [r.r, r]));

      for (const bet of pendingBets) {
        // Find result for this bet's round
        let roundResult = bet.round === currentRound
          ? { num: resultNum, slot: resultSlot }
          : resultsMap.get(bet.round);

        if (!roundResult) continue; // Result not available yet

        const rNum = 'num' in roundResult ? roundResult.num : 0;
        const rSlot = 'slot' in roundResult ? roundResult.slot : 0;

        // Check if bet won
        let won = false;
        let payout = 0;

        if (bet.betType === "SLOT" && bet.betValue === rSlot) {
          won = true;
          payout = bet.betAmount * (SLOT_PAYOUT[rSlot] || 2);
        } else if (bet.betType === "NUMBER" && bet.betValue === rNum) {
          won = true;
          payout = bet.betAmount * NUMBER_PAYOUT;
        }

        // Sequential atomic operations
        await prisma.ringBet.update({
          where: { id: bet.id },
          data: {
            resultNum: rNum,
            resultSlot: rSlot,
            payout,
            status: won ? "WON" : "LOST",
          },
        });

        if (won && payout > 0) {
          const updateData = bet.coinType === "SC"
            ? { scBalance: { increment: payout }, scLifetime: { increment: payout } }
            : { mcBalance: { increment: payout }, mcLifetime: { increment: payout } };

          const updBalance = await prisma.coinBalance.update({
            where: { userId: session.user.id },
            data: updateData,
          });

          await prisma.coinTransaction.create({
            data: {
              userId: session.user.id,
              coinType: bet.coinType,
              amount: payout,
              balanceAfter: bet.coinType === "SC" ? updBalance.scBalance : updBalance.mcBalance,
              sourceType: "GAME",
              description: `1분링 당첨 R${bet.round} ${bet.betType === "SLOT" ? `${bet.betValue}배` : `#${bet.betValue}`} (x${bet.betType === "SLOT" ? SLOT_PAYOUT[rSlot] : NUMBER_PAYOUT})`,
            },
          });
        }

        settledBets.push({
          betId: bet.id,
          round: bet.round,
          betType: bet.betType,
          betValue: bet.betValue,
          resultNum: rNum,
          resultSlot: rSlot,
          won,
          payout,
        });
      }
    }

    // Get updated balance
    const balance = await prisma.coinBalance.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      currentRound,
      resultNum,
      resultSlot,
      settledBets,
      balance: {
        scBalance: balance?.scBalance || 0,
        mcBalance: balance?.mcBalance || 0,
      },
    });
  } catch (error) {
    console.error("Ring result error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

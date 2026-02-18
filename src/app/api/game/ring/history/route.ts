import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bets = await prisma.ringBet.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      bets: bets.map((b) => ({
        id: b.id,
        round: b.round,
        coinType: b.coinType,
        betAmount: b.betAmount,
        betType: b.betType,
        betValue: b.betValue,
        resultNum: b.resultNum,
        resultSlot: b.resultSlot,
        payout: b.payout,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Ring history error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

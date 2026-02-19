import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TARGETS = [
  { km: 1, multiplier: 1.5 },
  { km: 2, multiplier: 2 },
  { km: 3, multiplier: 3 },
  { km: 5, multiplier: 5 },
];
const BET_AMOUNTS = [50, 100, 200, 500];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  await prisma.gamePlay.updateMany({
    where: {
      userId: session.user.id,
      gameType: "PREDICTION",
      status: "PENDING",
      createdAt: { lt: today },
    },
    data: { status: "LOST", resolvedAt: new Date() },
  });

  const activePrediction = await prisma.gamePlay.findFirst({
    where: {
      userId: session.user.id,
      gameType: "PREDICTION",
      status: "PENDING",
      createdAt: { gte: today, lt: tomorrow },
    },
  });

  const movements = await prisma.movement.findMany({
    where: {
      userId: session.user.id,
      status: "COMPLETED",
      completedAt: { gte: today, lt: tomorrow },
    },
    select: { distanceM: true },
  });
  const todayDistanceM = movements.reduce((sum, m) => sum + m.distanceM, 0);

  const balance = await prisma.coinBalance.findUnique({
    where: { userId: session.user.id },
  });

  const todayPlayed = !activePrediction
    ? await prisma.gamePlay.findFirst({
        where: {
          userId: session.user.id,
          gameType: "PREDICTION",
          createdAt: { gte: today, lt: tomorrow },
        },
      })
    : null;

  const history = await prisma.gamePlay.findMany({
    where: {
      userId: session.user.id,
      gameType: "PREDICTION",
      status: { not: "PENDING" },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    alreadyPlayedToday: !!todayPlayed,
    activePrediction: activePrediction
      ? {
          id: activePrediction.id,
          targetKm: parseFloat(activePrediction.betChoice),
          multiplier: activePrediction.multiplier,
          betAmount: activePrediction.betAmount,
        }
      : null,
    todayDistanceM,
    scBalance: balance?.scBalance || 0,
    targets: TARGETS,
    betAmounts: BET_AMOUNTS,
    history: history.map((h) => ({
      id: h.id,
      targetKm: parseFloat(h.betChoice),
      betAmount: h.betAmount,
      payout: h.payout,
      status: h.status,
      createdAt: h.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { targetKm, betAmount } = await req.json();

    const target = TARGETS.find((t) => t.km === targetKm);
    if (!target) {
      return NextResponse.json({ error: "잘못된 목표 거리입니다." }, { status: 400 });
    }
    if (!BET_AMOUNTS.includes(betAmount)) {
      return NextResponse.json({ error: "잘못된 베팅 금액입니다." }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [existing, preBalance] = await Promise.all([
      prisma.gamePlay.findFirst({
        where: {
          userId: session.user.id,
          gameType: "PREDICTION",
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.coinBalance.findUnique({ where: { userId: session.user.id } }),
    ]);

    if (existing) {
      return NextResponse.json({ error: "이미 오늘의 예측을 사용했습니다." }, { status: 400 });
    }
    if (!preBalance || preBalance.scBalance < betAmount) {
      return NextResponse.json({ error: "SC가 부족합니다." }, { status: 400 });
    }

    // Sequential atomic operations
    const updatedBalance = await prisma.coinBalance.update({
      where: { userId: session.user.id },
      data: { scBalance: { decrement: betAmount } },
    });

    await prisma.coinTransaction.create({
      data: {
        userId: session.user.id,
        coinType: "SC",
        amount: -betAmount,
        balanceAfter: updatedBalance.scBalance,
        sourceType: "GAME",
        description: `걸음수 예측 베팅 (${targetKm}km)`,
      },
    });

    const play = await prisma.gamePlay.create({
      data: {
        userId: session.user.id,
        gameType: "PREDICTION",
        coinType: "SC",
        betAmount,
        betChoice: String(targetKm),
        multiplier: target.multiplier,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      prediction: {
        id: play.id,
        targetKm,
        multiplier: target.multiplier,
        betAmount,
      },
      scBalance: updatedBalance.scBalance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    const status = message === "SC가 부족합니다." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { predictionId } = await req.json();

    const prediction = await prisma.gamePlay.findFirst({
      where: {
        id: predictionId,
        userId: session.user.id,
        gameType: "PREDICTION",
        status: "PENDING",
      },
    });

    if (!prediction) {
      return NextResponse.json({ error: "활성 예측이 없습니다." }, { status: 400 });
    }

    const targetKm = parseFloat(prediction.betChoice);
    const pToday = new Date();
    pToday.setHours(0, 0, 0, 0);
    const pTomorrow = new Date(pToday);
    pTomorrow.setDate(pToday.getDate() + 1);

    const movements = await prisma.movement.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        completedAt: { gte: pToday, lt: pTomorrow },
      },
      select: { distanceM: true },
    });

    const todayDistanceM = movements.reduce((sum, m) => sum + m.distanceM, 0);
    const todayKm = todayDistanceM / 1000;

    if (todayKm < targetKm) {
      return NextResponse.json({ error: `목표까지 ${(targetKm - todayKm).toFixed(1)}km 남았습니다.` }, { status: 400 });
    }

    const payout = Math.floor(prediction.betAmount * (prediction.multiplier || 1));

    // Sequential atomic operations
    const updatedBalance = await prisma.coinBalance.update({
      where: { userId: session.user.id },
      data: {
        scBalance: { increment: payout },
        scLifetime: { increment: payout },
      },
    });

    await prisma.coinTransaction.create({
      data: {
        userId: session.user.id,
        coinType: "SC",
        amount: payout,
        balanceAfter: updatedBalance.scBalance,
        sourceType: "GAME",
        description: `걸음수 예측 달성! (${prediction.betAmount} × ${prediction.multiplier})`,
      },
    });

    await prisma.gamePlay.update({
      where: { id: prediction.id },
      data: {
        status: "WON",
        result: String(todayDistanceM),
        payout,
        resolvedAt: new Date(),
      },
    });

    return NextResponse.json({
      isWin: true,
      payout,
      todayKm: todayKm.toFixed(1),
      scBalance: updatedBalance.scBalance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

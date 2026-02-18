import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { haversineDistance } from "@/lib/geolocation";

const ARRIVAL_RADIUS_M = 50; // 50m radius for arrival verification
const QUEST_ARRIVAL_SC = 50; // Fixed SC reward for arriving at destination

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { questId, lat, lng } = await req.json();

    if (!questId || typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    const quest = await prisma.quest.findFirst({
      where: { id: questId, userId: session.user.id, status: "ACTIVE" },
    });

    if (!quest) {
      return NextResponse.json({ error: "퀘스트를 찾을 수 없습니다." }, { status: 404 });
    }

    // Check distance to destination
    const distanceM = haversineDistance(lat, lng, quest.destLat, quest.destLng);

    if (distanceM > ARRIVAL_RADIUS_M) {
      return NextResponse.json({
        arrived: false,
        distanceM: Math.round(distanceM),
        message: `목적지까지 ${Math.round(distanceM)}m 남았습니다.`,
      });
    }

    // Arrival verified - credit SC bonus in a transaction
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update quest status
      const updatedQuest = await tx.quest.update({
        where: { id: questId },
        data: {
          status: "ARRIVED",
          arrivedAt: now,
          bonusSc: QUEST_ARRIVAL_SC,
        },
      });

      // 2. Credit arrival SC
      const balance = await tx.coinBalance.update({
        where: { userId: session.user.id },
        data: {
          scBalance: { increment: QUEST_ARRIVAL_SC },
          scLifetime: { increment: QUEST_ARRIVAL_SC },
        },
      });

      // 3. Record transaction
      await tx.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "SC",
          amount: QUEST_ARRIVAL_SC,
          balanceAfter: balance.scBalance,
          sourceType: "MOVEMENT",
          description: `퀘스트 도착 보너스: ${quest.destName} (+${QUEST_ARRIVAL_SC} SC)`,
        },
      });

      // 4. Update daily earning
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      await tx.dailyEarning.upsert({
        where: {
          userId_earnDate: { userId: session.user.id, earnDate: today },
        },
        create: {
          userId: session.user.id,
          earnDate: today,
          scMovement: QUEST_ARRIVAL_SC,
        },
        update: {
          scMovement: { increment: QUEST_ARRIVAL_SC },
        },
      });

      return { updatedQuest, balance };
    });

    return NextResponse.json({
      arrived: true,
      distanceM: Math.round(distanceM),
      questId: result.updatedQuest.id,
      arrivalBonus: QUEST_ARRIVAL_SC,
      newScBalance: result.balance.scBalance,
      message: `목적지에 도착했습니다! +${QUEST_ARRIVAL_SC} SC`,
    });
  } catch (error) {
    console.error("Quest verify-arrival error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

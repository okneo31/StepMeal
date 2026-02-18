import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { haversineDistance } from "@/lib/geolocation";

const ARRIVAL_RADIUS_M = 50; // 50m radius for arrival verification

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

    // Arrival verified
    const now = new Date();
    const updatedQuest = await prisma.quest.update({
      where: { id: questId },
      data: {
        status: "ARRIVED",
        arrivedAt: now,
      },
    });

    return NextResponse.json({
      arrived: true,
      distanceM: Math.round(distanceM),
      questId: updatedQuest.id,
      message: "목적지에 도착했습니다!",
    });
  } catch (error) {
    console.error("Quest verify-arrival error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

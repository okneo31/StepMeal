import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { destName, destLat, destLng, destAddress } = await req.json();

    if (!destName || typeof destLat !== "number" || typeof destLng !== "number") {
      return NextResponse.json({ error: "목적지 정보가 올바르지 않습니다." }, { status: 400 });
    }

    // Check if user already has an active quest
    const activeQuest = await prisma.quest.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
    });

    if (activeQuest) {
      return NextResponse.json({
        error: "이미 진행 중인 퀘스트가 있습니다.",
        existingQuestId: activeQuest.id,
      }, { status: 409 });
    }

    const quest = await prisma.quest.create({
      data: {
        userId: session.user.id,
        destName: destName.trim(),
        destLat,
        destLng,
        destAddress: destAddress?.trim() || null,
      },
    });

    return NextResponse.json({
      questId: quest.id,
      destName: quest.destName,
      destLat: quest.destLat,
      destLng: quest.destLng,
    });
  } catch (error) {
    console.error("Quest start error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

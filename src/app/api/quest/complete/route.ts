import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { questId } = await req.json();

    if (!questId) {
      return NextResponse.json({ error: "questId가 필요합니다." }, { status: 400 });
    }

    const quest = await prisma.quest.findFirst({
      where: {
        id: questId,
        userId: session.user.id,
        status: "ARRIVED",
      },
    });

    if (!quest) {
      return NextResponse.json({ error: "퀘스트를 찾을 수 없습니다." }, { status: 404 });
    }

    await prisma.quest.update({
      where: { id: questId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quest complete error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

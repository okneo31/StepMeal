import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { CONDITION_RESTORE_PER_QR } from "@/lib/constants";

// POST: Feed character (restore condition via QR scan)
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const character = await prisma.character.findUnique({
      where: { userId: user.id },
    });

    if (!character) {
      return NextResponse.json({ error: "캐릭터를 찾을 수 없습니다." }, { status: 404 });
    }

    const newCondition = Math.min(character.maxCondition, character.condition + CONDITION_RESTORE_PER_QR);

    const updated = await prisma.character.update({
      where: { userId: user.id },
      data: { condition: newCondition },
    });

    return NextResponse.json({
      condition: updated.condition,
      maxCondition: updated.maxCondition,
      restored: newCondition - character.condition,
    });
  } catch (error) {
    console.error("Character feed error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

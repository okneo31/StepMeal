import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EXP_PER_LEVEL, STATS_PER_LEVEL } from "@/lib/constants";

// POST: Allocate stat points on level up
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { stat } = await req.json() as { stat: string };

    if (!["EFF", "LCK", "CHM", "HP"].includes(stat)) {
      return NextResponse.json({ error: "잘못된 스탯입니다." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const character = await tx.character.findUnique({
        where: { userId: session.user.id },
      });

      if (!character) {
        throw new Error("캐릭터를 찾을 수 없습니다.");
      }

      if (character.exp < character.expToNext) {
        throw new Error("경험치가 부족합니다.");
      }

      // Level up
      const newLevel = character.level + 1;
      const remainingExp = character.exp - character.expToNext;
      const newExpToNext = EXP_PER_LEVEL(newLevel);

      const statField = stat === "EFF" ? "statEff" : stat === "LCK" ? "statLck" : stat === "CHM" ? "statChm" : "statHp";

      const updated = await tx.character.update({
        where: { userId: session.user.id },
        data: {
          level: newLevel,
          exp: remainingExp,
          expToNext: newExpToNext,
          [statField]: { increment: STATS_PER_LEVEL },
        },
      });

      return updated;
    }, { timeout: 15000 });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

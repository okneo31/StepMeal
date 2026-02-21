import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch user character (auto-create if not exists)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let character = await prisma.character.findUnique({
      where: { userId: session.user.id },
    });

    if (!character) {
      character = await prisma.character.create({
        data: {
          userId: session.user.id,
          name: session.user.name || "나의 캐릭터",
        },
      });
    }

    return NextResponse.json(character);
  } catch (error: any) {
    console.error("Character error:", error);
    return NextResponse.json({ error: "서버 오류", detail: error?.message || String(error) }, { status: 500 });
  }
}

// PATCH: Update character name, avatar, class
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as {
      name?: string;
      avatarType?: string;
      mainClass?: string;
      subClass?: string | null;
    };

    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (name.length < 1 || name.length > 20) {
        return NextResponse.json({ error: "이름은 1~20자여야 합니다." }, { status: 400 });
      }
      data.name = name;
    }

    if (body.avatarType !== undefined) {
      data.avatarType = body.avatarType;
    }

    if (body.mainClass !== undefined) {
      if (!["BODY", "ECO", "RIDE"].includes(body.mainClass)) {
        return NextResponse.json({ error: "잘못된 클래스입니다." }, { status: 400 });
      }
      data.mainClass = body.mainClass;
    }

    if (body.subClass !== undefined) {
      if (body.subClass !== null && !["BODY", "ECO", "RIDE"].includes(body.subClass)) {
        return NextResponse.json({ error: "잘못된 서브 클래스입니다." }, { status: 400 });
      }
      if (body.subClass !== null) {
        const charForLevel = await prisma.character.findUnique({ where: { userId: session.user.id }, select: { level: true } });
        if (!charForLevel || charForLevel.level < 10) {
          return NextResponse.json({ error: "서브 클래스는 Lv.10 이상에서 해금됩니다." }, { status: 400 });
        }
      }
      data.subClass = body.subClass;
    }

    const character = await prisma.character.upsert({
      where: { userId: session.user.id },
      update: data,
      create: {
        userId: session.user.id,
        name: (data.name as string) || session.user.name || "나의 캐릭터",
        avatarType: (data.avatarType as string) || "DEFAULT",
        mainClass: (data.mainClass as string) || "BODY",
        subClass: data.subClass as string | undefined,
      },
    });

    return NextResponse.json(character);
  } catch (error) {
    console.error("Character update error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

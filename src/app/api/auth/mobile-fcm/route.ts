import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/mobile-auth";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { fcmToken, platform } = await req.json();

    if (!fcmToken || !platform) {
      return NextResponse.json(
        { error: "FCM 토큰과 플랫폼 정보가 필요합니다." },
        { status: 400 }
      );
    }

    if (!["ios", "android", "web"].includes(platform)) {
      return NextResponse.json(
        { error: "유효하지 않은 플랫폼입니다." },
        { status: 400 }
      );
    }

    // Upsert: update if fcmToken already exists, otherwise create
    await prisma.deviceToken.upsert({
      where: { fcmToken },
      update: {
        userId: user.id,
        platform,
      },
      create: {
        userId: user.id,
        fcmToken,
        platform,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FCM registration error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const history = await prisma.qrCode.findMany({
      where: { usedBy: session.user.id },
      orderBy: { usedAt: "desc" },
      select: {
        id: true,
        code: true,
        mcReward: true,
        description: true,
        usedAt: true,
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("QR history error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

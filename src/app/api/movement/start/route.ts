import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { transport, startLat, startLng } = await req.json();

    // Cancel any active movements
    await prisma.movement.updateMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });

    const movement = await prisma.movement.create({
      data: {
        userId: session.user.id,
        startLat: startLat || null,
        startLng: startLng || null,
        segments: JSON.stringify([{ transport, distance: 0, duration: 0, avgSpeed: 0, points: [] }]),
      },
    });

    return NextResponse.json({ id: movement.id });
  } catch (error) {
    console.error("Movement start error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

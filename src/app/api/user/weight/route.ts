import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { weight: true },
  });

  return NextResponse.json({ weight: user?.weight ?? 70 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { weight } = await req.json();

  if (typeof weight !== "number" || weight < 20 || weight > 300) {
    return NextResponse.json({ error: "체중은 20~300kg 사이로 입력해주세요." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { weight: Math.round(weight * 10) / 10 },
  });

  return NextResponse.json({ weight });
}

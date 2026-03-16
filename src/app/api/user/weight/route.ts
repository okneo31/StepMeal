import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { weight: true },
  });

  return NextResponse.json({ weight: dbUser?.weight ?? 70 });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { weight } = await req.json();

  if (typeof weight !== "number" || weight < 20 || weight > 300) {
    return NextResponse.json({ error: "체중은 20~300kg 사이로 입력해주세요." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { weight: Math.round(weight * 10) / 10 },
  });

  return NextResponse.json({ weight });
}

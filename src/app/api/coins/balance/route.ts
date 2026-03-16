import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const balance = await prisma.coinBalance.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json(balance || { scBalance: 0, mcBalance: 0, scLifetime: 0, mcLifetime: 0 });
}

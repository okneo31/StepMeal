import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const balance = await prisma.coinBalance.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(balance || { scBalance: 0, mcBalance: 0, scLifetime: 0, mcLifetime: 0 });
}

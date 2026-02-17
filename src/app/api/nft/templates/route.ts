import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const rarity = searchParams.get("rarity");
    const nftType = searchParams.get("type");

    const where: Record<string, unknown> = { isActive: true };
    if (rarity) {
      where.rarity = rarity;
    }
    if (nftType) {
      where.nftType = nftType;
    }

    const templates = await prisma.nftTemplate.findMany({
      where,
      orderBy: [{ nftType: "asc" }, { rarity: "asc" }, { priceMc: "asc" }],
    });

    // Parse JSON fields for frontend
    const parsed = templates.map(t => ({
      ...t,
      ability: t.ability ? (() => { try { return JSON.parse(t.ability); } catch { return null; } })() : null,
      matchedTransports: t.matchedTransports ? (() => { try { return JSON.parse(t.matchedTransports); } catch { return null; } })() : null,
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("NFT templates error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

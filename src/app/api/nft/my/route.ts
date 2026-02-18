import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ENHANCE_BONUS_PER_LEVEL, SET_BONUS } from "@/lib/constants";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const nfts = await prisma.userNft.findMany({
      where: { userId: session.user.id },
      include: {
        template: true,
      },
      orderBy: { mintedAt: "desc" },
    });

    // Parse JSON fields
    const parsed = nfts.map(nft => ({
      ...nft,
      template: {
        ...nft.template,
        ability: nft.template.ability ? (() => { try { return JSON.parse(nft.template.ability); } catch { return null; } })() : null,
        matchedTransports: nft.template.matchedTransports ? (() => { try { return JSON.parse(nft.template.matchedTransports); } catch { return null; } })() : null,
      },
    }));

    // Calculate equipped bonus (only equipped NFTs contribute)
    const equipped = parsed.filter(n => n.isEquipped);
    const equippedTypes = new Set(equipped.map(n => n.template.nftType));

    // Base SC bonus from equipped booster + enhance bonus
    let totalBonusPercent = 0;
    for (const nft of equipped) {
      totalBonusPercent += nft.template.scBonusPercent;
      totalBonusPercent += nft.enhanceLevel * ENHANCE_BONUS_PER_LEVEL;
    }

    // Set bonus
    if (equippedTypes.size >= 3) {
      totalBonusPercent += SET_BONUS.THREE_TYPES;
    } else if (equippedTypes.size >= 2) {
      totalBonusPercent += SET_BONUS.TWO_TYPES;
    }

    return NextResponse.json({
      nfts: parsed,
      totalBonusPercent,
      count: nfts.length,
      equippedCount: equipped.length,
      uniqueTypeCount: equippedTypes.size,
    });
  } catch (error: any) {
    console.error("My NFT error:", error);
    return NextResponse.json({ error: "서버 오류", detail: error?.message || String(error) }, { status: 500 });
  }
}

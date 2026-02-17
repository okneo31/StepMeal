import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const equipped = await prisma.userNft.findMany({
      where: {
        userId: session.user.id,
        isEquipped: true,
      },
      include: { template: true },
    });

    // Organize by slot
    const slots: Record<string, any> = {};
    for (const nft of equipped) {
      if (nft.equippedSlot) {
        slots[nft.equippedSlot] = {
          id: nft.id,
          templateId: nft.templateId,
          mintNumber: nft.mintNumber,
          enhanceLevel: nft.enhanceLevel,
          equippedSlot: nft.equippedSlot,
          template: nft.template,
        };
      }
    }

    // Count unique NFT types equipped for set bonus
    const equippedTypes = new Set(equipped.map(n => n.template.nftType));
    const typeCount = equippedTypes.size;

    return NextResponse.json({
      slots,
      equippedCount: equipped.length,
      uniqueTypeCount: typeCount,
    });
  } catch (error) {
    console.error("Equipped NFT error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

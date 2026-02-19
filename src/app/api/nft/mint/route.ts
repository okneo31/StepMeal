import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { templateId } = await req.json() as { templateId: string };

    if (!templateId) {
      return NextResponse.json({ error: "템플릿 ID가 필요합니다." }, { status: 400 });
    }

    // Sequential atomic operations (no interactive transaction for PgBouncer compatibility)
    const template = await prisma.nftTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isActive) {
      throw new Error("NFT를 찾을 수 없습니다.");
    }

    // Check supply
    if (template.maxSupply !== -1 && template.mintedCount >= template.maxSupply) {
      throw new Error("재고가 소진되었습니다.");
    }

    // Check MC balance
    const mintBalance = await prisma.coinBalance.findUnique({
      where: { userId: session.user.id },
    });

    if (!mintBalance || mintBalance.mcBalance < template.priceMc) {
      throw new Error(`MC가 부족합니다. (필요: ${template.priceMc} MC, 보유: ${mintBalance?.mcBalance || 0} MC)`);
    }

    // Increment minted count
    const updatedTemplate = await prisma.nftTemplate.update({
      where: { id: templateId },
      data: { mintedCount: { increment: 1 } },
    });

    // Create UserNft
    const mintedNft = await prisma.userNft.create({
      data: {
        userId: session.user.id,
        templateId,
        mintNumber: updatedTemplate.mintedCount,
      },
    });

    // Deduct MC
    const updatedMintBalance = await prisma.coinBalance.update({
      where: { userId: session.user.id },
      data: {
        mcBalance: { decrement: template.priceMc },
      },
    });

    // Transaction record
    await prisma.coinTransaction.create({
      data: {
        userId: session.user.id,
        coinType: "MC",
        amount: -template.priceMc,
        balanceAfter: updatedMintBalance.mcBalance,
        sourceType: "NFT_MINT",
        description: `NFT 민팅: ${template.name} #${updatedTemplate.mintedCount}`,
      },
    });

    return NextResponse.json({
      success: true,
      nft: {
        id: mintedNft.id,
        mintNumber: mintedNft.mintNumber,
        templateName: updatedTemplate.name,
        imageEmoji: updatedTemplate.imageEmoji,
        rarity: updatedTemplate.rarity,
      },
      newMcBalance: updatedMintBalance.mcBalance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    const status = message.includes("찾을 수 없") ? 404
      : message.includes("소진") ? 409
      : message.includes("부족") ? 402
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

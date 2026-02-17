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

    const result = await prisma.$transaction(async (tx) => {
      // Get template with lock-like read
      const template = await tx.nftTemplate.findUnique({
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
      const balance = await tx.coinBalance.findUnique({
        where: { userId: session.user.id },
      });

      if (!balance || balance.mcBalance < template.priceMc) {
        throw new Error(`MC가 부족합니다. (필요: ${template.priceMc} MC, 보유: ${balance?.mcBalance || 0} MC)`);
      }

      // Increment minted count
      const updatedTemplate = await tx.nftTemplate.update({
        where: { id: templateId },
        data: { mintedCount: { increment: 1 } },
      });

      // Create UserNft
      const nft = await tx.userNft.create({
        data: {
          userId: session.user.id,
          templateId,
          mintNumber: updatedTemplate.mintedCount,
        },
      });

      // Deduct MC
      const updatedBalance = await tx.coinBalance.update({
        where: { userId: session.user.id },
        data: {
          mcBalance: { decrement: template.priceMc },
        },
      });

      // Transaction record
      await tx.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "MC",
          amount: -template.priceMc,
          balanceAfter: updatedBalance.mcBalance,
          sourceType: "NFT_MINT",
          description: `NFT 민팅: ${template.name} #${updatedTemplate.mintedCount}`,
        },
      });

      return { nft, template: updatedTemplate, newMcBalance: updatedBalance.mcBalance };
    });

    return NextResponse.json({
      success: true,
      nft: {
        id: result.nft.id,
        mintNumber: result.nft.mintNumber,
        templateName: result.template.name,
        imageEmoji: result.template.imageEmoji,
        rarity: result.template.rarity,
      },
      newMcBalance: result.newMcBalance,
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

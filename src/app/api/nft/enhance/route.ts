import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ENHANCE_RATES } from "@/lib/constants";

const ENHANCE_COST_MC = [50, 100, 200, 400, 800]; // MC cost per level

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { nftId } = await req.json() as { nftId: string };

    if (!nftId) {
      return NextResponse.json({ error: "NFT ID가 필요합니다." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const nft = await tx.userNft.findUnique({
        where: { id: nftId },
        include: { template: true },
      });

      if (!nft || nft.userId !== session.user.id) {
        throw new Error("NFT를 찾을 수 없습니다.");
      }

      if (nft.enhanceLevel >= 5) {
        throw new Error("이미 최대 강화 단계입니다.");
      }

      const nextLevel = nft.enhanceLevel; // 0-indexed for cost/rate arrays
      const cost = ENHANCE_COST_MC[nextLevel];
      const successRate = ENHANCE_RATES[nextLevel];

      // Check MC balance
      const balance = await tx.coinBalance.findUnique({
        where: { userId: session.user.id },
      });

      if (!balance || balance.mcBalance < cost) {
        throw new Error(`MC가 부족합니다. (필요: ${cost} MC)`);
      }

      // Deduct MC
      const updatedBalance = await tx.coinBalance.update({
        where: { userId: session.user.id },
        data: { mcBalance: { decrement: cost } },
      });

      // Record transaction
      await tx.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "MC",
          amount: -cost,
          balanceAfter: updatedBalance.mcBalance,
          sourceType: "NFT_MINT",
          sourceId: nftId,
          description: `NFT 강화 시도: ${nft.template.name} +${nft.enhanceLevel} → +${nft.enhanceLevel + 1}`,
        },
      });

      // Roll for success
      const roll = Math.random();
      const success = roll < successRate;

      let updatedNft = nft;
      if (success) {
        updatedNft = await tx.userNft.update({
          where: { id: nftId },
          data: { enhanceLevel: { increment: 1 } },
          include: { template: true },
        });
      }

      return {
        success,
        nft: updatedNft,
        cost,
        successRate: Math.round(successRate * 100),
        newMcBalance: updatedBalance.mcBalance,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

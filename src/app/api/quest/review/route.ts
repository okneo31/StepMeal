import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const QUEST_ARRIVAL_BONUS_RATE = 0.20; // 20% of movement SC
const QUEST_REVIEW_BONUS_RATE = 0.10; // additional 10% for review

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { questId, comment, rating, photoUrl } = await req.json();

    if (!questId) {
      return NextResponse.json({ error: "퀘스트 ID가 필요합니다." }, { status: 400 });
    }

    if (rating !== undefined && (typeof rating !== "number" || rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "평점은 1~5 사이여야 합니다." }, { status: 400 });
    }

    const quest = await prisma.quest.findFirst({
      where: { id: questId, userId: session.user.id, status: "ARRIVED" },
    });

    if (!quest) {
      return NextResponse.json({ error: "도착 인증된 퀘스트를 찾을 수 없습니다." }, { status: 404 });
    }

    // Check if review already exists
    const existingReview = await prisma.questReview.findUnique({
      where: { questId },
    });

    if (existingReview) {
      return NextResponse.json({ error: "이미 리뷰가 작성되었습니다." }, { status: 409 });
    }

    // Calculate bonuses based on the linked movement's totalSc
    let movementSc = 0;
    if (quest.movementId) {
      const movement = await prisma.movement.findUnique({
        where: { id: quest.movementId },
        select: { totalSc: true },
      });
      movementSc = movement?.totalSc || 0;
    }

    const arrivalBonus = Math.floor(movementSc * QUEST_ARRIVAL_BONUS_RATE);
    const reviewBonus = Math.floor(movementSc * QUEST_REVIEW_BONUS_RATE);
    const totalBonus = arrivalBonus + reviewBonus;

    const result = await prisma.$transaction(async (tx) => {
      // Create review
      const review = await tx.questReview.create({
        data: {
          questId,
          userId: session.user.id,
          photoUrl: photoUrl || null,
          comment: comment?.trim() || null,
          rating: rating || null,
          bonusSc: reviewBonus,
        },
      });

      // Update quest to completed
      await tx.quest.update({
        where: { id: questId },
        data: {
          status: "COMPLETED",
          bonusSc: totalBonus,
          completedAt: new Date(),
        },
      });

      // Credit bonus SC
      if (totalBonus > 0) {
        const balance = await tx.coinBalance.update({
          where: { userId: session.user.id },
          data: {
            scBalance: { increment: totalBonus },
            scLifetime: { increment: totalBonus },
          },
        });

        await tx.coinTransaction.create({
          data: {
            userId: session.user.id,
            coinType: "SC",
            amount: totalBonus,
            balanceAfter: balance.scBalance,
            sourceType: "MOVEMENT",
            description: `퀘스트 완료 보너스: ${quest.destName} (+${totalBonus} SC)`,
          },
        });

        return { review, balance };
      }

      return { review, balance: null };
    });

    return NextResponse.json({
      reviewId: result.review.id,
      arrivalBonus,
      reviewBonus,
      totalBonus,
    });
  } catch (error) {
    console.error("Quest review error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const QUEST_REVIEW_SC = 20; // Fixed SC reward for writing a review

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

    const arrivalBonus = quest.bonusSc || 0; // Already credited on arrival
    const reviewBonus = QUEST_REVIEW_SC;
    const totalBonus = arrivalBonus + reviewBonus;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create review
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

      // 2. Update quest to completed
      await tx.quest.update({
        where: { id: questId },
        data: {
          status: "COMPLETED",
          bonusSc: totalBonus,
          completedAt: new Date(),
        },
      });

      // 3. Credit review SC bonus
      const balance = await tx.coinBalance.update({
        where: { userId: session.user.id },
        data: {
          scBalance: { increment: reviewBonus },
          scLifetime: { increment: reviewBonus },
        },
      });

      await tx.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "SC",
          amount: reviewBonus,
          balanceAfter: balance.scBalance,
          sourceType: "MOVEMENT",
          description: `퀘스트 리뷰 보너스: ${quest.destName} (+${reviewBonus} SC)`,
        },
      });

      // 4. Update daily earning
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      await tx.dailyEarning.upsert({
        where: {
          userId_earnDate: { userId: session.user.id, earnDate: todayStart },
        },
        create: {
          userId: session.user.id,
          earnDate: todayStart,
          scMovement: reviewBonus,
        },
        update: {
          scMovement: { increment: reviewBonus },
        },
      });

      return { review, balance };
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

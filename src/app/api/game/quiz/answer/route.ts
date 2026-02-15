import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUIZ_MC_REWARD, QUIZ_DAILY_LIMIT } from "@/lib/constants";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { questionId, selectedIndex } = await req.json();

    if (!questionId || selectedIndex === undefined || selectedIndex === null) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttempts = await prisma.quizAttempt.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    if (todayAttempts >= QUIZ_DAILY_LIMIT) {
      return NextResponse.json({ error: "오늘의 퀴즈 횟수를 모두 사용했습니다." }, { status: 400 });
    }

    // Check if already attempted this question today
    const alreadyAttempted = await prisma.quizAttempt.findFirst({
      where: {
        userId: session.user.id,
        questionId,
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    if (alreadyAttempted) {
      return NextResponse.json({ error: "이미 이 문제를 풀었습니다." }, { status: 400 });
    }

    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ error: "문제를 찾을 수 없습니다." }, { status: 404 });
    }

    const isCorrect = selectedIndex === question.correctIndex;
    const mcEarned = isCorrect ? QUIZ_MC_REWARD : 0;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Record attempt
      await tx.quizAttempt.create({
        data: {
          userId: session.user.id,
          questionId,
          selectedIndex,
          isCorrect,
          mcEarned,
        },
      });

      // 2. Award MC if correct
      let balance = await tx.coinBalance.findUnique({
        where: { userId: session.user.id },
      });

      if (isCorrect && balance) {
        balance = await tx.coinBalance.update({
          where: { userId: session.user.id },
          data: {
            mcBalance: { increment: mcEarned },
            mcLifetime: { increment: mcEarned },
          },
        });

        await tx.coinTransaction.create({
          data: {
            userId: session.user.id,
            coinType: "MC",
            amount: mcEarned,
            balanceAfter: balance.mcBalance,
            sourceType: "GAME",
            description: `데일리 퀴즈 정답 보상`,
          },
        });

        // Update daily earning
        const earnDate = new Date(today);
        await tx.dailyEarning.upsert({
          where: {
            userId_earnDate: { userId: session.user.id, earnDate },
          },
          create: {
            userId: session.user.id,
            earnDate,
            mcGame: mcEarned,
          },
          update: {
            mcGame: { increment: mcEarned },
          },
        });
      }

      return { balance };
    });

    return NextResponse.json({
      isCorrect,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      mcEarned,
      remainingAttempts: QUIZ_DAILY_LIMIT - todayAttempts - 1,
      newMcBalance: result.balance?.mcBalance || 0,
    });
  } catch (error) {
    console.error("Quiz answer error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

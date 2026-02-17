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

    // Validate selectedIndex is a non-negative integer
    if (typeof selectedIndex !== 'number' || selectedIndex < 0 || !Number.isInteger(selectedIndex)) {
      return NextResponse.json({ error: "잘못된 답변 인덱스입니다." }, { status: 400 });
    }

    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ error: "문제를 찾을 수 없습니다." }, { status: 404 });
    }

    // Validate selectedIndex is within options bounds
    let options: string[];
    try {
      options = JSON.parse(question.options);
    } catch {
      return NextResponse.json({ error: "문제 데이터가 손상되었습니다." }, { status: 500 });
    }

    if (selectedIndex >= options.length) {
      return NextResponse.json({ error: "잘못된 답변 인덱스입니다." }, { status: 400 });
    }

    const isCorrect = selectedIndex === question.correctIndex;
    const mcEarned = isCorrect ? QUIZ_MC_REWARD : 0;

    const result = await prisma.$transaction(async (tx) => {
      // Check daily limit INSIDE transaction
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAttempts = await tx.quizAttempt.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      if (todayAttempts >= QUIZ_DAILY_LIMIT) {
        throw new Error("LIMIT:오늘의 퀴즈 횟수를 모두 사용했습니다.");
      }

      // Check if already attempted this question today
      const alreadyAttempted = await tx.quizAttempt.findFirst({
        where: {
          userId: session.user.id,
          questionId,
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      if (alreadyAttempted) {
        throw new Error("LIMIT:이미 이 문제를 풀었습니다.");
      }

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
        await tx.dailyEarning.upsert({
          where: {
            userId_earnDate: { userId: session.user.id, earnDate: today },
          },
          create: {
            userId: session.user.id,
            earnDate: today,
            mcGame: mcEarned,
          },
          update: {
            mcGame: { increment: mcEarned },
          },
        });
      }

      return { balance, todayAttempts };
    });

    return NextResponse.json({
      isCorrect,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      mcEarned,
      remainingAttempts: QUIZ_DAILY_LIMIT - result.todayAttempts - 1,
      newMcBalance: result.balance?.mcBalance || 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    if (message.startsWith("LIMIT:")) {
      return NextResponse.json({ error: message.slice(6) }, { status: 400 });
    }
    console.error("Quiz answer error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

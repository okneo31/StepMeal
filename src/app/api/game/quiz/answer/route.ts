import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { QUIZ_MC_REWARD, QUIZ_DAILY_LIMIT } from "@/lib/constants";
import { getKSTToday, getKSTTomorrow } from "@/lib/kst";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { questionId, selectedIndex } = await req.json();

    if (!questionId || selectedIndex === undefined || selectedIndex === null) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    if (typeof selectedIndex !== 'number' || selectedIndex < 0 || !Number.isInteger(selectedIndex)) {
      return NextResponse.json({ error: "잘못된 답변 인덱스입니다." }, { status: 400 });
    }

    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ error: "문제를 찾을 수 없습니다." }, { status: 404 });
    }

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

    const today = getKSTToday();
    const tomorrow = getKSTTomorrow();

    const [preAttempts, preAlready] = await Promise.all([
      prisma.quizAttempt.count({
        where: {
          userId: user.id,
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.quizAttempt.findFirst({
        where: {
          userId: user.id,
          questionId,
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    if (preAttempts >= QUIZ_DAILY_LIMIT) {
      return NextResponse.json({ error: "오늘의 퀴즈 횟수를 모두 사용했습니다." }, { status: 400 });
    }
    if (preAlready) {
      return NextResponse.json({ error: "이미 이 문제를 풀었습니다." }, { status: 400 });
    }

    // Sequential atomic operations (no interactive transaction)
    await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        questionId,
        selectedIndex,
        isCorrect,
        mcEarned,
      },
    });

    let balance = await prisma.coinBalance.findUnique({
      where: { userId: user.id },
    });

    if (isCorrect && balance) {
      balance = await prisma.coinBalance.update({
        where: { userId: user.id },
        data: {
          mcBalance: { increment: mcEarned },
          mcLifetime: { increment: mcEarned },
        },
      });

      await prisma.coinTransaction.create({
        data: {
          userId: user.id,
          coinType: "MC",
          amount: mcEarned,
          balanceAfter: balance.mcBalance,
          sourceType: "GAME",
          description: `데일리 퀴즈 정답 보상`,
        },
      });

      await prisma.dailyEarning.upsert({
        where: {
          userId_earnDate: { userId: user.id, earnDate: today },
        },
        create: {
          userId: user.id,
          earnDate: today,
          mcGame: mcEarned,
        },
        update: {
          mcGame: { increment: mcEarned },
        },
      });
    }

    return NextResponse.json({
      isCorrect,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      mcEarned,
      remainingAttempts: QUIZ_DAILY_LIMIT - preAttempts - 1,
      newMcBalance: balance?.mcBalance || 0,
    });
  } catch (error) {
    console.error("Quiz answer error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

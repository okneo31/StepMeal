import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUIZ_DAILY_LIMIT } from "@/lib/constants";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({
      exhausted: true,
      remainingAttempts: 0,
      message: "오늘의 퀴즈를 모두 풀었습니다.",
    });
  }

  // Get questions already attempted today
  const todayAttemptedIds = await prisma.quizAttempt.findMany({
    where: {
      userId: session.user.id,
      createdAt: { gte: today, lt: tomorrow },
    },
    select: { questionId: true },
  });
  const attemptedIds = todayAttemptedIds.map((a) => a.questionId);

  // Pick a random question not yet attempted today
  const availableQuestions = await prisma.quizQuestion.findMany({
    where: {
      isActive: true,
      id: { notIn: attemptedIds.length > 0 ? attemptedIds : undefined },
    },
  });

  if (availableQuestions.length === 0) {
    return NextResponse.json({
      exhausted: true,
      remainingAttempts: 0,
      message: "사용 가능한 퀴즈 문제가 없습니다.",
    });
  }

  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  const question = availableQuestions[randomIndex];

  return NextResponse.json({
    exhausted: false,
    remainingAttempts: QUIZ_DAILY_LIMIT - todayAttempts,
    question: {
      id: question.id,
      question: question.question,
      options: (() => { try { return JSON.parse(question.options); } catch { return []; } })(),
      category: question.category,
    },
  });
}

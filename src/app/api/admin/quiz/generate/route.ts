import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { openai } from "@/lib/openai";

const CATEGORIES = ["HEALTH", "NUTRITION", "FITNESS", "WELLNESS"];

const SYSTEM_PROMPT = `You are a health & fitness quiz generator for a Korean Move-to-Earn app called StepMeal.
Generate quiz questions about health, nutrition, fitness, and wellness topics.
All questions and answers MUST be in Korean (한국어).
Each question must have exactly 4 options with exactly 1 correct answer.
Include a brief explanation (1-2 sentences) for the correct answer.
Assign a category from: HEALTH, NUTRITION, FITNESS, WELLNESS.

Respond ONLY with a JSON array of objects with this exact structure:
[
  {
    "question": "질문 내용",
    "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
    "correctIndex": 0,
    "explanation": "정답 설명",
    "category": "HEALTH"
  }
]`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const count = Math.min(Math.max(Number(body.count) || 10, 1), 30);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `건강, 영양, 피트니스, 웰니스 관련 퀴즈 ${count}개를 생성해주세요. 다양한 주제와 난이도로 만들어주세요.` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
      max_tokens: 4000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "AI 응답이 비어있습니다." }, { status: 500 });
    }

    const parsed = JSON.parse(raw);
    const questions: any[] = Array.isArray(parsed) ? parsed : parsed.questions || parsed.quiz || [];

    // Validate and filter
    const valid = questions.filter((q) => {
      if (!q.question || typeof q.question !== "string") return false;
      if (!Array.isArray(q.options) || q.options.length !== 4) return false;
      if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex > 3) return false;
      return true;
    });

    if (valid.length === 0) {
      return NextResponse.json({ error: "유효한 퀴즈가 생성되지 않았습니다.", raw }, { status: 500 });
    }

    // Bulk insert
    const created = await prisma.quizQuestion.createMany({
      data: valid.map((q) => ({
        question: q.question,
        options: JSON.stringify(q.options),
        correctIndex: q.correctIndex,
        explanation: q.explanation || null,
        category: CATEGORIES.includes(q.category) ? q.category : "HEALTH",
        isActive: true,
      })),
    });

    return NextResponse.json({
      success: true,
      generated: created.count,
      failed: questions.length - valid.length,
      total: questions.length,
    });
  } catch (error: any) {
    console.error("AI Quiz generation error:", error);
    return NextResponse.json(
      { error: "퀴즈 생성 실패", detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}

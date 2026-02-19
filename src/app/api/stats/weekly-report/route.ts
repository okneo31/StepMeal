import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";
import { startOfWeek, endOfWeek, format, subDays } from "date-fns";
import { ko } from "date-fns/locale";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Collect 7 days of data
    const [dailyEarnings, movements, stride, character, weeklyChallenge] = await Promise.all([
      prisma.dailyEarning.findMany({
        where: {
          userId: session.user.id,
          earnDate: { gte: weekStart, lte: weekEnd },
        },
        orderBy: { earnDate: "asc" },
      }),
      prisma.movement.findMany({
        where: {
          userId: session.user.id,
          status: "COMPLETED",
          completedAt: { gte: weekStart, lte: weekEnd },
        },
        select: {
          distanceM: true,
          durationSec: true,
          calories: true,
          totalSc: true,
          transportClass: true,
          segments: true,
          completedAt: true,
        },
      }),
      prisma.stride.findUnique({ where: { userId: session.user.id } }),
      prisma.character.findUnique({ where: { userId: session.user.id } }),
      prisma.weeklyChallenge.findFirst({
        where: { userId: session.user.id, weekStart },
      }),
    ]);

    // Aggregate stats
    const totalDistance = movements.reduce((s, m) => s + m.distanceM, 0);
    const totalDuration = movements.reduce((s, m) => s + m.durationSec, 0);
    const totalCalories = Math.round(movements.reduce((s, m) => s + m.calories, 0));
    const totalSc = dailyEarnings.reduce((s, e) => s + e.scMovement, 0);
    const totalMc = dailyEarnings.reduce((s, e) => s + e.mcQr + e.mcGame, 0);
    const activeDays = dailyEarnings.filter((e) => e.strideActive).length;
    const moveCount = movements.length;

    // Transport distribution
    const transportDist: Record<string, number> = {};
    for (const m of movements) {
      const cls = m.transportClass || "UNKNOWN";
      transportDist[cls] = (transportDist[cls] || 0) + m.distanceM;
    }

    // Daily breakdown
    const dailyBreakdown = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayLabel = format(date, "E", { locale: ko });
      const earning = dailyEarnings.find(
        (e) => format(e.earnDate, "yyyy-MM-dd") === dateStr
      );
      dailyBreakdown.push({
        date: dateStr,
        day: dayLabel,
        distanceM: earning?.distanceM || 0,
        sc: earning?.scMovement || 0,
        active: earning?.strideActive || false,
      });
    }

    // Find best day
    const bestDay = dailyBreakdown.reduce(
      (best, d) => (d.distanceM > best.distanceM ? d : best),
      dailyBreakdown[0]
    );

    // Build GPT prompt data
    const userData = {
      nickname: session.user.name || "사용자",
      level: character?.level || 1,
      mainClass: character?.mainClass || "BODY",
      currentStreak: stride?.currentStreak || 0,
      weekSummary: {
        totalDistanceKm: (totalDistance / 1000).toFixed(1),
        totalMoves: moveCount,
        activeDays,
        totalSc,
        totalMc,
        totalCalories,
        totalDurationMin: Math.round(totalDuration / 60),
        transportDistribution: Object.entries(transportDist).map(
          ([cls, dist]) => `${cls}: ${(dist / 1000).toFixed(1)}km`
        ),
        bestDay: bestDay ? `${bestDay.date}(${bestDay.day}) - ${(bestDay.distanceM / 1000).toFixed(1)}km` : "없음",
        dailyBreakdown: dailyBreakdown.map(
          (d) => `${d.date}(${d.day}): ${(d.distanceM / 1000).toFixed(1)}km, ${d.sc}SC${d.active ? " [활동]" : ""}`
        ),
      },
      weeklyChallenge: weeklyChallenge
        ? {
            totalDistanceKm: (weeklyChallenge.totalDistanceM / 1000).toFixed(1),
            moveCount: weeklyChallenge.moveCount,
            bronzeClaimed: weeklyChallenge.bronzeClaimed,
            silverClaimed: weeklyChallenge.silverClaimed,
            goldClaimed: weeklyChallenge.goldClaimed,
          }
        : null,
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 StepMeal 앱의 AI 운동 코치입니다. 사용자의 주간 활동 데이터를 분석하여 개인화된 한국어 리포트를 작성합니다.
리포트는 아래 4개 섹션으로 구성하세요. 각 섹션은 ### 헤더로 시작합니다.
따뜻하고 동기부여가 되는 톤으로 작성하세요. 구체적인 수치를 인용하세요.

### 이번 주 총평
(전반적인 활동 요약, 2-3문장)

### 잘한 점
(구체적으로 잘한 것 2-3가지, 격려)

### 개선할 점
(부드러운 조언 1-2가지)

### 다음 주 목표
(실천 가능한 구체적 목표 2-3가지)`,
        },
        {
          role: "user",
          content: `다음 주간 활동 데이터를 분석해주세요:\n${JSON.stringify(userData, null, 2)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const report = completion.choices[0]?.message?.content || "리포트를 생성할 수 없습니다.";

    return NextResponse.json({
      report,
      generatedAt: now.toISOString(),
      meta: {
        weekStart: format(weekStart, "yyyy-MM-dd"),
        weekEnd: format(weekEnd, "yyyy-MM-dd"),
        totalDistanceKm: (totalDistance / 1000).toFixed(1),
        activeDays,
        moveCount,
        totalSc,
        totalCalories,
      },
    });
  } catch (error: any) {
    console.error("Weekly report error:", error);
    return NextResponse.json(
      { error: "리포트 생성 실패", detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}

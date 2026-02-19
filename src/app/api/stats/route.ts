import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, format } from "date-fns";
import { getKSTToday, getKSTMonday } from "@/lib/kst";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
  const now = new Date();
  const weekStart = getKSTMonday();
  const thirtyDaysAgo = subDays(now, 30);

  const todayStart = getKSTToday();

  const [weeklyEarnings, monthlyMovements, todayEarning, todayMovements] = await Promise.all([
    prisma.dailyEarning.findMany({
      where: {
        userId: session.user.id,
        earnDate: { gte: weekStart },
      },
      orderBy: { earnDate: "asc" },
    }),
    prisma.movement.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        completedAt: { gte: thirtyDaysAgo },
      },
      select: {
        distanceM: true,
        durationSec: true,
        calories: true,
        totalSc: true,
        completedAt: true,
      },
    }),
    prisma.dailyEarning.findFirst({
      where: {
        userId: session.user.id,
        earnDate: { gte: todayStart },
      },
    }),
    prisma.movement.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        completedAt: { gte: todayStart },
      },
      select: {
        distanceM: true,
        durationSec: true,
        calories: true,
        totalSc: true,
      },
    }),
  ]);

  // Weekly stats
  const weeklyDistance = weeklyEarnings.reduce((sum, e) => sum + e.distanceM, 0);
  const weeklySc = weeklyEarnings.reduce((sum, e) => sum + e.scMovement, 0);
  const weeklyDays = weeklyEarnings.filter((e) => e.strideActive).length;

  // Monthly stats
  const monthlyDistance = monthlyMovements.reduce((sum, m) => sum + m.distanceM, 0);
  const monthlySc = monthlyMovements.reduce((sum, m) => sum + m.totalSc, 0);
  const monthlyCalories = monthlyMovements.reduce((sum, m) => sum + m.calories, 0);

  // Daily chart data (last 7 days)
  const dailyChart = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(now, i);
    const dayStr = format(date, "MM/dd");
    const earning = weeklyEarnings.find(
      (e) => format(e.earnDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
    dailyChart.push({
      date: dayStr,
      distance: earning?.distanceM || 0,
      sc: earning?.scMovement || 0,
    });
  }

  // Today's stats from actual movements
  const todayCalories = Math.round(todayMovements.reduce((sum, m) => sum + m.calories, 0));
  const todayDuration = todayMovements.reduce((sum, m) => sum + m.durationSec, 0);
  const todaySc = todayMovements.reduce((sum, m) => sum + m.totalSc, 0);

  return NextResponse.json({
    today: {
      distanceM: todayEarning?.distanceM || 0,
      scMovement: todaySc,
      scEarned: todaySc + (todayEarning?.scSocial || 0) + (todayEarning?.scChallenge || 0) + (todayEarning?.scCheckin || 0),
      calories: todayCalories,
      durationSec: todayDuration,
    },
    weekly: {
      distance: weeklyDistance,
      sc: weeklySc,
      activeDays: weeklyDays,
    },
    monthly: {
      distance: monthlyDistance,
      sc: monthlySc,
      calories: Math.round(monthlyCalories),
      movementCount: monthlyMovements.length,
    },
    dailyChart,
  });
  } catch (error: any) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "서버 오류", detail: error?.message || String(error) }, { status: 500 });
  }
}

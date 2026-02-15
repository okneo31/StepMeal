import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfWeek, subDays, format } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thirtyDaysAgo = subDays(now, 30);

  const [weeklyEarnings, monthlyMovements, todayEarning] = await Promise.all([
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
        earnDate: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
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

  return NextResponse.json({
    today: {
      distanceM: todayEarning?.distanceM || 0,
      scEarned: (todayEarning?.scMovement || 0) + (todayEarning?.scSocial || 0) + (todayEarning?.scChallenge || 0) + (todayEarning?.scCheckin || 0),
      calories: 0,
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
}

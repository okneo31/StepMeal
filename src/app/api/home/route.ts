import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStrideInfo, getDaysUntilNextStride } from "@/lib/stride-engine";
import { ENHANCE_BONUS_PER_LEVEL, SET_BONUS } from "@/lib/constants";
import { subDays, format } from "date-fns";
import { getKSTToday, getKSTMonday } from "@/lib/kst";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const now = new Date();
    const todayStart = getKSTToday();
    const weekStart = getKSTMonday();
    const thirtyDaysAgo = subDays(now, 30);

    // Single parallel query batch - uses ONE connection
    const [
      balance,
      stride,
      todayEarning,
      todayMovements,
      weeklyEarnings,
      monthlyMovements,
      nfts,
      character,
    ] = await Promise.all([
      prisma.coinBalance.findUnique({ where: { userId } }),
      prisma.stride.findUnique({ where: { userId } }),
      prisma.dailyEarning.findFirst({
        where: { userId, earnDate: { gte: todayStart } },
      }),
      prisma.movement.findMany({
        where: { userId, status: "COMPLETED", completedAt: { gte: todayStart } },
        select: { distanceM: true, durationSec: true, calories: true, totalSc: true },
      }),
      prisma.dailyEarning.findMany({
        where: { userId, earnDate: { gte: weekStart } },
        orderBy: { earnDate: "asc" },
      }),
      prisma.movement.findMany({
        where: { userId, status: "COMPLETED", completedAt: { gte: thirtyDaysAgo } },
        select: { distanceM: true, durationSec: true, calories: true, totalSc: true, completedAt: true },
      }),
      prisma.userNft.findMany({
        where: { userId },
        include: { template: true },
        orderBy: { mintedAt: "desc" },
      }),
      prisma.character.findUnique({ where: { userId } }),
    ]);

    // === Balance ===
    const balanceData = balance || { scBalance: 0, mcBalance: 0, scLifetime: 0, mcLifetime: 0 };

    // === Stride ===
    const strideLevel = stride?.strideLevel || 0;
    const strideInfo = getStrideInfo(strideLevel);
    const strideData = {
      ...strideInfo,
      currentStreak: stride?.currentStreak || 0,
      longestStreak: stride?.longestStreak || 0,
      shieldCount: stride?.shieldCount || 0,
      totalDistance: stride?.totalDistance || 0,
      lastActive: stride?.lastActive || null,
      daysUntilNext: getDaysUntilNextStride(stride?.currentStreak || 0, strideLevel),
    };

    // === Stats ===
    const todayCalories = Math.round(todayMovements.reduce((sum, m) => sum + m.calories, 0));
    const todayDuration = todayMovements.reduce((sum, m) => sum + m.durationSec, 0);
    const todaySc = todayMovements.reduce((sum, m) => sum + m.totalSc, 0);

    const weeklyDistance = weeklyEarnings.reduce((sum, e) => sum + e.distanceM, 0);
    const weeklySc = weeklyEarnings.reduce((sum, e) => sum + e.scMovement, 0);
    const weeklyDays = weeklyEarnings.filter((e) => e.strideActive).length;

    const monthlyDistance = monthlyMovements.reduce((sum, m) => sum + m.distanceM, 0);
    const monthlySc = monthlyMovements.reduce((sum, m) => sum + m.totalSc, 0);
    const monthlyCalories = monthlyMovements.reduce((sum, m) => sum + m.calories, 0);

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

    const statsData = {
      today: {
        distanceM: todayEarning?.distanceM || 0,
        scMovement: todaySc,
        calories: todayCalories,
        durationSec: todayDuration,
      },
      weekly: { distance: weeklyDistance, sc: weeklySc, activeDays: weeklyDays },
      monthly: { distance: monthlyDistance, sc: monthlySc, calories: Math.round(monthlyCalories), movementCount: monthlyMovements.length },
      dailyChart,
    };

    // === NFT bonus ===
    const equipped = nfts.filter((n) => n.isEquipped);
    const equippedTypes = new Set(equipped.map((n) => n.template.nftType));
    let totalBonusPercent = 0;
    for (const nft of equipped) {
      totalBonusPercent += nft.template.scBonusPercent;
      totalBonusPercent += nft.enhanceLevel * ENHANCE_BONUS_PER_LEVEL;
    }
    if (equippedTypes.size >= 3) totalBonusPercent += SET_BONUS.THREE_TYPES;
    else if (equippedTypes.size >= 2) totalBonusPercent += SET_BONUS.TWO_TYPES;

    // === Character (auto-create if missing) ===
    let charData = character;
    if (!charData) {
      charData = await prisma.character.create({
        data: { userId, name: session.user.name || "나의 캐릭터" },
      });
    }

    return NextResponse.json({
      balance: balanceData,
      stride: strideData,
      stats: statsData,
      nftBonus: totalBonusPercent,
      character: charData,
    });
  } catch (error: any) {
    console.error("Home API error:", error);
    return NextResponse.json({ error: "서버 오류", detail: error?.message || String(error) }, { status: 500 });
  }
}

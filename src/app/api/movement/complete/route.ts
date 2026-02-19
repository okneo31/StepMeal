import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMovementSc, getMultiModalBonus, getMultiClassCount, getTimeSlot, estimateCalories } from "@/lib/sc-calculator";
import { calculateStrideUpdate } from "@/lib/stride-engine";
import { TRANSPORT_CONFIG, STRIDE_TABLE, MIN_DAILY_DISTANCE } from "@/lib/constants";
import { MILESTONES, DURATION_MILESTONES } from "@/lib/missions";
import { updateProgress } from "@/lib/progress";
import type { MovementSegment, WeatherType, TransportType } from "@/types";

const MAX_NFT_BONUS_PERCENT = 100;
const VALID_TRANSPORTS = new Set(Object.keys(TRANSPORT_CONFIG));
const VALID_WEATHERS = new Set(['CLEAR','CLOUDY','RAIN','SNOW','HEAVY_RAIN','HEAVY_SNOW','EXTREME_HEAT','EXTREME_COLD']);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { movementId, segments, weather = "CLEAR" } = await req.json() as {
      movementId: string;
      segments: MovementSegment[];
      weather?: WeatherType;
    };

    if (!movementId || !segments || !Array.isArray(segments) || segments.length === 0) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    // Validate weather
    if (!VALID_WEATHERS.has(weather)) {
      return NextResponse.json({ error: "잘못된 날씨 정보입니다." }, { status: 400 });
    }

    // Validate segments
    for (const seg of segments) {
      if (!seg.transport || !VALID_TRANSPORTS.has(seg.transport)) {
        return NextResponse.json({ error: `잘못된 이동수단: ${seg.transport}` }, { status: 400 });
      }
      if (typeof seg.distance !== 'number' || seg.distance < 0) {
        return NextResponse.json({ error: "잘못된 거리 데이터입니다." }, { status: 400 });
      }
      if (typeof seg.duration !== 'number' || seg.duration < 0) {
        return NextResponse.json({ error: "잘못된 시간 데이터입니다." }, { status: 400 });
      }
    }

    // Verify movement belongs to user
    const movement = await prisma.movement.findFirst({
      where: { id: movementId, userId: session.user.id, status: "ACTIVE" },
    });

    if (!movement) {
      return NextResponse.json({ error: "이동을 찾을 수 없습니다." }, { status: 404 });
    }

    // Get user stride info
    const stride = await prisma.stride.findUnique({
      where: { userId: session.user.id },
    });
    const strideLevel = stride?.strideLevel || 0;

    // Get NFT bonus
    const userNfts = await prisma.userNft.findMany({
      where: { userId: session.user.id },
      include: { template: { select: { scBonusPercent: true } } },
    });
    const nftBonusPercent = Math.min(
      userNfts.reduce((sum, nft) => sum + nft.template.scBonusPercent, 0),
      MAX_NFT_BONUS_PERCENT,
    );

    // Check for active booster
    const now = new Date();
    const activeBooster = await prisma.activeBooster.findFirst({
      where: { userId: session.user.id, expiresAt: { gt: now } },
      orderBy: { activatedAt: "desc" },
    });
    const boosterMult = activeBooster?.multiplier || 1.0;

    // Calculate SC
    const scBreakdown = calculateMovementSc(segments, strideLevel, weather, now, nftBonusPercent);

    // Apply booster multiplier
    if (boosterMult > 1.0) {
      scBreakdown.totalSc = Math.floor(scBreakdown.totalSc * boosterMult);
    }

    // Calculate totals
    const totalDistance = segments.reduce((sum, s) => sum + s.distance, 0);
    const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);
    const lastPoint = segments[segments.length - 1]?.points?.slice(-1)[0];

    // Determine transport class
    const classes = new Set(segments.map(s => TRANSPORT_CONFIG[s.transport].class));
    const transportClass = classes.size > 1 ? "MULTI" : Array.from(classes)[0];
    const isMulti = classes.size > 1;

    // Calculate calories
    const totalCalories = segments.reduce((sum, s) => {
      return sum + estimateCalories(s.distance / 1000, s.transport);
    }, 0);

    // Sequential atomic operations (no interactive transaction for PgBouncer compatibility)
    // 1. Complete movement
    await prisma.movement.update({
      where: { id: movementId },
      data: {
        status: "COMPLETED",
        endLat: lastPoint?.lat || null,
        endLng: lastPoint?.lng || null,
        distanceM: totalDistance,
        durationSec: totalDuration,
        segments: JSON.stringify(segments),
        transportClass,
        isMulti,
        multiClassCount: getMultiClassCount(segments),
        weather,
        timeSlot: getTimeSlot(now),
        calories: totalCalories,
        baseSc: scBreakdown.baseSc,
        transportMult: scBreakdown.transportMult,
        strideMult: scBreakdown.strideMult,
        timeMult: scBreakdown.timeMult,
        weatherMult: scBreakdown.weatherMult,
        multiMult: scBreakdown.multiMult,
        bonusSc: scBreakdown.bonusSc,
        totalSc: scBreakdown.totalSc,
        completedAt: now,
      },
    });

    // 2. Update coin balance
    const balance = await prisma.coinBalance.update({
      where: { userId: session.user.id },
      data: {
        scBalance: { increment: scBreakdown.totalSc },
        scLifetime: { increment: scBreakdown.totalSc },
      },
    });

    // 3. Create transaction record
    await prisma.coinTransaction.create({
      data: {
        userId: session.user.id,
        coinType: "SC",
        amount: scBreakdown.totalSc,
        balanceAfter: balance.scBalance,
        sourceType: "MOVEMENT",
        sourceId: movementId,
        description: `이동 완료 (${(totalDistance / 1000).toFixed(1)}km)`,
        multipliers: JSON.stringify(scBreakdown),
      },
    });

    // 4. Update daily earning
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    await prisma.dailyEarning.upsert({
      where: {
        userId_earnDate: { userId: session.user.id, earnDate: todayDate },
      },
      create: {
        userId: session.user.id,
        earnDate: todayDate,
        scMovement: scBreakdown.totalSc,
        distanceM: totalDistance,
        strideActive: totalDistance >= MIN_DAILY_DISTANCE,
      },
      update: {
        scMovement: { increment: scBreakdown.totalSc },
        distanceM: { increment: totalDistance },
        strideActive: true,
      },
    });

    // 5. Update stride
    const strideUpdate = calculateStrideUpdate(
      stride?.currentStreak || 0,
      stride?.strideLevel || 0,
      stride?.shieldCount || 0,
      (stride?.totalDistance || 0) + totalDistance,
      0, // no days missed when completing a movement
    );

    await prisma.stride.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        currentStreak: strideUpdate.newStreak,
        strideLevel: strideUpdate.newLevel,
        strideMultiplier: STRIDE_TABLE[Math.max(0, Math.min(strideUpdate.newLevel, STRIDE_TABLE.length - 1))].multiplier,
        longestStreak: Math.max(0, strideUpdate.newStreak),
        lastActive: now,
        shieldCount: strideUpdate.newShieldCount,
        totalDistance: totalDistance,
      },
      update: {
        currentStreak: strideUpdate.newStreak,
        strideLevel: strideUpdate.newLevel,
        strideMultiplier: STRIDE_TABLE[Math.max(0, Math.min(strideUpdate.newLevel, STRIDE_TABLE.length - 1))].multiplier,
        longestStreak: Math.max(stride?.longestStreak || 0, strideUpdate.newStreak),
        lastActive: now,
        shieldCount: strideUpdate.newShieldCount,
        totalDistance: { increment: totalDistance },
      },
    });

    // ─── Milestone Bonuses ───
    let milestoneBonusSc = 0;
    const earnedMilestones: string[] = [];

    for (const ms of MILESTONES) {
      if (totalDistance >= ms.distanceM) {
        milestoneBonusSc += ms.bonusSc;
        earnedMilestones.push(ms.label);
      }
    }
    for (const ms of DURATION_MILESTONES) {
      if (totalDuration >= ms.durationSec) {
        milestoneBonusSc += ms.bonusSc;
        earnedMilestones.push(ms.label);
      }
    }

    let finalBalance = balance.scBalance;
    if (milestoneBonusSc > 0) {
      const bal = await prisma.coinBalance.update({
        where: { userId: session.user.id },
        data: { scBalance: { increment: milestoneBonusSc }, scLifetime: { increment: milestoneBonusSc } },
      });
      finalBalance = bal.scBalance;
      await prisma.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "SC",
          amount: milestoneBonusSc,
          balanceAfter: finalBalance,
          sourceType: "CHALLENGE",
          description: `마일스톤 보너스: ${earnedMilestones.join(", ")}`,
        },
      });
    }

    // ─── Update Progress (missions, achievements, weekly) ───
    const walkDistanceM = segments
      .filter((s) => s.transport === "WALK" || s.transport === "RUN")
      .reduce((sum, s) => sum + s.distance, 0);

    await updateProgress(session.user.id, {
      type: "MOVEMENT_COMPLETE",
      distanceM: totalDistance,
      isMulti,
      walkDistanceM,
    }).catch((e) => console.error("Progress update error:", e));

    return NextResponse.json({
      movementId,
      totalDistance,
      totalDuration,
      calories: totalCalories,
      sc: scBreakdown,
      boosterMult: boosterMult > 1.0 ? boosterMult : undefined,
      newBalance: finalBalance,
      milestones: earnedMilestones.length > 0 ? { bonusSc: milestoneBonusSc, labels: earnedMilestones } : undefined,
    });
  } catch (error) {
    console.error("Movement complete error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMovementSc, getMultiModalBonus, getMultiClassCount, getTimeSlot, estimateCalories } from "@/lib/sc-calculator";
import { calculateStrideUpdate } from "@/lib/stride-engine";
import { TRANSPORT_CONFIG, STRIDE_TABLE, MIN_DAILY_DISTANCE, ENHANCE_BONUS_PER_LEVEL, SET_BONUS, CONDITION_DECAY_PER_MOVE, CONDITION_SC_MULTIPLIER, VEHICLE_SYNERGY, CHARACTER_CLASSES } from "@/lib/constants";
import { getKSTToday } from "@/lib/kst";
import { MILESTONES, DURATION_MILESTONES } from "@/lib/missions";
import { updateProgress } from "@/lib/progress";
import type { MovementSegment, WeatherType, TransportType } from "@/types";
import { grantExp, EXP_REWARDS } from "@/lib/exp";
import { getWeather } from "@/lib/weather";

const MAX_NFT_BONUS_PERCENT = 2000;
const VALID_TRANSPORTS = new Set(Object.keys(TRANSPORT_CONFIG));
const VALID_WEATHERS = new Set(['CLEAR','CLOUDY','RAIN','SNOW','HEAVY_RAIN','HEAVY_SNOW','EXTREME_HEAT','EXTREME_COLD']);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { movementId, segments, weather: clientWeather } = await req.json() as {
      movementId: string;
      segments: MovementSegment[];
      weather?: string;
    };

    if (!movementId || !segments || !Array.isArray(segments) || segments.length === 0) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    // Validate client weather if provided
    if (clientWeather && !VALID_WEATHERS.has(clientWeather)) {
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

    // Resolve weather: client value > server auto-lookup > fallback CLEAR
    let weather: WeatherType = "CLEAR";
    if (clientWeather && VALID_WEATHERS.has(clientWeather)) {
      weather = clientWeather as WeatherType;
    } else if (movement.startLat && movement.startLng) {
      weather = await getWeather(movement.startLat, movement.startLng);
    }

    // Get user stride info
    const stride = await prisma.stride.findUnique({
      where: { userId: session.user.id },
    });
    const strideLevel = stride?.strideLevel || 0;

    // Get NFT bonus (only EQUIPPED NFTs contribute)
    const equippedNfts = await prisma.userNft.findMany({
      where: { userId: session.user.id, isEquipped: true },
      include: { template: { select: { scBonusPercent: true, nftType: true, matchedTransports: true, synergyPercent: true, transportClass: true } } },
    });
    let nftBonusPercent = 0;
    for (const nft of equippedNfts) {
      nftBonusPercent += nft.template.scBonusPercent;
      nftBonusPercent += nft.enhanceLevel * ENHANCE_BONUS_PER_LEVEL;
    }
    // Set bonus for equipping multiple NFT types
    const equippedTypes = new Set(equippedNfts.map(n => n.template.nftType));
    if (equippedTypes.size >= 3) nftBonusPercent += SET_BONUS.THREE_TYPES;
    else if (equippedTypes.size >= 2) nftBonusPercent += SET_BONUS.TWO_TYPES;
    nftBonusPercent = Math.min(nftBonusPercent, MAX_NFT_BONUS_PERCENT);

    // Vehicle synergy bonus
    const usedTransports = new Set<string>(segments.map(s => s.transport));
    const usedClasses = new Set<string>(segments.map(s => TRANSPORT_CONFIG[s.transport].class));
    let synergyPercent = 0;
    const vehicleNft = equippedNfts.find(n => n.template.nftType === "VEHICLE");
    if (vehicleNft && vehicleNft.template.synergyPercent > 0) {
      const matched: string[] = vehicleNft.template.matchedTransports
        ? (() => { try { return JSON.parse(vehicleNft.template.matchedTransports as string); } catch { return []; } })()
        : [];
      const hasMatchedTransport = matched.some(t => usedTransports.has(t));
      const hasMatchedClass = vehicleNft.template.transportClass && usedClasses.has(vehicleNft.template.transportClass);

      if (hasMatchedTransport) {
        synergyPercent = Math.floor(vehicleNft.template.synergyPercent * VEHICLE_SYNERGY.MATCHED);
      } else if (hasMatchedClass) {
        synergyPercent = Math.floor(vehicleNft.template.synergyPercent * VEHICLE_SYNERGY.SAME_CLASS);
      } else {
        synergyPercent = Math.floor(vehicleNft.template.synergyPercent * VEHICLE_SYNERGY.OTHER_CLASS);
      }
    }

    // Character: condition, stats, class
    const character = await prisma.character.findUnique({
      where: { userId: session.user.id },
      select: { condition: true, maxCondition: true, statEff: true, statLck: true, statHp: true, mainClass: true, subClass: true },
    });
    const conditionMult = CONDITION_SC_MULTIPLIER(character?.condition ?? 100);
    const effStat = character?.statEff ?? 10;
    const lckStat = character?.statLck ?? 5;
    const hpStat = character?.statHp ?? 10;

    // Class bonus: check if transport matches main/sub class
    const usedClassesArr = Array.from(usedClasses);
    const mainClassTransports: string[] = character?.mainClass ? ([...(CHARACTER_CLASSES[character.mainClass as keyof typeof CHARACTER_CLASSES]?.transports || [])]) : [];
    const subClassTransports: string[] = character?.subClass ? ([...(CHARACTER_CLASSES[character.subClass as keyof typeof CHARACTER_CLASSES]?.transports || [])]) : [];
    const usedTransportArr = segments.map(s => s.transport);
    const mainMatch = usedTransportArr.some(t => mainClassTransports.includes(t));
    const subMatch = usedTransportArr.some(t => subClassTransports.includes(t));
    const classPercent = mainMatch ? 15 : subMatch ? 8 : 0;

    // Check for active booster
    const now = new Date();
    const activeBooster = await prisma.activeBooster.findFirst({
      where: { userId: session.user.id, expiresAt: { gt: now } },
      orderBy: { activatedAt: "desc" },
    });
    const boosterMult = activeBooster?.multiplier || 1.0;

    // Calculate SC
    const scBreakdown = calculateMovementSc(segments, strideLevel, weather, now, nftBonusPercent, synergyPercent, conditionMult, effStat, classPercent, lckStat);

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
        nftMult: scBreakdown.nftMult,
        synergyMult: scBreakdown.synergyMult,
        conditionMult: scBreakdown.conditionMult,
        effMult: scBreakdown.effMult,
        classMult: scBreakdown.classMult,
        luckBonusSc: scBreakdown.luckBonusSc,
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
    const todayDate = getKSTToday();
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

    // 6. Decay character condition (HP stat reduces decay)
    if (character) {
      const condDecay = Math.max(1, CONDITION_DECAY_PER_MOVE - Math.floor(hpStat / 10));
      const newCondition = Math.max(0, (character.condition ?? 100) - condDecay);
      await prisma.character.update({
        where: { userId: session.user.id },
        data: { condition: newCondition, lastCondDecay: now },
      });
    }

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

    // ─── Grant EXP ───
    const expAmount = Math.floor((totalDistance / 1000) * EXP_REWARDS.MOVEMENT_PER_KM);
    await grantExp(session.user.id, expAmount).catch((e) => console.error("EXP grant error:", e));

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

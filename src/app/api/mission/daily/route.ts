import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDailyMissions, ALL_CLEAR_BASE_SC, STREAK_BONUS_SC } from "@/lib/missions";
import { updateProgress } from "@/lib/progress";

// GET: today's missions (auto-generate if not exist)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check existing
  let missions = await prisma.dailyMission.findMany({
    where: { userId: session.user.id, missionDate: today },
    orderBy: { slot: "asc" },
  });

  // Generate if none
  if (missions.length === 0) {
    const defs = generateDailyMissions(session.user.id, today);
    await prisma.dailyMission.createMany({
      data: defs.map((d, i) => ({
        userId: session.user.id,
        missionDate: today,
        slot: i + 1,
        missionType: d.type,
        description: d.description,
        targetValue: d.targetValue,
        rewardSc: d.rewardSc,
        rewardMc: d.rewardMc,
      })),
    });
    missions = await prisma.dailyMission.findMany({
      where: { userId: session.user.id, missionDate: today },
      orderBy: { slot: "asc" },
    });
  }

  // Check consecutive all-clear streak
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  let streak = 0;
  let checkDate = new Date(yesterday);
  for (let i = 0; i < 30; i++) {
    const claimed = await prisma.dailyMission.count({
      where: { userId: session.user.id, missionDate: checkDate, status: "CLAIMED" },
    });
    if (claimed >= 3) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const allCleared = missions.every((m) => m.status === "CLAIMED");
  const allCompleted = missions.every((m) => m.status === "COMPLETED" || m.status === "CLAIMED");
  const allClearBonus = ALL_CLEAR_BASE_SC + streak * STREAK_BONUS_SC;

  return NextResponse.json({
    missions: missions.map((m) => ({
      id: m.id,
      slot: m.slot,
      missionType: m.missionType,
      description: m.description,
      targetValue: m.targetValue,
      currentValue: m.currentValue,
      rewardSc: m.rewardSc,
      rewardMc: m.rewardMc,
      status: m.status,
    })),
    allCompleted,
    allCleared,
    allClearBonus,
    streak,
  });
}

// PATCH: claim mission reward or all-clear bonus
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { missionId, claimAllClear } = await req.json();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (claimAllClear) {
      // Claim all-clear bonus
      const missions = await prisma.dailyMission.findMany({
        where: { userId: session.user.id, missionDate: today },
      });
      if (!missions.every((m) => m.status === "CLAIMED")) {
        return NextResponse.json({ error: "모든 미션을 먼저 완료하세요." }, { status: 400 });
      }

      // Calculate streak
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      let streak = 0;
      let checkDate = new Date(yesterday);
      for (let i = 0; i < 30; i++) {
        const claimed = await prisma.dailyMission.count({
          where: { userId: session.user.id, missionDate: checkDate, status: "CLAIMED" },
        });
        if (claimed >= 3) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else break;
      }

      const bonus = ALL_CLEAR_BASE_SC + streak * STREAK_BONUS_SC;

      const balance = await prisma.coinBalance.update({
        where: { userId: session.user.id },
        data: { scBalance: { increment: bonus }, scLifetime: { increment: bonus } },
      });

      await prisma.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "SC",
          amount: bonus,
          balanceAfter: balance.scBalance,
          sourceType: "CHALLENGE",
          description: `데일리 미션 올클리어 (${streak + 1}일 연속)`,
        },
      });

      await updateProgress(session.user.id, { type: "DAILY_ALL_CLEAR" });

      return NextResponse.json({ bonus, streak: streak + 1, scBalance: balance.scBalance });
    }

    // Claim single mission
    const mission = await prisma.dailyMission.findFirst({
      where: { id: missionId, userId: session.user.id, status: "COMPLETED" },
    });
    if (!mission) {
      return NextResponse.json({ error: "수령 가능한 미션이 아닙니다." }, { status: 400 });
    }

    // Sequential atomic operations (no interactive transaction for PgBouncer compatibility)
    await prisma.dailyMission.update({
      where: { id: mission.id },
      data: { status: "CLAIMED" },
    });

    let missionScBal = 0;
    let missionMcBal = 0;

    if (mission.rewardSc > 0) {
      const b = await prisma.coinBalance.update({
        where: { userId: session.user.id },
        data: { scBalance: { increment: mission.rewardSc }, scLifetime: { increment: mission.rewardSc } },
      });
      missionScBal = b.scBalance;
      missionMcBal = b.mcBalance;
      await prisma.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "SC",
          amount: mission.rewardSc,
          balanceAfter: b.scBalance,
          sourceType: "CHALLENGE",
          description: `데일리 미션: ${mission.description}`,
        },
      });
    }
    if (mission.rewardMc > 0) {
      const b = await prisma.coinBalance.update({
        where: { userId: session.user.id },
        data: { mcBalance: { increment: mission.rewardMc }, mcLifetime: { increment: mission.rewardMc } },
      });
      missionScBal = b.scBalance;
      missionMcBal = b.mcBalance;
      await prisma.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "MC",
          amount: mission.rewardMc,
          balanceAfter: b.mcBalance,
          sourceType: "CHALLENGE",
          description: `데일리 미션: ${mission.description}`,
        },
      });
    }

    return NextResponse.json({ scBalance: missionScBal, mcBalance: missionMcBal, rewardSc: mission.rewardSc, rewardMc: mission.rewardMc });
  } catch (error) {
    console.error("Mission claim error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

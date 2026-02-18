import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS, getMonday, generateDailyMissions } from "@/lib/missions";

type EventType =
  | { type: "MOVEMENT_COMPLETE"; distanceM: number; isMulti: boolean; walkDistanceM: number }
  | { type: "QUEST_COMPLETE" }
  | { type: "GAME_PLAY" }
  | { type: "COURSE_COMPLETE" }
  | { type: "DAILY_ALL_CLEAR" };

export async function updateProgress(userId: string, event: EventType) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // ─── 1. Update Daily Missions ───
  try {
    // Auto-generate missions if not yet created for today
    const existingCount = await prisma.dailyMission.count({
      where: { userId, missionDate: today },
    });
    if (existingCount === 0) {
      const defs = generateDailyMissions(userId, today);
      await prisma.dailyMission.createMany({
        data: defs.map((d, i) => ({
          userId,
          missionDate: today,
          slot: i + 1,
          missionType: d.type,
          description: d.description,
          targetValue: d.targetValue,
          rewardSc: d.rewardSc,
          rewardMc: d.rewardMc,
        })),
      });
    }

    const missions = await prisma.dailyMission.findMany({
      where: { userId, missionDate: today, status: "ACTIVE" },
    });

    for (const mission of missions) {
      let increment = 0;

      if (event.type === "MOVEMENT_COMPLETE") {
        if (mission.missionType === "WALK_DIST") increment = event.walkDistanceM;
        if (mission.missionType === "TOTAL_DIST") increment = event.distanceM;
        if (mission.missionType === "MOVE_COUNT") increment = 1;
      }
      if (event.type === "QUEST_COMPLETE" && mission.missionType === "QUEST_COMPLETE") increment = 1;
      if (event.type === "GAME_PLAY" && mission.missionType === "GAME_PLAY") increment = 1;

      if (increment > 0) {
        const newValue = Math.min(mission.currentValue + increment, mission.targetValue);
        await prisma.dailyMission.update({
          where: { id: mission.id },
          data: {
            currentValue: newValue,
            status: newValue >= mission.targetValue ? "COMPLETED" : "ACTIVE",
          },
        });
      }
    }
  } catch (e) {
    console.error("Mission update error:", e);
  }

  // ─── 2. Update Weekly Challenge ───
  if (event.type === "MOVEMENT_COMPLETE") {
    try {
      const weekStart = getMonday(today);
      await prisma.weeklyChallenge.upsert({
        where: { userId_weekStart: { userId, weekStart } },
        create: {
          userId,
          weekStart,
          totalDistanceM: event.distanceM,
          moveCount: 1,
        },
        update: {
          totalDistanceM: { increment: event.distanceM },
          moveCount: { increment: 1 },
        },
      });
    } catch (e) {
      console.error("Weekly challenge update error:", e);
    }
  }

  // ─── 3. Update Achievements ───
  try {
    const stride = await prisma.stride.findUnique({ where: { userId } });

    for (const ach of ACHIEVEMENTS) {
      let currentProgress = 0;

      switch (ach.category) {
        case "DISTANCE":
          currentProgress = stride?.totalDistance || 0;
          break;
        case "STREAK":
          currentProgress = stride?.currentStreak || 0;
          break;
        case "QUEST":
          if (event.type === "QUEST_COMPLETE" || ach.code.startsWith("QUEST_")) {
            currentProgress = await prisma.quest.count({
              where: { userId, status: "COMPLETED" },
            });
          }
          break;
        case "GAME":
          if (event.type === "GAME_PLAY" || ach.code.startsWith("GAME_")) {
            currentProgress = await prisma.gamePlay.count({
              where: { userId, status: { not: "PENDING" } },
            }) + await prisma.roulettePlay.count({ where: { userId } }) + await prisma.quizAttempt.count({ where: { userId } });
          }
          break;
        case "SPECIAL":
          if (ach.code === "MULTI_FIRST" && event.type === "MOVEMENT_COMPLETE" && event.isMulti) {
            currentProgress = 1;
          }
          if (ach.code === "COURSE_1" && event.type === "COURSE_COMPLETE") {
            currentProgress = await prisma.courseAttempt.count({
              where: { userId, status: "COMPLETED" },
            });
          }
          if (ach.code === "ALL_CLEAR_7" && event.type === "DAILY_ALL_CLEAR") {
            // Count days where all 3 missions were claimed
            const allClears = await prisma.dailyMission.groupBy({
              by: ["missionDate"],
              where: { userId, status: "CLAIMED" },
              _count: { id: true },
              having: { id: { _count: { gte: 3 } } },
            });
            currentProgress = allClears.length;
          }
          break;
      }

      if (currentProgress > 0) {
        await prisma.userAchievement.upsert({
          where: { userId_achievementCode: { userId, achievementCode: ach.code } },
          create: {
            userId,
            achievementCode: ach.code,
            progress: Math.min(currentProgress, ach.targetValue),
            completed: currentProgress >= ach.targetValue,
            completedAt: currentProgress >= ach.targetValue ? new Date() : null,
          },
          update: {
            progress: Math.min(currentProgress, ach.targetValue),
            completed: currentProgress >= ach.targetValue,
            completedAt: currentProgress >= ach.targetValue ? new Date() : undefined,
          },
        });
      }
    }
  } catch (e) {
    console.error("Achievement update error:", e);
  }
}

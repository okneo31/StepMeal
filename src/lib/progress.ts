import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS, getMonday, generateDailyMissions } from "@/lib/missions";

type EventType =
  | { type: "MOVEMENT_COMPLETE"; distanceM: number; isMulti: boolean; walkDistanceM: number }
  | { type: "QUEST_COMPLETE" }
  | { type: "GAME_PLAY" }
  | { type: "COURSE_COMPLETE" }
  | { type: "DAILY_ALL_CLEAR" };

// Map event types to relevant achievement categories
const EVENT_ACHIEVEMENT_MAP: Record<string, Set<string>> = {
  MOVEMENT_COMPLETE: new Set(["DISTANCE", "STREAK", "SPECIAL"]),
  QUEST_COMPLETE: new Set(["QUEST"]),
  GAME_PLAY: new Set(["GAME"]),
  COURSE_COMPLETE: new Set(["SPECIAL"]),
  DAILY_ALL_CLEAR: new Set(["SPECIAL"]),
};

export async function updateProgress(userId: string, event: EventType) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ─── 1. Update Daily Missions ───
  try {
    // Batch: check existing + fetch active missions in parallel
    const [existingCount, missions] = await Promise.all([
      prisma.dailyMission.count({ where: { userId, missionDate: today } }),
      prisma.dailyMission.findMany({ where: { userId, missionDate: today, status: "ACTIVE" } }),
    ]);

    if (existingCount === 0 && missions.length === 0) {
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
      // Re-fetch newly created missions
      const newMissions = await prisma.dailyMission.findMany({
        where: { userId, missionDate: today, status: "ACTIVE" },
      });
      await updateMissions(newMissions, event);
    } else {
      await updateMissions(missions, event);
    }
  } catch (e) {
    console.error("Mission update error:", e);
  }

  // ─── 2. Update Weekly Challenge (MOVEMENT_COMPLETE only) ───
  if (event.type === "MOVEMENT_COMPLETE") {
    try {
      const weekStart = getMonday(today);
      await prisma.weeklyChallenge.upsert({
        where: { userId_weekStart: { userId, weekStart } },
        create: { userId, weekStart, totalDistanceM: event.distanceM, moveCount: 1 },
        update: { totalDistanceM: { increment: event.distanceM }, moveCount: { increment: 1 } },
      });
    } catch (e) {
      console.error("Weekly challenge update error:", e);
    }
  }

  // ─── 3. Update Achievements (only relevant categories) ───
  try {
    const relevantCategories = EVENT_ACHIEVEMENT_MAP[event.type];
    if (!relevantCategories) return;

    // Filter to only relevant achievements
    const relevantAchs = ACHIEVEMENTS.filter((a) => relevantCategories.has(a.category));
    if (relevantAchs.length === 0) return;

    // Fetch already completed+claimed achievements to skip them
    const [existingAchs, stride] = await Promise.all([
      prisma.userAchievement.findMany({
        where: { userId, achievementCode: { in: relevantAchs.map((a) => a.code) } },
        select: { achievementCode: true, completed: true, claimed: true },
      }),
      // Only fetch stride if needed
      relevantCategories.has("DISTANCE") || relevantCategories.has("STREAK")
        ? prisma.stride.findUnique({ where: { userId } })
        : null,
    ]);

    const claimedSet = new Set(
      existingAchs.filter((a) => a.completed && a.claimed).map((a) => a.achievementCode)
    );

    // Skip achievements already completed and claimed
    const unclaimed = relevantAchs.filter((a) => !claimedSet.has(a.code));
    if (unclaimed.length === 0) return;

    // Pre-fetch counts needed for batch processing (one query per category, not per achievement)
    let gameCount = 0;
    let questCount = 0;
    let courseCount = 0;
    let allClearCount = 0;

    const countPromises: Promise<void>[] = [];

    if (event.type === "GAME_PLAY" && unclaimed.some((a) => a.category === "GAME")) {
      countPromises.push(
        Promise.all([
          prisma.gamePlay.count({ where: { userId, status: { not: "PENDING" } } }),
          prisma.roulettePlay.count({ where: { userId } }),
          prisma.quizAttempt.count({ where: { userId } }),
        ]).then(([g, r, q]) => { gameCount = g + r + q; })
      );
    }

    if (event.type === "QUEST_COMPLETE" && unclaimed.some((a) => a.category === "QUEST")) {
      countPromises.push(
        prisma.quest.count({ where: { userId, status: "COMPLETED" } })
          .then((c) => { questCount = c; })
      );
    }

    if (event.type === "COURSE_COMPLETE" && unclaimed.some((a) => a.code === "COURSE_1")) {
      countPromises.push(
        prisma.courseAttempt.count({ where: { userId, status: "COMPLETED" } })
          .then((c) => { courseCount = c; })
      );
    }

    if (event.type === "DAILY_ALL_CLEAR" && unclaimed.some((a) => a.code === "ALL_CLEAR_7")) {
      countPromises.push(
        prisma.dailyMission.groupBy({
          by: ["missionDate"],
          where: { userId, status: "CLAIMED" },
          _count: { id: true },
          having: { id: { _count: { gte: 3 } } },
        }).then((g) => { allClearCount = g.length; })
      );
    }

    // Run all count queries in parallel
    await Promise.all(countPromises);

    // Build upsert operations
    const upserts: Promise<unknown>[] = [];

    for (const ach of unclaimed) {
      let currentProgress = 0;

      switch (ach.category) {
        case "DISTANCE":
          currentProgress = stride?.totalDistance || 0;
          break;
        case "STREAK":
          currentProgress = stride?.currentStreak || 0;
          break;
        case "QUEST":
          currentProgress = questCount;
          break;
        case "GAME":
          currentProgress = gameCount;
          break;
        case "SPECIAL":
          if (ach.code === "MULTI_FIRST" && event.type === "MOVEMENT_COMPLETE" && event.isMulti) {
            currentProgress = 1;
          } else if (ach.code === "COURSE_1") {
            currentProgress = courseCount;
          } else if (ach.code === "ALL_CLEAR_7") {
            currentProgress = allClearCount;
          }
          break;
      }

      if (currentProgress > 0) {
        const completed = currentProgress >= ach.targetValue;
        upserts.push(
          prisma.userAchievement.upsert({
            where: { userId_achievementCode: { userId, achievementCode: ach.code } },
            create: {
              userId,
              achievementCode: ach.code,
              progress: Math.min(currentProgress, ach.targetValue),
              completed,
              completedAt: completed ? new Date() : null,
            },
            update: {
              progress: Math.min(currentProgress, ach.targetValue),
              completed,
              completedAt: completed ? new Date() : undefined,
            },
          })
        );
      }
    }

    // Run all upserts in parallel
    await Promise.all(upserts);
  } catch (e) {
    console.error("Achievement update error:", e);
  }
}

async function updateMissions(
  missions: Array<{ id: string; missionType: string; currentValue: number; targetValue: number }>,
  event: EventType,
) {
  const updates: Promise<unknown>[] = [];

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
      updates.push(
        prisma.dailyMission.update({
          where: { id: mission.id },
          data: {
            currentValue: newValue,
            status: newValue >= mission.targetValue ? "COMPLETED" : "ACTIVE",
          },
        })
      );
    }
  }

  if (updates.length > 0) {
    await Promise.all(updates);
  }
}

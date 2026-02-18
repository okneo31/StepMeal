// ─── Daily Mission Definitions ───
export interface MissionDef {
  type: string;
  description: string;
  targetValue: number;
  rewardSc: number;
  rewardMc: number;
}

const MISSION_POOL: MissionDef[] = [
  { type: "WALK_DIST", description: "걸어서 1km 이동하기", targetValue: 1000, rewardSc: 30, rewardMc: 0 },
  { type: "WALK_DIST", description: "걸어서 2km 이동하기", targetValue: 2000, rewardSc: 60, rewardMc: 0 },
  { type: "TOTAL_DIST", description: "총 2km 이동하기", targetValue: 2000, rewardSc: 40, rewardMc: 0 },
  { type: "TOTAL_DIST", description: "총 3km 이동하기", targetValue: 3000, rewardSc: 70, rewardMc: 0 },
  { type: "QUEST_COMPLETE", description: "퀘스트 1회 완료하기", targetValue: 1, rewardSc: 50, rewardMc: 0 },
  { type: "MOVE_COUNT", description: "이동 2회 완료하기", targetValue: 2, rewardSc: 40, rewardMc: 0 },
  { type: "MOVE_COUNT", description: "이동 3회 완료하기", targetValue: 3, rewardSc: 60, rewardMc: 0 },
  { type: "GAME_PLAY", description: "게임 2회 플레이하기", targetValue: 2, rewardSc: 0, rewardMc: 30 },
  { type: "GAME_PLAY", description: "게임 3회 플레이하기", targetValue: 3, rewardSc: 0, rewardMc: 50 },
];

// Deterministic daily shuffle based on date + userId
export function generateDailyMissions(userId: string, date: Date): MissionDef[] {
  const dateStr = date.toISOString().slice(0, 10);
  const seed = hashCode(`${userId}-${dateStr}`);
  const shuffled = [...MISSION_POOL].sort((a, b) => {
    const ha = hashCode(`${seed}-${a.type}-${a.targetValue}`);
    const hb = hashCode(`${seed}-${b.type}-${b.targetValue}`);
    return ha - hb;
  });

  // Pick 3 missions with different types
  const picked: MissionDef[] = [];
  const usedTypes = new Set<string>();
  for (const m of shuffled) {
    if (picked.length >= 3) break;
    if (!usedTypes.has(m.type)) {
      picked.push(m);
      usedTypes.add(m.type);
    }
  }
  // Fill remaining if less than 3 different types
  for (const m of shuffled) {
    if (picked.length >= 3) break;
    if (!picked.includes(m)) picked.push(m);
  }
  return picked.slice(0, 3);
}

// All-clear bonus: base 50 SC + streak bonus
export const ALL_CLEAR_BASE_SC = 50;
export const STREAK_BONUS_SC = 10; // per consecutive day

// ─── Weekly Challenge Tiers ───
export const WEEKLY_TIERS = {
  BRONZE: { targetM: 10000, rewardSc: 100, rewardMc: 0, label: "브론즈", km: 10 },
  SILVER: { targetM: 25000, rewardSc: 300, rewardMc: 50, label: "실버", km: 25 },
  GOLD: { targetM: 50000, rewardSc: 500, rewardMc: 100, label: "골드", km: 50 },
};

export function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

// ─── Milestone Rewards ───
export const MILESTONES = [
  { distanceM: 1000, bonusSc: 10, label: "1km 돌파!" },
  { distanceM: 3000, bonusSc: 30, label: "3km 돌파!" },
  { distanceM: 5000, bonusSc: 50, label: "5km 돌파!" },
  { distanceM: 10000, bonusSc: 100, label: "10km 돌파!" },
];

export const DURATION_MILESTONES = [
  { durationSec: 1800, bonusSc: 20, label: "30분 연속!" },
  { durationSec: 3600, bonusSc: 50, label: "1시간 연속!" },
];

// ─── Achievement Definitions ───
export interface AchievementDef {
  code: string;
  name: string;
  description: string;
  category: "DISTANCE" | "STREAK" | "QUEST" | "GAME" | "SPECIAL";
  targetValue: number;
  rewardSc: number;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Distance
  { code: "DIST_1K", name: "첫 걸음", description: "누적 1km 이동", category: "DISTANCE", targetValue: 1000, rewardSc: 30, icon: "distance" },
  { code: "DIST_10K", name: "10km 러너", description: "누적 10km 이동", category: "DISTANCE", targetValue: 10000, rewardSc: 100, icon: "distance" },
  { code: "DIST_50K", name: "50km 워커", description: "누적 50km 이동", category: "DISTANCE", targetValue: 50000, rewardSc: 300, icon: "distance" },
  { code: "DIST_100K", name: "100km 마라토너", description: "누적 100km 이동", category: "DISTANCE", targetValue: 100000, rewardSc: 500, icon: "distance" },
  { code: "DIST_500K", name: "500km 레전드", description: "누적 500km 이동", category: "DISTANCE", targetValue: 500000, rewardSc: 1000, icon: "distance" },
  // Streak
  { code: "STREAK_3", name: "3일 연속", description: "3일 연속 이동", category: "STREAK", targetValue: 3, rewardSc: 50, icon: "streak" },
  { code: "STREAK_7", name: "1주일 연속", description: "7일 연속 이동", category: "STREAK", targetValue: 7, rewardSc: 150, icon: "streak" },
  { code: "STREAK_14", name: "2주 연속", description: "14일 연속 이동", category: "STREAK", targetValue: 14, rewardSc: 300, icon: "streak" },
  { code: "STREAK_30", name: "30일 철인", description: "30일 연속 이동", category: "STREAK", targetValue: 30, rewardSc: 500, icon: "streak" },
  // Quest
  { code: "QUEST_1", name: "첫 퀘스트", description: "퀘스트 1회 완료", category: "QUEST", targetValue: 1, rewardSc: 30, icon: "quest" },
  { code: "QUEST_10", name: "퀘스트 헌터", description: "퀘스트 10회 완료", category: "QUEST", targetValue: 10, rewardSc: 200, icon: "quest" },
  { code: "QUEST_50", name: "퀘스트 마스터", description: "퀘스트 50회 완료", category: "QUEST", targetValue: 50, rewardSc: 500, icon: "quest" },
  // Game
  { code: "GAME_10", name: "겜돌이", description: "게임 10회 플레이", category: "GAME", targetValue: 10, rewardSc: 50, icon: "game" },
  { code: "GAME_50", name: "겜마스터", description: "게임 50회 플레이", category: "GAME", targetValue: 50, rewardSc: 200, icon: "game" },
  // Special
  { code: "MULTI_FIRST", name: "멀티무버", description: "멀티 이동수단 이동 1회", category: "SPECIAL", targetValue: 1, rewardSc: 100, icon: "multi" },
  { code: "COURSE_1", name: "코스 완주", description: "코스 퀘스트 1회 완주", category: "SPECIAL", targetValue: 1, rewardSc: 150, icon: "course" },
  { code: "ALL_CLEAR_7", name: "미션 마니아", description: "데일리 미션 올클리어 7회", category: "SPECIAL", targetValue: 7, rewardSc: 300, icon: "mission" },
];

// ─── Helpers ───
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

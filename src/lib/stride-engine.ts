import { STRIDE_TABLE, MAX_STRIDE_LEVEL, SHIELD_REWARDS, MAX_SHIELDS, STRIDE_DROP_LEVELS, STRIDE_RESET_DAYS, MIN_DAILY_DISTANCE } from "./constants";
import type { StrideInfo } from "@/types";

/**
 * Get StrideInfo for a given stride level
 */
export function getStrideInfo(level: number): StrideInfo {
  const clamped = Math.max(0, Math.min(level, MAX_STRIDE_LEVEL));
  return STRIDE_TABLE[clamped];
}

/**
 * Determine the stride level for a given consecutive streak
 */
export function getStrideLevelForStreak(streak: number): number {
  let level = 0;
  for (let i = STRIDE_TABLE.length - 1; i >= 0; i--) {
    if (streak >= STRIDE_TABLE[i].requiredDays) {
      level = i;
      break;
    }
  }
  return level;
}

/**
 * Calculate days until the next stride level
 */
export function getDaysUntilNextStride(currentStreak: number, currentLevel: number): number {
  if (currentLevel >= MAX_STRIDE_LEVEL) return 0;
  const nextLevel = STRIDE_TABLE[currentLevel + 1];
  return Math.max(0, nextLevel.requiredDays - currentStreak);
}

interface StrideUpdateResult {
  newStreak: number;
  newLevel: number;
  newShieldCount: number;
  shieldUsed: boolean;
  shieldsAwarded: number;
  levelChanged: boolean;
  wasReset: boolean;
}

/**
 * Calculate stride update after a day.
 * - daysMissed = 0: active day (completed movement with enough distance)
 * - daysMissed = 1: missed one day (can use shield)
 * - daysMissed >= STRIDE_RESET_DAYS: full reset
 */
export function calculateStrideUpdate(
  currentStreak: number,
  currentLevel: number,
  shieldCount: number,
  totalDistance: number,
  daysMissed: number,
): StrideUpdateResult {
  // Active day - increment streak
  if (daysMissed === 0) {
    const newStreak = currentStreak + 1;
    const newLevel = getStrideLevelForStreak(newStreak);

    // Check if new level awards shields
    let shieldsAwarded = 0;
    if (newLevel > currentLevel && SHIELD_REWARDS[newLevel]) {
      shieldsAwarded = SHIELD_REWARDS[newLevel];
    }
    const newShieldCount = Math.min(shieldCount + shieldsAwarded, MAX_SHIELDS);

    return {
      newStreak,
      newLevel,
      newShieldCount,
      shieldUsed: false,
      shieldsAwarded,
      levelChanged: newLevel !== currentLevel,
      wasReset: false,
    };
  }

  // Full reset after too many missed days
  if (daysMissed >= STRIDE_RESET_DAYS) {
    return {
      newStreak: 0,
      newLevel: 0,
      newShieldCount: shieldCount, // keep shields
      shieldUsed: false,
      shieldsAwarded: 0,
      levelChanged: currentLevel !== 0,
      wasReset: true,
    };
  }

  // Missed day(s) - try to use shield
  if (shieldCount > 0) {
    // Use shield to protect streak
    return {
      newStreak: currentStreak,
      newLevel: currentLevel,
      newShieldCount: shieldCount - 1,
      shieldUsed: true,
      shieldsAwarded: 0,
      levelChanged: false,
      wasReset: false,
    };
  }

  // No shield - drop levels
  const dropAmount = daysMissed * STRIDE_DROP_LEVELS;
  const newLevel = Math.max(0, currentLevel - dropAmount);
  // Streak resets to the minimum required days for the new level
  const newStreak = STRIDE_TABLE[newLevel].requiredDays;

  return {
    newStreak,
    newLevel,
    newShieldCount: 0,
    shieldUsed: false,
    shieldsAwarded: 0,
    levelChanged: newLevel !== currentLevel,
    wasReset: false,
  };
}

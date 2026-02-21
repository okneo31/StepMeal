import { prisma } from "./prisma";

/**
 * Grant EXP to a character. If the character doesn't exist, skip silently.
 * Does NOT auto level-up — user must manually choose stat on level up.
 */
export async function grantExp(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return;

  await prisma.character.updateMany({
    where: { userId },
    data: { exp: { increment: amount } },
  });
}

// EXP amounts per source
export const EXP_REWARDS = {
  MOVEMENT_PER_KM: 10,     // per km moved
  QR_SCAN: 20,             // QR scan
  GAME_WIN: 10,            // mini-game win
  DAILY_MISSION: 15,       // daily mission complete
  WEEKLY_BRONZE: 30,       // weekly challenge bronze
  WEEKLY_SILVER: 50,       // weekly challenge silver
  WEEKLY_GOLD: 100,        // weekly challenge gold
  QUEST_COMPLETE: 30,      // quest arrival
  QUEST_REVIEW: 10,        // quest review
} as const;

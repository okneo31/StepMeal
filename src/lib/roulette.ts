import { ROULETTE_REWARDS } from "@/lib/constants";
import type { RouletteReward } from "@/types";

export function spinRoulette(): { slotIndex: number; reward: RouletteReward } {
  const totalWeight = ROULETTE_REWARDS.reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < ROULETTE_REWARDS.length; i++) {
    random -= ROULETTE_REWARDS[i].weight;
    if (random <= 0) {
      return { slotIndex: i, reward: ROULETTE_REWARDS[i] };
    }
  }

  // Fallback to last slot
  return {
    slotIndex: ROULETTE_REWARDS.length - 1,
    reward: ROULETTE_REWARDS[ROULETTE_REWARDS.length - 1],
  };
}

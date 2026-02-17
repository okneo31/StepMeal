import { NFT_RARITY } from "@/lib/constants";
import type { NftRarity } from "@/types";

interface RarityBadgeProps {
  rarity: NftRarity;
  size?: "sm" | "md";
}

const RARITY_STYLES: Record<NftRarity, string> = {
  COMMON: "bg-gray-500/15 text-gray-400 border border-gray-500/20",
  RARE: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  EPIC: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  LEGENDARY: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
};

export default function RarityBadge({ rarity, size = "sm" }: RarityBadgeProps) {
  const config = NFT_RARITY[rarity];
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span className={`inline-flex items-center font-bold rounded-full ${sizes[size]} ${RARITY_STYLES[rarity]}`}>
      {config.label}
    </span>
  );
}

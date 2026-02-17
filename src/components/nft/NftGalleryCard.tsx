import { NFT_RARITY } from "@/lib/constants";
import type { NftRarity } from "@/types";

interface NftGalleryCardProps {
  name: string;
  imageEmoji: string;
  rarity: NftRarity;
  mintNumber: number;
  scBonusPercent: number;
}

export default function NftGalleryCard({ name, imageEmoji, rarity, mintNumber, scBonusPercent }: NftGalleryCardProps) {
  const config = NFT_RARITY[rarity];

  return (
    <div
      className="rounded-xl p-2 text-center border-2 bg-[var(--color-surface-elevated)]"
      style={{ borderColor: `${config.color}40` }}
    >
      <div
        className="w-full aspect-square rounded-lg flex items-center justify-center mb-1"
        style={{ backgroundColor: `${config.color}10` }}
      >
        <span className="text-3xl">{imageEmoji}</span>
      </div>
      <p className="text-xs font-bold text-[var(--color-text)] mt-1 truncate">{name}</p>
      <p className="text-[10px]" style={{ color: config.color }}>
        #{mintNumber} · +{scBonusPercent}%
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import RarityBadge from "./RarityBadge";
import { NFT_RARITY, NFT_TYPES } from "@/lib/constants";
import type { NftRarity, NftType } from "@/types";

interface NftCardProps {
  id: string;
  name: string;
  imageEmoji: string;
  rarity: NftRarity;
  nftType?: NftType;
  priceMc: number;
  maxSupply: number;
  mintedCount: number;
  scBonusPercent: number;
}

const RARITY_BORDER: Record<NftRarity, string> = {
  COMMON: "border-gray-500/20",
  RARE: "border-blue-500/20 glow-blue",
  EPIC: "border-purple-500/20 glow-purple",
  LEGENDARY: "border-amber-500/20 glow-amber",
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  BOOSTER: "bg-red-500/15 text-red-400 border-red-500/20",
  ACCESSORY: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  VEHICLE: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

export default function NftCard({
  id, name, imageEmoji, rarity, nftType, priceMc, maxSupply, mintedCount, scBonusPercent,
}: NftCardProps) {
  const config = NFT_RARITY[rarity];
  const typeConfig = nftType ? NFT_TYPES[nftType] : null;
  const soldOut = maxSupply !== -1 && mintedCount >= maxSupply;

  return (
    <Link href={`/nft/mint/${id}`}>
      <div className={`bg-[var(--color-surface)] rounded-2xl p-3 border ${RARITY_BORDER[rarity]} relative overflow-hidden hover:brightness-110 transition-all`}>
        {soldOut && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
            <span className="text-white font-bold text-lg tracking-wider">SOLD OUT</span>
          </div>
        )}

        {/* Type indicator bar */}
        {typeConfig && (
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: typeConfig.color }} />
        )}

        <div
          className="w-full aspect-square rounded-xl flex items-center justify-center mb-2 border border-white/5"
          style={{ backgroundColor: `${config.color}15` }}
        >
          <span className="text-5xl">{imageEmoji}</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <RarityBadge rarity={rarity} />
            {typeConfig && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${TYPE_BADGE_COLORS[nftType || ""]}`}>
                {typeConfig.emoji}
              </span>
            )}
          </div>
          <h3 className="font-bold text-sm text-[var(--color-text)] truncate">{name}</h3>
          <div className="flex items-center justify-between">
            <span className="text-amber-400 font-bold text-sm num">{priceMc} MC</span>
            <span className="text-xs text-green-400 font-semibold">+{scBonusPercent}%</span>
          </div>
          {maxSupply !== -1 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--color-text-muted)] num">{mintedCount}/{maxSupply}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import NftCard from "@/components/nft/NftCard";
import Spinner from "@/components/ui/Spinner";
import { NFT_TYPES } from "@/lib/constants";
import type { NftRarity, NftType, NftTemplateDisplay } from "@/types";

const TYPE_FILTERS: { label: string; value: NftType | "ALL"; icon: React.ReactNode; color: string }[] = [
  { label: "전체", value: "ALL", icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ), color: "" },
  { label: "부스터", value: "BOOSTER", icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1L9 5L13 5.5L10 8.5L11 13L7 10.5L3 13L4 8.5L1 5.5L5 5L7 1Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1"/>
    </svg>
  ), color: "text-red-400 border-red-500/30" },
  { label: "악세서리", value: "ACCESSORY", icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2L3 6V10L7 14L11 10V6L7 2Z" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="7" cy="8" r="2" fill="currentColor" fillOpacity="0.3"/>
    </svg>
  ), color: "text-blue-400 border-blue-500/30" },
  { label: "탈것", value: "VEHICLE", icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 8L4 4H10L12 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <rect x="2" y="8" width="10" height="3" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="4.5" cy="11.5" r="1.5" fill="currentColor" fillOpacity="0.5"/>
      <circle cx="9.5" cy="11.5" r="1.5" fill="currentColor" fillOpacity="0.5"/>
    </svg>
  ), color: "text-purple-400 border-purple-500/30" },
];

const RARITY_FILTERS: { label: string; value: NftRarity | "ALL" }[] = [
  { label: "전체", value: "ALL" },
  { label: "커먼", value: "COMMON" },
  { label: "레어", value: "RARE" },
  { label: "에픽", value: "EPIC" },
  { label: "레전", value: "LEGENDARY" },
];

export default function NftMarketPage() {
  const [templates, setTemplates] = useState<NftTemplateDisplay[]>([]);
  const [typeFilter, setTypeFilter] = useState<NftType | "ALL">("ALL");
  const [rarityFilter, setRarityFilter] = useState<NftRarity | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter !== "ALL") params.set("type", typeFilter);
    if (rarityFilter !== "ALL") params.set("rarity", rarityFilter);
    const qs = params.toString() ? `?${params}` : "";

    setLoading(true);
    fetch(`/api/nft/templates${qs}`)
      .then((r) => r.json())
      .then((data) => {
        setTemplates(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [typeFilter, rarityFilter]);

  return (
    <div>
      <Header title="NFT 마켓" showBack />
      <div className="px-4 py-4 space-y-4">
        {/* Type Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setTypeFilter(f.value); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${
                typeFilter === f.value
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                  : `bg-[var(--color-surface)] ${f.color || "text-[var(--color-text-secondary)] border-[var(--color-border)]"}`
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* Rarity filter pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {RARITY_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setRarityFilter(f.value); }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                rarityFilter === f.value
                  ? "bg-[var(--color-surface-hover)] text-[var(--color-text)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 3L5 9V19L14 25L23 19V9L14 3Z" stroke="#A855F7" strokeWidth="1.5" fill="#A855F7" fillOpacity="0.1"/>
                <path d="M14 11L11 13L14 15L17 13L14 11Z" fill="#A855F7" fillOpacity="0.3"/>
              </svg>
            </div>
            <p className="text-[var(--color-text-muted)] text-sm">표시할 NFT가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {templates.map((t) => (
              <NftCard
                key={t.id}
                id={t.id}
                name={t.name}
                imageEmoji={t.imageEmoji}
                rarity={t.rarity}
                nftType={t.nftType}
                priceMc={t.priceMc}
                maxSupply={t.maxSupply}
                mintedCount={t.mintedCount}
                scBonusPercent={t.scBonusPercent}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EQUIP_SLOTS } from "@/lib/constants";
import type { EquipSlot } from "@/types";

interface SlotData {
  id: string;
  templateId: string;
  mintNumber: number;
  enhanceLevel: number;
  equippedSlot: string;
  template: {
    name: string;
    imageEmoji: string;
    rarity: string;
    nftType: string;
    scBonusPercent: number;
  };
}

const SLOT_ICONS: Record<EquipSlot, { label: string; icon: React.ReactNode }> = {
  BOOSTER: {
    label: "부스터",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L10 6L14 7L11 10L12 14L8 12L4 14L5 10L2 7L6 6L8 2Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15"/>
      </svg>
    ),
  },
  HEADGEAR: {
    label: "헤드",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 10C4 6.7 5.8 4 8 4C10.2 4 12 6.7 12 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M3 10H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  HANDGEAR: {
    label: "핸드",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M5 8V4M8 8V3M11 8V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M4 8C4 8 4 12 8 12C12 12 12 8 12 8" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  FOOTGEAR: {
    label: "풋",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 11H13L14 13H2L3 11Z" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 11V7C5 5.9 5.9 5 7 5H9C10.1 5 11 5.9 11 7V11" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  BODYGEAR: {
    label: "바디",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M5 4L3 6V13H13V6L11 4H5Z" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 4L8 2L11 4" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  VEHICLE: {
    label: "탈것",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="4.5" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="11.5" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M6 11.5H10M3 10L4 7H10L12 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
};

const RARITY_BORDER: Record<string, string> = {
  COMMON: "border-slate-500/30",
  RARE: "border-blue-500/40",
  EPIC: "border-purple-500/40",
  LEGENDARY: "border-amber-500/40",
};

export default function EquippedGearSummary() {
  const [slots, setSlots] = useState<Record<string, SlotData>>({});
  const [totalBonus, setTotalBonus] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/nft/equipped")
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots || {});
        setTotalBonus(data.totalBonusPercent || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const hasAnyEquipped = Object.keys(slots).length > 0;

  return (
    <Link href="/nft/equip">
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">장착 장비</h3>
          {totalBonus > 0 && (
            <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
              SC +{totalBonus}%
            </span>
          )}
        </div>
        <div className="grid grid-cols-6 gap-2">
          {EQUIP_SLOTS.map((slot) => {
            const equipped = slots[slot];
            const slotInfo = SLOT_ICONS[slot];
            return (
              <div key={slot} className="flex flex-col items-center gap-1">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                    equipped
                      ? `bg-[var(--color-surface-elevated)] ${RARITY_BORDER[equipped.template.rarity] || "border-slate-500/30"}`
                      : "bg-[var(--color-bg)]/50 border-[var(--color-border)] border-dashed"
                  }`}
                >
                  {equipped ? (
                    <span className="text-lg">{equipped.template.imageEmoji}</span>
                  ) : (
                    <span className="text-[var(--color-text-muted)] opacity-40">{slotInfo.icon}</span>
                  )}
                </div>
                <span className="text-[9px] text-[var(--color-text-muted)]">{slotInfo.label}</span>
                {equipped && equipped.enhanceLevel > 0 && (
                  <span className="text-[8px] font-bold text-amber-400">+{equipped.enhanceLevel}</span>
                )}
              </div>
            );
          })}
        </div>
        {!hasAnyEquipped && (
          <p className="text-xs text-[var(--color-text-muted)] text-center mt-2 opacity-60">
            탭하여 장비를 장착하세요
          </p>
        )}
      </div>
    </Link>
  );
}

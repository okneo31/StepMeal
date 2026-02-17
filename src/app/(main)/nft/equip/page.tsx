"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import RarityBadge from "@/components/nft/RarityBadge";
import { NFT_TYPES, ACCESSORY_SLOTS, ENHANCE_BONUS_PER_LEVEL, SET_BONUS } from "@/lib/constants";
import type { NftRarity, EquipSlot } from "@/types";

interface EquippedNft {
  id: string;
  mintNumber: number;
  enhanceLevel: number;
  equippedSlot: string;
  template: {
    name: string;
    imageEmoji: string;
    rarity: string;
    nftType: string;
    scBonusPercent: number;
    slot: string | null;
  };
}

interface MyNft {
  id: string;
  mintNumber: number;
  enhanceLevel: number;
  isEquipped: boolean;
  equippedSlot: string | null;
  template: {
    name: string;
    imageEmoji: string;
    rarity: string;
    nftType: string;
    scBonusPercent: number;
    slot: string | null;
    tier: string | null;
  };
}

const SLOT_CONFIG: { slot: EquipSlot; label: string; icon: React.ReactNode; type: string }[] = [
  { slot: "BOOSTER", label: "부스터", type: "BOOSTER", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L15 8L22 9L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9L9 8L12 2Z" stroke="#EF4444" strokeWidth="1.5" fill="#EF4444" fillOpacity="0.15"/>
    </svg>
  )},
  { slot: "HEADGEAR", label: "헤드기어", type: "ACCESSORY", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 14C6 10 8 6 12 6C16 6 18 10 18 14" stroke="#3B82F6" strokeWidth="1.5"/>
      <path d="M4 14H20V17C20 18.1 19.1 19 18 19H6C4.9 19 4 18.1 4 17V14Z" stroke="#3B82F6" strokeWidth="1.5"/>
    </svg>
  )},
  { slot: "HANDGEAR", label: "핸드기어", type: "ACCESSORY", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M8 18V8C8 6.9 8.9 6 10 6H14C15.1 6 16 6.9 16 8V18" stroke="#3B82F6" strokeWidth="1.5"/>
      <path d="M6 12H18" stroke="#3B82F6" strokeWidth="1.5"/>
      <path d="M8 18H16" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )},
  { slot: "FOOTGEAR", label: "풋기어", type: "ACCESSORY", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 14L8 8H16L18 14" stroke="#3B82F6" strokeWidth="1.5"/>
      <path d="M4 14H20V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V14Z" stroke="#3B82F6" strokeWidth="1.5"/>
    </svg>
  )},
  { slot: "BODYGEAR", label: "바디기어", type: "ACCESSORY", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M8 4L6 8V18H18V8L16 4H8Z" stroke="#3B82F6" strokeWidth="1.5"/>
      <path d="M10 4V8H14V4" stroke="#3B82F6" strokeWidth="1.5"/>
    </svg>
  )},
  { slot: "VEHICLE", label: "탈것", type: "VEHICLE", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M5 14L7 8H17L19 14" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="4" y="14" width="16" height="4" rx="1.5" stroke="#A855F7" strokeWidth="1.5"/>
      <circle cx="8" cy="19" r="1.5" fill="#A855F7" fillOpacity="0.5"/>
      <circle cx="16" cy="19" r="1.5" fill="#A855F7" fillOpacity="0.5"/>
    </svg>
  )},
];

export default function EquipPage() {
  const [equipped, setEquipped] = useState<Record<string, EquippedNft>>({});
  const [myNfts, setMyNfts] = useState<MyNft[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlot, setActiveSlot] = useState<EquipSlot | null>(null);
  const [acting, setActing] = useState(false);
  const [uniqueTypes, setUniqueTypes] = useState(0);

  function fetchData() {
    setLoading(true);
    Promise.all([
      fetch("/api/nft/equipped").then(r => r.json()),
      fetch("/api/nft/my").then(r => r.json()),
    ]).then(([eq, my]) => {
      setEquipped(eq.slots || {});
      setMyNfts(my.nfts || []);
      setUniqueTypes(eq.uniqueTypeCount || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, []);

  async function handleEquip(nftId: string, slot: EquipSlot) {
    setActing(true);
    try {
      const res = await fetch("/api/nft/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nftId, slot }),
      });
      if (res.ok) {
        fetchData();
        setActiveSlot(null);
      } else {
        const data = await res.json();
        alert(data.error || "장착 실패");
      }
    } catch {
      alert("서버 오류");
    } finally {
      setActing(false);
    }
  }

  async function handleUnequip(nftId: string) {
    setActing(true);
    try {
      const res = await fetch("/api/nft/unequip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nftId }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      alert("서버 오류");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  // Available NFTs for the active slot
  const availableForSlot = activeSlot ? myNfts.filter(n => {
    if (n.isEquipped) return false;
    const slotCfg = SLOT_CONFIG.find(s => s.slot === activeSlot);
    if (!slotCfg) return false;
    if (slotCfg.type !== n.template.nftType) return false;
    if (n.template.nftType === "ACCESSORY" && n.template.slot !== activeSlot) return false;
    return true;
  }) : [];

  return (
    <div>
      <Header title="장비 관리" showBack />
      <div className="px-4 py-4 space-y-4">
        {/* Set Bonus Indicator */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-3 border border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">세트 보너스</span>
            <div className="flex items-center gap-2">
              {uniqueTypes >= 3 ? (
                <Badge variant="green" size="sm">3종 +{SET_BONUS.THREE_TYPES}% SC</Badge>
              ) : uniqueTypes >= 2 ? (
                <Badge variant="blue" size="sm">2종 +{SET_BONUS.TWO_TYPES}% SC</Badge>
              ) : (
                <span className="text-xs text-[var(--color-text-muted)]">미달성</span>
              )}
            </div>
          </div>
        </div>

        {/* Equipment Slots */}
        <div className="space-y-2">
          {SLOT_CONFIG.map(({ slot, label, icon, type }) => {
            const eq = equipped[slot];
            return (
              <div key={slot} className={`bg-[var(--color-surface)] rounded-2xl p-4 border transition-all ${
                eq ? "border-[var(--color-primary)]/30" : "border-[var(--color-border)] border-dashed"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    eq ? "bg-[var(--color-primary)]/10" : "bg-[var(--color-surface-elevated)]"
                  }`}>
                    {eq ? <span className="text-2xl">{eq.template.imageEmoji}</span> : icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{label}</div>
                    {eq ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold text-[var(--color-text)] truncate">{eq.template.name}</span>
                        <RarityBadge rarity={eq.template.rarity as NftRarity} size="sm" />
                        {eq.enhanceLevel > 0 && (
                          <span className="text-xs font-bold text-amber-400">+{eq.enhanceLevel}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">비어있음</span>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {eq ? (
                      <button
                        onClick={() => handleUnequip(eq.id)}
                        disabled={acting}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 font-semibold"
                      >
                        해제
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveSlot(activeSlot === slot ? null : slot)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/20 font-semibold"
                      >
                        장착
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable: available NFTs for this slot */}
                {activeSlot === slot && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                    {availableForSlot.length === 0 ? (
                      <p className="text-xs text-[var(--color-text-muted)] text-center py-2">
                        장착 가능한 NFT가 없습니다
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {availableForSlot.map(nft => (
                          <button
                            key={nft.id}
                            onClick={() => handleEquip(nft.id, slot)}
                            disabled={acting}
                            className="w-full flex items-center gap-3 p-2 rounded-xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] transition-colors text-left"
                          >
                            <span className="text-2xl">{nft.template.imageEmoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-[var(--color-text)] truncate">{nft.template.name}</div>
                              <div className="flex items-center gap-1.5">
                                <RarityBadge rarity={nft.template.rarity as NftRarity} size="sm" />
                                <span className="text-xs text-green-400">+{nft.template.scBonusPercent + nft.enhanceLevel * ENHANCE_BONUS_PER_LEVEL}%</span>
                              </div>
                            </div>
                            <span className="text-xs text-[var(--color-primary)] font-semibold">선택</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

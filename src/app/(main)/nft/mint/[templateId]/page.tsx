"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import RarityBadge from "@/components/nft/RarityBadge";
import Spinner from "@/components/ui/Spinner";
import { NFT_RARITY, NFT_TYPES, BOOSTER_TIERS, ACCESSORY_SLOTS } from "@/lib/constants";
import type { NftRarity, NftTemplateDisplay } from "@/types";

export default function NftMintPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;

  const [template, setTemplate] = useState<NftTemplateDisplay | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [mintResult, setMintResult] = useState<{ success: boolean; message: string; emoji?: string; mintNumber?: number } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/nft/templates").then((r) => r.json()),
      fetch("/api/coins/balance").then((r) => r.json()),
    ]).then(([templates, bal]) => {
      const found = Array.isArray(templates) ? templates.find((t: NftTemplateDisplay) => t.id === templateId) : null;
      setTemplate(found || null);
      setBalance(bal.mcBalance || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [templateId]);

  async function handleMint() {
    if (!template || minting) return;
    setMinting(true);

    try {
      const res = await fetch("/api/nft/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const data = await res.json();

      if (res.ok) {
        setMintResult({
          success: true,
          message: `${template.name} #${data.nft.mintNumber} 민팅 성공!`,
          emoji: template.imageEmoji,
          mintNumber: data.nft.mintNumber,
        });
        setBalance(data.newMcBalance);
      } else {
        setMintResult({ success: false, message: data.error });
      }
    } catch {
      setMintResult({ success: false, message: "네트워크 오류가 발생했습니다." });
    } finally {
      setMinting(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  if (!template) {
    return (
      <div>
        <Header title="NFT" showBack />
        <div className="px-4 py-12 text-center">
          <p className="text-[var(--color-text-muted)]">NFT를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const config = NFT_RARITY[template.rarity as NftRarity];
  const typeConfig = NFT_TYPES[template.nftType as keyof typeof NFT_TYPES];
  const soldOut = template.maxSupply !== -1 && template.mintedCount >= template.maxSupply;
  const canAfford = balance >= template.priceMc;

  return (
    <div>
      <Header title="NFT 민팅" showBack />
      <div className="px-4 py-4 space-y-4">
        {mintResult ? (
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 text-center">
            {mintResult.success ? (
              <>
                <div className="w-24 h-24 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl">{mintResult.emoji}</span>
                </div>
                <h2 className="text-lg font-bold text-green-400 mb-1">민팅 성공!</h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">{mintResult.message}</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => router.push("/nft")} variant="outline" size="sm">
                    마켓으로
                  </Button>
                  <Button onClick={() => router.push("/profile")} size="sm">
                    내 NFT 보기
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-red-500/15 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-4">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <path d="M12 12L24 24M24 12L12 24" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-red-400 font-semibold mb-1">민팅 실패</p>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">{mintResult.message}</p>
                <Button onClick={() => setMintResult(null)} variant="outline" size="sm">
                  돌아가기
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* NFT Preview */}
            <div className="bg-[var(--color-surface)] rounded-2xl p-5 border border-[var(--color-border)] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: typeConfig?.color || config.color }} />
              <div
                className="w-full aspect-square max-w-[200px] mx-auto rounded-2xl flex items-center justify-center mb-4 border border-white/5"
                style={{ backgroundColor: `${config.color}15` }}
              >
                <span className="text-7xl">{template.imageEmoji}</span>
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <RarityBadge rarity={template.rarity as NftRarity} size="md" />
                {typeConfig && (
                  <Badge variant={template.nftType === "BOOSTER" ? "green" : template.nftType === "ACCESSORY" ? "blue" : "purple"} size="sm">
                    {typeConfig.emoji} {typeConfig.label}
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">{template.name}</h2>
              {template.description && (
                <p className="text-sm text-[var(--color-text-muted)] mt-1">{template.description}</p>
              )}
            </div>

            {/* Details */}
            <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">유형</span>
                  <span className="font-semibold text-[var(--color-text)]">{typeConfig?.emoji} {typeConfig?.label}</span>
                </div>
                <div className="h-px bg-[var(--color-border)]" />
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">가격</span>
                  <span className="font-bold text-amber-400 num">{template.priceMc} MC</span>
                </div>
                <div className="h-px bg-[var(--color-border)]" />
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">SC 보너스</span>
                  <span className="font-bold text-green-400">+{template.scBonusPercent}%</span>
                </div>

                {/* Type-specific info */}
                {template.nftType === "BOOSTER" && template.tier && (
                  <>
                    <div className="h-px bg-[var(--color-border)]" />
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">등급</span>
                      <span className="font-semibold" style={{ color: BOOSTER_TIERS[template.tier as keyof typeof BOOSTER_TIERS]?.color }}>
                        {BOOSTER_TIERS[template.tier as keyof typeof BOOSTER_TIERS]?.label}
                      </span>
                    </div>
                  </>
                )}

                {template.nftType === "ACCESSORY" && template.slot && (
                  <>
                    <div className="h-px bg-[var(--color-border)]" />
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">슬롯</span>
                      <span className="font-semibold text-[var(--color-text)]">
                        {ACCESSORY_SLOTS[template.slot as keyof typeof ACCESSORY_SLOTS]?.emoji}{' '}
                        {ACCESSORY_SLOTS[template.slot as keyof typeof ACCESSORY_SLOTS]?.label}
                      </span>
                    </div>
                    {template.ability && (
                      <>
                        <div className="h-px bg-[var(--color-border)]" />
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-text-muted)]">특수 능력</span>
                          <span className="font-semibold text-blue-400">
                            {template.ability.effect} +{template.ability.value}%
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}

                {template.nftType === "VEHICLE" && (
                  <>
                    <div className="h-px bg-[var(--color-border)]" />
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">이동수단 클래스</span>
                      <span className="font-semibold text-purple-400">{template.transportClass}</span>
                    </div>
                    {template.synergyPercent > 0 && (
                      <>
                        <div className="h-px bg-[var(--color-border)]" />
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-text-muted)]">시너지 보너스</span>
                          <span className="font-bold text-purple-400">+{template.synergyPercent}%</span>
                        </div>
                      </>
                    )}
                  </>
                )}

                {template.maxSupply !== -1 && (
                  <>
                    <div className="h-px bg-[var(--color-border)]" />
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">발행량</span>
                      <span className="font-semibold text-[var(--color-text)] num">{template.mintedCount} / {template.maxSupply}</span>
                    </div>
                  </>
                )}
                <div className="h-px bg-[var(--color-border)]" />
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">내 MC 잔액</span>
                  <span className={`font-bold num ${canAfford ? "text-amber-400" : "text-red-400"}`}>
                    {balance.toLocaleString()} MC
                  </span>
                </div>
              </div>
            </div>

            {/* Mint Button */}
            <Button
              fullWidth
              size="lg"
              onClick={handleMint}
              loading={minting}
              disabled={soldOut || !canAfford}
            >
              {soldOut ? "매진됨" : !canAfford ? "MC 부족" : `${template.priceMc} MC로 민팅`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

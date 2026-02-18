"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DailySummaryCard from "@/components/home/DailySummaryCard";
import CoinBalanceCard from "@/components/home/CoinBalanceCard";
import StrideInfoCard from "@/components/home/StrideInfoCard";
import ActiveBoosterBadge from "@/components/home/ActiveBoosterBadge";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { CHARACTER_AVATARS, CONDITION_SC_MULTIPLIER } from "@/lib/constants";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [balance, setBalance] = useState({ scBalance: 0, mcBalance: 0 });
  const [stride, setStride] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [nftBonus, setNftBonus] = useState(0);
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      const safeFetch = (url: string) =>
        fetch(url)
          .then(async (r) => {
            if (!r.ok) {
              const body = await r.json().catch(() => null);
              console.warn(`[Home] ${url} failed:`, r.status, body?.detail || body?.error);
              return null;
            }
            return r.json();
          })
          .catch((e) => { console.warn(`[Home] ${url} error:`, e); return null; });

      Promise.all([
        safeFetch("/api/coins/balance"),
        safeFetch("/api/stride"),
        safeFetch("/api/stats"),
        safeFetch("/api/nft/my"),
        safeFetch("/api/character"),
      ]).then(([bal, str, sts, nft, char]) => {
        if (bal) setBalance(bal);
        if (str) setStride(str);
        if (sts) setStats(sts);
        if (nft) setNftBonus(nft.totalBonusPercent || 0);
        if (char) setCharacter(char);
        setLoading(false);
      });
    }
  }, [status, router]);

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Hero Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">Welcome back</p>
            <h1 className="text-xl font-bold text-[var(--color-text)]">
              {session?.user?.name || "사용자"}
            </h1>
          </div>
          <Link href="/profile">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/30 to-blue-500/30 border border-[var(--color-border)] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="3.5" stroke="#94A3B8" strokeWidth="1.5"/>
                <path d="M16 18C16 14.7 13.3 13 10 13C6.7 13 4 14.7 4 18" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </Link>
        </div>
      </div>

      {/* Character + Stride Preview */}
      <div className="px-4 py-3">
        <Link href="/character">
          <div className="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-elevated)] rounded-3xl p-5 border border-[var(--color-border)] relative overflow-hidden">
            {/* Background glow */}
            {(() => {
              const avatarInfo = character?.avatarType ? CHARACTER_AVATARS[character.avatarType as keyof typeof CHARACTER_AVATARS] : CHARACTER_AVATARS.DEFAULT;
              const condMult = character ? CONDITION_SC_MULTIPLIER(character.condition || 100) : 1;
              return (
                <>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-3xl" style={{ backgroundColor: avatarInfo?.color || '#22C55E', opacity: 0.04 }} />

                  {/* Character */}
                  <div className="flex flex-col items-center mb-4 relative">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center mb-3 border-2"
                      style={{
                        background: `linear-gradient(135deg, ${avatarInfo?.color || '#22C55E'}15, ${avatarInfo?.color || '#22C55E'}05)`,
                        borderColor: `${avatarInfo?.color || '#22C55E'}40`,
                      }}
                    >
                      <span className="text-5xl">{avatarInfo?.emoji || '🏃'}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      {character && (
                        <Badge variant="green" size="sm">Lv.{character.level}</Badge>
                      )}
                      {stride && (
                        <>
                          <Badge variant={stride.level >= 4 ? "green" : "blue"} size="sm">
                            Stride {stride.level}
                          </Badge>
                          <span className="text-lg font-bold text-[var(--color-primary)]">x{stride.multiplier}</span>
                        </>
                      )}
                    </div>
                    {/* Condition bar */}
                    {character && (
                      <div className="w-full max-w-[200px] mt-1">
                        <div className="flex items-center justify-between text-[10px] mb-0.5">
                          <span className="text-[var(--color-text-muted)]">컨디션</span>
                          <span className={`font-semibold ${
                            condMult >= 1 ? "text-green-400" :
                            condMult >= 0.8 ? "text-yellow-400" : "text-red-400"
                          }`}>{character.condition}% · x{condMult}</span>
                        </div>
                        <ProgressBar
                          value={character.condition}
                          height="h-1.5"
                          color={
                            character.condition >= 80 ? "bg-green-500" :
                            character.condition >= 50 ? "bg-yellow-500" : "bg-red-500"
                          }
                        />
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[var(--color-bg)]/50 rounded-xl p-2 text-center">
                <div className="text-sm font-bold text-[var(--color-text)] num">
                  {((stats?.today?.distanceM || 0) / 1000).toFixed(1)}
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)]">km</div>
              </div>
              <div className="bg-[var(--color-bg)]/50 rounded-xl p-2 text-center">
                <div className="text-sm font-bold text-green-400 num">
                  {stats?.today?.scMovement || 0}
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)]">SC 획득</div>
              </div>
              <div className="bg-[var(--color-bg)]/50 rounded-xl p-2 text-center">
                <div className="text-sm font-bold text-[var(--color-text)] num">
                  {stats?.today?.calories || 0}
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)]">kcal</div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="px-4 space-y-3">
        <ActiveBoosterBadge />

        <CoinBalanceCard
          scBalance={balance.scBalance}
          mcBalance={balance.mcBalance}
        />

        <DailySummaryCard
          distanceM={stats?.today?.distanceM || 0}
          durationSec={stats?.today?.durationSec || 0}
          calories={stats?.today?.calories || 0}
        />

        {stride && (
          <StrideInfoCard
            level={stride.level}
            title={stride.title}
            multiplier={stride.multiplier}
            currentStreak={stride.currentStreak}
            dailyCap={stride.dailyCap}
            daysUntilNext={stride.daysUntilNext}
            shieldCount={stride.shieldCount}
          />
        )}

        {nftBonus > 0 && (
          <Link href="/nft/equip" className="block">
            <div className="bg-[var(--color-surface)] rounded-2xl p-3 border border-purple-500/20 glow-purple flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2L3 7V13L10 18L17 13V7L10 2Z" stroke="#A855F7" strokeWidth="1.5" fill="#A855F7" fillOpacity="0.15"/>
                    <path d="M10 8L7 10L10 12L13 10L10 8Z" fill="#A855F7" fillOpacity="0.5"/>
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-semibold text-[var(--color-text)]">NFT 장비</span>
                  <p className="text-[10px] text-[var(--color-text-muted)]">장착 관리</p>
                </div>
              </div>
              <Badge variant="green" size="md">SC +{nftBonus}%</Badge>
            </div>
          </Link>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/mission">
            <div className="bg-[var(--color-surface)] rounded-2xl p-3 border border-amber-500/20 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 9L7 13L15 5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">미션</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">데일리 & 챌린지</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/profile/achievements">
            <div className="bg-[var(--color-surface)] rounded-2xl p-3 border border-purple-500/20 hover:border-purple-500/30 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 2L11 7H16L12 10.5L13.5 16L9 12.5L4.5 16L6 10.5L2 7H7L9 2Z" stroke="#A855F7" strokeWidth="1.5" fill="#A855F7" fillOpacity="0.15"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">업적</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">뱃지 수집</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <Link href="/move" className="block pb-4">
          <Button fullWidth size="lg" className="mt-1">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
              <path d="M10 2L18 10L10 18L2 10L10 2Z" fill="currentColor" fillOpacity="0.3"/>
              <path d="M10 6V14M6 10H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            이동 시작하기
          </Button>
        </Link>
      </div>
    </div>
  );
}

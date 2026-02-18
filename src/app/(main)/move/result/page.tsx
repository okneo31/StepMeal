"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { formatDistance, formatDuration } from "@/lib/geolocation";

interface ScBreakdown {
  baseSc: number;
  strideMult: number;
  timeMult: number;
  weatherMult: number;
  multiMult: number;
  nftMult: number;
  totalSc: number;
}

interface MoveResult {
  sc: ScBreakdown;
  boosterMult?: number;
  totalDistance: number;
  totalDuration: number;
  calories: number;
}

function MultiplierRow({ label, icon, value, color }: { label: string; icon: React.ReactNode; value: number; color: string }) {
  if (value === 1.0) return null;
  const percent = Math.round((value - 1) * 100);
  const sign = percent > 0 ? "+" : "";
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      </div>
      <span className={`text-sm font-bold num ${percent > 0 ? "text-[var(--color-primary)]" : "text-red-400"}`}>
        {sign}{percent}%
      </span>
    </div>
  );
}

function ResultContent() {
  const params = useSearchParams();
  const movementId = params.get("mid");
  const sc = parseInt(params.get("sc") || "0");
  const dist = parseInt(params.get("dist") || "0");
  const dur = parseInt(params.get("dur") || "0");
  const cal = parseInt(params.get("cal") || "0");
  const milestones = (() => {
    try {
      const raw = params.get("ms");
      if (!raw) return null;
      return JSON.parse(decodeURIComponent(raw)) as { bonusSc: number; labels: string[] };
    } catch { return null; }
  })();

  const [result, setResult] = useState<MoveResult | null>(null);
  const [loading, setLoading] = useState(!!movementId);

  useEffect(() => {
    if (!movementId) return;

    fetch(`/api/movement/detail?id=${movementId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.sc) {
          setResult(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [movementId]);

  const breakdown = result?.sc;
  const boosterMult = result?.boosterMult;

  return (
    <div>
      <Header title="이동 완료" />
      <div className="px-4 py-6 space-y-4">
        {/* SC earned hero */}
        <div className="text-center py-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[var(--color-primary)] opacity-[0.06] rounded-full blur-3xl" />
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/15 border-2 border-[var(--color-primary)]/30 flex items-center justify-center mx-auto mb-4">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 4L22 14L32 15L25 22L27 32L18 27L9 32L11 22L4 15L14 14L18 4Z" fill="var(--color-primary)" fillOpacity="0.4" stroke="var(--color-primary)" strokeWidth="1.5"/>
              </svg>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] mb-2">획득한 StepCoin</p>
            <p className="text-6xl font-bold text-gradient-green num">
              +{sc.toLocaleString()}
            </p>
            <p className="text-xl text-[var(--color-primary)] mt-1">SC</p>
          </div>
        </div>

        {/* SC Breakdown */}
        {loading && (
          <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] flex items-center justify-center">
            <Spinner size="sm" />
            <span className="text-sm text-[var(--color-text-muted)] ml-2">상세 내역 로딩 중...</span>
          </div>
        )}
        {breakdown && (
          <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">SC 상세 내역</h3>

            {/* Base SC */}
            <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="var(--color-text-secondary)" strokeWidth="1.2"/>
                    <path d="M7 4.5V9.5M4.5 7H9.5" stroke="var(--color-text-secondary)" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-sm text-[var(--color-text-secondary)]">기본 SC (이동거리)</span>
              </div>
              <span className="text-sm font-bold text-[var(--color-text)] num">{breakdown.baseSc}</span>
            </div>

            {/* Multipliers */}
            <div className="py-1">
              <MultiplierRow
                label="스트라이드 보너스"
                value={breakdown.strideMult}
                color="bg-green-500/10"
                icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10L5 6L8 8L12 3" stroke="#22C55E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />
              <MultiplierRow
                label="시간대 보너스"
                value={breakdown.timeMult}
                color="bg-blue-500/10"
                icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="#3B82F6" strokeWidth="1.2"/><path d="M7 4.5V7L9 8.5" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round"/></svg>}
              />
              <MultiplierRow
                label="날씨 보너스"
                value={breakdown.weatherMult}
                color="bg-cyan-500/10"
                icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4.5 10C3.1 10 2 8.9 2 7.5C2 6.2 2.9 5.1 4.2 5C4.6 3.3 6.1 2 8 2C10.2 2 12 3.8 12 6C12 6.1 12 6.2 12 6.3" stroke="#06B6D4" strokeWidth="1.2" strokeLinecap="round"/><path d="M6 9V12M9 8V11M12 9V12" stroke="#06B6D4" strokeWidth="1.2" strokeLinecap="round"/></svg>}
              />
              <MultiplierRow
                label="복합이동 보너스"
                value={breakdown.multiMult}
                color="bg-purple-500/10"
                icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 11L7 3L11 11" stroke="#A855F7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.5 8H9.5" stroke="#A855F7" strokeWidth="1.2" strokeLinecap="round"/></svg>}
              />
              <MultiplierRow
                label="NFT 보너스"
                value={breakdown.nftMult}
                color="bg-amber-500/10"
                icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5L4 5.5V10.5L7 12.5L10 10.5V5.5L7 1.5Z" stroke="#F59E0B" strokeWidth="1.2" fill="#F59E0B" fillOpacity="0.1"/></svg>}
              />
              {boosterMult && boosterMult > 1.0 && (
                <MultiplierRow
                  label="부스터 효과"
                  value={boosterMult}
                  color="bg-orange-500/10"
                  icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8 1L3 8H7L6 13L11 6H7L8 1Z" fill="#F97316" fillOpacity="0.2" stroke="#F97316" strokeWidth="1.2" strokeLinejoin="round"/></svg>}
                />
              )}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-[var(--color-border)]">
              <span className="text-sm font-bold text-[var(--color-text)]">최종 획득</span>
              <span className="text-lg font-bold text-[var(--color-primary)] num">+{breakdown.totalSc} SC</span>
            </div>
          </div>
        )}

        {/* Milestone Bonuses */}
        {milestones && milestones.bonusSc > 0 && (
          <div className="bg-amber-500/5 rounded-2xl p-4 border border-amber-500/20">
            <h3 className="text-xs font-semibold text-amber-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L9 5H13L10 8L11 12L7 9.5L3 12L4 8L1 5H5L7 1Z" fill="#F59E0B" fillOpacity="0.3" stroke="#F59E0B" strokeWidth="1"/>
              </svg>
              마일스톤 달성!
            </h3>
            <div className="space-y-1.5">
              {milestones.labels.map((label, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L6 10L11 4" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[var(--color-text-secondary)]">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-amber-500/15 flex items-center justify-between">
              <span className="text-sm text-amber-400 font-semibold">마일스톤 보너스</span>
              <span className="text-lg font-bold text-amber-400 num">+{milestones.bonusSc} SC</span>
            </div>
          </div>
        )}

        {/* Movement Stats */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-4 uppercase tracking-wider">이동 요약</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3">
              <p className="text-lg font-bold text-[var(--color-text)] num">{formatDistance(dist)}</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">이동 거리</p>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3">
              <p className="text-lg font-bold text-[var(--color-text)] num">{formatDuration(dur)}</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">이동 시간</p>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3">
              <p className="text-lg font-bold text-[var(--color-text)] num">{cal.toLocaleString()}</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">kcal</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/history" className="flex-1">
            <Button variant="outline" fullWidth>
              이동 기록
            </Button>
          </Link>
          <Link href="/home" className="flex-[2]">
            <Button fullWidth>
              홈으로
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><Spinner size="lg" /></div>}>
      <ResultContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

interface Mission {
  id: string;
  slot: number;
  missionType: string;
  description: string;
  targetValue: number;
  currentValue: number;
  rewardSc: number;
  rewardMc: number;
  status: string;
}

interface WeeklyData {
  totalDistanceM: number;
  moveCount: number;
  bronzeClaimed: boolean;
  silverClaimed: boolean;
  goldClaimed: boolean;
  tiers: Record<string, { targetM: number; rewardSc: number; rewardMc: number; label: string; km: number }>;
  daysLeft: number;
}

export default function MissionPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [allCompleted, setAllCompleted] = useState(false);
  const [allCleared, setAllCleared] = useState(false);
  const [allClearBonus, setAllClearBonus] = useState(0);
  const [streak, setStreak] = useState(0);
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [mRes, wRes] = await Promise.all([
        fetch("/api/mission/daily").then((r) => r.json()),
        fetch("/api/challenge/weekly").then((r) => r.json()),
      ]);
      setMissions(mRes.missions || []);
      setAllCompleted(mRes.allCompleted);
      setAllCleared(mRes.allCleared);
      setAllClearBonus(mRes.allClearBonus);
      setStreak(mRes.streak);
      setWeekly(wRes);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const claimMission = async (missionId: string) => {
    setClaiming(missionId);
    try {
      const res = await fetch("/api/mission/daily", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId }),
      });
      if (res.ok) await fetchData();
    } catch {}
    setClaiming(null);
  };

  const claimAllClear = async () => {
    setClaiming("allclear");
    try {
      const res = await fetch("/api/mission/daily", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimAllClear: true }),
      });
      if (res.ok) await fetchData();
    } catch {}
    setClaiming(null);
  };

  const claimWeeklyTier = async (tier: string) => {
    setClaiming(tier);
    try {
      const res = await fetch("/api/challenge/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      if (res.ok) await fetchData();
    } catch {}
    setClaiming(null);
  };

  if (loading) {
    return (
      <div>
        <Header title="미션 & 챌린지" showBack />
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      </div>
    );
  }

  const tierEntries = weekly ? Object.entries(weekly.tiers) as [string, { targetM: number; rewardSc: number; rewardMc: number; label: string; km: number }][] : [];

  return (
    <div>
      <Header title="미션 & 챌린지" showBack />
      <div className="px-4 py-4 space-y-4">

        {/* Daily Missions */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-primary)]/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[var(--color-text)]">오늘의 미션</h3>
            {streak > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-semibold">
                {streak}일 연속
              </span>
            )}
          </div>

          <div className="space-y-3">
            {missions.map((m) => {
              const pct = Math.min(100, (m.currentValue / m.targetValue) * 100);
              return (
                <div key={m.id} className="bg-[var(--color-bg)]/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold text-[var(--color-text)]">{m.description}</p>
                    <span className="text-xs font-bold text-green-400">
                      {m.rewardSc > 0 ? `+${m.rewardSc} SC` : `+${m.rewardMc} MC`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[var(--color-bg)] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${m.status === "CLAIMED" ? "bg-[var(--color-text-muted)]" : "bg-[var(--color-primary)]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)] num w-16 text-right">
                      {m.currentValue}/{m.targetValue}
                    </span>
                    {m.status === "COMPLETED" && (
                      <Button size="sm" onClick={() => claimMission(m.id)} loading={claiming === m.id}>
                        수령
                      </Button>
                    )}
                    {m.status === "CLAIMED" && (
                      <span className="text-xs text-[var(--color-text-muted)] font-semibold">완료</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* All Clear Bonus */}
          {allCleared && !allCompleted && null}
          {missions.every((m) => m.status === "CLAIMED") && (
            <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-amber-400 mb-2">
                올클리어 보너스: +{allClearBonus} SC
              </p>
              {!allCleared ? (
                <Button size="sm" onClick={claimAllClear} loading={claiming === "allclear"}>
                  보너스 수령
                </Button>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)]">수령 완료</p>
              )}
            </div>
          )}
        </div>

        {/* Weekly Challenge */}
        {weekly && (
          <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[var(--color-text)]">주간 챌린지</h3>
              <span className="text-xs text-[var(--color-text-muted)]">D-{weekly.daysLeft}</span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              이번 주 이동: <span className="font-bold text-[var(--color-text)] num">{(weekly.totalDistanceM / 1000).toFixed(1)}km</span> · {weekly.moveCount}회
            </p>

            <div className="space-y-2">
              {tierEntries.map(([key, tier]) => {
                const claimed = weekly[`${key.toLowerCase()}Claimed` as keyof WeeklyData] as boolean;
                const met = weekly.totalDistanceM >= tier.targetM;
                const pct = Math.min(100, (weekly.totalDistanceM / tier.targetM) * 100);
                const colors: Record<string, string> = { BRONZE: "amber", SILVER: "slate", GOLD: "yellow" };
                const c = colors[key] || "green";

                return (
                  <div key={key} className={`bg-${c}-500/5 border border-${c}-500/15 rounded-xl p-3`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold text-${c}-400`}>{tier.label} ({tier.km}km)</span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {tier.rewardSc > 0 && `+${tier.rewardSc} SC`}
                        {tier.rewardMc > 0 && ` +${tier.rewardMc} MC`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[var(--color-bg)] rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full bg-${c}-400 transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      {met && !claimed ? (
                        <Button size="sm" onClick={() => claimWeeklyTier(key)} loading={claiming === key}>
                          수령
                        </Button>
                      ) : claimed ? (
                        <span className="text-xs text-[var(--color-text-muted)]">완료</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Spinner from "@/components/ui/Spinner";
import { formatDistance } from "@/lib/geolocation";

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  return (
    <div>
      <Header title="통계" />
      <div className="px-4 py-4 space-y-4">
        {/* Weekly */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">이번 주</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)] num">{formatDistance(stats?.weekly?.distance || 0)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">거리</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-primary)] num">{(stats?.weekly?.sc || 0).toLocaleString()}</p>
              <p className="text-xs text-[var(--color-text-muted)]">SC</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)] num">{stats?.weekly?.activeDays || 0}일</p>
              <p className="text-xs text-[var(--color-text-muted)]">활동일</p>
            </div>
          </div>
        </div>

        {/* Daily Chart */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">일별 이동 거리</h3>
          <div className="flex items-end justify-between gap-1 h-32">
            {(stats?.dailyChart || []).map((d: any, i: number) => {
              const maxDist = Math.max(...(stats?.dailyChart || []).map((x: any) => x.distance), 1);
              const pct = Math.max((d.distance / maxDist) * 100, 4);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-[var(--color-text-muted)] num">{d.distance > 0 ? formatDistance(d.distance) : ""}</span>
                  <div className="w-full flex justify-center">
                    <div
                      className="w-6 bg-gradient-to-t from-green-600 to-green-400 rounded-t-md transition-all"
                      style={{ height: `${pct}%`, minHeight: "4px" }}
                    />
                  </div>
                  <span className="text-[9px] text-[var(--color-text-muted)]">{d.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">이번 달</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-text)] num">{formatDistance(stats?.monthly?.distance || 0)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">총 거리</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/15 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-green-400 num">{(stats?.monthly?.sc || 0).toLocaleString()} SC</p>
              <p className="text-xs text-[var(--color-text-muted)]">총 SC</p>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-text)] num">{(stats?.monthly?.calories || 0).toLocaleString()}</p>
              <p className="text-xs text-[var(--color-text-muted)]">칼로리</p>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-text)] num">{stats?.monthly?.movementCount || 0}회</p>
              <p className="text-xs text-[var(--color-text-muted)]">이동 횟수</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

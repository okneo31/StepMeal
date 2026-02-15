"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
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
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">이번 주</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold num">{formatDistance(stats?.weekly?.distance || 0)}</p>
              <p className="text-xs text-gray-500">거리</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-primary)] num">{(stats?.weekly?.sc || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">SC</p>
            </div>
            <div>
              <p className="text-2xl font-bold num">{stats?.weekly?.activeDays || 0}일</p>
              <p className="text-xs text-gray-500">활동일</p>
            </div>
          </div>
        </Card>

        {/* Daily Chart */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">일별 이동 거리</h3>
          <div className="flex items-end justify-between gap-1 h-32">
            {(stats?.dailyChart || []).map((d: any, i: number) => {
              const maxDist = Math.max(...(stats?.dailyChart || []).map((x: any) => x.distance), 1);
              const pct = Math.max((d.distance / maxDist) * 100, 4);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-gray-400 num">{d.distance > 0 ? formatDistance(d.distance) : ""}</span>
                  <div className="w-full flex justify-center">
                    <div
                      className="w-6 bg-[var(--color-primary)] rounded-t-md transition-all"
                      style={{ height: `${pct}%`, minHeight: "4px" }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-500">{d.date}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Monthly */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">이번 달</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold num">{formatDistance(stats?.monthly?.distance || 0)}</p>
              <p className="text-xs text-gray-500">총 거리</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-primary)] num">{(stats?.monthly?.sc || 0).toLocaleString()} SC</p>
              <p className="text-xs text-gray-500">총 SC</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold num">{(stats?.monthly?.calories || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">칼로리</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold num">{stats?.monthly?.movementCount || 0}회</p>
              <p className="text-xs text-gray-500">이동 횟수</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

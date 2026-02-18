"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

interface Achievement {
  code: string;
  name: string;
  description: string;
  category: string;
  targetValue: number;
  rewardSc: number;
  icon: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  DISTANCE: "거리",
  STREAK: "연속",
  QUEST: "퀘스트",
  GAME: "게임",
  SPECIAL: "특별",
};

const CATEGORY_COLORS: Record<string, string> = {
  DISTANCE: "green",
  STREAK: "amber",
  QUEST: "blue",
  GAME: "purple",
  SPECIAL: "pink",
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/achievement");
      const data = await res.json();
      setAchievements(data.achievements || []);
      setTotalCompleted(data.totalCompleted || 0);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const claim = async (code: string) => {
    setClaiming(code);
    try {
      const res = await fetch("/api/achievement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) await fetchData();
    } catch {}
    setClaiming(null);
  };

  if (loading) {
    return (
      <div>
        <Header title="업적" showBack />
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      </div>
    );
  }

  const filtered = filter ? achievements.filter((a) => a.category === filter) : achievements;
  const categories = [...new Set(achievements.map((a) => a.category))];

  return (
    <div>
      <Header title="업적" showBack />
      <div className="px-4 py-4 space-y-4">
        {/* Summary */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-primary)]/20 text-center">
          <p className="text-3xl font-bold text-[var(--color-primary)] num">{totalCompleted}/{total}</p>
          <p className="text-xs text-[var(--color-text-muted)]">달성한 업적</p>
        </div>

        {/* Filter */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setFilter("")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
              !filter ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/40" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]"
            }`}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                filter === cat ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/40" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]"
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        {/* Achievement List */}
        <div className="space-y-2">
          {filtered.map((a) => {
            const pct = Math.min(100, (a.progress / a.targetValue) * 100);
            const c = CATEGORY_COLORS[a.category] || "green";
            return (
              <div
                key={a.code}
                className={`bg-[var(--color-surface)] rounded-xl p-3 border ${
                  a.completed ? `border-${c}-500/30` : "border-[var(--color-border)]"
                } ${a.claimed ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-${c}-500/10 flex items-center justify-center`}>
                      {a.completed ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L7 12L13 4" stroke={`var(--color-primary)`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="5" stroke="#64748B" strokeWidth="1.5" strokeDasharray="3 2"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text)]">{a.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{a.description}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-xs font-bold text-green-400">+{a.rewardSc} SC</span>
                    {a.completed && !a.claimed && (
                      <Button size="sm" onClick={() => claim(a.code)} loading={claiming === a.code}>
                        수령
                      </Button>
                    )}
                    {a.claimed && <span className="text-xs text-[var(--color-text-muted)]">완료</span>}
                  </div>
                </div>
                {!a.completed && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 bg-[var(--color-bg)] rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)] num">{a.progress}/{a.targetValue}</span>
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

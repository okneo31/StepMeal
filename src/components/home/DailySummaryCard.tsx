"use client";

import { formatDistance, formatDuration } from "@/lib/geolocation";

interface Props {
  distanceM: number;
  durationSec: number;
  calories: number;
}

export default function DailySummaryCard({ distanceM, durationSec, calories }: Props) {
  const stats = [
    { icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L12.5 8H18L13.5 12L15 18L10 14.5L5 18L6.5 12L2 8H7.5L10 2Z" stroke="#22C55E" strokeWidth="1.5" fill="none"/>
      </svg>
    ), value: formatDistance(distanceM), label: "거리" },
    { icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="#3B82F6" strokeWidth="1.5"/>
        <path d="M10 6V10L13 13" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ), value: formatDuration(durationSec), label: "시간" },
    { icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3C6.5 3 4 6 4 9C4 14 10 18 10 18C10 18 16 14 16 9C16 6 13.5 3 10 3Z" stroke="#EF4444" strokeWidth="1.5" fill="none"/>
        <circle cx="10" cy="9" r="2" stroke="#EF4444" strokeWidth="1.5"/>
      </svg>
    ), value: calories.toLocaleString(), label: "kcal" },
  ];

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
      <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">오늘의 이동</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-elevated)] flex items-center justify-center">
              {s.icon}
            </div>
            <p className="text-lg font-bold text-[var(--color-text)] num">{s.value}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";

interface Props {
  level: number;
  title: string;
  multiplier: number;
  currentStreak: number;
  dailyCap: number;
  daysUntilNext: number | null;
  shieldCount: number;
}

export default function StrideInfoCard({
  level,
  title,
  multiplier,
  currentStreak,
  dailyCap,
  daysUntilNext,
  shieldCount,
}: Props) {
  const progress = daysUntilNext !== null && daysUntilNext > 0
    ? Math.round(((currentStreak) / (currentStreak + daysUntilNext)) * 100)
    : 100;

  const badgeVariant = level >= 6 ? "purple" : level >= 4 ? "green" : level >= 2 ? "blue" : "gray";

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-elevated)] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2L13 7L18 7.5L14 11.5L15.5 17L11 14L6.5 17L8 11.5L4 7.5L9 7L11 2Z" fill={level >= 4 ? "#22C55E" : "#64748B"} fillOpacity="0.6"/>
              <path d="M11 2L13 7L18 7.5L14 11.5L15.5 17L11 14L6.5 17L8 11.5L4 7.5L9 7L11 2Z" stroke={level >= 4 ? "#22C55E" : "#94A3B8"} strokeWidth="1.2"/>
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Stride</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={badgeVariant} size="sm">Lv.{level}</Badge>
              <span className="text-sm font-bold text-[var(--color-text)]">{title}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[var(--color-primary)]">x{multiplier}</div>
          <div className="text-[10px] text-[var(--color-text-muted)]">SC 배율</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-[var(--color-surface-elevated)] rounded-xl p-2.5 text-center">
          <div className="text-base font-bold text-[var(--color-text)] num">{currentStreak}</div>
          <div className="text-[10px] text-[var(--color-text-muted)]">연속일</div>
        </div>
        <div className="bg-[var(--color-surface-elevated)] rounded-xl p-2.5 text-center">
          <div className="text-base font-bold text-[var(--color-text)] num">{dailyCap.toLocaleString()}</div>
          <div className="text-[10px] text-[var(--color-text-muted)]">일일 상한</div>
        </div>
        <div className="bg-[var(--color-surface-elevated)] rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L8.5 4.5L12 5L9.5 7.5L10.5 11L7 9L3.5 11L4.5 7.5L2 5L5.5 4.5L7 1Z" fill="#3B82F6" fillOpacity="0.5" stroke="#3B82F6" strokeWidth="0.8"/>
            </svg>
            <span className="text-base font-bold text-[var(--color-text)] num">{shieldCount}</span>
          </div>
          <div className="text-[10px] text-[var(--color-text-muted)]">보호권</div>
        </div>
      </div>

      {daysUntilNext !== null && daysUntilNext > 0 && (
        <ProgressBar
          value={progress}
          label={`다음 등급까지 ${daysUntilNext}일`}
        />
      )}
      {daysUntilNext === null && (
        <div className="text-center py-1">
          <span className="text-xs font-bold text-gradient-green">MAX 등급 달성!</span>
        </div>
      )}
    </div>
  );
}

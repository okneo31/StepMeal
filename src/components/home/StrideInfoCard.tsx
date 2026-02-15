"use client";

import Card from "@/components/ui/Card";
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

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500">Stride</h3>
        <Badge variant={level >= 4 ? "green" : level >= 2 ? "blue" : "gray"} size="md">
          Lv.{level} {title}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">SC 배율</span>
          <span className="font-bold text-[var(--color-primary)]">x{multiplier}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">연속 이동</span>
          <span className="font-bold num">{currentStreak}일</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">일일 상한</span>
          <span className="font-bold num">{dailyCap.toLocaleString()} SC</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">보호권</span>
          <span className="font-bold num">{shieldCount}개</span>
        </div>

        {daysUntilNext !== null && daysUntilNext > 0 && (
          <ProgressBar
            value={progress}
            label={`다음 등급까지 ${daysUntilNext}일`}
          />
        )}
        {daysUntilNext === null && (
          <p className="text-xs text-center text-[var(--color-primary)] font-semibold">MAX 등급 달성!</p>
        )}
      </div>
    </Card>
  );
}

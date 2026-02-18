"use client";

import { useEffect, useState } from "react";

interface BoosterData {
  active: boolean;
  multiplier?: number;
  boosterType?: string;
  productName?: string;
  remainingLabel?: string;
  remainingMin?: number;
}

export default function ActiveBoosterBadge() {
  const [booster, setBooster] = useState<BoosterData | null>(null);

  useEffect(() => {
    fetch("/api/booster/active")
      .then((r) => r.json())
      .then((data) => setBooster(data))
      .catch(() => {});
  }, []);

  if (!booster?.active) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-3 border border-amber-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L12 7H17L13 10.5L14.5 16L10 12.5L5.5 16L7 10.5L3 7H8L10 2Z" fill="#F59E0B" fillOpacity="0.4" stroke="#F59E0B" strokeWidth="1.2"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-[var(--color-text)]">SC 부스터 활성</span>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
                x{booster.multiplier}
              </span>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {booster.productName || "QR 스캔 보너스"} · 남은 시간: {booster.remainingLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { formatDistance, formatDuration } from "@/lib/geolocation";

function ResultContent() {
  const params = useSearchParams();
  const sc = parseInt(params.get("sc") || "0");
  const dist = parseInt(params.get("dist") || "0");
  const dur = parseInt(params.get("dur") || "0");
  const cal = parseInt(params.get("cal") || "0");

  return (
    <div>
      <Header title="이동 완료" />
      <div className="px-4 py-8 space-y-6">
        {/* SC earned hero */}
        <div className="text-center py-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[var(--color-primary)] opacity-[0.06] rounded-full blur-3xl" />
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/15 border-2 border-[var(--color-primary)]/30 flex items-center justify-center mx-auto mb-4">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 4L22 14L32 15L25 22L27 32L18 27L9 32L11 22L4 15L14 14L18 4Z" fill="#22C55E" fillOpacity="0.4" stroke="#22C55E" strokeWidth="1.5"/>
              </svg>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] mb-2">획득한 StepCoin</p>
            <p className="text-6xl font-bold text-gradient-green num">
              +{sc.toLocaleString()}
            </p>
            <p className="text-xl text-[var(--color-primary)] mt-1">SC</p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-4 uppercase tracking-wider">이동 요약</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-text-secondary)] text-sm">이동 거리</span>
              <span className="font-bold text-[var(--color-text)] num">{formatDistance(dist)}</span>
            </div>
            <div className="h-px bg-[var(--color-border)]" />
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-text-secondary)] text-sm">이동 시간</span>
              <span className="font-bold text-[var(--color-text)] num">{formatDuration(dur)}</span>
            </div>
            <div className="h-px bg-[var(--color-border)]" />
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-text-secondary)] text-sm">소모 칼로리</span>
              <span className="font-bold text-[var(--color-text)] num">{cal.toLocaleString()} kcal</span>
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

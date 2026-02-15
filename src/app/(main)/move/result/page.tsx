"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
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
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-2">획득한 StepCoin</p>
          <p className="text-6xl font-bold text-[var(--color-primary)] num">
            +{sc.toLocaleString()}
          </p>
          <p className="text-xl text-[var(--color-primary)] mt-1">SC</p>
        </div>

        {/* Stats */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-4">이동 요약</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">이동 거리</span>
              <span className="font-bold num">{formatDistance(dist)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">이동 시간</span>
              <span className="font-bold num">{formatDuration(dur)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">소모 칼로리</span>
              <span className="font-bold num">{cal.toLocaleString()} kcal</span>
            </div>
          </div>
        </Card>

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
    <Suspense fallback={<div className="flex items-center justify-center h-[60vh]">로딩 중...</div>}>
      <ResultContent />
    </Suspense>
  );
}

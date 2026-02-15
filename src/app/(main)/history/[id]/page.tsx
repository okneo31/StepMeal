"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { formatDistance, formatDuration } from "@/lib/geolocation";
import { TRANSPORT_CONFIG, WEATHER_BONUS, TIME_BONUS } from "@/lib/constants";
import { format } from "date-fns";

export default function HistoryDetailPage() {
  const params = useParams();
  const [movement, setMovement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/movement/history?page=1&limit=100`)
      .then((r) => r.json())
      .then((data) => {
        const found = data.movements?.find((m: any) => m.id === params.id);
        setMovement(found);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  if (!movement) {
    return (
      <div>
        <Header title="이동 상세" showBack />
        <div className="text-center py-12 text-gray-400">이동 기록을 찾을 수 없습니다.</div>
      </div>
    );
  }

  const segments = movement.segments || [];

  return (
    <div>
      <Header title="이동 상세" showBack />
      <div className="px-4 py-4 space-y-4">
        {/* SC Summary */}
        <Card className="text-center">
          <p className="text-sm text-gray-500">획득 SC</p>
          <p className="text-4xl font-bold text-[var(--color-primary)] num mt-1">+{movement.totalSc}</p>
          <p className="text-xs text-gray-400 mt-2">
            {format(new Date(movement.completedAt), "yyyy년 MM월 dd일 HH:mm")}
          </p>
        </Card>

        {/* Stats */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">이동 정보</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">총 거리</span>
              <span className="font-bold">{formatDistance(movement.distanceM)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">소요 시간</span>
              <span className="font-bold">{formatDuration(movement.durationSec)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">칼로리</span>
              <span className="font-bold">{Math.round(movement.calories)} kcal</span>
            </div>
          </div>
        </Card>

        {/* Segments */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">구간별 상세</h3>
          <div className="space-y-2">
            {segments.map((seg: any, i: number) => {
              const config = TRANSPORT_CONFIG[seg.transport];
              return (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{config?.emoji}</span>
                    <div>
                      <p className="text-sm font-medium">{config?.label}</p>
                      <p className="text-xs text-gray-500">{formatDistance(seg.distance)}</p>
                    </div>
                  </div>
                  <Badge variant="green">x{config?.multiplier}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* SC Breakdown */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">SC 계산 내역</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">기본 SC</span>
              <span className="num">{movement.baseSc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Stride 배율</span>
              <span className="num">x{movement.strideMult}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">시간 보너스</span>
              <span className="num">x{movement.timeMult} ({TIME_BONUS[movement.timeSlot as keyof typeof TIME_BONUS]?.label || '-'})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">날씨 보너스</span>
              <span className="num">x{movement.weatherMult}</span>
            </div>
            {movement.isMulti && (
              <div className="flex justify-between">
                <span className="text-gray-600">복합이동 보너스</span>
                <span className="num text-[var(--color-primary)] font-bold">x{movement.multiMult}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>최종 SC</span>
              <span className="text-[var(--color-primary)] num">{movement.totalSc} SC</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

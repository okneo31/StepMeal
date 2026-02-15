"use client";

import Card from "@/components/ui/Card";
import { formatDistance, formatDuration } from "@/lib/geolocation";

interface Props {
  distanceM: number;
  durationSec: number;
  calories: number;
}

export default function DailySummaryCard({ distanceM, durationSec, calories }: Props) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-500 mb-3">오늘의 이동</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900 num">{formatDistance(distanceM)}</p>
          <p className="text-xs text-gray-500">거리</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 num">{formatDuration(durationSec)}</p>
          <p className="text-xs text-gray-500">시간</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 num">{calories.toLocaleString()}</p>
          <p className="text-xs text-gray-500">kcal</p>
        </div>
      </div>
    </Card>
  );
}

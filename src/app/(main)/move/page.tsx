"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import TransportSelector from "@/components/move/TransportSelector";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useMovementStore } from "@/stores/movementStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import { estimateSc } from "@/lib/sc-calculator";
import type { TransportType } from "@/types";

export default function MovePage() {
  const router = useRouter();
  const [transport, setTransport] = useState<TransportType>("WALK");
  const [loading, setLoading] = useState(false);
  const { getCurrentPosition } = useGeolocation();
  const { startTracking, isTracking } = useMovementStore();

  // If already tracking, redirect to tracking page
  if (isTracking) {
    router.push("/move/tracking");
    return null;
  }

  const handleStart = async () => {
    setLoading(true);
    try {
      const pos = await getCurrentPosition();

      const res = await fetch("/api/movement/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transport,
          startLat: pos.lat,
          startLng: pos.lng,
        }),
      });

      const data = await res.json();
      if (data.id) {
        startTracking(data.id, transport);
        router.push("/move/tracking");
      }
    } catch (err) {
      alert("위치를 가져올 수 없습니다. GPS를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const est1km = estimateSc(1000, transport);
  const est3km = estimateSc(3000, transport);
  const est5km = estimateSc(5000, transport);

  return (
    <div>
      <Header title="이동" />
      <div className="px-4 py-4 space-y-4">
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">이동수단 선택</h3>
          <TransportSelector selected={transport} onSelect={setTransport} />
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">예상 SC 획득</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-500">1km</p>
              <p className="text-lg font-bold text-[var(--color-primary)] num">{est1km} SC</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-500">3km</p>
              <p className="text-lg font-bold text-[var(--color-primary)] num">{est3km} SC</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-500">5km</p>
              <p className="text-lg font-bold text-[var(--color-primary)] num">{est5km} SC</p>
            </div>
          </div>
        </Card>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
          GPS 추적을 위해 화면을 켜둔 상태로 이동해주세요.
        </div>

        <Button fullWidth size="lg" onClick={handleStart} loading={loading}>
          이동 시작
        </Button>
      </div>
    </div>
  );
}

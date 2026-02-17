"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import TransportSelector from "@/components/move/TransportSelector";
import Button from "@/components/ui/Button";
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
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">이동수단 선택</h3>
          <TransportSelector selected={transport} onSelect={setTransport} />
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">예상 SC 획득</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3">
              <p className="text-xs text-[var(--color-text-muted)]">1km</p>
              <p className="text-lg font-bold text-[var(--color-primary)] num">{est1km} SC</p>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3">
              <p className="text-xs text-[var(--color-text-muted)]">3km</p>
              <p className="text-lg font-bold text-[var(--color-primary)] num">{est3km} SC</p>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3">
              <p className="text-xs text-[var(--color-text-muted)]">5km</p>
              <p className="text-lg font-bold text-[var(--color-primary)] num">{est5km} SC</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-400">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="#F59E0B" strokeWidth="1.5"/>
              <path d="M9 6V10" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="13" r="0.75" fill="#F59E0B"/>
            </svg>
            GPS 추적을 위해 화면을 켜둔 상태로 이동해주세요.
          </div>
        </div>

        <Button fullWidth size="lg" onClick={handleStart} loading={loading}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
            <path d="M10 2L18 10L10 18L2 10L10 2Z" fill="currentColor" fillOpacity="0.3"/>
            <path d="M10 6V14M6 10H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          이동 시작
        </Button>
      </div>
    </div>
  );
}

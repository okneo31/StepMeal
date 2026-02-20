"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import TransportSelector from "@/components/move/TransportSelector";
import { useMovementStore } from "@/stores/movementStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import { formatDistance, formatDuration, formatSpeed, haversineDistance } from "@/lib/geolocation";
import { estimateSc } from "@/lib/sc-calculator";
import type { GpsPoint } from "@/types";

export default function TrackingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showTransportSwitch, setShowTransportSwitch] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPointRef = useRef<GpsPoint | null>(null);
  const totalDistanceRef = useRef(0);

  const {
    isTracking,
    movementId,
    currentTransport,
    totalDistance,
    elapsedSec,
    estimatedSc,
    startTime,
    addGpsPoint,
    updateDistance,
    updateElapsed,
    updateEstimatedSc,
    setTransport,
    finalizeSegment,
    reset,
  } = useMovementStore();

  const { position, error, startWatching, stopWatching } = useGeolocation();
  const completedRef = useRef(false);

  // Keep ref in sync with store
  useEffect(() => {
    totalDistanceRef.current = totalDistance;
  }, [totalDistance]);

  // Redirect if not tracking (skip if we just completed → navigating to result)
  useEffect(() => {
    if (completedRef.current) return;
    if (!isTracking || !movementId) {
      router.replace("/move");
    }
  }, [isTracking, movementId, router]);

  // Handle GPS updates - use refs to avoid stale closure
  const handleGpsUpdate = useCallback(
    (point: GpsPoint) => {
      if (lastPointRef.current) {
        const dist = haversineDistance(lastPointRef.current.lat, lastPointRef.current.lng, point.lat, point.lng);
        // Anti-cheat: skip if jump > 500m
        if (dist > 500) return;
        // Skip if too close (noise)
        if (dist < 2) return;

        const newTotal = totalDistanceRef.current + Math.round(dist);
        const store = useMovementStore.getState();
        updateDistance(newTotal);
        updateEstimatedSc(estimateSc(newTotal, store.currentTransport));
      }
      lastPointRef.current = point;
      addGpsPoint(point);
    },
    [addGpsPoint, updateDistance, updateEstimatedSc]
  );

  // Start watching GPS
  useEffect(() => {
    if (isTracking) {
      startWatching(handleGpsUpdate);
    }
    return () => stopWatching();
  }, [isTracking, startWatching, handleGpsUpdate, stopWatching]);

  // Timer
  useEffect(() => {
    if (isTracking && startTime) {
      timerRef.current = setInterval(() => {
        updateElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTracking, startTime, updateElapsed]);

  const handleComplete = async () => {
    setLoading(true);
    stopWatching();

    // Finalize current segment
    const lastSeg = finalizeSegment();
    const store = useMovementStore.getState();
    const segments = store.segments;

    if (segments.length === 0 && !lastSeg) {
      alert("이동 데이터가 없습니다. 최소 몇 초 이상 이동해주세요.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/movement/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movementId,
          segments,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        completedRef.current = true;
        const msParam = data.milestones ? `&ms=${encodeURIComponent(JSON.stringify(data.milestones))}` : "";
        router.push(`/move/result?mid=${movementId}&sc=${data.sc.totalSc}&dist=${data.totalDistance}&dur=${data.totalDuration}&cal=${data.calories}${msParam}`);
        reset();
      } else {
        alert(data.error || "이동 완료 처리 중 오류가 발생했습니다.");
      }
    } catch {
      alert("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm("이동을 취소하시겠습니까? 획득한 SC가 없어집니다.")) {
      stopWatching();
      reset();
      router.replace("/move");
    }
  };

  const currentSpeed = position?.speed ? position.speed * 3.6 : 0;

  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      {/* Top status */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              <span className="text-sm opacity-90">이동 중</span>
            </div>
            <span className="text-sm font-mono bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
              {formatDuration(elapsedSec)}
            </span>
          </div>
          <div className="text-center">
            <p className="text-5xl font-bold num">{formatDistance(totalDistance)}</p>
            <p className="text-sm opacity-80 mt-1">이동 거리</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-4 -mt-4">
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)] grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-[var(--color-primary)] num">{estimatedSc}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">예상 SC</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--color-text)] num">{formatSpeed(currentSpeed)}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">현재 속도</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--color-text)] num">{currentTransport}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">이동수단</p>
          </div>
        </div>
      </div>

      {/* GPS Error */}
      {error && (
        <div className="mx-4 mt-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Transport switch */}
      <div className="px-4 mt-4">
        <button
          onClick={() => setShowTransportSwitch(!showTransportSwitch)}
          className="text-sm text-[var(--color-primary)] font-medium flex items-center gap-1"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 5L8 2L14 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 11L8 14L14 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {showTransportSwitch ? "닫기" : "이동수단 변경"}
        </button>
        {showTransportSwitch && (
          <div className="mt-2">
            <TransportSelector selected={currentTransport} onSelect={(t) => { setTransport(t); setShowTransportSwitch(false); }} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-[var(--color-border)] safe-bottom">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            취소
          </Button>
          <Button onClick={handleComplete} loading={loading} className="flex-[2]">
            이동 완료
          </Button>
        </div>
      </div>
    </div>
  );
}

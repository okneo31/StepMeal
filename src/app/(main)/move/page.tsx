"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import TransportSelector from "@/components/move/TransportSelector";
import EquippedGearSummary from "@/components/move/EquippedGearSummary";
import Button from "@/components/ui/Button";
import { useMovementStore } from "@/stores/movementStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import { estimateSc } from "@/lib/sc-calculator";
import type { TransportType } from "@/types";

export default function MovePage() {
  const router = useRouter();
  const [transport, setTransport] = useState<TransportType>("WALK");
  const [loading, setLoading] = useState(false);
  const [activeQuest, setActiveQuest] = useState<{ id: string; destName: string; status: string } | null>(null);
  const { getCurrentPosition } = useGeolocation();
  const { startTracking, isTracking } = useMovementStore();

  // Check for active quest
  useEffect(() => {
    fetch("/api/quest/active")
      .then((r) => r.json())
      .then((data) => {
        if (data?.quest) {
          setActiveQuest({ id: data.quest.id, destName: data.quest.destName, status: data.quest.status });
        }
      })
      .catch(() => {});
  }, []);

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
        <EquippedGearSummary />

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

        {/* Active Quest Banner */}
        {activeQuest && (
          <button
            onClick={() => router.push("/move/quest")}
            className="w-full bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2C5.5 2 3 4.5 3 7C3 11 8 14 8 14C8 14 13 11 13 7C13 4.5 10.5 2 8 2Z" stroke="#22C55E" strokeWidth="1.3"/>
                    <circle cx="8" cy="7" r="1.5" stroke="#22C55E" strokeWidth="1.3"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-400">
                    {activeQuest.status === "ARRIVED" ? "도착 완료!" : "진행 중인 퀘스트"}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">{activeQuest.destName}</p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        )}

        <div className="flex gap-3">
          <Button fullWidth size="lg" variant="outline" onClick={() => router.push("/move/quest")}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="mr-1.5">
              <path d="M9 2C6 2 3 5 3 8C3 12 9 16 9 16C9 16 15 12 15 8C15 5 12 2 9 2Z" stroke="currentColor" strokeWidth="1.3"/>
              <circle cx="9" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            {activeQuest ? "퀘스트 이어하기" : "목적지 설정"}
          </Button>
          <Button fullWidth size="lg" onClick={handleStart} loading={loading}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
              <path d="M10 2L18 10L10 18L2 10L10 2Z" fill="currentColor" fillOpacity="0.3"/>
              <path d="M10 6V14M6 10H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            이동 시작
          </Button>
        </div>

        {/* Course Quest Link */}
        <button
          onClick={() => router.push("/move/course")}
          className="w-full bg-[var(--color-surface)] rounded-2xl p-3.5 border border-blue-500/20 flex items-center justify-between hover:border-blue-500/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="5" cy="5" r="2.5" stroke="#3B82F6" strokeWidth="1.5"/>
                <circle cx="15" cy="8" r="2.5" stroke="#3B82F6" strokeWidth="1.5"/>
                <circle cx="10" cy="16" r="2.5" stroke="#3B82F6" strokeWidth="1.5"/>
                <path d="M7 6L13 7.5M13.5 10L11 14" stroke="#3B82F6" strokeWidth="1" strokeDasharray="2 2"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[var(--color-text)]">코스 퀘스트</p>
              <p className="text-xs text-[var(--color-text-muted)]">여러 장소를 순회하고 보상 받기</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

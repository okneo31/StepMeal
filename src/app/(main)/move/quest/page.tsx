"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import PlaceSearchInput, { type PlaceResult } from "@/components/quest/PlaceSearchInput";
import QuestNavigationMap from "@/components/quest/QuestNavigationMap";
import ArrivalBanner from "@/components/quest/ArrivalBanner";
import PhotoReviewModal from "@/components/quest/PhotoReviewModal";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { useGeolocation } from "@/hooks/useGeolocation";

type QuestPhase = "loading" | "search" | "navigating" | "arrived" | "completed";

function QuestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getCurrentPosition } = useGeolocation();

  const [phase, setPhase] = useState<QuestPhase>("loading");
  const [questId, setQuestId] = useState<string | null>(searchParams.get("questId"));
  const [dest, setDest] = useState<{ name: string; lat: number; lng: number; address?: string } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceM, setDistanceM] = useState<number | undefined>();
  const [starting, setStarting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [bonus, setBonus] = useState<{ arrivalBonus: number; reviewBonus: number; totalBonus: number } | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Restore active quest from DB on mount
  useEffect(() => {
    let cancelled = false;

    async function restoreQuest() {
      try {
        const [questRes, pos] = await Promise.allSettled([
          fetch("/api/quest/active").then((r) => r.json()),
          getCurrentPosition(),
        ]);

        if (cancelled) return;

        if (pos.status === "fulfilled") {
          setCurrentPos(pos.value);
        }

        const questData = questRes.status === "fulfilled" ? questRes.value : null;

        if (questData?.quest) {
          const q = questData.quest;
          setQuestId(q.id);
          setDest({
            name: q.destName,
            lat: q.destLat,
            lng: q.destLng,
            address: q.destAddress || undefined,
          });

          if (q.status === "ARRIVED") {
            setPhase("arrived");
          } else {
            setPhase("navigating");
          }
        } else {
          setPhase("search");
        }
      } catch {
        if (!cancelled) setPhase("search");
      }
    }

    restoreQuest();
    return () => { cancelled = true; };
  }, [getCurrentPosition]);

  const handlePlaceSelect = (place: PlaceResult) => {
    setDest({ name: place.name, lat: place.lat, lng: place.lng, address: place.address });
  };

  const handleStartQuest = async () => {
    if (!dest) return;
    setStarting(true);

    try {
      const res = await fetch("/api/quest/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destName: dest.name,
          destLat: dest.lat,
          destLng: dest.lng,
          destAddress: dest.address,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setQuestId(data.questId);
        setPhase("navigating");
      } else {
        alert(data.error || "퀘스트 시작에 실패했습니다.");
      }
    } catch {
      alert("서버 오류가 발생했습니다.");
    } finally {
      setStarting(false);
    }
  };

  const handleVerifyArrival = async () => {
    if (!questId) return;
    setVerifying(true);

    try {
      const pos = await getCurrentPosition();
      setCurrentPos(pos);

      const res = await fetch("/api/quest/verify-arrival", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId, lat: pos.lat, lng: pos.lng }),
      });

      const data = await res.json();
      setDistanceM(data.distanceM);

      if (data.arrived) {
        setBonus({ arrivalBonus: data.arrivalBonus || 0, reviewBonus: 0, totalBonus: data.arrivalBonus || 0 });
        setPhase("arrived");
        setShowReview(true);
      } else {
        alert(data.message || "아직 목적지에 도착하지 않았습니다.");
      }
    } catch {
      alert("위치를 가져올 수 없습니다. GPS를 확인해주세요.");
    } finally {
      setVerifying(false);
    }
  };

  const handleCancelQuest = useCallback(async () => {
    if (!questId || cancelling) return;
    setCancelling(true);

    try {
      await fetch("/api/quest/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
    } catch {
      // ignore - reset UI anyway
    }

    setQuestId(null);
    setDest(null);
    setDistanceM(undefined);
    setPhase("search");
    setCancelling(false);
  }, [questId, cancelling]);

  const handleReviewSubmitted = (result: { arrivalBonus: number; reviewBonus: number; totalBonus: number }) => {
    setBonus(result);
    setShowReview(false);
    setPhase("completed");
  };

  const handleSkipReview = async () => {
    setShowReview(false);
    // Complete quest in DB without review
    if (questId) {
      try {
        await fetch("/api/quest/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questId }),
        });
      } catch {
        // ignore - complete UI anyway
      }
    }
    setPhase("completed");
  };

  // Loading state while restoring quest
  if (phase === "loading") {
    return (
      <div>
        <Header title="네비게이션 퀘스트" showBack />
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="text-sm text-[var(--color-text-muted)] mt-3">퀘스트 상태 확인 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="네비게이션 퀘스트" showBack />
      <div className="px-4 py-4 space-y-4">

        {/* Search Phase */}
        {phase === "search" && (
          <>
            <PlaceSearchInput
              onSelect={handlePlaceSelect}
              currentLat={currentPos?.lat}
              currentLng={currentPos?.lng}
            />

            {dest && (
              <>
                <QuestNavigationMap
                  destLat={dest.lat}
                  destLng={dest.lng}
                  destName={dest.name}
                  currentLat={currentPos?.lat}
                  currentLng={currentPos?.lng}
                />

                <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{dest.name}</p>
                  {dest.address && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{dest.address}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1L9 4.5L13 5L10 8L11 12L7 10L3 12L4 8L1 5L5 4.5L7 1Z" stroke="currentColor" strokeWidth="1"/>
                    </svg>
                    도착 시 +50 SC 보너스 · 리뷰 작성 +20 SC 보너스
                  </div>
                </div>

                <Button fullWidth size="lg" onClick={handleStartQuest} loading={starting}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="mr-2">
                    <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15"/>
                    <path d="M9 7V11M7 9H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  퀘스트 시작
                </Button>
              </>
            )}
          </>
        )}

        {/* Navigating Phase */}
        {phase === "navigating" && dest && (
          <>
            <QuestNavigationMap
              destLat={dest.lat}
              destLng={dest.lng}
              destName={dest.name}
              currentLat={currentPos?.lat}
              currentLng={currentPos?.lng}
            />

            <ArrivalBanner
              arrived={false}
              distanceM={distanceM}
              onVerify={handleVerifyArrival}
              verifying={verifying}
            />

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-400">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#F59E0B" strokeWidth="1.2"/>
                  <path d="M8 5V9" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round"/>
                  <circle cx="8" cy="11" r="0.6" fill="#F59E0B"/>
                </svg>
                목적지 근처에서 &quot;도착 인증&quot; 버튼을 눌러주세요
              </div>
            </div>

            <Button fullWidth variant="outline" onClick={handleCancelQuest} loading={cancelling}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-1.5">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              퀘스트 취소
            </Button>
          </>
        )}

        {/* Arrived Phase */}
        {phase === "arrived" && dest && (
          <>
            <ArrivalBanner arrived={true} distanceM={0} onVerify={() => {}} verifying={false} />
            <Button fullWidth size="lg" onClick={() => setShowReview(true)}>
              리뷰 작성하기 (+20 SC)
            </Button>
            <Button fullWidth variant="outline" onClick={handleSkipReview}>
              건너뛰기
            </Button>
          </>
        )}

        {/* Completed Phase */}
        {phase === "completed" && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M10 18L16 24L26 12" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-lg font-bold text-[var(--color-text)] mb-2">퀘스트 완료!</p>
            {bonus && bonus.totalBonus > 0 && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4 inline-block">
                <p className="text-2xl font-bold text-green-400 num">+{bonus.totalBonus} SC</p>
                <p className="text-xs text-green-400/60 mt-1">
                  도착 +{bonus.arrivalBonus} · 리뷰 +{bonus.reviewBonus}
                </p>
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <Button fullWidth variant="outline" onClick={() => router.push("/move")}>
                이동 시작
              </Button>
              <Button fullWidth onClick={() => router.push("/home")}>
                홈으로
              </Button>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReview && questId && dest && (
          <PhotoReviewModal
            questId={questId}
            destName={dest.name}
            onClose={handleSkipReview}
            onSubmitted={handleReviewSubmitted}
          />
        )}
      </div>
    </div>
  );
}

export default function QuestPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><Spinner size="lg" /></div>}>
      <QuestContent />
    </Suspense>
  );
}

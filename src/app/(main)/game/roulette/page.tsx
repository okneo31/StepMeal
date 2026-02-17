"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import RouletteWheel from "@/components/game/RouletteWheel";
import Spinner from "@/components/ui/Spinner";
import { ROULETTE_REWARDS } from "@/lib/constants";

interface RouletteStatus {
  remainingPlays: number;
  dailyLimit: number;
  costSc: number;
  scBalance: number;
}

export default function RoulettePage() {
  const [status, setStatus] = useState<RouletteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [resultIndex, setResultIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultReward, setResultReward] = useState<typeof ROULETTE_REWARDS[0] | null>(null);
  const [error, setError] = useState("");

  const fetchStatus = useCallback(() => {
    fetch("/api/game/roulette/status")
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSpin = async () => {
    if (spinning || !status) return;
    setError("");
    setShowResult(false);
    setResultIndex(null);
    setSpinning(true);

    try {
      const res = await fetch("/api/game/roulette/spin", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setSpinning(false);
        return;
      }

      setResultReward(data.reward);
      setResultIndex(data.slotIndex);
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              remainingPlays: data.remainingPlays,
              scBalance: data.newScBalance,
            }
          : prev
      );
    } catch {
      setError("서버 오류가 발생했습니다.");
      setSpinning(false);
    }
  };

  const handleSpinComplete = () => {
    setSpinning(false);
    setShowResult(true);
  };

  const handleClose = () => {
    setShowResult(false);
    setResultIndex(null);
    setResultReward(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const canSpin = status && status.remainingPlays > 0 && status.scBalance >= status.costSc;

  return (
    <div>
      <Header title="럭키 룰렛" showBack />
      <div className="px-4 py-4 space-y-4">
        {/* Status */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-purple-500/20 glow-purple">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">남은 횟수</p>
              <p className="text-lg font-bold text-[var(--color-text)] num">
                {status?.remainingPlays || 0} / {status?.dailyLimit || 5}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-muted)]">참여 비용</p>
              <p className="text-lg font-bold text-green-400 num">{status?.costSc || 50} SC</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-muted)]">보유 SC</p>
              <p className="text-lg font-bold text-green-400 num">
                {(status?.scBalance || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Wheel */}
        <div className="py-4">
          <RouletteWheel
            spinning={spinning}
            resultIndex={resultIndex}
            onSpinComplete={handleSpinComplete}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Result Modal */}
        {showResult && resultReward && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] w-full max-w-sm p-6 text-center">
              <div className="py-4">
                <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  resultReward.type === "NONE" ? "bg-[var(--color-surface-elevated)]" : "bg-[var(--color-primary)]/15"
                }`}>
                  {resultReward.type === "NONE" ? (
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                      <circle cx="18" cy="18" r="12" stroke="#64748B" strokeWidth="2"/>
                      <path d="M12 12L24 24M24 12L12 24" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                      <path d="M18 4L22 14L32 15L25 22L27 32L18 27L9 32L11 22L4 15L14 14L18 4Z" fill="#22C55E" fillOpacity="0.4" stroke="#22C55E" strokeWidth="1.5"/>
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text)] mb-1">
                  {resultReward.type === "NONE" ? "아쉽네요!" : "축하합니다!"}
                </h3>
                <p className="text-lg font-semibold" style={{ color: resultReward.color }}>
                  {resultReward.label}
                  {resultReward.type === "SHIELD" && " 획득!"}
                  {resultReward.type !== "NONE" && resultReward.type !== "SHIELD" && " 획득!"}
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">
                  남은 횟수: {status?.remainingPlays || 0}회
                </p>
                <Button
                  fullWidth
                  className="mt-4"
                  onClick={handleClose}
                >
                  확인
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Spin Button */}
        <Button
          fullWidth
          size="lg"
          onClick={handleSpin}
          disabled={!canSpin || spinning}
          loading={spinning}
        >
          {!status || status.remainingPlays <= 0
            ? "오늘의 횟수를 모두 사용했습니다"
            : status.scBalance < status.costSc
            ? "SC가 부족합니다"
            : `${status.costSc} SC로 돌리기`}
        </Button>

        {/* Reward Table */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">보상 확률표</h3>
          <div className="space-y-2">
            {ROULETTE_REWARDS.map((reward, i) => {
              const totalWeight = ROULETTE_REWARDS.reduce((s, r) => s + r.weight, 0);
              const pct = ((reward.weight / totalWeight) * 100).toFixed(1);
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: reward.color }}
                    />
                    <span className="text-[var(--color-text-secondary)]">{reward.label}</span>
                  </div>
                  <span className="text-[var(--color-text-muted)] num">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
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

      // Trigger wheel animation to land on the slot
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
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">남은 횟수</p>
              <p className="text-lg font-bold num">
                {status?.remainingPlays || 0} / {status?.dailyLimit || 5}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">참여 비용</p>
              <p className="text-lg font-bold text-green-700 num">{status?.costSc || 50} SC</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">보유 SC</p>
              <p className="text-lg font-bold text-green-700 num">
                {(status?.scBalance || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

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
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Result Modal */}
        {showResult && resultReward && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm text-center">
              <div className="py-4">
                <p className="text-5xl mb-3">
                  {resultReward.type === "NONE" ? "😢" : "🎉"}
                </p>
                <h3 className="text-xl font-bold mb-1">
                  {resultReward.type === "NONE" ? "아쉽네요!" : "축하합니다!"}
                </h3>
                <p className="text-lg font-semibold" style={{ color: resultReward.color }}>
                  {resultReward.label}
                  {resultReward.type === "SHIELD" && " 획득!"}
                  {resultReward.type !== "NONE" && resultReward.type !== "SHIELD" && " 획득!"}
                </p>
                <p className="text-sm text-gray-500 mt-2">
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
            </Card>
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
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">보상 확률표</h3>
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
                    <span className="text-gray-700">{reward.label}</span>
                  </div>
                  <span className="text-gray-400 num">{pct}%</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

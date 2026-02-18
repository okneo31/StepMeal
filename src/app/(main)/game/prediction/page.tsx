"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

interface Target {
  km: number;
  multiplier: number;
}

interface ActivePrediction {
  id: string;
  targetKm: number;
  multiplier: number;
  betAmount: number;
}

interface HistoryItem {
  id: string;
  targetKm: number;
  betAmount: number;
  payout: number;
  status: string;
  createdAt: string;
}

interface PredictionData {
  activePrediction: ActivePrediction | null;
  todayDistanceM: number;
  scBalance: number;
  targets: Target[];
  betAmounts: number[];
  history: HistoryItem[];
}

export default function PredictionPage() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(50);
  const [submitting, setSubmitting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [showWin, setShowWin] = useState(false);
  const [winPayout, setWinPayout] = useState(0);

  const fetchData = useCallback(() => {
    fetch("/api/game/prediction")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (!selectedTarget && d.targets?.length > 0) {
          setSelectedTarget(d.targets[0].km);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedTarget]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreatePrediction = async () => {
    if (!selectedTarget || submitting) return;
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/game/prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetKm: selectedTarget, betAmount }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      setData((prev) =>
        prev
          ? { ...prev, activePrediction: result.prediction, scBalance: result.scBalance }
          : prev
      );
    } catch {
      setError("서버 오류가 발생했습니다.");
    }
    setSubmitting(false);
  };

  const handleClaim = async () => {
    if (!data?.activePrediction || claiming) return;
    setError("");
    setClaiming(true);

    try {
      const res = await fetch("/api/game/prediction", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predictionId: data.activePrediction.id }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error);
        setClaiming(false);
        return;
      }

      setWinPayout(result.payout);
      setShowWin(true);
      setData((prev) =>
        prev
          ? { ...prev, activePrediction: null, scBalance: result.scBalance }
          : prev
      );
    } catch {
      setError("서버 오류가 발생했습니다.");
    }
    setClaiming(false);
  };

  if (loading) {
    return (
      <div>
        <Header title="걸음수 예측" showBack />
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      </div>
    );
  }

  const todayKm = (data?.todayDistanceM || 0) / 1000;
  const prediction = data?.activePrediction;
  const progress = prediction ? Math.min(100, (todayKm / prediction.targetKm) * 100) : 0;
  const targetMet = prediction ? todayKm >= prediction.targetKm : false;

  return (
    <div>
      <Header title="걸음수 예측" showBack />
      <div className="px-4 py-4 space-y-4">
        {/* Today's Distance */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-5 border border-green-500/20 text-center">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">오늘 이동 거리</p>
          <p className="text-3xl font-bold text-green-400 num">{todayKm.toFixed(2)} km</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            보유 SC: <span className="text-green-400 font-semibold num">{(data?.scBalance || 0).toLocaleString()}</span>
          </p>
        </div>

        {prediction ? (
          /* Active Prediction */
          <div className="bg-[var(--color-surface)] rounded-2xl p-5 border border-[var(--color-primary)]/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[var(--color-text)]">진행 중인 예측</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30 font-semibold">
                {prediction.multiplier}배
              </span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--color-text-secondary)]">
                목표: <span className="font-bold text-[var(--color-text)]">{prediction.targetKm} km</span>
              </span>
              <span className="text-[var(--color-text-secondary)]">
                베팅: <span className="font-bold text-green-400">{prediction.betAmount} SC</span>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="bg-[var(--color-bg)] rounded-full h-4 overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  targetMet ? "bg-green-500" : "bg-[var(--color-primary)]"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
              <span>{todayKm.toFixed(2)} km</span>
              <span>{prediction.targetKm} km</span>
            </div>

            {targetMet ? (
              <div className="mt-4">
                <p className="text-center text-sm text-green-400 font-semibold mb-3">
                  목표 달성! 보상을 받으세요!
                </p>
                <Button
                  fullWidth
                  onClick={handleClaim}
                  loading={claiming}
                >
                  보상 받기 (+{Math.floor(prediction.betAmount * prediction.multiplier)} SC)
                </Button>
              </div>
            ) : (
              <div className="mt-4 text-center">
                <p className="text-sm text-[var(--color-text-muted)]">
                  목표까지 <span className="text-[var(--color-primary)] font-bold">{(prediction.targetKm - todayKm).toFixed(2)} km</span> 남았습니다
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  오늘 자정까지 목표를 달성하세요!
                </p>
              </div>
            )}
          </div>
        ) : (
          /* New Prediction */
          <>
            <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">목표 거리 선택</p>
              <div className="grid grid-cols-4 gap-2">
                {(data?.targets || []).map((t) => (
                  <button
                    key={t.km}
                    onClick={() => setSelectedTarget(t.km)}
                    className={`py-3 rounded-xl text-center transition-all ${
                      selectedTarget === t.km
                        ? "bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/40"
                        : "bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-border-light)]"
                    }`}
                  >
                    <p className={`text-lg font-bold ${selectedTarget === t.km ? "text-[var(--color-primary)]" : "text-[var(--color-text)]"}`}>
                      {t.km}km
                    </p>
                    <p className={`text-xs font-semibold ${selectedTarget === t.km ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}`}>
                      {t.multiplier}배
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">베팅 금액 (SC)</p>
              <div className="grid grid-cols-4 gap-2">
                {(data?.betAmounts || []).map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                      betAmount === amount
                        ? "bg-green-500/20 text-green-400 border border-green-500/40"
                        : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                    }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            {selectedTarget && (
              <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3 text-center">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <span className="font-bold text-green-400">{betAmount} SC</span> 베팅 →
                  목표 달성 시 <span className="font-bold text-[var(--color-primary)]">
                    {Math.floor(betAmount * (data?.targets.find((t) => t.km === selectedTarget)?.multiplier || 1))} SC
                  </span> 획득
                </p>
              </div>
            )}

            <Button
              fullWidth
              size="lg"
              onClick={handleCreatePrediction}
              disabled={!selectedTarget || submitting || (data?.scBalance || 0) < betAmount}
              loading={submitting}
            >
              {(data?.scBalance || 0) < betAmount ? "SC가 부족합니다" : "예측 시작"}
            </Button>
          </>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Rules */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">규칙</p>
          <ul className="space-y-1.5 text-sm text-[var(--color-text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
              오늘 이동할 거리를 예측하고 SC를 베팅
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] flex-shrink-0 mt-1.5" />
              목표 달성 시 배율에 따라 SC 보상
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
              자정까지 미달성 시 베팅 금액 소멸
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] flex-shrink-0 mt-1.5" />
              하루 1회 예측 가능
            </li>
          </ul>
        </div>

        {/* History */}
        {data?.history && data.history.length > 0 && (
          <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">최근 기록</p>
            <div className="space-y-2">
              {data.history.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${h.status === "WON" ? "bg-green-400" : "bg-red-400"}`} />
                    <span className="text-[var(--color-text-secondary)]">{h.targetKm}km · {h.betAmount} SC</span>
                  </div>
                  <span className={`font-semibold ${h.status === "WON" ? "text-green-400" : "text-red-400"}`}>
                    {h.status === "WON" ? `+${h.payout} SC` : "실패"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Win Modal */}
        {showWin && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] w-full max-w-sm p-6 text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-green-500/15">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <circle cx="18" cy="18" r="14" stroke="#22C55E" strokeWidth="2"/>
                  <path d="M11 18L16 23L25 13" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text)] mb-1">목표 달성!</h3>
              <p className="text-lg font-bold text-green-400">+{winPayout} SC</p>
              <Button fullWidth className="mt-4" onClick={() => { setShowWin(false); fetchData(); }}>
                확인
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

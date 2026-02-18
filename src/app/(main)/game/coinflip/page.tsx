"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

const BET_AMOUNTS = [10, 30, 50, 100];

interface Status {
  mcBalance: number;
  remainingPlays: number;
  dailyLimit: number;
}

export default function CoinFlipPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [betAmount, setBetAmount] = useState(10);
  const [flipping, setFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{
    coinResult: string;
    pick: string;
    isWin: boolean;
    payout: number;
  } | null>(null);
  const [error, setError] = useState("");

  const fetchStatus = useCallback(() => {
    fetch("/api/game/coinflip")
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleFlip = async (pick: "heads" | "tails") => {
    if (flipping || !status) return;
    setError("");
    setShowResult(false);
    setFlipResult(null);
    setFlipping(true);

    try {
      const res = await fetch("/api/game/coinflip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount, pick }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setFlipping(false);
        return;
      }

      setLastResult(data);
      setStatus((prev) =>
        prev
          ? { ...prev, mcBalance: data.mcBalance, remainingPlays: data.remainingPlays }
          : prev
      );

      // Animate coin flip
      setTimeout(() => {
        setFlipResult(data.coinResult);
      }, 300);

      setTimeout(() => {
        setFlipping(false);
        setShowResult(true);
      }, 1500);
    } catch {
      setError("서버 오류가 발생했습니다.");
      setFlipping(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="코인 플립" showBack />
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      </div>
    );
  }

  const canPlay = status && status.remainingPlays > 0 && status.mcBalance >= betAmount;

  return (
    <div>
      <Header title="코인 플립" showBack />
      <div className="px-4 py-4 space-y-4">
        {/* Status */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-amber-500/20">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">남은 횟수</p>
              <p className="text-lg font-bold text-[var(--color-text)] num">
                {status?.remainingPlays || 0} / {status?.dailyLimit || 10}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-muted)]">보유 MC</p>
              <p className="text-lg font-bold text-amber-400 num">
                {(status?.mcBalance || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Coin Visual */}
        <div className="flex justify-center py-6">
          <div
            className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${
              flipping
                ? "animate-spin border-amber-400 bg-amber-500/20"
                : flipResult === "heads"
                ? "border-amber-400 bg-amber-500/15"
                : flipResult === "tails"
                ? "border-blue-400 bg-blue-500/15"
                : "border-[var(--color-border)] bg-[var(--color-surface)]"
            }`}
            style={flipping ? { animationDuration: "0.3s" } : {}}
          >
            {flipResult ? (
              <div className="text-center">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  {flipResult === "heads" ? (
                    <>
                      <circle cx="20" cy="20" r="16" stroke="#F59E0B" strokeWidth="2" fill="#F59E0B" fillOpacity="0.2"/>
                      <text x="20" y="24" textAnchor="middle" fill="#F59E0B" fontSize="14" fontWeight="bold">H</text>
                    </>
                  ) : (
                    <>
                      <circle cx="20" cy="20" r="16" stroke="#3B82F6" strokeWidth="2" fill="#3B82F6" fillOpacity="0.2"/>
                      <text x="20" y="24" textAnchor="middle" fill="#3B82F6" fontSize="14" fontWeight="bold">T</text>
                    </>
                  )}
                </svg>
                <p className={`text-sm font-bold mt-1 ${flipResult === "heads" ? "text-amber-400" : "text-blue-400"}`}>
                  {flipResult === "heads" ? "앞면" : "뒷면"}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="16" stroke="#64748B" strokeWidth="2" strokeDasharray="4 3"/>
                  <text x="20" y="24" textAnchor="middle" fill="#64748B" fontSize="14" fontWeight="bold">?</text>
                </svg>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">선택하세요</p>
              </div>
            )}
          </div>
        </div>

        {/* Bet Amount */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">베팅 금액 (MC)</p>
          <div className="grid grid-cols-4 gap-2">
            {BET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount)}
                disabled={flipping}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                  betAmount === amount
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-light)]"
                }`}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Pick Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleFlip("heads")}
            disabled={!canPlay || flipping}
            className="py-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-lg hover:bg-amber-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="mx-auto mb-1">
              <circle cx="14" cy="14" r="11" stroke="#F59E0B" strokeWidth="1.5" fill="#F59E0B" fillOpacity="0.15"/>
              <text x="14" y="18" textAnchor="middle" fill="#F59E0B" fontSize="12" fontWeight="bold">H</text>
            </svg>
            앞면
          </button>
          <button
            onClick={() => handleFlip("tails")}
            disabled={!canPlay || flipping}
            className="py-4 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold text-lg hover:bg-blue-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="mx-auto mb-1">
              <circle cx="14" cy="14" r="11" stroke="#3B82F6" strokeWidth="1.5" fill="#3B82F6" fillOpacity="0.15"/>
              <text x="14" y="18" textAnchor="middle" fill="#3B82F6" fontSize="12" fontWeight="bold">T</text>
            </svg>
            뒷면
          </button>
        </div>

        {!canPlay && status && (
          <p className="text-center text-sm text-[var(--color-text-muted)]">
            {status.remainingPlays <= 0
              ? "오늘의 횟수를 모두 사용했습니다"
              : "MC가 부족합니다"}
          </p>
        )}

        {/* Rules */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">규칙</p>
          <ul className="space-y-1.5 text-sm text-[var(--color-text-secondary)]">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              앞면 또는 뒷면을 선택하여 MC를 베팅
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              맞추면 <span className="text-green-400 font-semibold">2배</span> MC 획득
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] flex-shrink-0" />
              하루 최대 10회
            </li>
          </ul>
        </div>

        {/* Result Modal */}
        {showResult && lastResult && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] w-full max-w-sm p-6 text-center">
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                lastResult.isWin ? "bg-green-500/15" : "bg-red-500/10"
              }`}>
                {lastResult.isWin ? (
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="18" r="14" stroke="#22C55E" strokeWidth="2"/>
                    <path d="M11 18L16 23L25 13" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="18" r="14" stroke="#EF4444" strokeWidth="2"/>
                    <path d="M12 12L24 24M24 12L12 24" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text)] mb-1">
                {lastResult.isWin ? "당첨!" : "아쉽네요!"}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                결과: <span className="font-bold">{lastResult.coinResult === "heads" ? "앞면" : "뒷면"}</span>
              </p>
              {lastResult.isWin && (
                <p className="text-lg font-bold text-green-400">+{lastResult.payout} MC</p>
              )}
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                남은 횟수: {status?.remainingPlays || 0}회
              </p>
              <Button fullWidth className="mt-4" onClick={() => setShowResult(false)}>
                확인
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

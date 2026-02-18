"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

const BET_AMOUNTS = [10, 30, 50, 100];

interface Status {
  scBalance: number;
  mcBalance: number;
  remainingPlays: number;
  dailyLimit: number;
}

// Dice face SVG dots positions
const DICE_DOTS: Record<number, [number, number][]> = {
  1: [[25, 25]],
  2: [[12, 12], [38, 38]],
  3: [[12, 12], [25, 25], [38, 38]],
  4: [[12, 12], [38, 12], [12, 38], [38, 38]],
  5: [[12, 12], [38, 12], [25, 25], [12, 38], [38, 38]],
  6: [[12, 12], [38, 12], [12, 25], [38, 25], [12, 38], [38, 38]],
};

function DiceFace({ value, rolling }: { value: number | null; rolling: boolean }) {
  const dots = value ? DICE_DOTS[value] || [] : [];
  return (
    <div className={`w-28 h-28 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${
      rolling
        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 animate-bounce"
        : value
        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
        : "border-[var(--color-border)] bg-[var(--color-surface)]"
    }`}>
      {rolling ? (
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" className="animate-spin" style={{ animationDuration: "0.5s" }}>
          <rect x="5" y="5" width="40" height="40" rx="8" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="6 4"/>
          <text x="25" y="30" textAnchor="middle" fill="var(--color-primary)" fontSize="16" fontWeight="bold">?</text>
        </svg>
      ) : value ? (
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
          {dots.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="5" fill="var(--color-primary)" />
          ))}
        </svg>
      ) : (
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
          <rect x="5" y="5" width="40" height="40" rx="8" stroke="#64748B" strokeWidth="2" strokeDasharray="4 3"/>
          <text x="25" y="30" textAnchor="middle" fill="#64748B" fontSize="16" fontWeight="bold">?</text>
        </svg>
      )}
    </div>
  );
}

export default function DicePage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [coinType, setCoinType] = useState<"SC" | "MC">("SC");
  const [betAmount, setBetAmount] = useState(10);
  const [rolling, setRolling] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{
    roll: number;
    isWin: boolean;
    payout: number;
    multiplier: number;
  } | null>(null);
  const [error, setError] = useState("");

  const fetchStatus = useCallback(() => {
    fetch("/api/game/dice")
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleBet = async (betType: string, betValue?: number) => {
    if (rolling || !status) return;
    setError("");
    setShowResult(false);
    setDiceValue(null);
    setRolling(true);

    try {
      const res = await fetch("/api/game/dice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coinType, betAmount, betType, betValue }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setRolling(false);
        return;
      }

      setLastResult(data);
      setStatus((prev) =>
        prev
          ? { ...prev, scBalance: data.scBalance, mcBalance: data.mcBalance, remainingPlays: data.remainingPlays }
          : prev
      );

      setTimeout(() => {
        setDiceValue(data.roll);
      }, 500);

      setTimeout(() => {
        setRolling(false);
        setShowResult(true);
      }, 1500);
    } catch {
      setError("서버 오류가 발생했습니다.");
      setRolling(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="주사위" showBack />
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      </div>
    );
  }

  const currentBalance = coinType === "SC" ? status?.scBalance || 0 : status?.mcBalance || 0;
  const canPlay = status && status.remainingPlays > 0 && currentBalance >= betAmount;

  return (
    <div>
      <Header title="주사위" showBack />
      <div className="px-4 py-4 space-y-4">
        {/* Status */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-primary)]/20">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">남은 횟수</p>
              <p className="text-lg font-bold text-[var(--color-text)] num">
                {status?.remainingPlays || 0} / {status?.dailyLimit || 10}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[var(--color-text-muted)]">SC</p>
              <p className="text-lg font-bold text-green-400 num">{(status?.scBalance || 0).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-muted)]">MC</p>
              <p className="text-lg font-bold text-amber-400 num">{(status?.mcBalance || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Dice */}
        <div className="flex justify-center py-4">
          <DiceFace value={diceValue} rolling={rolling} />
        </div>

        {/* Coin Type Toggle */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">코인 선택</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCoinType("SC")}
              disabled={rolling}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                coinType === "SC"
                  ? "bg-green-500/20 text-green-400 border border-green-500/40"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
              }`}
            >
              SC
            </button>
            <button
              onClick={() => setCoinType("MC")}
              disabled={rolling}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                coinType === "MC"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
              }`}
            >
              MC
            </button>
          </div>

          {/* Bet Amount */}
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mt-4 mb-3 uppercase tracking-wider">베팅 금액</p>
          <div className="grid grid-cols-4 gap-2">
            {BET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount)}
                disabled={rolling}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                  betAmount === amount
                    ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/40"
                    : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
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

        {/* Bet Types */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          {/* 홀짝 */}
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
            홀짝 · <span className="text-green-400">2배</span>
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => handleBet("odd")}
              disabled={!canPlay || rolling}
              className="py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 font-bold hover:bg-red-500/20 transition-all disabled:opacity-40"
            >
              홀 (1·3·5)
            </button>
            <button
              onClick={() => handleBet("even")}
              disabled={!canPlay || rolling}
              className="py-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 font-bold hover:bg-blue-500/20 transition-all disabled:opacity-40"
            >
              짝 (2·4·6)
            </button>
          </div>

          {/* 대소 */}
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
            대소 · <span className="text-green-400">2배</span>
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => handleBet("high")}
              disabled={!canPlay || rolling}
              className="py-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 font-bold hover:bg-amber-500/20 transition-all disabled:opacity-40"
            >
              대 (4·5·6)
            </button>
            <button
              onClick={() => handleBet("low")}
              disabled={!canPlay || rolling}
              className="py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 font-bold hover:bg-cyan-500/20 transition-all disabled:opacity-40"
            >
              소 (1·2·3)
            </button>
          </div>

          {/* 정확한 숫자 */}
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
            정확한 숫자 · <span className="text-purple-400">6배</span>
          </p>
          <div className="grid grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => handleBet("exact", n)}
                disabled={!canPlay || rolling}
                className="py-3 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 font-bold text-lg hover:bg-purple-500/20 transition-all disabled:opacity-40"
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {!canPlay && status && (
          <p className="text-center text-sm text-[var(--color-text-muted)]">
            {status.remainingPlays <= 0
              ? "오늘의 횟수를 모두 사용했습니다"
              : `${coinType}가 부족합니다`}
          </p>
        )}

        {/* Result Modal */}
        {showResult && lastResult && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] w-full max-w-sm p-6 text-center">
              <div className="flex justify-center mb-4">
                <DiceFace value={lastResult.roll} rolling={false} />
              </div>
              <h3 className={`text-xl font-bold mb-1 ${lastResult.isWin ? "text-green-400" : "text-red-400"}`}>
                {lastResult.isWin ? "당첨!" : "아쉽네요!"}
              </h3>
              <p className="text-lg font-bold text-[var(--color-text)]">
                주사위: {lastResult.roll}
              </p>
              {lastResult.isWin && (
                <p className="text-lg font-bold text-green-400 mt-1">
                  +{lastResult.payout} {coinType} ({lastResult.multiplier}배)
                </p>
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

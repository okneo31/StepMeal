"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";

type CoinType = "SC" | "MC";
type BetType = "SLOT" | "NUMBER";

interface RingResult {
  r: number;
  num: number;
  slot: number;
}

interface BetRecord {
  id: string;
  round: number;
  coinType: string;
  betAmount: number;
  betType: string;
  betValue: number;
  resultNum: number | null;
  resultSlot: number | null;
  payout: number;
  status: string;
  createdAt: string;
}

const SLOT_COLORS: Record<number, { bg: string; border: string; text: string; label: string }> = {
  2: { bg: "bg-blue-500/15", border: "border-blue-500/40", text: "text-blue-400", label: "2배" },
  3: { bg: "bg-purple-500/15", border: "border-purple-500/40", text: "text-purple-400", label: "3배" },
  5: { bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-400", label: "5배" },
};

const BET_AMOUNTS = [10, 30, 50, 100, 200, 500];

export default function RingGamePage() {
  // State
  const [coinType, setCoinType] = useState<CoinType>("SC");
  const [betAmount, setBetAmount] = useState(50);
  const [betType, setBetType] = useState<BetType>("SLOT");
  const [betValue, setBetValue] = useState(2);
  const [numberInput, setNumberInput] = useState("");

  const [balance, setBalance] = useState({ scBalance: 0, mcBalance: 0 });
  const [lastResults, setLastResults] = useState<RingResult[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [pendingBet, setPendingBet] = useState<{ round: number; betType: string; betValue: number; betAmount: number; coinType: string } | null>(null);
  const [history, setHistory] = useState<BetRecord[]>([]);

  const [betting, setBetting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: "win" | "lose"; message: string; amount?: number } | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/coins/balance");
      const data = await res.json();
      setBalance(data);
    } catch {}
  }, []);

  // Fetch last results
  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch("https://result.nex2games.com/v1/ring/last_10_results", { cache: "no-store" });
      const data: RingResult[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setLastResults(data.reverse()); // oldest first
        setCurrentRound(data[data.length - 1].r);
      }
    } catch {}
  }, []);

  // Check & settle pending bets
  const checkResult = useCallback(async () => {
    try {
      const res = await fetch("/api/game/ring/result");
      const data = await res.json();
      if (data.balance) {
        setBalance(data.balance);
      }
      if (data.currentRound) {
        setCurrentRound(data.currentRound);
      }
      if (data.settledBets && data.settledBets.length > 0) {
        for (const bet of data.settledBets) {
          if (bet.won) {
            setNotification({ type: "win", message: `R${bet.round} 당첨!`, amount: bet.payout });
          } else {
            setNotification({ type: "lose", message: `R${bet.round} 미당첨` });
          }
        }
        setPendingBet(null);
        // Refresh history
        fetchHistory();
      }
    } catch {}
  }, []);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/game/ring/history");
      const data = await res.json();
      if (data.bets) setHistory(data.bets);
    } catch {}
  }, []);

  // Initialize
  useEffect(() => {
    Promise.all([fetchBalance(), fetchResults(), fetchHistory()])
      .finally(() => setLoading(false));
  }, [fetchBalance, fetchResults, fetchHistory]);

  // Polling: check results every 5s
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchResults();
      if (pendingBet) {
        checkResult();
      }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchResults, checkResult, pendingBet]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Place bet
  const handleBet = async () => {
    const finalBetValue = betType === "NUMBER" ? parseInt(numberInput) : betValue;

    if (betType === "NUMBER" && (!finalBetValue || finalBetValue < 1 || finalBetValue > 54)) {
      setNotification({ type: "lose", message: "1~54 사이 숫자를 입력하세요" });
      return;
    }

    setBetting(true);
    try {
      const res = await fetch("/api/game/ring/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coinType, betAmount, betType, betValue: finalBetValue }),
      });
      const data = await res.json();

      if (res.ok) {
        setPendingBet({
          round: data.round,
          betType,
          betValue: finalBetValue,
          betAmount,
          coinType,
        });
        setBalance((b) => ({
          ...b,
          [coinType === "SC" ? "scBalance" : "mcBalance"]: data.newBalance,
        }));
        setNotification({
          type: "win",
          message: `R${data.round} 베팅 완료! (${betType === "SLOT" ? `${finalBetValue}배` : `#${finalBetValue}`})`,
        });
      } else {
        setNotification({ type: "lose", message: data.error || "베팅 실패" });
      }
    } catch {
      setNotification({ type: "lose", message: "서버 연결 오류" });
    } finally {
      setBetting(false);
    }
  };

  const currentBalance = coinType === "SC" ? balance.scBalance : balance.mcBalance;

  if (loading) {
    return (
      <div>
        <Header title="1분링 게임" showBack />
        <div className="flex items-center justify-center h-[60vh]"><Spinner size="lg" /></div>
      </div>
    );
  }

  return (
    <div>
      <Header title="1분링 게임" showBack />
      <div className="px-4 py-4 space-y-4">

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl border backdrop-blur-md shadow-lg transition-all max-w-sm ${
            notification.type === "win"
              ? "bg-green-500/20 border-green-500/40 text-green-400"
              : "bg-red-500/20 border-red-500/40 text-red-400"
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === "win" ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 10L9 13L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 7L13 13M13 7L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              )}
              <span className="text-sm font-semibold">{notification.message}</span>
              {notification.amount && (
                <span className="text-lg font-bold num">+{notification.amount}</span>
              )}
            </div>
          </div>
        )}

        {/* Game iframe */}
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <iframe
            src="https://nex2games.com/ring/live"
            width="100%"
            height="380"
            scrolling="no"
            style={{ border: "none", display: "block" }}
            title="1분링 게임"
          />
        </div>

        {/* Current Round + Balance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-[var(--color-text-muted)]">라운드</span>
            <span className="text-sm font-bold text-[var(--color-text)] num">R{currentRound}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-[var(--color-text-muted)]">SC </span>
              <span className="text-sm font-bold text-green-400 num">{balance.scBalance.toLocaleString()}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-[var(--color-text-muted)]">MC </span>
              <span className="text-sm font-bold text-blue-400 num">{balance.mcBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Recent Results */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {lastResults.map((r) => {
            const slotStyle = SLOT_COLORS[r.slot] || SLOT_COLORS[2];
            return (
              <div
                key={r.r}
                className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 border text-center ${slotStyle.bg} ${slotStyle.border}`}
              >
                <div className={`text-xs font-bold num ${slotStyle.text}`}>{r.num}</div>
                <div className={`text-[9px] ${slotStyle.text} opacity-60`}>{slotStyle.label}</div>
              </div>
            );
          })}
        </div>

        {/* Pending Bet */}
        {pendingBet && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <div>
                <p className="text-sm font-semibold text-amber-400">
                  R{pendingBet.round} 결과 대기중...
                </p>
                <p className="text-xs text-amber-400/60">
                  {pendingBet.betType === "SLOT" ? `${pendingBet.betValue}배` : `#${pendingBet.betValue} (50배)`} · {pendingBet.betAmount} {pendingBet.coinType}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Betting Panel */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)] space-y-4">

          {/* Coin Type Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-[var(--color-border)]">
            <button
              onClick={() => setCoinType("SC")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                coinType === "SC"
                  ? "bg-green-500/20 text-green-400 border-r border-green-500/30"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border-r border-[var(--color-border)]"
              }`}
            >
              SC ({balance.scBalance.toLocaleString()})
            </button>
            <button
              onClick={() => setCoinType("MC")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                coinType === "MC"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]"
              }`}
            >
              MC ({balance.mcBalance.toLocaleString()})
            </button>
          </div>

          {/* Bet Amount */}
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-2">베팅 금액</label>
            <div className="grid grid-cols-6 gap-1.5">
              {BET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(amt)}
                  className={`py-2 rounded-lg text-xs font-bold num transition-colors ${
                    betAmount === amt
                      ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/40"
                      : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border border-transparent"
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Bet Type Toggle */}
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-2">베팅 종류</label>
            <div className="flex gap-2">
              <button
                onClick={() => setBetType("SLOT")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${
                  betType === "SLOT"
                    ? "bg-purple-500/15 text-purple-400 border-purple-500/40"
                    : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border-transparent"
                }`}
              >
                슬롯 맞추기 (2/3/5배)
              </button>
              <button
                onClick={() => setBetType("NUMBER")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${
                  betType === "NUMBER"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
                    : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border-transparent"
                }`}
              >
                숫자 맞추기 (50배)
              </button>
            </div>
          </div>

          {/* Bet Value */}
          {betType === "SLOT" ? (
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 5].map((slot) => {
                const style = SLOT_COLORS[slot];
                return (
                  <button
                    key={slot}
                    onClick={() => setBetValue(slot)}
                    className={`py-4 rounded-xl border-2 transition-all ${
                      betValue === slot
                        ? `${style.bg} ${style.border} ${style.text} scale-[1.02]`
                        : "bg-[var(--color-surface-elevated)] border-transparent text-[var(--color-text-muted)]"
                    }`}
                  >
                    <div className="text-3xl font-bold num">{slot}x</div>
                    <div className="text-xs mt-1 opacity-70">{style.label}</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <input
                type="number"
                min={1}
                max={54}
                value={numberInput}
                onChange={(e) => setNumberInput(e.target.value)}
                placeholder="1~54 숫자 입력"
                className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-center text-2xl font-bold text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-amber-500/50 num"
              />
              <p className="text-xs text-amber-400/60 text-center mt-2">
                정확한 숫자를 맞추면 베팅 금액의 50배!
              </p>
            </div>
          )}

          {/* Payout Preview */}
          <div className="bg-[var(--color-bg)]/50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">예상 당첨금</span>
            <span className="text-lg font-bold text-[var(--color-primary)] num">
              {(betAmount * (betType === "SLOT" ? betValue : 50)).toLocaleString()} {coinType}
            </span>
          </div>

          {/* Place Bet Button */}
          <Button
            fullWidth
            size="lg"
            onClick={handleBet}
            loading={betting}
            disabled={!!pendingBet || currentBalance < betAmount}
          >
            {pendingBet
              ? "결과 대기중..."
              : currentBalance < betAmount
                ? `${coinType} 잔액 부족`
                : `${betAmount} ${coinType} 베팅하기`
            }
          </Button>
        </div>

        {/* Bet History */}
        {history.length > 0 && (
          <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">베팅 기록</h3>
            <div className="space-y-2">
              {history.slice(0, 10).map((bet) => (
                <div
                  key={bet.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border ${
                    bet.status === "WON"
                      ? "bg-green-500/5 border-green-500/20"
                      : bet.status === "LOST"
                        ? "bg-red-500/5 border-red-500/10"
                        : "bg-amber-500/5 border-amber-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold num ${
                      bet.status === "WON" ? "bg-green-500/15 text-green-400"
                        : bet.status === "LOST" ? "bg-red-500/15 text-red-400"
                          : "bg-amber-500/15 text-amber-400"
                    }`}>
                      R{bet.round}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[var(--color-text)]">
                          {bet.betType === "SLOT" ? `${bet.betValue}배` : `#${bet.betValue}`}
                        </span>
                        <Badge variant={bet.coinType === "SC" ? "green" : "blue"} size="sm">
                          {bet.betAmount} {bet.coinType}
                        </Badge>
                      </div>
                      {bet.resultNum !== null && (
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          결과: {bet.resultNum} ({bet.resultSlot}배)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {bet.status === "WON" ? (
                      <span className="text-sm font-bold text-green-400 num">+{bet.payout}</span>
                    ) : bet.status === "LOST" ? (
                      <span className="text-sm font-bold text-red-400 num">-{bet.betAmount}</span>
                    ) : (
                      <Spinner size="sm" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

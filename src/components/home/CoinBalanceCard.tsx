"use client";

interface Props {
  scBalance: number;
  mcBalance: number;
}

export default function CoinBalanceCard({ scBalance, mcBalance }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-green-500/20 glow-green">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L10 5.5L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 5.5L8 1Z" fill="#22C55E"/>
            </svg>
          </div>
          <span className="text-xs font-medium text-green-400">StepCoin</span>
        </div>
        <div className="text-2xl font-bold text-gradient-green num">{scBalance.toLocaleString()}</div>
        <div className="text-[10px] text-[var(--color-text-muted)] mt-1">SC</div>
      </div>
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-amber-500/20 glow-amber">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" fill="#F59E0B"/>
              <path d="M6 6.5H10M6 9.5H10" stroke="#FFF" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-xs font-medium text-amber-400">MealCoin</span>
        </div>
        <div className="text-2xl font-bold text-gradient-gold num">{mcBalance.toLocaleString()}</div>
        <div className="text-[10px] text-[var(--color-text-muted)] mt-1">MC</div>
      </div>
    </div>
  );
}

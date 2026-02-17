"use client";

import type { StoreItemDisplay } from "@/types";

interface Props {
  item: StoreItemDisplay;
  onPurchase: (item: StoreItemDisplay) => void;
}

export default function StoreItemCard({ item, onPurchase }: Props) {
  const isOutOfStock = item.stock === 0;
  const coinLabel = item.coinType === "SC" ? "SC" : "MC";
  const isSc = item.coinType === "SC";

  return (
    <div className={`bg-[var(--color-surface)] rounded-2xl p-3 border border-[var(--color-border)] ${isOutOfStock ? "opacity-50" : ""}`}>
      <div className="flex flex-col h-full">
        <div className={`w-full aspect-square rounded-xl flex items-center justify-center text-3xl mb-2 ${
          isSc ? "bg-green-500/10 border border-green-500/20" : "bg-amber-500/10 border border-amber-500/20"
        }`}>
          {item.imageUrl || (
            item.category === "HEALTH_FOOD" ? (
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 6C14 6 8 12 8 20C8 28 14 34 20 34C26 34 32 28 32 20C32 12 26 6 20 6Z" stroke={isSc ? "#22C55E" : "#F59E0B"} strokeWidth="1.5" fill={isSc ? "#22C55E" : "#F59E0B"} fillOpacity="0.1"/>
                <path d="M20 6V20L28 14" stroke={isSc ? "#22C55E" : "#F59E0B"} strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M16 24L20 20L24 26" stroke={isSc ? "#22C55E" : "#F59E0B"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 6L24 14L32 15L26 21L28 30L20 26L12 30L14 21L8 15L16 14L20 6Z" stroke={isSc ? "#22C55E" : "#F59E0B"} strokeWidth="1.5" fill={isSc ? "#22C55E" : "#F59E0B"} fillOpacity="0.1"/>
              </svg>
            )
          )}
        </div>
        <h4 className="text-sm font-semibold text-[var(--color-text)] line-clamp-1">{item.name}</h4>
        {item.description && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{item.description}</p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className={`text-sm font-bold num ${isSc ? "text-green-400" : "text-amber-400"}`}>
            {item.price.toLocaleString()} {coinLabel}
          </span>
          <button
            onClick={() => onPurchase(item)}
            disabled={isOutOfStock}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              isOutOfStock
                ? "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] cursor-not-allowed"
                : isSc
                ? "bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25"
                : "bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25"
            }`}
          >
            {isOutOfStock ? "품절" : "구매"}
          </button>
        </div>
      </div>
    </div>
  );
}

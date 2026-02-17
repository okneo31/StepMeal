"use client";

import { TRANSPORT_LIST } from "@/lib/constants";
import type { TransportType } from "@/types";

interface Props {
  selected: TransportType;
  onSelect: (type: TransportType) => void;
}

const transportIcons: Record<string, React.ReactNode> = {
  RUN: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="17" cy="5" r="2.5" fill="currentColor"/>
      <path d="M21 12L17.5 9L14 11L11 14L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 11L12 18L15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.5 9L19 15L22 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  WALK: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="5" r="2.5" fill="currentColor"/>
      <path d="M14 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 16L11 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 16L17 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 11L14 10L18 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  BIKE: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="8" cy="19" r="4.5" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="20" cy="19" r="4.5" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 19L14 10L20 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 10L18 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="14" cy="7" r="1.5" fill="currentColor"/>
    </svg>
  ),
  SCOOTER: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="8" cy="22" r="3" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="20" cy="22" r="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 22L10 10H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 10V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 6H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 16L20 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  BUS: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="6" y="5" width="16" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M6 14H22" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 10H22" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="10" cy="19" r="1.5" fill="currentColor"/>
      <circle cx="18" cy="19" r="1.5" fill="currentColor"/>
      <path d="M11 7H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  TRAIN: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="7" y="3" width="14" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M7 14H21" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="11" cy="18" r="1.2" fill="currentColor"/>
      <circle cx="17" cy="18" r="1.2" fill="currentColor"/>
      <path d="M10 24L7 21H21L18 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 8H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  CAR: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M5 16L7 10H21L23 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="4" y="16" width="20" height="6" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="9" cy="22" r="2" fill="currentColor"/>
      <circle cx="19" cy="22" r="2" fill="currentColor"/>
      <path d="M10 10L11.5 6H16.5L18 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export default function TransportSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {TRANSPORT_LIST.map((t) => {
        const isActive = selected === t.type;
        return (
          <button
            key={t.type}
            onClick={() => onSelect(t.type)}
            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all min-h-[80px] ${
              isActive
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-[0_0_12px_rgba(34,197,94,0.15)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-surface-hover)]"
            }`}
          >
            <div className={isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]"}>
              {transportIcons[t.type] || <span className="text-2xl">{t.emoji}</span>}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${
              isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
            }`}>
              {t.label}
            </span>
            <span className={`text-[9px] font-semibold ${
              isActive ? "text-green-400" : "text-[var(--color-text-muted)]"
            }`}>
              x{t.multiplier}
            </span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { TRANSPORT_LIST } from "@/lib/constants";
import type { TransportType } from "@/types";

interface Props {
  selected: TransportType;
  onSelect: (type: TransportType) => void;
}

export default function TransportSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {TRANSPORT_LIST.map((t) => (
        <button
          key={t.type}
          onClick={() => onSelect(t.type)}
          className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all min-h-[72px] ${
            selected === t.type
              ? "border-[var(--color-primary)] bg-green-50 shadow-sm"
              : "border-gray-100 bg-white hover:border-gray-200"
          }`}
        >
          <span className="text-2xl">{t.emoji}</span>
          <span className={`text-[10px] mt-1 font-medium ${
            selected === t.type ? "text-[var(--color-primary)]" : "text-gray-500"
          }`}>
            {t.label}
          </span>
          <span className={`text-[9px] ${
            selected === t.type ? "text-green-600" : "text-gray-400"
          }`}>
            x{t.multiplier}
          </span>
        </button>
      ))}
    </div>
  );
}

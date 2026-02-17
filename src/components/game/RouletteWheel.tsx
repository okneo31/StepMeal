"use client";

import { useState, useCallback } from "react";
import { ROULETTE_REWARDS } from "@/lib/constants";

interface Props {
  onSpinComplete: (slotIndex: number) => void;
  spinning: boolean;
  resultIndex: number | null;
}

export default function RouletteWheel({ onSpinComplete, spinning, resultIndex }: Props) {
  const [rotation, setRotation] = useState(0);
  const slotCount = ROULETTE_REWARDS.length;
  const slotAngle = 360 / slotCount;

  // When resultIndex changes and spinning, animate to that slot
  const targetRotation = resultIndex !== null
    ? 360 * 5 + (360 - resultIndex * slotAngle - slotAngle / 2)
    : rotation;

  return (
    <div className="relative w-72 h-72 mx-auto">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
        <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
          <path d="M12 20L2 2H22L12 20Z" fill="#22C55E" stroke="#1A1F2E" strokeWidth="2"/>
        </svg>
      </div>

      {/* Outer ring glow */}
      <div className="absolute inset-0 rounded-full bg-purple-500/5 blur-xl" />

      {/* Wheel */}
      <div
        className="w-full h-full rounded-full border-4 border-[var(--color-surface-elevated)] overflow-hidden relative shadow-[0_0_30px_rgba(168,85,247,0.1)]"
        style={{
          transform: `rotate(${targetRotation}deg)`,
          transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
        }}
        onTransitionEnd={() => {
          if (resultIndex !== null) {
            onSpinComplete(resultIndex);
          }
        }}
      >
        {ROULETTE_REWARDS.map((reward, i) => {
          const startAngle = i * slotAngle;
          const midAngle = startAngle + slotAngle / 2;

          return (
            <div
              key={i}
              className="absolute w-full h-full"
              style={{
                clipPath: `polygon(50% 50%, ${50 + 50 * Math.sin((startAngle * Math.PI) / 180)}% ${50 - 50 * Math.cos((startAngle * Math.PI) / 180)}%, ${50 + 50 * Math.sin(((startAngle + slotAngle) * Math.PI) / 180)}% ${50 - 50 * Math.cos(((startAngle + slotAngle) * Math.PI) / 180)}%)`,
                backgroundColor: reward.color,
                opacity: 0.8,
              }}
            >
              <span
                className="absolute text-white text-xs font-bold drop-shadow-sm"
                style={{
                  left: `${50 + 30 * Math.sin((midAngle * Math.PI) / 180)}%`,
                  top: `${50 - 30 * Math.cos((midAngle * Math.PI) / 180)}%`,
                  transform: `translate(-50%, -50%) rotate(${midAngle}deg)`,
                }}
              >
                {reward.label}
              </span>
            </div>
          );
        })}

        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[var(--color-surface)] rounded-full shadow-lg border-2 border-[var(--color-border)] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="6" stroke="#A855F7" strokeWidth="1.5"/>
            <circle cx="10" cy="10" r="2" fill="#A855F7"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

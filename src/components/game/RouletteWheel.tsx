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

  const spin = useCallback(() => {
    if (spinning || resultIndex !== null) return;

    // We don't know the result yet - just start visual spin
    // The parent calls the API and sets resultIndex
  }, [spinning, resultIndex]);

  // When resultIndex changes and spinning, animate to that slot
  const targetRotation = resultIndex !== null
    ? 360 * 5 + (360 - resultIndex * slotAngle - slotAngle / 2)
    : rotation;

  return (
    <div className="relative w-72 h-72 mx-auto">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 text-2xl">
        ▼
      </div>

      {/* Wheel */}
      <div
        className="w-full h-full rounded-full border-4 border-gray-200 overflow-hidden relative"
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
              }}
            >
              <span
                className="absolute text-white text-xs font-bold"
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center">
          <span className="text-lg">🎰</span>
        </div>
      </div>
    </div>
  );
}

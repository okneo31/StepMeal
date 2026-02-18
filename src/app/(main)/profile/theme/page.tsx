"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Spinner from "@/components/ui/Spinner";
import { useTheme } from "@/components/providers/ThemeProvider";
import { THEMES } from "@/lib/theme-config";

export default function ThemeSelectPage() {
  const { theme: activeTheme, setTheme } = useTheme();
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/theme")
      .then((r) => r.json())
      .then((data) => {
        setUnlockedThemes(data.unlockedThemes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const isUnlocked = (id: string) => id === "default" || unlockedThemes.includes(id);
  const isActive = (id: string) => activeTheme === id;

  const handleSelect = (id: string) => {
    if (isUnlocked(id) && !isActive(id)) {
      setTheme(id);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  return (
    <div>
      <Header title="테마 설정" showBack />
      <div className="px-4 py-4 space-y-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          프리미엄 테마로 나만의 스타일을 완성하세요.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((t) => {
            const unlocked = isUnlocked(t.id);
            const active = isActive(t.id);

            return (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                disabled={!unlocked}
                className={`relative bg-[var(--color-surface)] rounded-2xl p-4 border text-left transition-all ${
                  active
                    ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                    : unlocked
                    ? "border-[var(--color-border)] hover:border-[var(--color-border-light)]"
                    : "border-[var(--color-border)] opacity-60"
                }`}
              >
                {/* Active checkmark */}
                {active && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7L6 10L11 4" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}

                {/* Lock icon */}
                {!unlocked && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <rect x="2" y="5" width="8" height="6" rx="1" stroke="#64748B" strokeWidth="1.2"/>
                      <path d="M4 5V3.5C4 2.12 5.12 1 6.5 1V1C7.88 1 9 2.12 9 3.5V5" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}

                {/* Color preview circles */}
                <div className="flex items-center gap-1.5 mb-3">
                  <div
                    className="w-6 h-6 rounded-full border border-white/10"
                    style={{ backgroundColor: t.previewColors.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-white/10"
                    style={{ backgroundColor: t.previewColors.bg }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-white/10"
                    style={{ backgroundColor: t.previewColors.surface }}
                  />
                </div>

                {/* Theme name */}
                <h3 className="text-sm font-bold text-[var(--color-text)] mb-0.5">{t.name}</h3>
                <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">{t.description}</p>

                {/* Price / status */}
                <div className="mt-2">
                  {t.price === 0 ? (
                    <span className="text-xs text-[var(--color-text-muted)]">무료</span>
                  ) : unlocked ? (
                    <span className="text-xs text-[var(--color-primary)] font-semibold">해금됨</span>
                  ) : (
                    <span className="text-xs text-amber-400 font-semibold">{t.price} MC</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Store link */}
        {unlockedThemes.length < THEMES.length - 1 && (
          <Link
            href="/store"
            className="block bg-[var(--color-surface)] rounded-2xl p-4 border border-amber-500/20 text-center hover:border-amber-500/30 transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 6L5 2H15L17 6" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M3 6V16C3 16.6 3.4 17 4 17H16C16.6 17 17 16.6 17 16V6" stroke="#F59E0B" strokeWidth="1.5"/>
                <path d="M3 6H17" stroke="#F59E0B" strokeWidth="1.5"/>
                <path d="M8 10H12" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-sm font-semibold text-amber-400">스토어에서 테마 구매</span>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

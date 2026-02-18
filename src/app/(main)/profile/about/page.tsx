"use client";

import Header from "@/components/layout/Header";

export default function AboutPage() {
  return (
    <div>
      <Header title="앱 정보" showBack />
      <div className="px-4 py-4 space-y-4">
        {/* App logo & name */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-green-500/20">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C14 4 12.5 6 11 9C9.5 12 8 14 6 15C4 16 4 18 5 20C6 22 8 23 10 23C12 23 13 22 14 21C15 20 15.5 19 16 19C16.5 19 17 20 18 21C19 22 20 23 22 23C24 23 26 22 27 20C28 18 28 16 26 15C24 14 22.5 12 21 9C19.5 6 18 4 16 4Z" fill="#22C55E" fillOpacity="0.2" stroke="#22C55E" strokeWidth="1.5"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text)]">StepMeal</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">움직여서 벌고, 건강하게 먹자</p>
          <div className="mt-3 inline-block bg-[var(--color-surface-elevated)] rounded-full px-3 py-1">
            <span className="text-xs font-mono text-[var(--color-text-secondary)]">v1.0.0</span>
          </div>
        </div>

        {/* Info list */}
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div className="flex justify-between py-3.5 px-4 border-b border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-secondary)]">버전</span>
            <span className="text-sm font-medium text-[var(--color-text)]">1.0.0</span>
          </div>
          <div className="flex justify-between py-3.5 px-4 border-b border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-secondary)]">플랫폼</span>
            <span className="text-sm font-medium text-[var(--color-text)]">PWA (Web App)</span>
          </div>
          <div className="flex justify-between py-3.5 px-4 border-b border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-secondary)]">프레임워크</span>
            <span className="text-sm font-medium text-[var(--color-text)]">Next.js 16</span>
          </div>
          <div className="flex justify-between py-3.5 px-4">
            <span className="text-sm text-[var(--color-text-secondary)]">개발</span>
            <span className="text-sm font-medium text-[var(--color-text)]">StepMeal Team</span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">소개</h3>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            StepMeal은 걷기, 자전거, 대중교통 등 일상 이동으로 StepCoin(SC)을 벌고,
            QR 스캔과 미니게임으로 MealCoin(MC)을 모아 건강식품을 구매할 수 있는
            Move-to-Earn 앱입니다.
          </p>
        </div>

        <p className="text-xs text-[var(--color-text-muted)] text-center pt-2">
          &copy; 2026 StepMeal. All rights reserved.
        </p>
      </div>
    </div>
  );
}

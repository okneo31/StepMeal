"use client";

import Link from "next/link";
import Header from "@/components/layout/Header";

const games = [
  {
    href: "/game/roulette",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="14" stroke="#A855F7" strokeWidth="2"/>
        <circle cx="18" cy="18" r="8" stroke="#A855F7" strokeWidth="1.5" strokeDasharray="3 3"/>
        <circle cx="18" cy="18" r="3" fill="#A855F7" fillOpacity="0.5"/>
        <path d="M18 4V10" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M18 26V32" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M4 18H10" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M26 18H32" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "럭키 룰렛",
    description: "50 SC로 룰렛을 돌려 MC, 보호막 등 다양한 보상을 획득하세요!",
    badge: "하루 5회",
    borderColor: "border-purple-500/20",
    glowClass: "glow-purple",
    badgeColor: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
    iconBg: "bg-purple-500/10",
  },
  {
    href: "/game/quiz",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="14" stroke="#3B82F6" strokeWidth="2"/>
        <path d="M14 14C14 11.8 15.8 10 18 10C20.2 10 22 11.8 22 14C22 16 20 16.5 20 19" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="18" cy="24" r="1.5" fill="#3B82F6"/>
      </svg>
    ),
    title: "데일리 퀴즈",
    description: "건강 관련 퀴즈를 풀고 정답 시 20 MC를 획득하세요!",
    badge: "하루 3회",
    borderColor: "border-blue-500/20",
    glowClass: "glow-blue",
    badgeColor: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    iconBg: "bg-blue-500/10",
  },
];

export default function GamePage() {
  return (
    <div>
      <Header title="게임" />
      <div className="px-4 py-4 space-y-4">
        <p className="text-sm text-[var(--color-text-muted)]">게임에 참여하고 보상을 받아보세요!</p>

        {games.map((game) => (
          <Link key={game.href} href={game.href}>
            <div className={`bg-[var(--color-surface)] rounded-2xl p-4 border ${game.borderColor} ${game.glowClass} hover:brightness-110 transition-all mb-4`}>
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl ${game.iconBg} flex items-center justify-center flex-shrink-0`}>
                  {game.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[var(--color-text)]">{game.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${game.badgeColor}`}>
                      {game.badge}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">{game.description}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-1">
                  <path d="M6 4L10 8L6 12" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

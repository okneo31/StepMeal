"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3L21 9.5V20C21 20.5 20.5 21 20 21H4C3.5 21 3 20.5 3 20V9.5Z" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <path d="M9 21V12H15V21" />
    </svg>
  );
}

function MoveIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.3 : 0} />
      <path d="M12 2V4M12 20V22M2 12H4M20 12H22" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function StoreIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 7V20C3 20.5 3.5 21 4 21H20C20.5 21 21 20.5 21 20V7L18 2H6Z" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <path d="M3 7H21" />
      <path d="M16 11C16 13.2 14.2 15 12 15C9.8 15 8 13.2 8 11" />
    </svg>
  );
}

function GameIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="4" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <path d="M6 12H10M8 10V14" />
      <circle cx="15" cy="10" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="17" cy="12" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <path d="M20 21C20 16.6 16.4 14 12 14C7.6 14 4 16.6 4 21" />
    </svg>
  );
}

const tabs = [
  { href: "/home", label: "홈", Icon: HomeIcon, forceRefresh: true },
  { href: "/move", label: "이동", Icon: MoveIcon },
  { href: "/store", label: "스토어", Icon: StoreIcon },
  { href: "/game", label: "게임", Icon: GameIcon },
  { href: "/profile", label: "마이", Icon: ProfileIcon },
];

const HIDDEN_PATHS = ["/move/tracking", "/move/result"];

export default function BottomNav() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.some((p) => pathname?.startsWith(p))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-[var(--color-border)] safe-bottom z-50">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const isActive = pathname?.startsWith(tab.href);
          const className = `flex-1 flex flex-col items-center py-2 min-h-[56px] transition-all ${
            isActive
              ? "text-[var(--color-primary)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`;

          const content = (
            <>
              <tab.Icon active={!!isActive} />
              <span className={`text-[10px] mt-0.5 font-medium ${isActive ? "text-[var(--color-primary)]" : ""}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 rounded-full bg-[var(--color-primary)]" />
              )}
            </>
          );

          if (tab.forceRefresh) {
            return (
              <a key={tab.label} href={tab.href} className={`${className} relative`}>
                {content}
              </a>
            );
          }

          return (
            <Link key={tab.label} href={tab.href} className={`${className} relative`}>
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

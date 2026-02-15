"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/home", label: "홈", icon: "🏠" },
  { href: "/move", label: "이동", icon: "🗺️" },
  { href: "/store", label: "스토어", icon: "🛒" },
  { href: "/game", label: "게임", icon: "🎮" },
  { href: "/profile", label: "마이", icon: "👤" },
];

const HIDDEN_PATHS = ["/move/tracking", "/move/result"];

export default function BottomNav() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.some((p) => pathname?.startsWith(p))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const isActive = pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex-1 flex flex-col items-center py-2 min-h-[56px] transition-colors ${
                isActive
                  ? "text-[var(--color-primary)]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

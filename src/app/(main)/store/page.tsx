"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import StoreItemCard from "@/components/store/StoreItemCard";
import Spinner from "@/components/ui/Spinner";
import type { StoreItemDisplay, StoreCategory } from "@/types";

const categories: { key: StoreCategory | "ALL"; label: string; icon: React.ReactNode }[] = [
  { key: "ALL", label: "전체", icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )},
  { key: "HEALTH_FOOD", label: "건강식품", icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2C4 2 2 5 2 7C2 10 5 12 7 12C9 12 12 10 12 7C12 5 10 2 7 2Z" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7 2V7L10 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )},
  { key: "IN_APP", label: "인앱아이템", icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1L9 4.5L13 5L10 8L11 12L7 10L3 12L4 8L1 5L5 4.5L7 1Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    </svg>
  )},
];

export default function StorePage() {
  const router = useRouter();
  const [items, setItems] = useState<StoreItemDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<StoreCategory | "ALL">("ALL");

  useEffect(() => {
    const url = activeCategory === "ALL"
      ? "/api/store/items"
      : `/api/store/items?category=${activeCategory}`;

    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((data) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const handlePurchase = (item: StoreItemDisplay) => {
    router.push(`/store/purchase/${item.id}`);
  };

  return (
    <div>
      <Header
        title="스토어"
        rightAction={
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/store/orders")}
              className="text-sm text-amber-400 font-medium"
            >
              주문내역
            </button>
            <button
              onClick={() => router.push("/store/history")}
              className="text-sm text-[var(--color-primary)] font-medium"
            >
              구매내역
            </button>
          </div>
        }
      />
      <div className="px-4 py-4">
        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeCategory === cat.key
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-surface-hover)]"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M4 8L7 4H21L24 8V22C24 23.1 23.1 24 22 24H6C4.9 24 4 23.1 4 22V8Z" stroke="#64748B" strokeWidth="1.5"/>
                <path d="M4 8H24" stroke="#64748B" strokeWidth="1.5"/>
                <path d="M10 12C10 14.2 11.8 16 14 16C16.2 16 18 14.2 18 12" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">상품이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <StoreItemCard
                key={item.id}
                item={item}
                onPurchase={handlePurchase}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

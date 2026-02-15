"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import StoreItemCard from "@/components/store/StoreItemCard";
import Spinner from "@/components/ui/Spinner";
import type { StoreItemDisplay, StoreCategory } from "@/types";

const categories: { key: StoreCategory | "ALL"; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "HEALTH_FOOD", label: "🥗 건강식품" },
  { key: "IN_APP", label: "🎁 인앱아이템" },
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
          <button
            onClick={() => router.push("/store/history")}
            className="text-sm text-[var(--color-primary)] font-medium"
          >
            구매내역
          </button>
        }
      />
      <div className="px-4 py-4">
        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.key
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
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
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🛒</p>
            <p className="text-sm">상품이 없습니다.</p>
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

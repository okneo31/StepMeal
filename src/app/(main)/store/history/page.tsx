"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";

interface PurchaseRecord {
  id: string;
  coinType: string;
  amount: number;
  quantity: number;
  createdAt: string;
  storeItem: {
    name: string;
    category: string;
    imageUrl: string | null;
  };
}

export default function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/store/history")
      .then((r) => r.json())
      .then((data) => setPurchases(data))
      .catch(() => setPurchases([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Header title="구매 내역" showBack />
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-sm">구매 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <Card key={purchase.id} padding="sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {purchase.storeItem.imageUrl || (purchase.storeItem.category === "HEALTH_FOOD" ? "🥗" : "🎁")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 truncate">
                      {purchase.storeItem.name}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {new Date(purchase.createdAt).toLocaleDateString("ko-KR")} ·
                      수량 {purchase.quantity}
                    </p>
                  </div>
                  <span className={`text-sm font-bold num ${
                    purchase.coinType === "SC" ? "text-green-700" : "text-amber-700"
                  }`}>
                    -{purchase.amount.toLocaleString()} {purchase.coinType}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import type { StoreItemDisplay } from "@/types";

export default function PurchasePage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemId as string;

  const [item, setItem] = useState<StoreItemDisplay | null>(null);
  const [balance, setBalance] = useState({ scBalance: 0, mcBalance: 0 });
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/store/items").then((r) => r.json()),
      fetch("/api/coins/balance").then((r) => r.json()),
    ])
      .then(([items, bal]) => {
        const found = items.find((i: StoreItemDisplay) => i.id === itemId);
        setItem(found || null);
        setBalance(bal);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [itemId]);

  const handlePurchase = async () => {
    if (!item) return;
    setPurchasing(true);

    try {
      const res = await fetch("/api/store/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeItemId: item.id, quantity }),
      });

      const data = await res.json();

      if (res.ok) {
        setBalance({
          scBalance: data.newScBalance,
          mcBalance: data.newMcBalance,
        });
        setResult({ success: true, message: "구매가 완료되었습니다!" });
      } else {
        setResult({ success: false, message: data.error || "구매에 실패했습니다." });
      }
    } catch {
      setResult({ success: false, message: "서버 오류가 발생했습니다." });
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!item) {
    return (
      <div>
        <Header title="상품 상세" showBack />
        <div className="px-4 py-12 text-center text-gray-400">
          상품을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const totalPrice = item.price * quantity;
  const currentBalance = item.coinType === "SC" ? balance.scBalance : balance.mcBalance;
  const canAfford = currentBalance >= totalPrice;
  const coinLabel = item.coinType === "SC" ? "SC" : "MC";

  return (
    <div>
      <Header title="구매 확인" showBack />
      <div className="px-4 py-4 space-y-4">
        {/* Product Info */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
              {item.imageUrl || (item.category === "HEALTH_FOOD" ? "🥗" : "🎁")}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
              )}
              <p className={`text-lg font-bold mt-1 num ${
                item.coinType === "SC" ? "text-green-700" : "text-amber-700"
              }`}>
                {item.price.toLocaleString()} {coinLabel}
              </p>
            </div>
          </div>
        </Card>

        {/* Quantity */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">수량</h3>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 font-bold text-lg hover:bg-gray-200"
            >
              -
            </button>
            <span className="text-xl font-bold num w-12 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              disabled={item.stock !== -1 && quantity >= item.stock}
              className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 font-bold text-lg hover:bg-gray-200 disabled:opacity-40"
            >
              +
            </button>
          </div>
        </Card>

        {/* Payment Summary */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">결제 정보</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">보유 잔액</span>
              <span className="font-medium num">{currentBalance.toLocaleString()} {coinLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">결제 금액</span>
              <span className="font-bold num">{totalPrice.toLocaleString()} {coinLabel}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">결제 후 잔액</span>
              <span className={`font-bold num ${canAfford ? "text-gray-800" : "text-red-500"}`}>
                {canAfford ? (currentBalance - totalPrice).toLocaleString() : "잔액 부족"} {canAfford ? coinLabel : ""}
              </span>
            </div>
          </div>
        </Card>

        {/* Result Message */}
        {result && (
          <div className={`p-4 rounded-xl text-sm font-medium ${
            result.success
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {result.message}
          </div>
        )}

        {/* Purchase Button */}
        {result?.success ? (
          <Button fullWidth size="lg" onClick={() => router.push("/store")}>
            스토어로 돌아가기
          </Button>
        ) : (
          <Button
            fullWidth
            size="lg"
            onClick={handlePurchase}
            loading={purchasing}
            disabled={!canAfford}
          >
            {canAfford ? `${totalPrice.toLocaleString()} ${coinLabel} 결제하기` : "잔액이 부족합니다"}
          </Button>
        )}
      </div>
    </div>
  );
}

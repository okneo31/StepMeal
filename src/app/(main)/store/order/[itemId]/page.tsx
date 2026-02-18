"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

function OrderContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const itemId = params.itemId as string;
  const purchaseId = searchParams.get("purchaseId") || "";

  const [itemName, setItemName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const [form, setForm] = useState({
    recipientName: "",
    phone: "",
    zipCode: "",
    address: "",
    addressDetail: "",
    memo: "",
  });

  useEffect(() => {
    fetch("/api/store/items")
      .then((r) => r.json())
      .then((items) => {
        const found = items.find((i: any) => i.id === itemId);
        if (found) setItemName(found.name);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [itemId]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.recipientName || !form.phone || !form.zipCode || !form.address) {
      setResult({ success: false, message: "필수 정보를 모두 입력해주세요." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/store/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId, ...form }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: "주문이 접수되었습니다!" });
      } else {
        setResult({ success: false, message: data.error || "주문에 실패했습니다." });
      }
    } catch {
      setResult({ success: false, message: "서버 오류가 발생했습니다." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <Header title="배송 정보 입력" showBack />
      <div className="px-4 py-4 space-y-4">
        {/* Product Info */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2C6 2 3 5 3 8C3 12 7 16 10 18C13 16 17 12 17 8C17 5 14 2 10 2Z" stroke="#22C55E" strokeWidth="1.2" fill="#22C55E" fillOpacity="0.15"/>
                <path d="M7 9L9 11L13 7" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">{itemName || "건강식품"}</p>
              <p className="text-xs text-[var(--color-text-muted)]">배송 상품 주문</p>
            </div>
          </div>
        </div>

        {/* Shipping Form */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)] space-y-4">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">배송 정보</h3>

          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1">수령인 *</label>
            <input
              type="text"
              value={form.recipientName}
              onChange={(e) => handleChange("recipientName", e.target.value)}
              placeholder="이름"
              className="w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1">전화번호 *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="010-1234-5678"
              className="w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1">우편번호 *</label>
            <input
              type="text"
              value={form.zipCode}
              onChange={(e) => handleChange("zipCode", e.target.value)}
              placeholder="12345"
              className="w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1">주소 *</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="기본 주소"
              className="w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1">상세 주소</label>
            <input
              type="text"
              value={form.addressDetail}
              onChange={(e) => handleChange("addressDetail", e.target.value)}
              placeholder="동/호수"
              className="w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1">배송 메모</label>
            <input
              type="text"
              value={form.memo}
              onChange={(e) => handleChange("memo", e.target.value)}
              placeholder="부재시 문 앞에 놓아주세요"
              className="w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>

        {/* Result Message */}
        {result && (
          <div className={`p-4 rounded-xl text-sm font-medium ${
            result.success
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            {result.message}
          </div>
        )}

        {result?.success ? (
          <Button fullWidth size="lg" onClick={() => router.push("/store/orders")}>
            주문 내역 보기
          </Button>
        ) : (
          <Button fullWidth size="lg" onClick={handleSubmit} loading={submitting}>
            주문 접수
          </Button>
        )}
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><Spinner size="lg" /></div>}>
      <OrderContent />
    </Suspense>
  );
}

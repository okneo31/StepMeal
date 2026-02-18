"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import OrderStatusBadge from "@/components/store/OrderStatusBadge";
import Spinner from "@/components/ui/Spinner";

interface OrderItem {
  id: string;
  status: string;
  recipientName: string;
  phone: string;
  address: string;
  addressDetail: string | null;
  trackingNo: string | null;
  memo: string | null;
  createdAt: string;
  itemName: string;
  itemImage: string | null;
  quantity: number;
  price: number;
  coinType: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/store/orders")
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Header title="주문 내역" showBack />
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M4 8L7 4H21L24 8V22C24 23.1 23.1 24 22 24H6C4.9 24 4 23.1 4 22V8Z" stroke="#64748B" strokeWidth="1.5"/>
                <path d="M4 8H24" stroke="#64748B" strokeWidth="1.5"/>
                <path d="M10 12C10 14.2 11.8 16 14 16C16.2 16 18 14.2 18 12" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">주문 내역이 없습니다.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{order.itemName}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {new Date(order.createdAt).toLocaleDateString("ko-KR")} · x{order.quantity}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex gap-2">
                  <span className="text-[var(--color-text-muted)] w-14 flex-shrink-0">수령인</span>
                  <span className="text-[var(--color-text-secondary)]">{order.recipientName}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[var(--color-text-muted)] w-14 flex-shrink-0">주소</span>
                  <span className="text-[var(--color-text-secondary)]">
                    {order.address}{order.addressDetail ? ` ${order.addressDetail}` : ""}
                  </span>
                </div>
                {order.trackingNo && (
                  <div className="flex gap-2">
                    <span className="text-[var(--color-text-muted)] w-14 flex-shrink-0">운송장</span>
                    <span className="text-[var(--color-primary)] font-medium">{order.trackingNo}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

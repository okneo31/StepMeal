"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import OrderStatusBadge from "@/components/store/OrderStatusBadge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

/* ─── Types ─── */
interface AdminOrder {
  id: string;
  status: string;
  recipientName: string;
  phone: string;
  zipCode: string;
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
  userName: string;
  userEmail: string;
}

type Tab = "orders" | "quiz";

const STATUS_FLOW = ["ORDERED", "CONFIRMED", "SHIPPED", "DELIVERED"];
const STATUS_LABELS: Record<string, string> = {
  ORDERED: "주문완료",
  CONFIRMED: "확인됨",
  SHIPPED: "배송중",
  DELIVERED: "배송완료",
};

/* ═══════════════════════════════════════════════
   Orders Tab
   ═══════════════════════════════════════════════ */
function OrdersTab() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [editTracking, setEditTracking] = useState<{ orderId: string; value: string } | null>(null);

  const fetchOrders = async () => {
    try {
      const url = filter ? `/api/admin/orders?status=${filter}` : "/api/admin/orders";
      const res = await fetch(url);
      if (res.status === 403) { router.push("/home"); return; }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setLoading(true); fetchOrders(); }, [filter]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      }
    } catch {}
    setUpdating(null);
  };

  const handleTrackingSave = async () => {
    if (!editTracking) return;
    setUpdating(editTracking.orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: editTracking.orderId, trackingNo: editTracking.value }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === editTracking.orderId ? { ...o, trackingNo: editTracking.value } : o
          )
        );
        setEditTracking(null);
      }
    } catch {}
    setUpdating(null);
  };

  const getNextStatus = (current: string) => {
    const idx = STATUS_FLOW.indexOf(current);
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setFilter("")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
            !filter
              ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/40"
              : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]"
          }`}
        >
          전체 ({orders.length})
        </button>
        {STATUS_FLOW.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
              filter === s
                ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/40"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2">
        {STATUS_FLOW.map((s) => {
          const count = filter ? (filter === s ? orders.length : 0) : orders.filter((o) => o.status === s).length;
          return (
            <div key={s} className="bg-[var(--color-surface)] rounded-xl p-2.5 text-center border border-[var(--color-border)]">
              <div className="text-lg font-bold text-[var(--color-text)] num">{count}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">{STATUS_LABELS[s]}</div>
            </div>
          );
        })}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--color-text-muted)]">주문이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const nextStatus = getNextStatus(order.status);
            return (
              <div key={order.id} className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text)]">{order.itemName}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {new Date(order.createdAt).toLocaleString("ko-KR")} · x{order.quantity} · {order.price} {order.coinType}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* User Info */}
                <div className="bg-[var(--color-bg)]/50 rounded-xl p-3 mb-3 space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <span className="text-[var(--color-text-muted)] w-14 flex-shrink-0">주문자</span>
                    <span className="text-[var(--color-text-secondary)]">{order.userName} ({order.userEmail})</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[var(--color-text-muted)] w-14 flex-shrink-0">수령인</span>
                    <span className="text-[var(--color-text-secondary)]">{order.recipientName}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[var(--color-text-muted)] w-14 flex-shrink-0">연락처</span>
                    <span className="text-[var(--color-text-secondary)]">{order.phone}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[var(--color-text-muted)] w-14 flex-shrink-0">주소</span>
                    <span className="text-[var(--color-text-secondary)]">
                      [{order.zipCode}] {order.address}{order.addressDetail ? ` ${order.addressDetail}` : ""}
                    </span>
                  </div>
                  {order.memo && (
                    <div className="flex gap-2">
                      <span className="text-[var(--color-text-muted)] w-14 flex-shrink-0">메모</span>
                      <span className="text-[var(--color-text-secondary)]">{order.memo}</span>
                    </div>
                  )}
                  {order.trackingNo && (
                    <div className="flex gap-2">
                      <span className="text-[var(--color-text-muted)] w-14 flex-shrink-0">운송장</span>
                      <span className="text-[var(--color-primary)] font-semibold">{order.trackingNo}</span>
                    </div>
                  )}
                </div>

                {/* Tracking Number Input */}
                {editTracking?.orderId === order.id ? (
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={editTracking.value}
                      onChange={(e) => setEditTracking({ ...editTracking, value: e.target.value })}
                      placeholder="운송장 번호 입력"
                      className="flex-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                    <Button size="sm" onClick={handleTrackingSave} loading={updating === order.id}>
                      저장
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditTracking(null)}>
                      취소
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      fullWidth
                      onClick={() => setEditTracking({ orderId: order.id, value: order.trackingNo || "" })}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1">
                        <path d="M3 11H5L10.5 5.5L8.5 3.5L3 9V11Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                        <path d="M8 4L10 6" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                      운송장 {order.trackingNo ? "수정" : "입력"}
                    </Button>

                    {nextStatus && (
                      <Button
                        size="sm"
                        fullWidth
                        onClick={() => handleStatusUpdate(order.id, nextStatus)}
                        loading={updating === order.id}
                      >
                        {STATUS_LABELS[nextStatus]}으로 변경
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Quiz Tab
   ═══════════════════════════════════════════════ */
function QuizTab() {
  const router = useRouter();
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    generated?: number;
    failed?: number;
    error?: string;
  } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      if (res.status === 403) { router.push("/home"); return; }
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "네트워크 오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Generator Card */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 border border-[var(--color-border)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L12.5 7.5L18 10L12.5 12.5L10 18L7.5 12.5L2 10L7.5 7.5L10 2Z" stroke="#a855f7" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text)]">AI 퀴즈 자동 생성</h3>
            <p className="text-xs text-[var(--color-text-muted)]">GPT가 건강/영양/피트니스 퀴즈를 생성합니다</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-[var(--color-text-secondary)]">생성 개수</label>
          <input
            type="number"
            min={1}
            max={30}
            value={count}
            onChange={(e) => setCount(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
            className="w-20 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] text-center focus:outline-none focus:border-purple-500"
          />
          <span className="text-xs text-[var(--color-text-muted)]">최대 30개</span>
        </div>

        <Button
          fullWidth
          onClick={handleGenerate}
          loading={loading}
          className="!bg-purple-600 hover:!bg-purple-700"
        >
          {loading ? "AI 생성 중..." : "AI 퀴즈 생성"}
        </Button>
      </div>

      {/* Result Card */}
      {result && (
        <div className={`rounded-2xl p-4 border ${
          result.success
            ? "bg-green-500/10 border-green-500/25"
            : "bg-red-500/10 border-red-500/25"
        }`}>
          {result.success ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="#22c55e" strokeWidth="1.5"/>
                  <path d="M6 9L8 11L12 7" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm font-bold text-green-400">생성 완료</span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {result.generated}개 퀴즈가 성공적으로 생성되었습니다.
                {(result.failed ?? 0) > 0 && ` (${result.failed}개 실패)`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="#ef4444" strokeWidth="1.5"/>
                  <path d="M7 7L11 11M11 7L7 11" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="text-sm font-bold text-red-400">생성 실패</span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">{result.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
        <h4 className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">안내</h4>
        <ul className="text-xs text-[var(--color-text-secondary)] space-y-1.5">
          <li>- 생성된 퀴즈는 자동으로 활성화되어 게임에 출제됩니다</li>
          <li>- 카테고리: 건강(HEALTH), 영양(NUTRITION), 피트니스(FITNESS), 웰니스(WELLNESS)</li>
          <li>- 각 문제는 4지선다형이며 한국어로 생성됩니다</li>
          <li>- OpenAI GPT-4o-mini 모델을 사용합니다</li>
        </ul>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Admin Page (unified)
   ═══════════════════════════════════════════════ */
export default function AdminPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("orders");

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  if (authStatus === "loading") {
    return (
      <div>
        <Header title="관리자" showBack />
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      </div>
    );
  }

  return (
    <div>
      <Header title="관리자" showBack />
      <div className="px-4 py-4 space-y-4">
        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
          <button
            onClick={() => setTab("orders")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              tab === "orders"
                ? "bg-[var(--color-primary)] text-black"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            주문 관리
          </button>
          <button
            onClick={() => setTab("quiz")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              tab === "quiz"
                ? "bg-purple-600 text-white"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            AI 퀴즈
          </button>
        </div>

        {/* Tab Content */}
        {tab === "orders" ? <OrdersTab /> : <QuizTab />}
      </div>
    </div>
  );
}

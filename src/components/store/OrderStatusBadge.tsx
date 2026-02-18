const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ORDERED:   { label: "주문완료", color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  CONFIRMED: { label: "확인됨",   color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/20" },
  SHIPPED:   { label: "배송중",   color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
  DELIVERED: { label: "배송완료", color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20" },
};

export default function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.ORDERED;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${config.color} ${config.bg}`}>
      {config.label}
    </span>
  );
}

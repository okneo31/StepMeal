"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { formatDistance, formatDuration } from "@/lib/geolocation";
import { TRANSPORT_CONFIG } from "@/lib/constants";
import { format } from "date-fns";
import Link from "next/link";

interface Movement {
  id: string;
  distanceM: number;
  durationSec: number;
  totalSc: number;
  transportClass: string;
  isMulti: boolean;
  segments: Array<{ transport: string; distance: number }>;
  completedAt: string;
}

const transportIcons: Record<string, React.ReactNode> = {
  RUN: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="11" cy="3" r="1.5" fill="#22C55E"/><path d="M14 8L11 6L9 7.5L7 9.5L5 11" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  WALK: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="3" r="1.5" fill="#22C55E"/><path d="M9 5V10L7 15M9 10L11 15" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  BIKE: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="5" cy="13" r="3" stroke="#3B82F6" strokeWidth="1.2"/><circle cx="13" cy="13" r="3" stroke="#3B82F6" strokeWidth="1.2"/><path d="M5 13L9 7L13 13" stroke="#3B82F6" strokeWidth="1.2"/></svg>,
  SCOOTER: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="5" cy="14" r="2" stroke="#3B82F6" strokeWidth="1.2"/><circle cx="13" cy="14" r="2" stroke="#3B82F6" strokeWidth="1.2"/><path d="M5 14L7 6H10V4" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  BUS: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="4" y="3" width="10" height="12" rx="2" stroke="#F59E0B" strokeWidth="1.2"/><path d="M4 9H14" stroke="#F59E0B" strokeWidth="1"/></svg>,
  TRAIN: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="5" y="2" width="8" height="11" rx="2" stroke="#F59E0B" strokeWidth="1.2"/><path d="M5 9H13" stroke="#F59E0B" strokeWidth="1"/><path d="M7 16L5 13H13L11 16" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  CAR: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 10L5 6H13L15 10" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round"/><rect x="3" y="10" width="12" height="4" rx="1" stroke="#F59E0B" strokeWidth="1.2"/></svg>,
};

export default function HistoryPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/movement/history")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setMovements(data.movements || []);
        setLoading(false);
      })
      .catch((e) => {
        console.error("History fetch error:", e);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <Header title="이동 기록" />
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="5" r="3" fill="#64748B"/>
                <path d="M14 9V18L10 26M14 18L18 26" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 13L14 11L19 13" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[var(--color-text-muted)]">아직 이동 기록이 없습니다.</p>
            <Link href="/move" className="text-[var(--color-primary)] font-semibold mt-2 inline-block text-sm">
              첫 이동 시작하기
            </Link>
          </div>
        ) : (
          movements.map((m) => {
            const icons = m.segments.map((s) => transportIcons[s.transport] || null);
            return (
              <Link key={m.id} href={`/history/${m.id}`}>
                <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)] flex items-center justify-between hover:border-[var(--color-surface-hover)] transition-colors mb-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1">
                        {icons.map((icon, i) => (
                          <span key={i} className="flex items-center">
                            {icon}
                            {i < icons.length - 1 && (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="mx-0.5">
                                <path d="M3 5H7M7 5L5 3M7 5L5 7" stroke="#64748B" strokeWidth="1" strokeLinecap="round"/>
                              </svg>
                            )}
                          </span>
                        ))}
                      </div>
                      {m.isMulti && <Badge variant="blue">복합</Badge>}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {format(new Date(m.completedAt), "MM월 dd일 HH:mm")} · {formatDistance(m.distanceM)} · {formatDuration(m.durationSec)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[var(--color-primary)] num">+{m.totalSc}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">SC</p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

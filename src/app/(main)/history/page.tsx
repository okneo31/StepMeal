"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
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

export default function HistoryPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/movement/history")
      .then((r) => r.json())
      .then((data) => {
        setMovements(data.movements || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🚶</p>
            <p>아직 이동 기록이 없습니다.</p>
            <Link href="/move" className="text-[var(--color-primary)] font-semibold mt-2 inline-block">
              첫 이동 시작하기
            </Link>
          </div>
        ) : (
          movements.map((m) => {
            const transports = m.segments.map((s) => {
              const config = TRANSPORT_CONFIG[s.transport];
              return config?.emoji || "📍";
            });
            return (
              <Link key={m.id} href={`/history/${m.id}`}>
                <Card className="flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{transports.join(" → ")}</span>
                      {m.isMulti && <Badge variant="blue">복합</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(new Date(m.completedAt), "MM월 dd일 HH:mm")} · {formatDistance(m.distanceM)} · {formatDuration(m.durationSec)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[var(--color-primary)] num">+{m.totalSc}</p>
                    <p className="text-xs text-gray-400">SC</p>
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

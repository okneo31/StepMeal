"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";

interface QrHistoryItem {
  id: string;
  code: string;
  mcReward: number;
  description: string | null;
  usedAt: string;
}

export default function QrHistoryPage() {
  const [history, setHistory] = useState<QrHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/qr/history")
      .then((r) => r.json())
      .then((data) => {
        setHistory(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  return (
    <div>
      <Header title="QR 스캔 내역" showBack />
      <div className="px-4 py-4 space-y-3">
        {history.length === 0 ? (
          <Card className="text-center py-8">
            <span className="text-4xl block mb-2">📭</span>
            <p className="text-gray-500 text-sm">아직 스캔한 QR코드가 없습니다</p>
          </Card>
        ) : (
          history.map((item) => (
            <Card key={item.id} padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{item.description || item.code}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(item.usedAt).toLocaleDateString("ko-KR", {
                      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="text-amber-600 font-bold">+{item.mcReward} MC</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { formatDistance } from "@/lib/geolocation";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [stride, setStride] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stride").then((r) => r.json()),
      fetch("/api/coins/balance").then((r) => r.json()),
    ]).then(([s, b]) => {
      setStride(s);
      setBalance(b);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  return (
    <div>
      <Header title="마이페이지" />
      <div className="px-4 py-4 space-y-4">
        {/* Profile info */}
        <Card className="text-center">
          <div className="w-16 h-16 bg-[var(--color-primary-light)] rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">👤</span>
          </div>
          <h2 className="text-lg font-bold">{session?.user?.name}</h2>
          <p className="text-sm text-gray-500">{session?.user?.email}</p>
          {stride && (
            <Badge variant="green" size="md">
              Stride {stride.level} · {stride.title}
            </Badge>
          )}
        </Card>

        {/* Stats */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">누적 기록</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold num">{formatDistance(stride?.totalDistance || 0)}</p>
              <p className="text-xs text-gray-500">총 이동거리</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold num">{stride?.longestStreak || 0}일</p>
              <p className="text-xs text-gray-500">최장 연속</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-green-700 num">{(balance?.scLifetime || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">누적 SC</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-amber-700 num">{(balance?.mcLifetime || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">누적 MC</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card>
          <div className="space-y-2">
            <button className="w-full text-left py-3 px-1 border-b border-gray-100 text-sm text-gray-700 flex justify-between">
              <span>알림 설정</span>
              <span className="text-gray-400">→</span>
            </button>
            <button className="w-full text-left py-3 px-1 border-b border-gray-100 text-sm text-gray-700 flex justify-between">
              <span>체중 설정</span>
              <span className="text-gray-400">→</span>
            </button>
            <button className="w-full text-left py-3 px-1 text-sm text-gray-700 flex justify-between">
              <span>앱 정보</span>
              <span className="text-gray-400">v0.1.0</span>
            </button>
          </div>
        </Card>

        <Button
          variant="ghost"
          fullWidth
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-red-500"
        >
          로그아웃
        </Button>
      </div>
    </div>
  );
}

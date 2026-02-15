"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import DailySummaryCard from "@/components/home/DailySummaryCard";
import CoinBalanceCard from "@/components/home/CoinBalanceCard";
import StrideInfoCard from "@/components/home/StrideInfoCard";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [balance, setBalance] = useState({ scBalance: 0, mcBalance: 0 });
  const [stride, setStride] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/coins/balance").then((r) => r.json()),
        fetch("/api/stride").then((r) => r.json()),
        fetch("/api/stats").then((r) => r.json()),
      ]).then(([bal, str, sts]) => {
        setBalance(bal);
        setStride(str);
        setStats(sts);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [status, router]);

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <Header
        title={`안녕하세요, ${session?.user?.name || "사용자"}님`}
      />
      <div className="px-4 py-4 space-y-4">
        <DailySummaryCard
          distanceM={stats?.today?.distanceM || 0}
          durationSec={0}
          calories={stats?.today?.calories || 0}
        />

        <CoinBalanceCard
          scBalance={balance.scBalance}
          mcBalance={balance.mcBalance}
        />

        {stride && (
          <StrideInfoCard
            level={stride.level}
            title={stride.title}
            multiplier={stride.multiplier}
            currentStreak={stride.currentStreak}
            dailyCap={stride.dailyCap}
            daysUntilNext={stride.daysUntilNext}
            shieldCount={stride.shieldCount}
          />
        )}

        <Link href="/move">
          <Button fullWidth size="lg" className="mt-2">
            이동 시작하기
          </Button>
        </Link>
      </div>
    </div>
  );
}

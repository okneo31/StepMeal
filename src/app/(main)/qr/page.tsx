"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import QrScanner from "@/components/qr/QrScanner";
import type { QrScanResult } from "@/types";

export default function QrPage() {
  const [result, setResult] = useState<QrScanResult | null>(null);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  async function handleScan(code: string) {
    if (loading) return;
    setLoading(true);
    setScanning(false);

    try {
      const res = await fetch("/api/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, mcReward: data.mcReward, description: data.description, newMcBalance: data.newMcBalance });
      } else {
        setResult({ success: false, error: data.error });
      }
    } catch {
      setResult({ success: false, error: "네트워크 오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  }

  function resetScanner() {
    setResult(null);
    setScanning(true);
  }

  return (
    <div>
      <Header
        title="QR 스캔"
        showBack
        rightAction={
          <Link href="/qr/history" className="text-sm text-[var(--color-primary)] font-semibold">
            내역
          </Link>
        }
      />
      <div className="px-4 py-4 space-y-4">
        {cameraError ? (
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] text-center py-8 px-4">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="7" width="20" height="14" rx="3" stroke="#64748B" strokeWidth="1.5"/>
                <circle cx="14" cy="14" r="4" stroke="#64748B" strokeWidth="1.5"/>
                <circle cx="14" cy="14" r="1.5" fill="#64748B"/>
              </svg>
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm">{cameraError}</p>
          </div>
        ) : scanning ? (
          <>
            <div className="bg-[var(--color-surface)] rounded-2xl p-3 border border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-secondary)] text-center">
                건강식품 패키지의 QR코드를 카메라로 스캔하세요
              </p>
            </div>
            <QrScanner
              onScan={handleScan}
              onError={(err) => setCameraError(err)}
            />
          </>
        ) : (
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] text-center py-8 px-4">
            {loading ? (
              <>
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="10" stroke="#64748B" strokeWidth="1.5"/>
                    <path d="M14 8V14L18 18" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-[var(--color-text-secondary)]">QR코드 확인 중...</p>
              </>
            ) : result?.success ? (
              <>
                <div className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-3">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <path d="M10 18L16 24L26 12" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gradient-gold mb-1 num">+{result.mcReward} MC</h2>
                {result.description && (
                  <p className="text-sm text-[var(--color-text-muted)] mb-1">{result.description}</p>
                )}
                <p className="text-xs text-[var(--color-text-muted)] mb-4">
                  현재 잔액: {result.newMcBalance?.toLocaleString()} MC
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={resetScanner} variant="outline" size="sm">
                    다시 스캔
                  </Button>
                  <Link href="/home">
                    <Button size="sm">홈으로</Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-red-500/15 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-3">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <path d="M12 12L24 24M24 12L12 24" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-red-400 font-semibold mb-1">스캔 실패</p>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">{result?.error}</p>
                <Button onClick={resetScanner} variant="outline" size="sm">
                  다시 스캔
                </Button>
              </>
            )}
          </div>
        )}

        <div className="bg-[var(--color-surface)] rounded-2xl p-3 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">안내</h3>
          <ul className="text-xs text-[var(--color-text-muted)] space-y-1">
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)] flex-shrink-0" />
              건강식품 구매 후 포장지의 QR코드를 스캔하세요
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)] flex-shrink-0" />
              QR코드는 1회만 사용 가능합니다
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)] flex-shrink-0" />
              일일 스캔 한도: 10회
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

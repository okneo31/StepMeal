"use client";

import { useEffect, useRef, useState } from "react";

interface QrScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
}

export default function QrScanner({ onScan, onError }: QrScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<any>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted || !scannerRef.current) return;

        const scanner = new Html5Qrcode("qr-reader");
        html5QrRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            onScan(decodedText);
            scanner.pause(true);
          },
          () => {},
        );
        if (mounted) setStarted(true);
      } catch (err) {
        if (mounted) {
          onError?.("카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.");
        }
      }
    }

    init();

    return () => {
      mounted = false;
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <div
        id="qr-reader"
        ref={scannerRef}
        className="w-full rounded-2xl overflow-hidden bg-black border-2 border-[var(--color-border)]"
        style={{ minHeight: 300 }}
      />
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg)] rounded-2xl">
          <div className="text-center">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto mb-2 animate-pulse">
              <rect x="6" y="10" width="28" height="20" rx="4" stroke="#64748B" strokeWidth="1.5"/>
              <circle cx="20" cy="20" r="6" stroke="#64748B" strokeWidth="1.5"/>
              <circle cx="20" cy="20" r="2" fill="#64748B"/>
            </svg>
            <p className="text-[var(--color-text-muted)] text-sm">카메라 로딩 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}

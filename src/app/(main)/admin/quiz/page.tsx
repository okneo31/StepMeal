"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";

export default function AdminQuizPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    generated?: number;
    failed?: number;
    error?: string;
  } | null>(null);

  if (authStatus === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      if (res.status === 403) {
        router.push("/home");
        return;
      }
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "네트워크 오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="AI 퀴즈 관리 (관리자)" showBack />
      <div className="px-4 py-4 space-y-4">
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
    </div>
  );
}

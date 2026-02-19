"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Spinner from "@/components/ui/Spinner";
import { formatDistance } from "@/lib/geolocation";

interface WeeklyReport {
  report: string;
  generatedAt: string;
  meta: {
    weekStart: string;
    weekEnd: string;
    totalDistanceKm: string;
    activeDays: number;
    moveCount: number;
    totalSc: number;
    totalCalories: number;
  };
}

function parseReportSections(report: string) {
  const sections: { title: string; content: string }[] = [];
  const parts = report.split(/###\s+/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const newlineIdx = trimmed.indexOf("\n");
    if (newlineIdx === -1) {
      sections.push({ title: trimmed, content: "" });
    } else {
      sections.push({
        title: trimmed.slice(0, newlineIdx).trim(),
        content: trimmed.slice(newlineIdx + 1).trim(),
      });
    }
  }
  return sections;
}

const SECTION_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  "이번 주 총평": { bg: "bg-purple-500/10", border: "border-purple-500/20", icon: "#a855f7" },
  "잘한 점": { bg: "bg-green-500/10", border: "border-green-500/20", icon: "#22c55e" },
  "개선할 점": { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "#f59e0b" },
  "다음 주 목표": { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "#3b82f6" },
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
  "이번 주 총평": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L10 6L14 6.5L11 9.5L12 14L8 11.5L4 14L5 9.5L2 6.5L6 6L8 2Z" stroke="#a855f7" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  "잘한 점": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#22c55e" strokeWidth="1.2"/>
      <path d="M5.5 8L7 9.5L10.5 6" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "개선할 점": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3L13 13H3L8 3Z" stroke="#f59e0b" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M8 7V9.5" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="8" cy="11" r="0.5" fill="#f59e0b"/>
    </svg>
  ),
  "다음 주 목표": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#3b82f6" strokeWidth="1.2"/>
      <circle cx="8" cy="8" r="3" stroke="#3b82f6" strokeWidth="1.2"/>
      <circle cx="8" cy="8" r="0.8" fill="#3b82f6"/>
    </svg>
  ),
};

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<WeeklyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportError(null);
    try {
      const res = await fetch("/api/stats/weekly-report");
      const data = await res.json();
      if (!res.ok) {
        setReportError(data.error || "리포트 생성에 실패했습니다.");
      } else {
        setReportData(data);
      }
    } catch {
      setReportError("네트워크 오류가 발생했습니다.");
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  const sections = reportData ? parseReportSections(reportData.report) : [];

  return (
    <div>
      <Header title="통계" />
      <div className="px-4 py-4 space-y-4">
        {/* Weekly */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">이번 주</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)] num">{formatDistance(stats?.weekly?.distance || 0)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">거리</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-primary)] num">{(stats?.weekly?.sc || 0).toLocaleString()}</p>
              <p className="text-xs text-[var(--color-text-muted)]">SC</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)] num">{stats?.weekly?.activeDays || 0}일</p>
              <p className="text-xs text-[var(--color-text-muted)]">활동일</p>
            </div>
          </div>
        </div>

        {/* Daily Chart */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">일별 이동 거리</h3>
          <div className="flex items-end justify-between gap-1 h-32">
            {(stats?.dailyChart || []).map((d: any, i: number) => {
              const maxDist = Math.max(...(stats?.dailyChart || []).map((x: any) => x.distance), 1);
              const pct = Math.max((d.distance / maxDist) * 100, 4);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-[var(--color-text-muted)] num">{d.distance > 0 ? formatDistance(d.distance) : ""}</span>
                  <div className="w-full flex justify-center">
                    <div
                      className="w-6 bg-gradient-to-t from-green-600 to-green-400 rounded-t-md transition-all"
                      style={{ height: `${pct}%`, minHeight: "4px" }}
                    />
                  </div>
                  <span className="text-[9px] text-[var(--color-text-muted)]">{d.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">이번 달</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-text)] num">{formatDistance(stats?.monthly?.distance || 0)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">총 거리</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/15 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-green-400 num">{(stats?.monthly?.sc || 0).toLocaleString()} SC</p>
              <p className="text-xs text-[var(--color-text-muted)]">총 SC</p>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-text)] num">{(stats?.monthly?.calories || 0).toLocaleString()}</p>
              <p className="text-xs text-[var(--color-text-muted)]">칼로리</p>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-text)] num">{stats?.monthly?.movementCount || 0}회</p>
              <p className="text-xs text-[var(--color-text-muted)]">이동 횟수</p>
            </div>
          </div>
        </div>

        {/* AI Weekly Report */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L11 6.5L16 7L12.5 10.5L13.5 16L9 13L4.5 16L5.5 10.5L2 7L7 6.5L9 2Z" stroke="#a855f7" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text)]">AI 주간 리포트</h3>
              <p className="text-xs text-[var(--color-text-muted)]">GPT가 분석하는 나만의 운동 리포트</p>
            </div>
          </div>

          {!reportData && !reportLoading && !reportError && (
            <button
              onClick={handleGenerateReport}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors"
            >
              리포트 생성하기
            </button>
          )}

          {reportLoading && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-purple-400">AI가 활동 데이터를 분석하고 있습니다...</p>
            </div>
          )}

          {reportError && (
            <div className="space-y-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-xs text-red-400">{reportError}</p>
              </div>
              <button
                onClick={handleGenerateReport}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {reportData && sections.length > 0 && (
            <div className="space-y-3">
              {/* Meta summary */}
              <div className="grid grid-cols-3 gap-2 mb-1">
                <div className="bg-purple-500/10 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-purple-400 num">{reportData.meta.totalDistanceKm}km</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">총 거리</p>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-purple-400 num">{reportData.meta.activeDays}일</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">활동일</p>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-purple-400 num">{reportData.meta.totalSc.toLocaleString()}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">SC</p>
                </div>
              </div>

              {/* Report sections */}
              {sections.map((sec, i) => {
                const colors = SECTION_COLORS[sec.title] || { bg: "bg-[var(--color-surface-elevated)]", border: "border-[var(--color-border)]", icon: "#a855f7" };
                const icon = SECTION_ICONS[sec.title] || null;
                return (
                  <div key={i} className={`${colors.bg} border ${colors.border} rounded-xl p-3`}>
                    <div className="flex items-center gap-2 mb-2">
                      {icon}
                      <h4 className="text-xs font-bold text-[var(--color-text)]">{sec.title}</h4>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                      {sec.content}
                    </p>
                  </div>
                );
              })}

              {/* Regenerate */}
              <button
                onClick={handleGenerateReport}
                className="w-full py-2.5 rounded-xl border border-purple-500/30 text-purple-400 text-xs font-semibold hover:bg-purple-500/10 transition-colors"
              >
                리포트 다시 생성
              </button>

              <p className="text-[10px] text-[var(--color-text-muted)] text-center">
                {reportData.meta.weekStart} ~ {reportData.meta.weekEnd} 기준
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

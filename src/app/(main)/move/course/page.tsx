"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

interface Checkpoint {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  rewardSc: number;
  radiusM?: number;
}

interface Course {
  id: string;
  name: string;
  description: string | null;
  category: string;
  checkpoints: Checkpoint[];
  completionBonus: number;
  estimatedKm: number;
}

interface ActiveAttempt {
  id: string;
  courseId: string;
  courseName: string;
  currentCheckpoint: number;
  completedChecks: number[];
  checkpoints: Checkpoint[];
  completionBonus: number;
  totalEarned: number;
  status: string;
}

export default function CoursePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeAttempt, setActiveAttempt] = useState<ActiveAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/course");
      const data = await res.json();
      setCourses(data.courses || []);
      setActiveAttempt(data.activeAttempt);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startCourse = async (courseId: string) => {
    setStarting(courseId);
    setError("");
    try {
      const res = await fetch("/api/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        await fetchData();
      }
    } catch {
      setError("서버 오류");
    }
    setStarting(null);
  };

  const verifyCheckpoint = async () => {
    if (!activeAttempt) return;
    setVerifying(true);
    setError("");
    setMessage("");

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });

      const res = await fetch("/api/course", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: activeAttempt.id,
          action: "verify",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        if (data.isComplete) {
          setMessage(`코스 완주! +${data.checkpointReward + data.completionBonus} SC`);
        } else {
          setMessage(`체크포인트 도착! +${data.checkpointReward} SC`);
        }
        await fetchData();
      }
    } catch (e) {
      setError("위치를 가져올 수 없습니다.");
    }
    setVerifying(false);
  };

  const cancelCourse = async () => {
    if (!activeAttempt) return;
    setCancelling(true);
    try {
      await fetch("/api/course", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: activeAttempt.id, action: "cancel" }),
      });
      await fetchData();
    } catch {}
    setCancelling(false);
  };

  if (loading) {
    return (
      <div>
        <Header title="코스 퀘스트" showBack />
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      </div>
    );
  }

  const CATEGORY_LABELS: Record<string, string> = { HEALTH: "건강", FOOD: "맛집", TOUR: "관광" };

  return (
    <div>
      <Header title="코스 퀘스트" showBack />
      <div className="px-4 py-4 space-y-4">

        {message && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-sm text-green-400 text-center font-semibold">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Active Course */}
        {activeAttempt && (
          <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-primary)]/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[var(--color-text)]">{activeAttempt.courseName}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 font-semibold">
                진행 중
              </span>
            </div>

            {/* Checkpoints */}
            <div className="space-y-2 mb-4">
              {activeAttempt.checkpoints.map((cp, idx) => {
                const completed = activeAttempt.completedChecks.includes(idx);
                const isCurrent = idx === activeAttempt.currentCheckpoint;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2.5 rounded-lg ${
                      completed
                        ? "bg-green-500/10"
                        : isCurrent
                        ? "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20"
                        : "bg-[var(--color-bg)]/30"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      completed ? "bg-green-500 text-black" : isCurrent ? "bg-[var(--color-primary)] text-black" : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]"
                    }`}>
                      {completed ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${completed ? "text-green-400" : "text-[var(--color-text)]"}`}>{cp.name}</p>
                      {cp.address && <p className="text-xs text-[var(--color-text-muted)]">{cp.address}</p>}
                    </div>
                    <span className="text-xs font-semibold text-green-400">+{cp.rewardSc} SC</span>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-[var(--color-text-muted)] text-center mb-3">
              획득: <span className="text-green-400 font-bold">{activeAttempt.totalEarned} SC</span>
              {activeAttempt.currentCheckpoint < activeAttempt.checkpoints.length && (
                <> · 완주 보너스: <span className="text-amber-400 font-bold">+{activeAttempt.completionBonus} SC</span></>
              )}
            </p>

            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={cancelCourse} loading={cancelling}>
                포기
              </Button>
              {activeAttempt.currentCheckpoint < activeAttempt.checkpoints.length && (
                <Button fullWidth onClick={verifyCheckpoint} loading={verifying}>
                  도착 인증
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Course List */}
        {!activeAttempt && (
          <>
            <p className="text-sm text-[var(--color-text-muted)]">
              여러 장소를 순서대로 방문하고 보상을 받으세요!
            </p>
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-[var(--color-text-muted)]">등록된 코스가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div key={course.id} className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-semibold">
                        {CATEGORY_LABELS[course.category] || course.category}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {course.checkpoints.length}곳 · ~{course.estimatedKm}km
                      </span>
                    </div>
                    <h4 className="font-bold text-[var(--color-text)] mb-1">{course.name}</h4>
                    {course.description && (
                      <p className="text-sm text-[var(--color-text-secondary)] mb-2">{course.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-[var(--color-text-muted)]">
                        체크포인트 보상 + 완주 <span className="text-green-400 font-bold">+{course.completionBonus} SC</span>
                      </div>
                      <Button size="sm" onClick={() => startCourse(course.id)} loading={starting === course.id}>
                        시작
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

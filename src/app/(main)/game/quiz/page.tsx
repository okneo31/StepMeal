"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import QuizOption from "@/components/game/QuizOption";
import Spinner from "@/components/ui/Spinner";
import type { QuizQuestionDisplay } from "@/types";

export default function QuizPage() {
  const [question, setQuestion] = useState<QuizQuestionDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [exhausted, setExhausted] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctIndex: number;
    explanation: string | null;
    mcEarned: number;
  } | null>(null);

  const fetchQuestion = useCallback(() => {
    setLoading(true);
    setSelectedIndex(null);
    setResult(null);

    fetch("/api/game/quiz/question")
      .then((r) => r.json())
      .then((data) => {
        if (data.exhausted) {
          setExhausted(true);
          setRemainingAttempts(0);
        } else {
          setExhausted(false);
          setQuestion(data.question);
          setRemainingAttempts(data.remainingAttempts);
        }
      })
      .catch(() => setExhausted(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const handleSubmit = async () => {
    if (selectedIndex === null || !question || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/game/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          selectedIndex,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          isCorrect: data.isCorrect,
          correctIndex: data.correctIndex,
          explanation: data.explanation,
          mcEarned: data.mcEarned,
        });
        setRemainingAttempts(data.remainingAttempts);
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (exhausted) {
    return (
      <div>
        <Header title="데일리 퀴즈" showBack />
        <div className="px-4 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="12" stroke="#3B82F6" strokeWidth="2"/>
              <path d="M14 14C14 11.8 15.8 10 18 10C20.2 10 22 11.8 22 14C22 16 20 16.5 20 19" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="18" cy="24" r="1.5" fill="#3B82F6"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">
            오늘의 퀴즈를 모두 풀었습니다!
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">내일 다시 도전해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="데일리 퀴즈" showBack />
      <div className="px-4 py-4 space-y-4">
        {/* Status */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--color-text-muted)]">
            남은 횟수: <strong className="text-[var(--color-text)] num">{remainingAttempts}회</strong>
          </span>
          <span className="text-sm text-amber-400 font-medium flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5" fill="#F59E0B" fillOpacity="0.3" stroke="#F59E0B" strokeWidth="1"/>
              <path d="M5 6H9M5 8H9" stroke="#F59E0B" strokeWidth="0.8" strokeLinecap="round"/>
            </svg>
            정답 시 20 MC
          </span>
        </div>

        {/* Question */}
        {question && (
          <>
            <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-blue-500/20">
              <p className="text-base font-semibold text-[var(--color-text)] leading-relaxed">
                {question.question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, i) => (
                <QuizOption
                  key={i}
                  index={i}
                  text={option}
                  selected={selectedIndex === i}
                  correct={result ? i === result.correctIndex : undefined}
                  showResult={result !== null}
                  onSelect={setSelectedIndex}
                  disabled={result !== null || submitting}
                />
              ))}
            </div>

            {/* Result */}
            {result && (
              <div className={`rounded-2xl p-4 border text-center ${
                result.isCorrect
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-red-500/10 border-red-500/20"
              }`}>
                <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                  result.isCorrect ? "bg-green-500/20" : "bg-red-500/20"
                }`}>
                  {result.isCorrect ? (
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path d="M8 16L14 22L24 10" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path d="M10 10L22 22M22 10L10 22" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
                <h3 className="font-bold text-lg text-[var(--color-text)] mb-1">
                  {result.isCorrect ? "정답입니다!" : "틀렸습니다"}
                </h3>
                {result.isCorrect && (
                  <p className="text-amber-400 font-semibold num">+{result.mcEarned} MC</p>
                )}
                {result.explanation && (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-2">{result.explanation}</p>
                )}
              </div>
            )}

            {/* Action Button */}
            {result ? (
              remainingAttempts > 0 ? (
                <Button fullWidth size="lg" onClick={fetchQuestion}>
                  다음 문제 풀기
                </Button>
              ) : (
                <Button fullWidth size="lg" variant="secondary" onClick={() => window.history.back()}>
                  게임으로 돌아가기
                </Button>
              )
            ) : (
              <Button
                fullWidth
                size="lg"
                onClick={handleSubmit}
                disabled={selectedIndex === null}
                loading={submitting}
              >
                정답 제출
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

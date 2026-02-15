"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
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
          <p className="text-5xl mb-4">🧠</p>
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            오늘의 퀴즈를 모두 풀었습니다!
          </h3>
          <p className="text-sm text-gray-500">내일 다시 도전해주세요.</p>
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
          <span className="text-sm text-gray-500">
            남은 횟수: <strong className="text-gray-800 num">{remainingAttempts}회</strong>
          </span>
          <span className="text-sm text-amber-600 font-medium">
            정답 시 20 MC
          </span>
        </div>

        {/* Question */}
        {question && (
          <>
            <Card>
              <p className="text-base font-semibold text-gray-800 leading-relaxed">
                {question.question}
              </p>
            </Card>

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
              <Card className={result.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                <div className="text-center">
                  <p className="text-3xl mb-2">{result.isCorrect ? "🎉" : "😢"}</p>
                  <h3 className="font-bold text-lg mb-1">
                    {result.isCorrect ? "정답입니다!" : "틀렸습니다"}
                  </h3>
                  {result.isCorrect && (
                    <p className="text-amber-700 font-semibold num">+{result.mcEarned} MC</p>
                  )}
                  {result.explanation && (
                    <p className="text-sm text-gray-600 mt-2">{result.explanation}</p>
                  )}
                </div>
              </Card>
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

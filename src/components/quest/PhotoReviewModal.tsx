"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface Props {
  questId: string;
  destName: string;
  onClose: () => void;
  onSubmitted: (bonus: { arrivalBonus: number; reviewBonus: number; totalBonus: number }) => void;
}

export default function PhotoReviewModal({ questId, destName, onClose, onSubmitted }: Props) {
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/quest/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId, comment, rating }),
      });

      const data = await res.json();
      if (res.ok) {
        onSubmitted(data);
      } else {
        setError(data.error || "리뷰 작성에 실패했습니다.");
      }
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--color-surface)] rounded-t-3xl sm:rounded-3xl p-5 border border-[var(--color-border)] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--color-text)]">리뷰 작성</h3>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)] mb-4">{destName}</p>

        {/* Rating */}
        <div className="mb-4">
          <label className="block text-xs text-[var(--color-text-muted)] mb-2">평점</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path
                    d="M14 3L17 10H24L19 14.5L21 22L14 17.5L7 22L9 14.5L4 10H11L14 3Z"
                    fill={star <= rating ? "#F59E0B" : "transparent"}
                    stroke={star <= rating ? "#F59E0B" : "#64748B"}
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-4">
          <label className="block text-xs text-[var(--color-text-muted)] mb-2">한줄 후기</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="방문 후기를 작성해주세요"
            maxLength={200}
            rows={3}
            className="w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-3">{error}</p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" fullWidth onClick={onClose}>
            건너뛰기
          </Button>
          <Button fullWidth onClick={handleSubmit} loading={submitting}>
            리뷰 제출 (+20 SC)
          </Button>
        </div>
      </div>
    </div>
  );
}

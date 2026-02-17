"use client";

interface Props {
  index: number;
  text: string;
  selected: boolean;
  correct?: boolean;
  showResult: boolean;
  onSelect: (index: number) => void;
  disabled: boolean;
}

const labels = ["A", "B", "C", "D"];

export default function QuizOption({ index, text, selected, correct, showResult, onSelect, disabled }: Props) {
  let borderColor = "border-[var(--color-border)]";
  let bgColor = "bg-[var(--color-surface)]";
  let textColor = "text-[var(--color-text)]";

  if (showResult) {
    if (correct) {
      borderColor = "border-green-500/50";
      bgColor = "bg-green-500/10";
      textColor = "text-green-400";
    } else if (selected && !correct) {
      borderColor = "border-red-500/50";
      bgColor = "bg-red-500/10";
      textColor = "text-red-400";
    }
  } else if (selected) {
    borderColor = "border-[var(--color-primary)]/50";
    bgColor = "bg-[var(--color-primary)]/10";
  }

  return (
    <button
      onClick={() => onSelect(index)}
      disabled={disabled}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${borderColor} ${bgColor} ${textColor} ${
        disabled ? "cursor-not-allowed" : "hover:border-[var(--color-surface-hover)] active:scale-[0.98]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
          selected && !showResult
            ? "bg-[var(--color-primary)] text-white"
            : showResult && correct
            ? "bg-green-500 text-white"
            : showResult && selected && !correct
            ? "bg-red-500 text-white"
            : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]"
        }`}>
          {showResult && correct ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : showResult && selected && !correct ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : labels[index]}
        </span>
        <span className="text-sm font-medium leading-relaxed">{text}</span>
      </div>
    </button>
  );
}

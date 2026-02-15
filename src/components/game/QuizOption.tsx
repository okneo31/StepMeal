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
  let borderColor = "border-gray-200";
  let bgColor = "bg-white";
  let textColor = "text-gray-800";

  if (showResult) {
    if (correct) {
      borderColor = "border-green-500";
      bgColor = "bg-green-50";
      textColor = "text-green-800";
    } else if (selected && !correct) {
      borderColor = "border-red-500";
      bgColor = "bg-red-50";
      textColor = "text-red-800";
    }
  } else if (selected) {
    borderColor = "border-[var(--color-primary)]";
    bgColor = "bg-green-50";
  }

  return (
    <button
      onClick={() => onSelect(index)}
      disabled={disabled}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${borderColor} ${bgColor} ${textColor} ${
        disabled ? "cursor-not-allowed" : "hover:border-gray-300 active:scale-[0.98]"
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
            : "bg-gray-100 text-gray-600"
        }`}>
          {showResult && correct ? "✓" : showResult && selected && !correct ? "✗" : labels[index]}
        </span>
        <span className="text-sm font-medium leading-relaxed">{text}</span>
      </div>
    </button>
  );
}

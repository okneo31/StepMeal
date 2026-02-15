interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: string;
  label?: string;
}

export default function ProgressBar({ value, color = "bg-[var(--color-primary)]", height = "h-2", label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div>
      {label && <div className="text-xs text-gray-500 mb-1">{label}</div>}
      <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

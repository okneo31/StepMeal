"use client";

interface Props {
  arrived: boolean;
  distanceM?: number;
  onVerify: () => void;
  verifying: boolean;
}

export default function ArrivalBanner({ arrived, distanceM, onVerify, verifying }: Props) {
  if (arrived) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 10L9 13L14 7" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="10" r="8" stroke="#22C55E" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-400">목적지에 도착했습니다!</p>
            <p className="text-xs text-green-400/60">사진 리뷰를 작성하면 추가 보너스를 받을 수 있습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3C7 3 4 6 4 9C4 13 10 17 10 17C10 17 16 13 16 9C16 6 13 3 10 3Z" stroke="#3B82F6" strokeWidth="1.5"/>
              <circle cx="10" cy="9" r="2" stroke="#3B82F6" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">
              {distanceM ? `목적지까지 ${distanceM >= 1000 ? `${(distanceM / 1000).toFixed(1)}km` : `${distanceM}m`}` : "이동 중..."}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">50m 이내 도착 시 인증 가능</p>
          </div>
        </div>
        <button
          onClick={onVerify}
          disabled={verifying}
          className="px-3 py-1.5 bg-blue-500/15 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/20 hover:bg-blue-500/25 transition-colors disabled:opacity-50"
        >
          {verifying ? "확인 중..." : "도착 인증"}
        </button>
      </div>
    </div>
  );
}

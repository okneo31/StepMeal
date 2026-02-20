import Link from "next/link";

/* ─── 섹션 공통 컴포넌트 ─── */
function Section({
  id,
  icon,
  title,
  accent = "green",
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  accent?: "green" | "amber" | "purple" | "blue" | "cyan" | "red";
  children: React.ReactNode;
}) {
  const accentMap = {
    green: "border-green-500/20",
    amber: "border-amber-500/20",
    purple: "border-purple-500/20",
    blue: "border-blue-500/20",
    cyan: "border-cyan-500/20",
    red: "border-red-500/20",
  };
  return (
    <section id={id} className={`bg-[var(--color-surface)] rounded-2xl p-5 border ${accentMap[accent]}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="shrink-0">{icon}</div>
        <h2 className="text-lg font-bold text-[var(--color-text)]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      {children}
    </span>
  );
}

/* ─── 메인 페이지 ─── */
export default function GuidePage() {
  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-40 glass border-b border-[var(--color-border)]">
        <div className="max-w-lg mx-auto flex items-center justify-between h-12 px-4">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#22C55E" strokeWidth="1.5" fill="#22C55E" fillOpacity="0.1" />
              <path d="M8 12L11 15L16 9" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 className="text-lg font-bold text-[var(--color-text)]">StepMeal 가이드</h1>
          </div>
          <Link
            href="/login"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-black hover:opacity-90 transition-opacity"
          >
            앱으로 이동
          </Link>
        </div>
      </header>

      {/* ── 본문 ── */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
        {/* 1. Hero */}
        <section className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-amber-500/20 border-2 border-green-500/30 flex items-center justify-center glow-green">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L12 10V22L20 28V16L28 10V22L20 28" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="20" cy="34" r="3" fill="#F59E0B" fillOpacity="0.6" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--color-text)] mb-2">StepMeal</h1>
          <p className="text-base text-[var(--color-text-secondary)] mb-1">움직여서 벌고, 건강하게 먹자</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            걸으면 코인이 쌓이고, 건강한 식품으로 교환하는 Move-to-Earn 앱
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Chip color="bg-green-500/10 text-green-400">PWA 지원</Chip>
            <Chip color="bg-blue-500/10 text-blue-400">GPS 트래킹</Chip>
            <Chip color="bg-purple-500/10 text-purple-400">NFT 리워드</Chip>
          </div>
        </section>

        {/* 2. 듀얼 코인 시스템 */}
        <Section
          id="coins"
          title="듀얼 코인 시스템"
          accent="green"
          icon={
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="11" cy="14" r="8" stroke="#22C55E" strokeWidth="1.5" fill="#22C55E" fillOpacity="0.1" />
              <circle cx="17" cy="14" r="8" stroke="#F59E0B" strokeWidth="1.5" fill="#F59E0B" fillOpacity="0.1" />
            </svg>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="#22C55E" strokeWidth="1.5" />
                  <text x="10" y="14" textAnchor="middle" fill="#22C55E" fontSize="9" fontWeight="bold">S</text>
                </svg>
              </div>
              <p className="text-sm font-bold text-green-400">StepCoin (SC)</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">이동으로 획득</p>
              <p className="text-xs text-[var(--color-text-muted)]">걷기 · 자전거 · 대중교통</p>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-500/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="#F59E0B" strokeWidth="1.5" />
                  <text x="10" y="14" textAnchor="middle" fill="#F59E0B" fontSize="9" fontWeight="bold">M</text>
                </svg>
              </div>
              <p className="text-sm font-bold text-amber-400">MealCoin (MC)</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">QR/게임으로 획득</p>
              <p className="text-xs text-[var(--color-text-muted)]">매장 QR · 미니게임</p>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-3 text-center">
            SC와 MC를 모아 상점에서 건강식품을 구매할 수 있습니다.
          </p>
        </Section>

        {/* 3. 이동 & 걷기 */}
        <Section
          id="move"
          title="이동 & 걷기"
          accent="green"
          icon={
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="6" r="3" stroke="#22C55E" strokeWidth="1.5" />
              <path d="M14 10V18M14 18L10 24M14 18L18 24M10 14H18" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-green-500/10 flex items-center justify-center mt-0.5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 13L8 3L13 13" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">GPS 트래킹</p>
                <p className="text-xs text-[var(--color-text-muted)]">실시간 위치 추적으로 이동 거리를 정확하게 측정합니다.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-green-500/10 flex items-center justify-center mt-0.5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#22C55E" strokeWidth="1.2" />
                  <path d="M5 8L7 10L11 6" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">이동 수단</p>
                <p className="text-xs text-[var(--color-text-muted)]">걷기 · 자전거 · 대중교통 3가지 이동 수단을 지원합니다.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-green-500/10 flex items-center justify-center mt-0.5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="4" width="12" height="8" rx="2" stroke="#22C55E" strokeWidth="1.2" />
                  <text x="8" y="10" textAnchor="middle" fill="#22C55E" fontSize="6" fontWeight="bold">SC</text>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">SC 리워드</p>
                <p className="text-xs text-[var(--color-text-muted)]">이동 거리 × 스트라이드 배율 × NFT 보너스로 SC가 지급됩니다.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* 4. 스트라이드 시스템 */}
        <Section
          id="stride"
          title="스트라이드 시스템"
          accent="blue"
          icon={
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M4 20L8 12L14 16L20 8L24 12" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="24" cy="12" r="2" fill="#3B82F6" fillOpacity="0.4" />
            </svg>
          }
        >
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            매일 이동하면 스트라이드 레벨이 올라가고, SC 배율 보너스를 받습니다.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">연속 출석</p>
              <p className="text-sm text-[var(--color-text)]">매일 이동 시 연속일수 증가</p>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">레벨업</p>
              <p className="text-sm text-[var(--color-text)]">레벨이 오를수록 높은 배율</p>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">배율 보너스</p>
              <p className="text-sm text-[var(--color-text)]">SC 획득량 × 스트라이드 배율</p>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">쉴드</p>
              <p className="text-sm text-[var(--color-text)]">하루 쉬어도 연속 유지</p>
            </div>
          </div>
        </Section>

        {/* 5. 퀘스트 */}
        <Section
          id="quest"
          title="퀘스트"
          accent="cyan"
          icon={
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 4L14 24" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="14" cy="8" r="3" stroke="#06B6D4" strokeWidth="1.5" fill="#06B6D4" fillOpacity="0.1" />
              <circle cx="14" cy="20" r="3" stroke="#06B6D4" strokeWidth="1.5" fill="#06B6D4" fillOpacity="0.3" />
              <path d="M11 14H17" stroke="#06B6D4" strokeWidth="1.2" strokeDasharray="2 2" />
            </svg>
          }
        >
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            지정된 목적지까지 도보로 이동하는 퀘스트를 수행하세요.
          </p>
          <div className="space-y-2">
            {["목적지 도보 퀘스트 수락", "GPS 기반 이동 & 실시간 진행", "도착 인증 후 SC 리워드", "리뷰 작성 시 추가 보너스"].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/15 text-cyan-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-[var(--color-text-secondary)]">{step}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 6. 미니게임 */}
        <Section
          id="game"
          title="미니게임"
          accent="amber"
          icon={
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="8" width="20" height="14" rx="3" stroke="#F59E0B" strokeWidth="1.5" fill="#F59E0B" fillOpacity="0.05" />
              <circle cx="10" cy="15" r="2" stroke="#F59E0B" strokeWidth="1.2" />
              <circle cx="18" cy="13" r="1.5" fill="#F59E0B" fillOpacity="0.4" />
              <circle cx="18" cy="17" r="1.5" fill="#F59E0B" fillOpacity="0.4" />
            </svg>
          }
        >
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            MC를 걸고 다양한 미니게임에 참여하세요. 승리 시 MC를 획득!
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "주사위", desc: "높은 눈 맞추기", icon: "⬡" },
              { name: "코인플립", desc: "앞/뒤 예측", icon: "◎" },
              { name: "룰렛", desc: "배율 룰렛 스핀", icon: "◉" },
              { name: "AI 퀴즈", desc: "건강 지식 퀴즈", icon: "◇" },
              { name: "예측 게임", desc: "코인 가격 예측", icon: "△" },
              { name: "링 게임", desc: "실시간 대결", icon: "○" },
            ].map((game) => (
              <div key={game.name} className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-center gap-2">
                <span className="text-amber-400 text-lg">{game.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{game.name}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">{game.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 7. QR 스캔 */}
        <Section
          id="qr"
          title="QR 스캔"
          accent="amber"
          icon={
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="#F59E0B" strokeWidth="1.5" />
              <rect x="16" y="4" width="8" height="8" rx="1.5" stroke="#F59E0B" strokeWidth="1.5" />
              <rect x="4" y="16" width="8" height="8" rx="1.5" stroke="#F59E0B" strokeWidth="1.5" />
              <rect x="16" y="16" width="4" height="4" fill="#F59E0B" fillOpacity="0.5" />
              <rect x="20" y="20" width="4" height="4" fill="#F59E0B" fillOpacity="0.5" />
            </svg>
          }
        >
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            건강식품을 구입하고 QR 코드를 스캔하면 MC가 즉시 충전됩니다.
          </p>
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
            <div className="space-y-2">
              {["건강식품 구입", "QR 코드 스캔", "MC 즉시 충전"].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm text-[var(--color-text)]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* 8. NFT 시스템 */}
        <Section
          id="nft"
          title="NFT 시스템"
          accent="purple"
          icon={
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 4L6 8.5V19.5L14 24L22 19.5V8.5L14 4Z" stroke="#A855F7" strokeWidth="1.5" fill="#A855F7" fillOpacity="0.05" />
              <path d="M14 12L10 14.5L14 17L18 14.5L14 12Z" fill="#A855F7" fillOpacity="0.3" />
            </svg>
          }
        >
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            3종류의 NFT를 수집하고 장착하여 능력을 강화하세요.
          </p>
          <div className="space-y-2">
            <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2L11 7H16L12 10L13.5 15L9 12L4.5 15L6 10L2 7H7L9 2Z" stroke="#A855F7" strokeWidth="1.2" fill="#A855F7" fillOpacity="0.15" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-400">부스터 NFT</p>
                <p className="text-xs text-[var(--color-text-muted)]">SC 획득량 보너스 증가</p>
              </div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="6" stroke="#3B82F6" strokeWidth="1.2" />
                  <circle cx="9" cy="9" r="2.5" stroke="#3B82F6" strokeWidth="1" fill="#3B82F6" fillOpacity="0.2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-400">액세서리 NFT</p>
                <p className="text-xs text-[var(--color-text-muted)]">스탯 보너스 & 특수 효과</p>
              </div>
            </div>
            <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 12L9 6L15 12" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 14H13" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-400">탈것 NFT</p>
                <p className="text-xs text-[var(--color-text-muted)]">이동 속도 & 거리 보너스</p>
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-[var(--color-surface-elevated)] rounded-lg p-2">
              <p className="text-xs text-[var(--color-text-muted)]">장착</p>
              <p className="text-[11px] text-[var(--color-text-secondary)]">6슬롯</p>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-lg p-2">
              <p className="text-xs text-[var(--color-text-muted)]">강화</p>
              <p className="text-[11px] text-[var(--color-text-secondary)]">+1~+5</p>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-lg p-2">
              <p className="text-xs text-[var(--color-text-muted)]">세트 보너스</p>
              <p className="text-[11px] text-[var(--color-text-secondary)]">시너지</p>
            </div>
          </div>
        </Section>

        {/* 9. 캐릭터 시스템 */}
        <Section
          id="character"
          title="캐릭터 시스템"
          accent="purple"
          icon={
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="10" r="5" stroke="#A855F7" strokeWidth="1.5" fill="#A855F7" fillOpacity="0.1" />
              <path d="M6 24C6 19.6 9.6 17 14 17C18.4 17 22 19.6 22 24" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
        >
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            캐릭터를 성장시키고, 4가지 스탯과 다중 클래스를 활용하세요.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-green-400">EFF</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">효율 (SC 획득량)</p>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-amber-400">LCK</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">행운 (드롭률)</p>
            </div>
            <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-purple-400">CHM</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">매력 (보너스 이벤트)</p>
            </div>
            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-red-400">HP</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">체력 (컨디션)</p>
            </div>
          </div>
          <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">다중 클래스</p>
            <div className="flex gap-2">
              <Chip color="bg-green-500/10 text-green-400">BODY</Chip>
              <Chip color="bg-amber-500/10 text-amber-400">ECO</Chip>
              <Chip color="bg-blue-500/10 text-blue-400">RIDE</Chip>
            </div>
          </div>
        </Section>

        {/* 10. 미션 & 업적 */}
        <Section
          id="mission"
          title="미션 & 업적"
          accent="blue"
          icon={
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="6" width="20" height="16" rx="3" stroke="#3B82F6" strokeWidth="1.5" fill="#3B82F6" fillOpacity="0.05" />
              <path d="M9 13L12 16L19 10" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          <div className="space-y-2">
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="#3B82F6" strokeWidth="1.2" />
                  <path d="M7 4V7L9 9" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">일일 미션</p>
                <p className="text-xs text-[var(--color-text-muted)]">매일 갱신되는 목표 달성 → SC/MC 보상</p>
              </div>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="3" width="10" height="8" rx="1" stroke="#F59E0B" strokeWidth="1.2" />
                  <path d="M2 6H12" stroke="#F59E0B" strokeWidth="1.2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">주간 챌린지</p>
                <p className="text-xs text-[var(--color-text-muted)]">7일간 큰 목표 도전 → 특별 보상</p>
              </div>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L8.5 5H13L9.5 7.5L10.5 12L7 9L3.5 12L4.5 7.5L1 5H5.5L7 1Z" stroke="#A855F7" strokeWidth="1" fill="#A855F7" fillOpacity="0.15" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">업적 뱃지</p>
                <p className="text-xs text-[var(--color-text-muted)]">누적 달성 업적 → 영구 뱃지 수집</p>
              </div>
            </div>
          </div>
        </Section>

        {/* 11. 상점 */}
        <Section
          id="store"
          title="상점"
          accent="green"
          icon={
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M4 10H24L22 22H6L4 10Z" stroke="#22C55E" strokeWidth="1.5" fill="#22C55E" fillOpacity="0.05" />
              <path d="M10 10V7C10 5.3 11.8 4 14 4C16.2 4 18 5.3 18 7V10" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
        >
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            SC와 MC로 건강식품, 프로틴, 영양 보충제 등을 구매할 수 있습니다.
          </p>
          <div className="bg-[var(--color-surface-elevated)] rounded-xl p-4 flex items-center gap-3">
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded">SC</span>
              <span className="text-[var(--color-text-muted)]">+</span>
              <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded">MC</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8H12M12 8L9 5M12 8L9 11" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm text-[var(--color-text)]">건강식품 교환</span>
          </div>
        </Section>

        {/* 12. CTA */}
        <section className="text-center py-6">
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">지금 시작하세요</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-5">
            걸으면 코인, 코인으로 건강식품. 간단합니다.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-3.5 rounded-xl bg-[var(--color-primary)] text-black font-bold text-sm hover:opacity-90 transition-opacity glow-green"
          >
            StepMeal 시작하기
          </Link>
        </section>
      </main>

      {/* ── 하단 고정 CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-[var(--color-border)] safe-bottom">
        <div className="max-w-lg mx-auto px-4 py-3">
          <Link
            href="/login"
            className="block w-full text-center py-3 rounded-xl bg-[var(--color-primary)] text-black font-bold text-sm hover:opacity-90 transition-opacity"
          >
            StepMeal 시작하기
          </Link>
        </div>
      </div>
    </div>
  );
}

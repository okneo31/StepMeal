"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import NftGalleryCard from "@/components/nft/NftGalleryCard";
import { formatDistance } from "@/lib/geolocation";
import { isAdmin } from "@/lib/admin";
import type { NftRarity } from "@/types";

interface MyNft {
  id: string;
  mintNumber: number;
  template: {
    name: string;
    imageEmoji: string;
    rarity: string;
    scBonusPercent: number;
  };
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stride, setStride] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [nfts, setNfts] = useState<MyNft[]>([]);
  const [nftBonus, setNftBonus] = useState(0);
  const [loading, setLoading] = useState(true);

  // Weight modal
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weight, setWeight] = useState(70);
  const [weightSaving, setWeightSaving] = useState(false);
  const weightInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/stride").then((r) => r.json()),
      fetch("/api/coins/balance").then((r) => r.json()),
      fetch("/api/nft/my").then((r) => r.json()),
    ]).then(([s, b, n]) => {
      setStride(s);
      setBalance(b);
      setNfts(n.nfts || []);
      setNftBonus(n.totalBonusPercent || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const openWeightModal = () => {
    fetch("/api/user/weight")
      .then((r) => r.json())
      .then((d) => setWeight(d.weight || 70))
      .catch(() => {});
    setShowWeightModal(true);
    setTimeout(() => weightInputRef.current?.focus(), 100);
  };

  const saveWeight = async () => {
    setWeightSaving(true);
    try {
      const res = await fetch("/api/user/weight", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight }),
      });
      if (res.ok) setShowWeightModal(false);
    } catch {}
    setWeightSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  return (
    <div>
      <Header title="마이페이지" />
      <div className="px-4 py-4 space-y-4">
        {/* Profile info */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-5 border border-[var(--color-border)] text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-green-500/30">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="10" r="5" stroke="#94A3B8" strokeWidth="1.5"/>
              <path d="M22 25C22 20.6 18.4 18 14 18C9.6 18 6 20.6 6 25" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[var(--color-text)]">{session?.user?.name}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{session?.user?.email}</p>
          {stride && (
            <div className="mt-2">
              <Badge variant="green" size="md">
                Stride {stride.level} · {stride.title}
              </Badge>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/nft/equip">
            <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-green-500/20 text-center hover:border-green-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15 8L22 9L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9L9 8L12 2Z" stroke="#22C55E" strokeWidth="1.5" fill="#22C55E" fillOpacity="0.15"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-[var(--color-text)]">장비</p>
              <p className="text-xs text-[var(--color-text-muted)]">NFT 장착</p>
            </div>
          </Link>
          <Link href="/qr">
            <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)] text-center hover:border-[var(--color-surface-hover)] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="#F59E0B" strokeWidth="1.5"/>
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="#F59E0B" strokeWidth="1.5"/>
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="#F59E0B" strokeWidth="1.5"/>
                  <rect x="14" y="14" width="3" height="3" fill="#F59E0B"/>
                  <rect x="18" y="18" width="3" height="3" fill="#F59E0B"/>
                  <rect x="14" y="18" width="3" height="3" fill="#F59E0B" fillOpacity="0.5"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-[var(--color-text)]">QR 스캔</p>
              <p className="text-xs text-[var(--color-text-muted)]">MC 충전</p>
            </div>
          </Link>
          <Link href="/nft">
            <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-purple-500/20 text-center hover:border-purple-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3L5 7.5V16.5L12 21L19 16.5V7.5L12 3Z" stroke="#A855F7" strokeWidth="1.5" fill="#A855F7" fillOpacity="0.1"/>
                  <path d="M12 10L9 12L12 14L15 12L12 10Z" fill="#A855F7" fillOpacity="0.4"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-[var(--color-text)]">NFT 마켓</p>
              {nftBonus > 0 && (
                <p className="text-xs text-green-400 font-semibold">+{nftBonus}% SC</p>
              )}
            </div>
          </Link>
        </div>

        {/* Quick Actions Row 2 */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/profile/theme">
            <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-primary)]/20 text-center hover:border-[var(--color-primary)]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="var(--color-primary)" strokeWidth="1.5" fill="var(--color-primary)" fillOpacity="0.1"/>
                  <circle cx="12" cy="8" r="2" fill="var(--color-primary)" fillOpacity="0.6"/>
                  <circle cx="8.5" cy="14" r="2" fill="var(--color-primary)" fillOpacity="0.4"/>
                  <circle cx="15.5" cy="14" r="2" fill="var(--color-primary)" fillOpacity="0.8"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-[var(--color-text)]">테마</p>
              <p className="text-xs text-[var(--color-text-muted)]">색상 변경</p>
            </div>
          </Link>
        </div>

        {/* NFT Gallery */}
        {nfts.length > 0 && (
          <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">내 NFT 컬렉션 ({nfts.length})</h3>
              {nftBonus > 0 && (
                <Badge variant="green" size="sm">SC +{nftBonus}%</Badge>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {nfts.map((nft) => (
                <NftGalleryCard
                  key={nft.id}
                  name={nft.template.name}
                  imageEmoji={nft.template.imageEmoji}
                  rarity={nft.template.rarity as NftRarity}
                  mintNumber={nft.mintNumber}
                  scBonusPercent={nft.template.scBonusPercent}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">누적 기록</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-text)] num">{formatDistance(stride?.totalDistance || 0)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">총 이동거리</p>
            </div>
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-text)] num">{stride?.longestStreak || 0}일</p>
              <p className="text-xs text-[var(--color-text-muted)]">최장 연속</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/15 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-green-400 num">{(balance?.scLifetime || 0).toLocaleString()}</p>
              <p className="text-xs text-[var(--color-text-muted)]">누적 SC</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/15 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-amber-400 num">{(balance?.mcLifetime || 0).toLocaleString()}</p>
              <p className="text-xs text-[var(--color-text-muted)]">누적 MC</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <button
            onClick={() => router.push("/profile/achievements")}
            className="w-full text-left py-3.5 px-4 border-b border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] flex justify-between items-center hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L10 6H15L11 9L12.5 14L8 11L3.5 14L5 9L1 6H6L8 1Z" stroke="#A855F7" strokeWidth="1.2" fill="#A855F7" fillOpacity="0.15"/>
              </svg>
              업적 / 뱃지
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={() => router.push("/profile/notifications")}
            className="w-full text-left py-3.5 px-4 border-b border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] flex justify-between items-center hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <span>알림 설정</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={openWeightModal}
            className="w-full text-left py-3.5 px-4 border-b border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] flex justify-between items-center hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <span>체중 설정</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={() => router.push("/profile/about")}
            className={`w-full text-left py-3.5 px-4 text-sm text-[var(--color-text-secondary)] flex justify-between items-center hover:bg-[var(--color-surface-hover)] transition-colors ${isAdmin(session?.user?.email) ? "border-b border-[var(--color-border)]" : ""}`}
          >
            <span>앱 정보</span>
            <span className="text-[var(--color-text-muted)]">v1.0.0</span>
          </button>
          {isAdmin(session?.user?.email) && (
            <button
              onClick={() => router.push("/admin/orders")}
              className="w-full text-left py-3.5 px-4 text-sm text-amber-400 flex justify-between items-center hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4H14M2 4V12C2 12.6 2.4 13 3 13H13C13.6 13 14 12.6 14 12V4M2 4L3.3 2.3C3.5 2.1 3.7 2 4 2H12C12.3 2 12.5 2.1 12.7 2.3L14 4" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 7H10" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                주문 관리 (관리자)
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        <Button
          variant="ghost"
          fullWidth
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-red-400 hover:text-red-300"
        >
          로그아웃
        </Button>
      </div>

      {/* Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowWeightModal(false)} />
          <div className="relative w-full max-w-lg bg-[var(--color-surface)] rounded-t-2xl p-5 pb-8 border-t border-[var(--color-border)] safe-bottom">
            <div className="w-10 h-1 bg-[var(--color-border-light)] rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[var(--color-text)] mb-1">체중 설정</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">정확한 칼로리 계산을 위해 체중을 입력하세요.</p>
            <div className="flex items-center gap-3 mb-5">
              <input
                ref={weightInputRef}
                type="number"
                min={20}
                max={300}
                step={0.1}
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                className="flex-1 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-lg font-bold text-[var(--color-text)] text-center outline-none focus:border-[var(--color-primary)] transition-colors"
              />
              <span className="text-sm font-semibold text-[var(--color-text-secondary)]">kg</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWeightModal(false)}
                className="flex-1 py-3 rounded-xl bg-[var(--color-surface-elevated)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={saveWeight}
                disabled={weightSaving || weight < 20 || weight > 300}
                className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] text-sm font-bold text-black hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {weightSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

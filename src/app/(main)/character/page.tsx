"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import Spinner from "@/components/ui/Spinner";
import {
  CHARACTER_AVATARS,
  CHARACTER_CLASSES,
  CHARACTER_STAT_LABELS,
  CONDITION_SC_MULTIPLIER,
} from "@/lib/constants";
import type { CharacterDisplay, CharacterStat } from "@/types";

export default function CharacterPage() {
  const [character, setCharacter] = useState<CharacterDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [leveling, setLeveling] = useState(false);

  function fetchCharacter() {
    fetch("/api/character")
      .then((r) => r.json())
      .then((data) => {
        setCharacter(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => { fetchCharacter(); }, []);

  async function handleLevelUp(stat: CharacterStat) {
    if (leveling || !character) return;
    setLeveling(true);
    try {
      const res = await fetch("/api/character/levelup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stat }),
      });
      if (res.ok) {
        fetchCharacter();
        setShowLevelUp(false);
      } else {
        const data = await res.json();
        alert(data.error || "레벨업 실패");
      }
    } catch {
      alert("서버 오류");
    } finally {
      setLeveling(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  if (!character) {
    return (
      <div>
        <Header title="캐릭터" />
        <div className="px-4 py-12 text-center">
          <p className="text-[var(--color-text-muted)]">캐릭터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const avatar = CHARACTER_AVATARS[character.avatarType as keyof typeof CHARACTER_AVATARS] || CHARACTER_AVATARS.DEFAULT;
  const mainClass = CHARACTER_CLASSES[character.mainClass as keyof typeof CHARACTER_CLASSES];
  const subClass = character.subClass ? CHARACTER_CLASSES[character.subClass as keyof typeof CHARACTER_CLASSES] : null;
  const condMultiplier = CONDITION_SC_MULTIPLIER(character.condition);
  const canLevelUp = character.exp >= character.expToNext;
  const expProgress = Math.min(100, Math.round((character.exp / character.expToNext) * 100));

  const stats: { key: CharacterStat; value: number }[] = [
    { key: "EFF", value: character.statEff },
    { key: "LCK", value: character.statLck },
    { key: "CHM", value: character.statChm },
    { key: "HP", value: character.statHp },
  ];

  return (
    <div>
      <Header title="캐릭터" />
      <div className="px-4 py-4 space-y-4">
        {/* Character Hero */}
        <div className="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-elevated)] rounded-3xl p-5 border border-[var(--color-border)] relative overflow-hidden">
          {/* Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl" style={{ backgroundColor: avatar.color, opacity: 0.06 }} />

          {/* Avatar */}
          <div className="flex flex-col items-center mb-4 relative">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center mb-3 border-3"
              style={{
                background: `linear-gradient(135deg, ${avatar.color}15, ${avatar.color}05)`,
                borderColor: `${avatar.color}40`,
              }}
            >
              <span className="text-6xl">{avatar.emoji}</span>
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">{character.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="green" size="sm">Lv.{character.level}</Badge>
              <Badge variant="blue" size="sm">{mainClass?.label || character.mainClass}</Badge>
              {subClass && (
                <Badge variant="purple" size="sm">+{subClass.label}</Badge>
              )}
            </div>
          </div>

          {/* EXP Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--color-text-muted)]">EXP</span>
              <span className="text-[var(--color-text-muted)] num">{character.exp} / {character.expToNext}</span>
            </div>
            <ProgressBar value={expProgress} height="h-2.5" />
            {canLevelUp && (
              <button
                onClick={() => setShowLevelUp(!showLevelUp)}
                className="w-full mt-2 text-sm text-[var(--color-primary)] font-bold animate-pulse"
              >
                LEVEL UP!
              </button>
            )}
          </div>

          {/* Condition */}
          <div className="bg-[var(--color-bg)]/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2C5 2 3 5 3 7.5C3 12 8 15 8 15C8 15 13 12 13 7.5C13 5 11 2 8 2Z" fill="#EF4444" fillOpacity="0.3" stroke="#EF4444" strokeWidth="1.2"/>
                </svg>
                <span className="text-xs text-[var(--color-text-muted)]">컨디션</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--color-text)] num">{character.condition}/{character.maxCondition}</span>
                <span className={`text-xs font-semibold ${
                  condMultiplier >= 1 ? "text-green-400" :
                  condMultiplier >= 0.8 ? "text-yellow-400" :
                  condMultiplier >= 0.5 ? "text-orange-400" : "text-red-400"
                }`}>
                  x{condMultiplier}
                </span>
              </div>
            </div>
            <ProgressBar
              value={character.condition}
              color={
                character.condition >= 80 ? "bg-green-500" :
                character.condition >= 50 ? "bg-yellow-500" :
                character.condition >= 20 ? "bg-orange-500" : "bg-red-500"
              }
              height="h-2"
            />
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
              QR 스캔으로 건강식품을 섭취하면 컨디션이 회복됩니다
            </p>
          </div>
        </div>

        {/* Level Up Modal */}
        {showLevelUp && canLevelUp && (
          <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-primary)]/30">
            <h3 className="text-sm font-bold text-[var(--color-primary)] mb-3 text-center">
              스탯 포인트를 배분하세요!
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {stats.map(({ key }) => {
                const cfg = CHARACTER_STAT_LABELS[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleLevelUp(key)}
                    disabled={leveling}
                    className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-primary)]/30 transition-colors text-center"
                  >
                    <div className="text-lg font-bold" style={{ color: cfg.color }}>{cfg.label}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">{cfg.description}</div>
                    <div className="text-xs font-semibold text-[var(--color-primary)] mt-1">+3</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">스탯</h3>
          <div className="space-y-3">
            {stats.map(({ key, value }) => {
              const cfg = CHARACTER_STAT_LABELS[key];
              const maxStat = 100;
              const pct = Math.min(100, Math.round((value / maxStat) * 100));
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">{cfg.fullLabel}</span>
                    </div>
                    <span className="text-sm font-bold text-[var(--color-text)] num">{value}</span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-elevated)] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Class Info */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">클래스</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(CHARACTER_CLASSES).map(([key, cls]) => {
              const isMain = character.mainClass === key;
              const isSub = character.subClass === key;
              return (
                <div
                  key={key}
                  className={`rounded-xl p-3 text-center border transition-all ${
                    isMain
                      ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10"
                      : isSub
                      ? "border-blue-500/30 bg-blue-500/10"
                      : "border-[var(--color-border)] bg-[var(--color-surface-elevated)]"
                  }`}
                >
                  <div className="text-sm font-bold" style={{ color: cls.color }}>{cls.label}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">{cls.description}</div>
                  {isMain && <span className="text-[10px] font-bold text-[var(--color-primary)]">메인</span>}
                  {isSub && <span className="text-[10px] font-bold text-blue-400">서브</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

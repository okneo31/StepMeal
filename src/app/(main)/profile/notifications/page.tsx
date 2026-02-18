"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";

interface NotificationSettings {
  moveReminder: boolean;
  strideAlert: boolean;
  coinEarned: boolean;
  eventNews: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  moveReminder: true,
  strideAlert: true,
  coinEarned: false,
  eventNews: true,
};

const STORAGE_KEY = "stepmeal-notification-settings";

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings(JSON.parse(stored));
    } catch {}
  }, []);

  const toggle = (key: keyof NotificationSettings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const items: { key: keyof NotificationSettings; label: string; desc: string }[] = [
    { key: "moveReminder", label: "운동 리마인더", desc: "오늘 아직 운동하지 않았을 때 알림" },
    { key: "strideAlert", label: "스트라이드 알림", desc: "연속 기록 유지/위험 시 알림" },
    { key: "coinEarned", label: "코인 획득 알림", desc: "SC/MC 획득 시 알림" },
    { key: "eventNews", label: "이벤트 & 소식", desc: "새로운 이벤트 및 업데이트 소식" },
  ];

  return (
    <div>
      <Header title="알림 설정" showBack />
      <div className="px-4 py-4 space-y-3">
        <p className="text-sm text-[var(--color-text-secondary)]">
          받고 싶은 알림을 선택하세요.
        </p>

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          {items.map((item, i) => (
            <button
              key={item.key}
              onClick={() => toggle(item.key)}
              className={`w-full flex items-center justify-between py-3.5 px-4 hover:bg-[var(--color-surface-hover)] transition-colors ${
                i < items.length - 1 ? "border-b border-[var(--color-border)]" : ""
              }`}
            >
              <div className="text-left">
                <p className="text-sm font-medium text-[var(--color-text)]">{item.label}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.desc}</p>
              </div>
              <div
                className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${
                  settings[item.key] ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-elevated)]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    settings[item.key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-[var(--color-text-muted)] text-center pt-2">
          알림은 기기 설정에서도 관리할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

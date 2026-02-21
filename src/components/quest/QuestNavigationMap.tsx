"use client";

import { useEffect, useRef } from "react";
import { useKakaoMap } from "@/hooks/useKakaoMap";

interface Props {
  destLat: number;
  destLng: number;
  destName: string;
  currentLat?: number;
  currentLng?: number;
}

export default function QuestNavigationMap({ destLat, destLng, destName, currentLat, currentLng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { loaded, hasKey } = useKakaoMap();

  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const { kakao } = window;

    const center = new kakao.maps.LatLng(
      currentLat || destLat,
      currentLng || destLng
    );

    const map = new kakao.maps.Map(mapRef.current, {
      center,
      level: 5,
    });

    // Destination marker
    const destPosition = new kakao.maps.LatLng(destLat, destLng);
    new kakao.maps.Marker({
      position: destPosition,
      map,
    });

    // Destination label
    new kakao.maps.InfoWindow({
      position: destPosition,
      content: `<div style="padding:4px 8px;font-size:12px;font-weight:bold;white-space:nowrap;">${destName}</div>`,
    }).open(map);

    // Current position marker
    if (currentLat && currentLng) {
      const curPosition = new kakao.maps.LatLng(currentLat, currentLng);
      new kakao.maps.CustomOverlay({
        position: curPosition,
        content: '<div style="width:14px;height:14px;border-radius:50%;background:#22C55E;border:3px solid white;box-shadow:0 0 6px rgba(34,197,94,0.5);"></div>',
        yAnchor: 0.5,
        map,
      });

      // Draw line between current and dest
      new kakao.maps.Polyline({
        path: [curPosition, destPosition],
        strokeWeight: 3,
        strokeColor: "#22C55E",
        strokeOpacity: 0.5,
        strokeStyle: "shortdash",
        map,
      });

      // Fit bounds to include both
      const bounds = new kakao.maps.LatLngBounds();
      bounds.extend(curPosition);
      bounds.extend(destPosition);
      map.setBounds(bounds);
    }
  }, [loaded, destLat, destLng, destName, currentLat, currentLng]);

  if (!hasKey) {
    return (
      <div className="h-48 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
        <p className="text-xs text-[var(--color-text-muted)]">지도 API 키가 설정되지 않았습니다</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="h-48 rounded-xl overflow-hidden border border-[var(--color-border)]"
    />
  );
}

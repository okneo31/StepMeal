"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import type { GpsPoint } from "@/types";

interface Props {
  points: GpsPoint[];
}

export default function MovementTrackingMap({ points }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const pointCountRef = useRef(0);
  const [userDragged, setUserDragged] = useState(false);
  const { loaded, hasKey } = useKakaoMap();

  // Initialize map once SDK loaded
  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current) return;
    const { kakao } = window;

    // Default center: Seoul City Hall (fallback until GPS arrives)
    const defaultCenter = new kakao.maps.LatLng(37.5665, 126.978);
    const map = new kakao.maps.Map(containerRef.current, {
      center: defaultCenter,
      level: 3,
    });

    // Track user drag
    kakao.maps.event.addListener(map, "dragend", () => {
      setUserDragged(true);
    });

    // Create polyline
    const polyline = new kakao.maps.Polyline({
      path: [],
      strokeWeight: 4,
      strokeColor: "#22C55E",
      strokeOpacity: 0.8,
      strokeStyle: "solid",
      map,
    });

    // Create current-position overlay (green dot)
    const marker = new kakao.maps.CustomOverlay({
      position: defaultCenter,
      content:
        '<div style="width:16px;height:16px;border-radius:50%;background:#22C55E;border:3px solid white;box-shadow:0 0 8px rgba(34,197,94,0.6);"></div>',
      yAnchor: 0.5,
      xAnchor: 0.5,
    });

    mapRef.current = map;
    polylineRef.current = polyline;
    markerRef.current = marker;
  }, [loaded]);

  // Update polyline & marker when points change
  useEffect(() => {
    const map = mapRef.current;
    const polyline = polylineRef.current;
    const marker = markerRef.current;
    if (!map || !polyline || !marker || points.length === 0) return;

    const { kakao } = window;

    // Build full path
    const path = points.map((p) => new kakao.maps.LatLng(p.lat, p.lng));
    polyline.setPath(path);

    // Move marker to last point
    const lastPos = path[path.length - 1];
    marker.setPosition(lastPos);
    if (!marker.getMap()) marker.setMap(map);

    // Pan to current position (unless user dragged)
    if (!userDragged) {
      map.setCenter(lastPos);
    }

    pointCountRef.current = points.length;
  }, [points, userDragged]);

  // Re-center handler
  const handleRecenter = useCallback(() => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;
    const { kakao } = window;
    const last = points[points.length - 1];
    map.setCenter(new kakao.maps.LatLng(last.lat, last.lng));
    setUserDragged(false);
  }, [points]);

  if (!hasKey) {
    return (
      <div className="h-64 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
        <p className="text-xs text-[var(--color-text-muted)]">지도 API 키가 설정되지 않았습니다</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-64 rounded-xl overflow-hidden border border-[var(--color-border)]"
      />

      {/* GPS waiting overlay */}
      {points.length === 0 && loaded && (
        <div className="absolute inset-0 rounded-xl bg-black/50 flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-green-300">GPS 신호 대기 중...</p>
        </div>
      )}

      {/* Re-center button */}
      {userDragged && points.length > 0 && (
        <button
          onClick={handleRecenter}
          className="absolute bottom-3 right-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full p-2 shadow-lg"
          title="현재 위치로"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" fill="#22C55E" />
            <circle cx="10" cy="10" r="7" stroke="#22C55E" strokeWidth="1.5" fill="none" />
            <line x1="10" y1="1" x2="10" y2="4" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="10" y1="16" x2="10" y2="19" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="1" y1="10" x2="4" y2="10" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16" y1="10" x2="19" y2="10" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

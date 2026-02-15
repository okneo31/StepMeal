"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GpsPoint } from "@/types";

interface GeolocationState {
  position: GpsPoint | null;
  error: string | null;
  isWatching: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isWatching: false,
  });
  const watchIdRef = useRef<number | null>(null);
  const onUpdateRef = useRef<((point: GpsPoint) => void) | null>(null);

  const startWatching = useCallback((onUpdate?: (point: GpsPoint) => void) => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "위치 서비스를 사용할 수 없습니다." }));
      return;
    }

    onUpdateRef.current = onUpdate || null;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point: GpsPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: pos.timestamp,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed || undefined,
        };

        // Filter out inaccurate readings
        if (pos.coords.accuracy > 50) return;

        setState({ position: point, error: null, isWatching: true });
        onUpdateRef.current?.(point);
      },
      (err) => {
        let msg = "위치를 가져올 수 없습니다.";
        if (err.code === 1) msg = "위치 권한이 필요합니다. 설정에서 허용해주세요.";
        if (err.code === 2) msg = "위치를 확인할 수 없습니다.";
        if (err.code === 3) msg = "위치 요청 시간이 초과되었습니다.";
        setState((s) => ({ ...s, error: msg }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    watchIdRef.current = id;
    setState((s) => ({ ...s, isWatching: true }));
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    onUpdateRef.current = null;
    setState((s) => ({ ...s, isWatching: false }));
  }, []);

  const getCurrentPosition = useCallback((): Promise<GpsPoint> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            timestamp: pos.timestamp,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed || undefined,
          });
        },
        reject,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { ...state, startWatching, stopWatching, getCurrentPosition };
}

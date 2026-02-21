"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

export function useKakaoMap(): { loaded: boolean; hasKey: boolean } {
  const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!KAKAO_KEY) return;

    if (window.kakao?.maps) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
    script.onload = () => {
      window.kakao.maps.load(() => setLoaded(true));
    };
    document.head.appendChild(script);
  }, [KAKAO_KEY]);

  return { loaded, hasKey: !!KAKAO_KEY };
}

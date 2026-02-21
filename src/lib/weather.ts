import type { WeatherType } from "@/types";

// === Open-Meteo API → WeatherType 매핑 ===

const weatherCache = new Map<string, { weather: WeatherType; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30분
const CACHE_CLEANUP_TTL = 60 * 60 * 1000; // 1시간 이상된 항목 정리
const FETCH_TIMEOUT = 3000; // 3초

function wmoToWeather(code: number, temperature: number): WeatherType {
  // 온도 기반 극한 판정 (맑음/흐림일 때만)
  if (code <= 3) {
    if (temperature >= 35) return "EXTREME_HEAT";
    if (temperature <= -10) return "EXTREME_COLD";
  }

  if (code === 0) return "CLEAR";
  if (code <= 3) return "CLOUDY";
  if (code <= 48) return "CLOUDY"; // 안개
  if (code <= 57) return "RAIN"; // 이슬비/동결 이슬비
  if (code <= 63) return "RAIN"; // 약~보통 비
  if (code === 65) return "HEAVY_RAIN"; // 강한 비
  if (code <= 67) return "RAIN"; // 동결 비
  if (code <= 73) return "SNOW"; // 약~보통 눈
  if (code === 75) return "HEAVY_SNOW"; // 강한 눈
  if (code === 77) return "SNOW"; // 눈알갱이
  if (code <= 81) return "RAIN"; // 약~보통 소나기
  if (code === 82) return "HEAVY_RAIN"; // 폭우 소나기
  if (code === 85) return "SNOW"; // 약한 눈소나기
  if (code === 86) return "HEAVY_SNOW"; // 강한 눈소나기
  if (code >= 95) return "HEAVY_RAIN"; // 뇌우

  return "CLEAR";
}

function getCacheKey(lat: number, lng: number): string {
  return `${Math.round(lat * 10) / 10}_${Math.round(lng * 10) / 10}`;
}

function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of weatherCache) {
    if (now - entry.timestamp > CACHE_CLEANUP_TTL) {
      weatherCache.delete(key);
    }
  }
}

export async function getWeather(lat: number, lng: number): Promise<WeatherType> {
  const key = getCacheKey(lat, lng);

  // 캐시 히트 확인
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Weather] Cache hit: ${key} → ${cached.weather}`);
    return cached.weather;
  }

  // 오래된 캐시 정리
  cleanupCache();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=weather_code,temperature_2m&timezone=Asia/Seoul`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[Weather] API error: ${res.status}`);
      return "CLEAR";
    }

    const data = await res.json();
    const code: number = data.current?.weather_code ?? 0;
    const temp: number = data.current?.temperature_2m ?? 20;

    const weather = wmoToWeather(code, temp);

    // 캐시 저장
    weatherCache.set(key, { weather, timestamp: Date.now() });
    console.log(`[Weather] API fetch: ${key} → code=${code}, temp=${temp}°C → ${weather}`);

    return weather;
  } catch (error) {
    console.error("[Weather] Fetch failed, fallback to CLEAR:", error);
    return "CLEAR";
  }
}

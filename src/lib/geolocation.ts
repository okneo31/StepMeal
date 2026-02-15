import type { GpsPoint } from "@/types";

const EARTH_RADIUS = 6371000; // meters

/**
 * Haversine distance between two lat/lng points in meters
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Total distance along a series of GPS points in meters
 */
export function calculateTotalDistance(points: GpsPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng,
    );
  }
  return total;
}

/**
 * Speed in km/h between two GPS points
 */
export function calculateSpeed(p1: GpsPoint, p2: GpsPoint): number {
  const dist = haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);
  const timeSec = (p2.timestamp - p1.timestamp) / 1000;
  if (timeSec <= 0) return 0;
  return (dist / timeSec) * 3.6; // m/s -> km/h
}

/**
 * Check if a GPS jump is suspicious (>maxJump meters)
 */
export function isGpsJump(
  p1: GpsPoint,
  p2: GpsPoint,
  maxJumpMeters: number = 500,
): boolean {
  return haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng) > maxJumpMeters;
}

/**
 * Filter out inaccurate GPS points (accuracy > threshold)
 */
export function filterAccuratePoints(
  points: GpsPoint[],
  maxAccuracy: number = 50,
): GpsPoint[] {
  return points.filter((p) => !p.accuracy || p.accuracy <= maxAccuracy);
}

/**
 * Format distance in meters to a human-readable string
 * e.g., 1500 -> "1.5km", 800 -> "800m"
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${Math.round(meters)}m`;
}

/**
 * Format duration in seconds to a human-readable string
 * e.g., 3661 -> "1시간 1분", 120 -> "2분"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}초`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}시간 ${mins}분`;
  return `${mins}분`;
}

/**
 * Format speed in km/h
 */
export function formatSpeed(kmh: number): string {
  return `${kmh.toFixed(1)}km/h`;
}

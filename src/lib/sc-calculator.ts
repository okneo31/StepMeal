import type { TransportType, WeatherType, MovementSegment, ScBreakdown, TimeSlot } from "@/types";
import { TRANSPORT_CONFIG, TIME_BONUS, WEATHER_BONUS, MULTI_MODAL_BONUS, STRIDE_TABLE } from "./constants";

export function getTimeSlot(date: Date = new Date()): TimeSlot {
  const hour = date.getHours();
  if (hour >= 5 && hour < 7) return 'DAWN';
  if (hour >= 7 && hour < 9) return 'COMMUTE_AM';
  if (hour >= 9 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 14) return 'LUNCH';
  if (hour >= 14 && hour < 18) return 'AFTERNOON';
  if (hour >= 18 && hour < 20) return 'COMMUTE_PM';
  if (hour >= 20 && hour < 22) return 'EVENING';
  return 'NIGHT';
}

export function getTimeMultiplier(date: Date = new Date()): number {
  const slot = getTimeSlot(date);
  return TIME_BONUS[slot].multiplier;
}

export function getWeatherMultiplier(weather: WeatherType, transportType: TransportType): number {
  const config = TRANSPORT_CONFIG[transportType];
  if (!config.weatherBonus) return 1.0;
  return WEATHER_BONUS[weather].multiplier;
}

export function getMultiModalBonus(segments: MovementSegment[]): number {
  if (segments.length <= 1) return 1.0;
  
  const classes = new Set(segments.map(s => TRANSPORT_CONFIG[s.transport].class));
  
  if (classes.size >= 3) return MULTI_MODAL_BONUS.THREE_CLASS;
  if (classes.size === 2) return MULTI_MODAL_BONUS.TWO_CLASS;
  return MULTI_MODAL_BONUS.SAME_CLASS;
}

export function getMultiClassCount(segments: MovementSegment[]): number {
  const classes = new Set(segments.map(s => TRANSPORT_CONFIG[s.transport].class));
  return classes.size;
}

export function calculateSegmentSc(segment: MovementSegment): number {
  const config = TRANSPORT_CONFIG[segment.transport];
  const distanceUnits = segment.distance / 100; // per 100m
  return Math.floor(distanceUnits * config.baseSc * config.multiplier);
}

export function calculateMovementSc(
  segments: MovementSegment[],
  strideLevel: number,
  weather: WeatherType = 'CLEAR',
  date: Date = new Date(),
  nftBonusPercent: number = 0,
  synergyPercent: number = 0,
  conditionMult: number = 1.0,
  effStat: number = 10,
  classPercent: number = 0,
  lckStat: number = 5,
): ScBreakdown {
  if (segments.length === 0) {
    return { baseSc: 0, transportMult: 1, strideMult: 1, timeMult: 1, weatherMult: 1, multiMult: 1, nftMult: 1, synergyMult: 1, conditionMult: 1, effMult: 1, classMult: 1, luckBonusSc: 0, bonusSc: 0, totalSc: 0 };
  }

  // Calculate base SC per segment
  let baseSc = 0;
  for (const seg of segments) {
    baseSc += calculateSegmentSc(seg);
  }

  // Stride multiplier
  const strideInfo = STRIDE_TABLE[Math.min(strideLevel, STRIDE_TABLE.length - 1)];
  const strideMult = strideInfo.multiplier;

  // Time bonus
  const timeMult = getTimeMultiplier(date);

  // Weather bonus (use first body/eco segment's transport for determination, or default)
  const primaryTransport = segments[0].transport;
  const weatherMult = getWeatherMultiplier(weather, primaryTransport);

  // Multi-modal bonus
  const multiMult = getMultiModalBonus(segments);

  // NFT bonus multiplier (e.g. 20% = 1.20)
  const nftMult = 1 + nftBonusPercent / 100;

  // Vehicle synergy multiplier (e.g. 15% = 1.15)
  const synergyMult = 1 + synergyPercent / 100;

  // EFF stat multiplier: 1 + stat × 0.005
  const effMult = 1 + effStat * 0.005;

  // Class bonus multiplier
  const classMult = 1 + classPercent / 100;

  // Calculate total (condition applied last)
  let totalSc = Math.floor(baseSc * strideMult * timeMult * weatherMult * multiMult * nftMult * synergyMult * effMult * classMult * conditionMult);

  // LCK bonus: lckStat% chance to gain 50% of baseSc as bonus
  let luckBonusSc = 0;
  if (lckStat > 0 && Math.random() * 100 < lckStat) {
    luckBonusSc = Math.floor(baseSc * 0.5);
    totalSc += luckBonusSc;
  }

  // Apply daily cap
  const dailyCap = strideInfo.dailyCap;
  const dailyCapped = totalSc > dailyCap;
  totalSc = Math.min(totalSc, dailyCap);

  return {
    baseSc,
    transportMult: 1, // Already applied in baseSc calculation
    strideMult,
    timeMult,
    weatherMult,
    multiMult,
    nftMult,
    synergyMult,
    conditionMult,
    effMult,
    classMult,
    luckBonusSc,
    bonusSc: 0,
    totalSc,
    dailyCapped,
  };
}

export function estimateSc(
  distanceM: number,
  transport: TransportType,
  strideLevel: number = 0,
): number {
  const config = TRANSPORT_CONFIG[transport];
  const distanceUnits = distanceM / 100;
  const baseSc = distanceUnits * config.baseSc * config.multiplier;
  const strideInfo = STRIDE_TABLE[Math.min(strideLevel, STRIDE_TABLE.length - 1)];
  return Math.floor(baseSc * strideInfo.multiplier);
}

export function estimateCalories(
  distanceKm: number,
  transport: TransportType,
  weightKg: number = 70,
): number {
  const coefficients: Record<string, number> = {
    RUN: 1.05,
    WALK: 0.65,
    BIKE: 0.45,
    SCOOTER: 0.1,
    BUS: 0.05,
    TRAIN: 0.05,
    CAR: 0.05,
  };
  return Math.round(weightKg * distanceKm * (coefficients[transport] || 0.05));
}

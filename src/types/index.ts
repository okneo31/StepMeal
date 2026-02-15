export type TransportType = 'RUN' | 'WALK' | 'BIKE' | 'SCOOTER' | 'BUS' | 'TRAIN' | 'CAR';
export type TransportClass = 'BODY' | 'ECO' | 'RIDE';
export type MovementStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type TimeSlot = 'DAWN' | 'COMMUTE_AM' | 'MORNING' | 'LUNCH' | 'AFTERNOON' | 'COMMUTE_PM' | 'EVENING' | 'NIGHT';
export type WeatherType = 'CLEAR' | 'CLOUDY' | 'RAIN' | 'SNOW' | 'HEAVY_RAIN' | 'HEAVY_SNOW' | 'EXTREME_HEAT' | 'EXTREME_COLD';

export interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
}

export interface MovementSegment {
  transport: TransportType;
  distance: number; // meters
  duration: number; // seconds
  avgSpeed: number; // km/h
  points: GpsPoint[];
  sc: number;
}

export interface TransportConfig {
  type: TransportType;
  class: TransportClass;
  label: string;
  emoji: string;
  baseSc: number;     // SC per 100m
  multiplier: number;
  minSpeed: number;   // km/h
  maxSpeed: number;   // km/h
  weatherBonus: boolean;
}

export interface StrideInfo {
  level: number;
  title: string;
  multiplier: number;
  dailyCap: number;
  requiredDays: number;
}

export interface ScBreakdown {
  baseSc: number;
  transportMult: number;
  strideMult: number;
  timeMult: number;
  weatherMult: number;
  multiMult: number;
  bonusSc: number;
  totalSc: number;
}

export interface DailySummary {
  distanceM: number;
  durationSec: number;
  calories: number;
  scEarned: number;
  mcEarned: number;
  movementCount: number;
}

// === Store Types ===
export type StoreCategory = 'HEALTH_FOOD' | 'IN_APP';

export interface StoreItemDisplay {
  id: string;
  category: StoreCategory;
  name: string;
  description: string | null;
  price: number;
  coinType: string;
  stock: number;
  imageUrl: string | null;
  metadata: string | null;
}

// === Game Types ===
export type RouletteRewardType = 'MC' | 'SHIELD' | 'SC' | 'NONE';

export interface RouletteReward {
  type: RouletteRewardType;
  value: number;
  label: string;
  weight: number;
  color: string;
}

export interface RouletteResult {
  slotIndex: number;
  reward: RouletteReward;
  newScBalance: number;
  newMcBalance: number;
  remainingPlays: number;
}

export interface QuizQuestionDisplay {
  id: string;
  question: string;
  options: string[];
  category: string;
}

export interface QuizAnswerResult {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string | null;
  mcEarned: number;
  remainingAttempts: number;
}

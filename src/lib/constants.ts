import type { TransportConfig, StrideInfo, TimeSlot, WeatherType } from "@/types";

// === Transport Configurations ===
export const TRANSPORT_CONFIG: Record<string, TransportConfig> = {
  RUN:     { type: 'RUN',     class: 'BODY', label: '달리기',     emoji: '🏃', baseSc: 1.2, multiplier: 1.8, minSpeed: 6,  maxSpeed: 15,  weatherBonus: true },
  WALK:    { type: 'WALK',    class: 'BODY', label: '도보',       emoji: '🚶', baseSc: 1.0, multiplier: 1.5, minSpeed: 0,  maxSpeed: 6,   weatherBonus: true },
  BIKE:    { type: 'BIKE',    class: 'ECO',  label: '자전거',     emoji: '🚴', baseSc: 0.8, multiplier: 1.2, minSpeed: 6,  maxSpeed: 30,  weatherBonus: true },
  SCOOTER: { type: 'SCOOTER', class: 'ECO',  label: '전동킥보드', emoji: '🛴', baseSc: 0.6, multiplier: 0.9, minSpeed: 6,  maxSpeed: 25,  weatherBonus: false },
  BUS:     { type: 'BUS',     class: 'RIDE', label: '버스',       emoji: '🚌', baseSc: 0.5, multiplier: 0.8, minSpeed: 0,  maxSpeed: 80,  weatherBonus: false },
  TRAIN:   { type: 'TRAIN',   class: 'RIDE', label: '지하철/기차', emoji: '🚆', baseSc: 0.4, multiplier: 0.6, minSpeed: 0,  maxSpeed: 300, weatherBonus: false },
  CAR:     { type: 'CAR',     class: 'RIDE', label: '자동차',     emoji: '🚗', baseSc: 0.3, multiplier: 0.5, minSpeed: 15, maxSpeed: 120, weatherBonus: false },
};

export const TRANSPORT_LIST = Object.values(TRANSPORT_CONFIG);

// === Stride Table ===
export const STRIDE_TABLE: StrideInfo[] = [
  { level: 0, title: '첫걸음',     multiplier: 1.0, dailyCap: 500,   requiredDays: 0 },
  { level: 1, title: '워밍업',     multiplier: 1.2, dailyCap: 600,   requiredDays: 3 },
  { level: 2, title: '러너',       multiplier: 1.5, dailyCap: 800,   requiredDays: 7 },
  { level: 3, title: '스프린터',   multiplier: 2.0, dailyCap: 1200,  requiredDays: 14 },
  { level: 4, title: '마라토너',   multiplier: 3.0, dailyCap: 1800,  requiredDays: 30 },
  { level: 5, title: '철인',       multiplier: 4.0, dailyCap: 2500,  requiredDays: 60 },
  { level: 6, title: '전설의 발',  multiplier: 5.0, dailyCap: 3500,  requiredDays: 90 },
  { level: 7, title: '스텝마스터', multiplier: 6.5, dailyCap: 5000,  requiredDays: 180 },
  { level: 8, title: '스텝킹',     multiplier: 8.0, dailyCap: 8000,  requiredDays: 365 },
];

export const MAX_STRIDE_LEVEL = 8;

// === Time Bonus ===
export const TIME_BONUS: Record<TimeSlot, { label: string; multiplier: number; startHour: number; endHour: number }> = {
  DAWN:       { label: '새벽',   multiplier: 1.4,  startHour: 5,  endHour: 7 },
  COMMUTE_AM: { label: '출근',   multiplier: 1.2,  startHour: 7,  endHour: 9 },
  MORNING:    { label: '오전',   multiplier: 1.0,  startHour: 9,  endHour: 12 },
  LUNCH:      { label: '점심',   multiplier: 1.15, startHour: 12, endHour: 14 },
  AFTERNOON:  { label: '오후',   multiplier: 1.0,  startHour: 14, endHour: 18 },
  COMMUTE_PM: { label: '퇴근',   multiplier: 1.2,  startHour: 18, endHour: 20 },
  EVENING:    { label: '저녁',   multiplier: 1.1,  startHour: 20, endHour: 22 },
  NIGHT:      { label: '심야',   multiplier: 0.7,  startHour: 22, endHour: 5 },
};

// === Weather Bonus (체력/친환경 클래스만) ===
export const WEATHER_BONUS: Record<WeatherType, { label: string; multiplier: number }> = {
  CLEAR:       { label: '맑음',   multiplier: 1.0 },
  CLOUDY:      { label: '흐림',   multiplier: 1.0 },
  RAIN:        { label: '비',     multiplier: 1.3 },
  SNOW:        { label: '눈',     multiplier: 1.3 },
  HEAVY_RAIN:  { label: '폭우',   multiplier: 1.5 },
  HEAVY_SNOW:  { label: '폭설',   multiplier: 1.5 },
  EXTREME_HEAT:{ label: '폭염',   multiplier: 1.3 },
  EXTREME_COLD:{ label: '혹한',   multiplier: 1.3 },
};

// === Multi-Modal Bonus ===
export const MULTI_MODAL_BONUS = {
  SAME_CLASS: 1.2,   // same class combination +20%
  TWO_CLASS:  1.3,   // 2 different classes +30%
  THREE_CLASS: 1.5,  // 3 different classes +50%
};

// === Stride Protection Shield ===
export const SHIELD_REWARDS: Record<number, number> = {
  2: 1, // Stride 2 first achievement: 1 shield
  4: 2, // Stride 4: 2 shields
  6: 3, // Stride 6: 3 shields
};
export const MAX_SHIELDS = 5;
export const MIN_DAILY_DISTANCE = 1000; // 1km minimum for Stride active day
export const STRIDE_DROP_LEVELS = 2; // Drop 2 levels on miss
export const STRIDE_RESET_DAYS = 3; // 3 consecutive missed days = reset

// === Store ===
export const STORE_CATEGORIES = {
  HEALTH_FOOD: { label: '건강식품', emoji: '🥗' },
  IN_APP: { label: '인앱아이템', emoji: '🎁' },
} as const;

// === Roulette ===
export const ROULETTE_COST_SC = 50;
export const ROULETTE_DAILY_LIMIT = 5;
export const ROULETTE_REWARDS = [
  { type: 'MC' as const, value: 10,  label: '10 MC',    weight: 30, color: '#4CAF50' },
  { type: 'MC' as const, value: 30,  label: '30 MC',    weight: 25, color: '#2196F3' },
  { type: 'MC' as const, value: 50,  label: '50 MC',    weight: 15, color: '#9C27B0' },
  { type: 'MC' as const, value: 100, label: '100 MC',   weight: 5,  color: '#FF9800' },
  { type: 'SHIELD' as const, value: 1, label: '보호막',  weight: 5,  color: '#00BCD4' },
  { type: 'SC' as const, value: 20,  label: '20 SC',    weight: 10, color: '#8BC34A' },
  { type: 'NONE' as const, value: 0,  label: '꽝',      weight: 10, color: '#9E9E9E' },
];

// === Quiz ===
export const QUIZ_MC_REWARD = 20;
export const QUIZ_DAILY_LIMIT = 3;

// === Anti-cheat ===
export const GPS_UPDATE_INTERVAL = 30000; // 30 seconds
export const MAX_GPS_JUMP_METERS = 500; // Max jump in one update
export const MAX_DAILY_SAME_ROUTE = 4; // Same route limit per day
export const SAME_ROUTE_PENALTY = 0.3; // 70% reduction after limit

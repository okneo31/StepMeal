import type { TransportConfig, StrideInfo, TimeSlot, WeatherType } from "@/types";

// === Transport Configurations ===
export const TRANSPORT_CONFIG: Record<string, TransportConfig> = {
  RUN:     { type: 'RUN',     class: 'BODY', label: '달리기',     emoji: '🏃', baseSc: 2.8, multiplier: 1.8, minSpeed: 6,  maxSpeed: 15,  weatherBonus: true },
  WALK:    { type: 'WALK',    class: 'BODY', label: '도보',       emoji: '🚶', baseSc: 2.4, multiplier: 1.5, minSpeed: 0,  maxSpeed: 6,   weatherBonus: true },
  BIKE:    { type: 'BIKE',    class: 'ECO',  label: '자전거',     emoji: '🚴', baseSc: 2.0, multiplier: 1.2, minSpeed: 6,  maxSpeed: 30,  weatherBonus: true },
  SCOOTER: { type: 'SCOOTER', class: 'ECO',  label: '전동킥보드', emoji: '🛴', baseSc: 1.5, multiplier: 0.9, minSpeed: 6,  maxSpeed: 25,  weatherBonus: false },
  BUS:     { type: 'BUS',     class: 'RIDE', label: '버스',       emoji: '🚌', baseSc: 1.2, multiplier: 0.8, minSpeed: 0,  maxSpeed: 80,  weatherBonus: false },
  TRAIN:   { type: 'TRAIN',   class: 'RIDE', label: '지하철/기차', emoji: '🚆', baseSc: 1.0, multiplier: 0.6, minSpeed: 0,  maxSpeed: 300, weatherBonus: false },
  CAR:     { type: 'CAR',     class: 'RIDE', label: '자동차',     emoji: '🚗', baseSc: 0.7, multiplier: 0.5, minSpeed: 15, maxSpeed: 120, weatherBonus: false },
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

// === QR Code ===
export const QR_SCAN_DAILY_LIMIT = 10;

// === NFT ===
export const NFT_RARITY = {
  COMMON:    { label: '커먼',      color: '#94A3B8', bgColor: 'rgba(148,163,184,0.1)', textColor: '#94A3B8', bonusPercent: 5 },
  RARE:      { label: '레어',      color: '#3B82F6', bgColor: 'rgba(59,130,246,0.1)',  textColor: '#60A5FA', bonusPercent: 10 },
  EPIC:      { label: '에픽',      color: '#A855F7', bgColor: 'rgba(168,85,247,0.1)',  textColor: '#C084FC', bonusPercent: 20 },
  LEGENDARY: { label: '레전더리',  color: '#F59E0B', bgColor: 'rgba(245,158,11,0.1)',  textColor: '#FBBF24', bonusPercent: 30 },
} as const;

// === NFT 3-Type System ===
export const NFT_TYPES = {
  BOOSTER:   { label: '부스터',   emoji: '🔥', color: '#EF4444', description: '모든 이동에 SC 보너스' },
  ACCESSORY: { label: '악세서리', emoji: '⚡', color: '#3B82F6', description: '조건부 특수 능력' },
  VEHICLE:   { label: '탈것',     emoji: '🚀', color: '#A855F7', description: '이동수단 시너지 보너스' },
} as const;

export const BOOSTER_TIERS = {
  BRONZE:   { label: '브론즈',   bonusPercent: 12,  color: '#CD7F32' },
  SILVER:   { label: '실버',     bonusPercent: 25,  color: '#C0C0C0' },
  GOLD:     { label: '골드',     bonusPercent: 50,  color: '#FFD700' },
  PLATINUM: { label: '플래티넘', bonusPercent: 90,  color: '#E5E4E2' },
  DIAMOND:  { label: '다이아',   bonusPercent: 150, color: '#B9F2FF' },
} as const;

export const ACCESSORY_SLOTS = {
  HEADGEAR: { label: '헤드기어', emoji: '🎩', description: '날씨 보너스 강화' },
  HANDGEAR: { label: '핸드기어', emoji: '🧤', description: '칼로리 보너스' },
  FOOTGEAR: { label: '풋기어',   emoji: '👟', description: '이동 배율 강화' },
  BODYGEAR: { label: '바디기어', emoji: '🦺', description: 'Stride 보호 강화' },
} as const;

export const EQUIP_SLOTS = ['BOOSTER', 'HEADGEAR', 'HANDGEAR', 'FOOTGEAR', 'BODYGEAR', 'VEHICLE'] as const;

export const VEHICLE_SYNERGY = {
  MATCHED:    1.0,  // 100% synergy when transport matches
  SAME_CLASS: 0.7,  // 70% when same class
  OTHER_CLASS: 0.4, // 40% when different class
} as const;

export const ENHANCE_RATES = [0.9, 0.75, 0.6, 0.45, 0.3] as const; // +1~+5 success rates
export const ENHANCE_BONUS_PER_LEVEL = 8; // +8% per enhance level (item bonus × 1.08^level)

export const SET_BONUS = {
  TWO_TYPES: 20,   // 2종 장착 시 +20% SC
  THREE_TYPES: 40, // 3종 장착 시 +40% SC
} as const;

// === Character System ===
export const CHARACTER_AVATARS = {
  DEFAULT:  { label: '기본',      emoji: '🏃', color: '#22C55E', description: '기본 캐릭터' },
  RUNNER:   { label: '러너',      emoji: '🏃‍♂️', color: '#EF4444', description: '달리기 특화' },
  CYCLIST:  { label: '사이클리스트', emoji: '🚴', color: '#3B82F6', description: '자전거 특화' },
  EXPLORER: { label: '탐험가',    emoji: '🧭', color: '#A855F7', description: '다양한 이동수단' },
  RIDER:    { label: '라이더',    emoji: '🛵', color: '#F59E0B', description: '탈것 특화' },
  ATHLETE:  { label: '운동선수',  emoji: '💪', color: '#06B6D4', description: '체력 특화' },
  CHAMPION: { label: '챔피언',    emoji: '🏆', color: '#FFD700', description: 'NFT 전용' },
} as const;

export const CHARACTER_CLASSES = {
  BODY: { label: 'Body', description: '도보/달리기', color: '#22C55E', transports: ['RUN', 'WALK'] },
  ECO:  { label: 'Eco',  description: '자전거/킥보드', color: '#3B82F6', transports: ['BIKE', 'SCOOTER'] },
  RIDE: { label: 'Ride', description: '버스/기차/자동차', color: '#A855F7', transports: ['BUS', 'TRAIN', 'CAR'] },
} as const;

export const CHARACTER_STAT_LABELS = {
  EFF: { label: 'EFF', fullLabel: 'Efficiency', color: '#22C55E', description: 'SC 획득 효율' },
  LCK: { label: 'LCK', fullLabel: 'Luck',       color: '#F59E0B', description: '보너스 보상 확률' },
  CHM: { label: 'CHM', fullLabel: 'Charisma',    color: '#A855F7', description: '게임/소셜 보너스' },
  HP:  { label: 'HP',  fullLabel: 'HP',           color: '#EF4444', description: '컨디션 감소 속도' },
} as const;

// EXP needed per level: level 1->2 = 100, 2->3 = 150, etc.
export const EXP_PER_LEVEL = (level: number) => Math.floor(100 * Math.pow(1.15, level - 1));

// Stats gained per level
export const STATS_PER_LEVEL = 3; // 3 stat points per level

// Condition decay: -5 per movement, QR food restores +20
export const CONDITION_DECAY_PER_MOVE = 10;
export const CONDITION_RESTORE_PER_QR = 50;
export const CONDITION_DAILY_RESTORE = 50;
export const CONDITION_SC_MULTIPLIER = (condition: number) => {
  if (condition >= 80) return 1.0;
  if (condition >= 50) return 0.8;
  if (condition >= 20) return 0.5;
  return 0.2;
};

// EXP earned per movement (based on distance)
export const EXP_PER_KM = 10;

// === Anti-cheat ===
export const GPS_UPDATE_INTERVAL = 30000; // 30 seconds
export const MAX_GPS_JUMP_METERS = 500; // Max jump in one update
export const MAX_DAILY_SAME_ROUTE = 4; // Same route limit per day
export const SAME_ROUTE_PENALTY = 0.3; // 70% reduction after limit

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
  nftMult: number;
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

// === NFT Types ===
export type NftRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type NftCategory = 'BADGE' | 'CHARACTER' | 'LANDSCAPE';
export type NftType = 'BOOSTER' | 'ACCESSORY' | 'VEHICLE';
export type BoosterTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
export type AccessorySlot = 'HEADGEAR' | 'HANDGEAR' | 'FOOTGEAR' | 'BODYGEAR';
export type EquipSlot = 'BOOSTER' | 'HEADGEAR' | 'HANDGEAR' | 'FOOTGEAR' | 'BODYGEAR' | 'VEHICLE';

export interface NftAbility {
  condition: string; // e.g. "RAIN", "STREAK_7", "DAWN"
  effect: string;    // e.g. "SC_BONUS", "CALORIE_BONUS", "SHIELD_SAVE"
  value: number;     // e.g. 15 (percent)
}

export interface NftTemplateDisplay {
  id: string;
  name: string;
  description: string | null;
  imageEmoji: string;
  rarity: NftRarity;
  category: NftCategory;
  nftType: NftType;
  priceMc: number;
  maxSupply: number;
  mintedCount: number;
  scBonusPercent: number;
  isActive: boolean;
  // Booster
  tier: BoosterTier | null;
  // Accessory
  slot: AccessorySlot | null;
  ability: NftAbility | null;
  // Vehicle
  matchedTransports: TransportType[] | null;
  transportClass: TransportClass | null;
  synergyPercent: number;
}

export interface UserNftDisplay {
  id: string;
  templateId: string;
  mintNumber: number;
  enhanceLevel: number;
  isEquipped: boolean;
  equippedSlot: EquipSlot | null;
  mintedAt: string;
  template: NftTemplateDisplay;
}

// === Character Types ===
export type CharacterClass = 'BODY' | 'ECO' | 'RIDE';
export type AvatarType = 'DEFAULT' | 'RUNNER' | 'CYCLIST' | 'EXPLORER' | 'RIDER' | 'ATHLETE' | 'CHAMPION';
export type CharacterStat = 'EFF' | 'LCK' | 'CHM' | 'HP';

export interface CharacterDisplay {
  id: string;
  name: string;
  avatarType: AvatarType;
  isNftAvatar: boolean;
  mainClass: CharacterClass;
  subClass: CharacterClass | null;
  level: number;
  exp: number;
  expToNext: number;
  statEff: number;
  statLck: number;
  statChm: number;
  statHp: number;
  condition: number;
  maxCondition: number;
}

// === QR Types ===
export interface QrScanResult {
  success: boolean;
  mcReward?: number;
  description?: string;
  newMcBalance?: number;
  error?: string;
  booster?: {
    activated: boolean;
    multiplier: number;
    type: string;
    durationHours: number;
  };
}

// === Booster Types ===
export interface ActiveBoosterInfo {
  active: boolean;
  multiplier?: number;
  boosterType?: string;
  productName?: string;
  expiresAt?: string;
  remainingMin?: number;
  remainingLabel?: string;
}

// === Quest Types ===
export type QuestStatus = 'ACTIVE' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';

export interface QuestDisplay {
  id: string;
  destName: string;
  destLat: number;
  destLng: number;
  destAddress: string | null;
  status: QuestStatus;
  bonusSc: number;
  arrivedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface QuestReviewDisplay {
  id: string;
  questId: string;
  photoUrl: string | null;
  comment: string | null;
  rating: number | null;
  bonusSc: number;
  createdAt: string;
}

// === Order Types ===
export type OrderStatus = 'ORDERED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED';

export interface OrderDisplay {
  id: string;
  status: OrderStatus;
  recipientName: string;
  phone: string;
  address: string;
  addressDetail: string | null;
  trackingNo: string | null;
  memo: string | null;
  createdAt: string;
  itemName: string;
  itemImage: string | null;
  quantity: number;
  price: number;
  coinType: string;
}

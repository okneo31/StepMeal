import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import bcrypt from "bcryptjs";
const { hash } = bcrypt;

const prisma = new PrismaClient();

async function main() {
  const password = await hash("test1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "test@stepmeal.kr" },
    update: {},
    create: {
      email: "test@stepmeal.kr",
      password,
      nickname: "테스트유저",
      coinBalance: {
        create: { scBalance: 500, mcBalance: 100, scLifetime: 500, mcLifetime: 100 },
      },
      stride: {
        create: {
          currentStreak: 5,
          strideLevel: 1,
          strideMultiplier: 1.2,
          longestStreak: 5,
          lastActive: new Date(),
          shieldCount: 0,
          totalDistance: 12000,
        },
      },
    },
  });

  console.log("Seeded user:", user.email);

  // === Store Items: Health Foods (SC) ===
  const healthFoods = [
    { category: "HEALTH_FOOD", name: "프로틴 쉐이크", description: "고단백 저칼로리 쉐이크 (1팩)", price: 300, coinType: "SC", imageUrl: "🥤" },
    { category: "HEALTH_FOOD", name: "그래놀라 바", description: "통곡물 에너지 바 (2개입)", price: 200, coinType: "SC", imageUrl: "🍫" },
    { category: "HEALTH_FOOD", name: "닭가슴살 샐러드", description: "신선한 닭가슴살 샐러드", price: 500, coinType: "SC", imageUrl: "🥗" },
    { category: "HEALTH_FOOD", name: "아사이볼", description: "슈퍼푸드 아사이볼", price: 400, coinType: "SC", imageUrl: "🫐" },
    { category: "HEALTH_FOOD", name: "콤부차", description: "유기농 콤부차 (1병)", price: 250, coinType: "SC", imageUrl: "🍵" },
    { category: "HEALTH_FOOD", name: "견과류 믹스", description: "프리미엄 견과류 30g", price: 150, coinType: "SC", imageUrl: "🥜" },
  ];

  const inAppItems = [
    { category: "IN_APP", name: "보호막", description: "스트라이드 보호막 1개", price: 100, coinType: "MC", imageUrl: "🛡️", metadata: JSON.stringify({ type: "SHIELD" }) },
    { category: "IN_APP", name: "보호막 3개 묶음", description: "스트라이드 보호막 3개 (할인)", price: 250, coinType: "MC", imageUrl: "🛡️", metadata: JSON.stringify({ type: "SHIELD", quantity: 3 }) },
    { category: "IN_APP", name: "SC 부스터 (2시간)", description: "2시간 동안 SC 1.5배 획득", price: 200, coinType: "MC", imageUrl: "⚡", metadata: JSON.stringify({ type: "SC_BOOST", duration: 7200, multiplier: 1.5 }) },
    { category: "IN_APP", name: "프로필 뱃지", description: "특별한 프로필 뱃지", price: 500, coinType: "SC", imageUrl: "🏅", metadata: JSON.stringify({ type: "BADGE" }) },
    { category: "IN_APP", name: "프리미엄 테마", description: "앱 프리미엄 테마 (영구)", price: 300, coinType: "MC", imageUrl: "🎨", metadata: JSON.stringify({ type: "THEME" }) },
  ];

  await prisma.storeItem.deleteMany({});
  for (const item of [...healthFoods, ...inAppItems]) {
    await prisma.storeItem.create({ data: item });
  }
  console.log("Seeded store items:", healthFoods.length + inAppItems.length);

  // === Quiz Questions (12 questions) ===
  const quizQuestions = [
    { question: "성인 기준 하루 권장 걸음 수는 몇 보일까요?", options: JSON.stringify(["5,000보", "8,000보", "10,000보", "15,000보"]), correctIndex: 2, explanation: "WHO는 하루 10,000보를 권장하고 있습니다.", category: "HEALTH" },
    { question: "다음 중 단백질이 가장 많은 식품은?", options: JSON.stringify(["두부 100g", "닭가슴살 100g", "계란 1개", "우유 200ml"]), correctIndex: 1, explanation: "닭가슴살 100g에는 약 31g의 단백질이 포함되어 있습니다.", category: "NUTRITION" },
    { question: "유산소 운동의 효과가 아닌 것은?", options: JSON.stringify(["심폐기능 향상", "체지방 감소", "근비대 효과", "스트레스 해소"]), correctIndex: 2, explanation: "근비대(근육 크기 증가)는 주로 저항 운동(웨이트)의 효과입니다.", category: "FITNESS" },
    { question: "하루 권장 수분 섭취량은 약 얼마일까요?", options: JSON.stringify(["500ml", "1L", "2L", "4L"]), correctIndex: 2, explanation: "일반 성인의 하루 권장 수분 섭취량은 약 2리터입니다.", category: "HEALTH" },
    { question: "BMI(체질량지수) 계산 공식은?", options: JSON.stringify(["체중(kg) / 신장(m)", "체중(kg) / 신장(m)²", "신장(m) / 체중(kg)", "체중(kg) × 신장(m)"]), correctIndex: 1, explanation: "BMI = 체중(kg) ÷ 신장(m)의 제곱으로 계산합니다.", category: "HEALTH" },
    { question: "걷기 운동 시 가장 좋은 자세는?", options: JSON.stringify(["고개를 숙이고 걷기", "팔을 크게 흔들며 걷기", "등을 펴고 시선은 전방", "최대한 빠르게 걷기"]), correctIndex: 2, explanation: "등을 펴고 시선은 전방 10~15m를 바라보며 걷는 것이 이상적입니다.", category: "FITNESS" },
    { question: "비타민 D를 자연적으로 합성하려면?", options: JSON.stringify(["물을 많이 마시면", "햇빛을 쬐면", "채소를 먹으면", "충분히 자면"]), correctIndex: 1, explanation: "피부가 자외선(UVB)에 노출되면 비타민 D가 합성됩니다.", category: "NUTRITION" },
    { question: "스트레칭의 효과가 아닌 것은?", options: JSON.stringify(["유연성 향상", "부상 예방", "근력 강화", "혈액순환 개선"]), correctIndex: 2, explanation: "근력 강화는 저항 운동의 효과이며, 스트레칭은 유연성과 혈류 개선에 도움됩니다.", category: "FITNESS" },
    { question: "하루 중 가장 체온이 높은 시간대는?", options: JSON.stringify(["오전 6시", "오후 2~4시", "오후 6~8시", "밤 10시"]), correctIndex: 2, explanation: "체온은 보통 오후 6~8시경에 가장 높으며, 이 시간대 운동 효율이 좋습니다.", category: "HEALTH" },
    { question: "건강한 성인의 안정 시 심박수 범위는?", options: JSON.stringify(["40~50bpm", "60~100bpm", "100~120bpm", "120~140bpm"]), correctIndex: 1, explanation: "일반적인 성인의 안정 시 심박수는 60~100bpm입니다.", category: "HEALTH" },
    { question: "식이섬유가 가장 풍부한 식품은?", options: JSON.stringify(["흰쌀밥", "고구마", "귀리", "두부"]), correctIndex: 2, explanation: "귀리는 100g당 약 10g의 식이섬유를 포함하고 있습니다.", category: "NUTRITION" },
    { question: "근육통이 생기는 주된 이유는?", options: JSON.stringify(["근섬유의 미세한 손상", "뼈의 약화", "관절 마모", "혈압 상승"]), correctIndex: 0, explanation: "운동 후 근육통(DOMS)은 근섬유의 미세 손상에 따른 염증 반응입니다.", category: "FITNESS" },
  ];

  await prisma.quizAttempt.deleteMany({});
  await prisma.quizQuestion.deleteMany({});
  for (const q of quizQuestions) {
    await prisma.quizQuestion.create({ data: q });
  }
  console.log("Seeded quiz questions:", quizQuestions.length);

  // === QR Codes (10 codes) ===
  const qrCodes = [
    { code: "STEPMEAL-QR-001", mcReward: 30,  description: "프로틴 쉐이크 QR" },
    { code: "STEPMEAL-QR-002", mcReward: 50,  description: "그래놀라 바 QR" },
    { code: "STEPMEAL-QR-003", mcReward: 40,  description: "닭가슴살 샐러드 QR" },
    { code: "STEPMEAL-QR-004", mcReward: 60,  description: "아사이볼 QR" },
    { code: "STEPMEAL-QR-005", mcReward: 35,  description: "콤부차 QR" },
    { code: "STEPMEAL-QR-006", mcReward: 45,  description: "견과류 믹스 QR" },
    { code: "STEPMEAL-QR-007", mcReward: 70,  description: "프리미엄 세트 QR" },
    { code: "STEPMEAL-QR-008", mcReward: 80,  description: "스페셜 박스 QR" },
    { code: "STEPMEAL-QR-009", mcReward: 100, description: "럭셔리 패키지 QR" },
    { code: "STEPMEAL-QR-010", mcReward: 50,  description: "이벤트 QR" },
  ];

  await prisma.qrCode.deleteMany({});
  for (const qr of qrCodes) {
    await prisma.qrCode.create({ data: qr });
  }
  console.log("Seeded QR codes:", qrCodes.length);

  // ============================================================
  // === NFT Templates (94 items: 16 Boosters + 40 Accessories + 29 Shoes + 9 Vehicles)
  // ============================================================

  // --- Helper: ability JSON builder ---
  const ability = (condition, effect, value) => JSON.stringify({ condition, effect, value });
  const transports = (...types) => JSON.stringify(types);

  const nftTemplates = [
    // ============================================================
    // BOOSTER (16) - Universal SC% boost
    // ============================================================

    // COMMON BOOSTERS (4) - unlimited
    { name: "에너지 젤리",   imageEmoji: "🍬", rarity: "COMMON", nftType: "BOOSTER", tier: "BRONZE", priceMc: 200,   maxSupply: -1,  scBonusPercent: 12,  description: "달콤한 에너지 충전! 기본 SC 부스트" },
    { name: "파워 드링크",   imageEmoji: "🥤", rarity: "COMMON", nftType: "BOOSTER", tier: "SILVER", priceMc: 400,   maxSupply: -1,  scBonusPercent: 25,  description: "파워 넘치는 드링크로 SC 획득 UP" },
    { name: "비타민 캡슐",   imageEmoji: "💊", rarity: "COMMON", nftType: "BOOSTER", tier: "BRONZE", priceMc: 200,   maxSupply: -1,  scBonusPercent: 12,  description: "매일 챙기는 비타민으로 꾸준한 보너스" },
    { name: "프로틴 바",     imageEmoji: "🍫", rarity: "COMMON", nftType: "BOOSTER", tier: "SILVER", priceMc: 400,   maxSupply: -1,  scBonusPercent: 25,  description: "고단백 에너지바로 SC 부스트" },

    // RARE BOOSTERS (5) - 100 each
    { name: "크리스탈 샤드", imageEmoji: "🔮", rarity: "RARE", nftType: "BOOSTER", tier: "SILVER",   priceMc: 800,   maxSupply: 100, scBonusPercent: 25,  description: "은빛 크리스탈의 힘을 담은 파편" },
    { name: "불꽃의 깃털",   imageEmoji: "🪶", rarity: "RARE", nftType: "BOOSTER", tier: "GOLD",     priceMc: 1500,  maxSupply: 100, scBonusPercent: 50,  description: "불사조의 깃털에서 뿜어져 나오는 에너지" },
    { name: "기운의 부적",   imageEmoji: "🧿", rarity: "RARE", nftType: "BOOSTER", tier: "SILVER",   priceMc: 800,   maxSupply: 100, scBonusPercent: 25,  description: "행운과 기운을 불러오는 부적" },
    { name: "용의 비늘",     imageEmoji: "🐉", rarity: "RARE", nftType: "BOOSTER", tier: "GOLD",     priceMc: 1500,  maxSupply: 100, scBonusPercent: 50,  description: "고대 용의 비늘에 깃든 강력한 힘" },
    { name: "문스톤",       imageEmoji: "🌙", rarity: "RARE", nftType: "BOOSTER", tier: "GOLD",     priceMc: 1200,  maxSupply: 100, scBonusPercent: 50,  description: "달빛을 머금은 신비로운 보석" },

    // EPIC BOOSTERS (4) - 50 each
    { name: "용의 심장",     imageEmoji: "❤️‍🔥", rarity: "EPIC", nftType: "BOOSTER", tier: "GOLD",     priceMc: 3000,  maxSupply: 50, scBonusPercent: 50,  description: "용의 심장에서 뿜어져 나오는 불꽃 에너지" },
    { name: "태양의 돌",     imageEmoji: "☀️",  rarity: "EPIC", nftType: "BOOSTER", tier: "PLATINUM", priceMc: 6000,  maxSupply: 50, scBonusPercent: 90,  description: "태양의 핵심 에너지를 품은 보석" },
    { name: "피닉스 에센스", imageEmoji: "🔥",  rarity: "EPIC", nftType: "BOOSTER", tier: "PLATINUM", priceMc: 6000,  maxSupply: 50, scBonusPercent: 90,  description: "불사조의 정수가 담긴 에센스" },
    { name: "원소의 결정",   imageEmoji: "💎",  rarity: "EPIC", nftType: "BOOSTER", tier: "GOLD",     priceMc: 3000,  maxSupply: 50, scBonusPercent: 50,  description: "4원소의 힘이 응축된 결정체" },

    // LEGENDARY BOOSTERS (3) - 10 each
    { name: "별의 파편",     imageEmoji: "⭐",  rarity: "LEGENDARY", nftType: "BOOSTER", tier: "PLATINUM", priceMc: 12000, maxSupply: 10, scBonusPercent: 90,  description: "별이 폭발하며 남긴 우주의 파편" },
    { name: "인피니티 코어", imageEmoji: "🌀",  rarity: "LEGENDARY", nftType: "BOOSTER", tier: "DIAMOND",  priceMc: 15000, maxSupply: 10, scBonusPercent: 150, description: "무한한 에너지를 품은 궁극의 코어" },
    { name: "카오스 오브",   imageEmoji: "🌌",  rarity: "LEGENDARY", nftType: "BOOSTER", tier: "DIAMOND",  priceMc: 15000, maxSupply: 10, scBonusPercent: 150, description: "혼돈의 힘을 지배하는 자의 구슬" },

    // ============================================================
    // ACCESSORY - HEADGEAR (10) - Weather SC bonus
    // ============================================================

    // COMMON HEADGEAR (3) - unlimited
    { name: "레인 캡",       imageEmoji: "🧢", rarity: "COMMON", nftType: "ACCESSORY", slot: "HEADGEAR", priceMc: 250, maxSupply: -1,  scBonusPercent: 12, ability: ability("RAIN_SNOW", "SC_BONUS", 12),       description: "비와 눈에도 거뜬한 방수 캡" },
    { name: "스포츠 헤드밴드", imageEmoji: "🎽", rarity: "COMMON", nftType: "ACCESSORY", slot: "HEADGEAR", priceMc: 200, maxSupply: -1, scBonusPercent: 10, ability: ability("EXERCISE", "SC_BONUS", 10),        description: "땀 흡수 헤드밴드로 쾌적한 운동" },
    { name: "UV 선캡",       imageEmoji: "⛱️", rarity: "COMMON", nftType: "ACCESSORY", slot: "HEADGEAR", priceMc: 220, maxSupply: -1,  scBonusPercent: 11, ability: ability("CLEAR", "SC_BONUS", 11),           description: "자외선 차단 선캡" },

    // RARE HEADGEAR (3) - 100 each
    { name: "썬 바이저",     imageEmoji: "🕶️", rarity: "RARE", nftType: "ACCESSORY", slot: "HEADGEAR", priceMc: 700,  maxSupply: 100, scBonusPercent: 30, ability: ability("EXTREME_WEATHER", "SC_BONUS", 30), description: "극한 기후에서 빛나는 프리미엄 바이저" },
    { name: "나이트 고글",   imageEmoji: "🥽", rarity: "RARE", nftType: "ACCESSORY", slot: "HEADGEAR", priceMc: 700,  maxSupply: 100, scBonusPercent: 28, ability: ability("NIGHT", "SC_BONUS", 28),           description: "야간 이동 시 시야 확보 + SC 보너스" },
    { name: "윈드프루프 캡", imageEmoji: "🎩", rarity: "RARE", nftType: "ACCESSORY", slot: "HEADGEAR", priceMc: 750,  maxSupply: 100, scBonusPercent: 32, ability: ability("RAIN_HEAVY", "SC_BONUS", 32),      description: "강풍과 비바람에도 끄떡없는 방풍캡" },

    // EPIC HEADGEAR (2) - 50 each
    { name: "스톰 헬멧",     imageEmoji: "⛑️", rarity: "EPIC", nftType: "ACCESSORY", slot: "HEADGEAR", priceMc: 3500, maxSupply: 50,  scBonusPercent: 60, ability: ability("ALL_BAD_WEATHER", "SC_BONUS", 60),  description: "모든 악천후에서 SC 대폭 증가" },
    { name: "오로라 바이저", imageEmoji: "🌅", rarity: "EPIC", nftType: "ACCESSORY", slot: "HEADGEAR", priceMc: 3200, maxSupply: 50,  scBonusPercent: 55, ability: ability("DAWN_NIGHT", "SC_BONUS", 55),      description: "새벽과 야간에 오로라처럼 빛나는 바이저" },

    // LEGENDARY HEADGEAR (2) - 10 each
    { name: "아우라 크라운", imageEmoji: "👑", rarity: "LEGENDARY", nftType: "ACCESSORY", slot: "HEADGEAR", priceMc: 10000, maxSupply: 10, scBonusPercent: 120, ability: ability("ALL_NON_CLEAR", "SC_BONUS", 120), description: "맑은 날을 제외한 모든 날씨에서 폭발적 SC 보너스" },
    { name: "천공의 티아라", imageEmoji: "✨", rarity: "LEGENDARY", nftType: "ACCESSORY", slot: "HEADGEAR", priceMc: 10000, maxSupply: 10, scBonusPercent: 100, ability: ability("ALWAYS", "SC_BONUS", 100),       description: "하늘의 축복이 깃든 전설의 왕관" },

    // ============================================================
    // ACCESSORY - HANDGEAR (10) - SC + Calorie bonus
    // ============================================================

    // COMMON HANDGEAR (3) - unlimited
    { name: "트레이닝 밴드", imageEmoji: "🏋️", rarity: "COMMON", nftType: "ACCESSORY", slot: "HANDGEAR", priceMc: 200, maxSupply: -1,  scBonusPercent: 12, ability: ability("ALWAYS", "SC_BONUS", 12),     description: "기본 트레이닝 밴드로 꾸준한 SC 보너스" },
    { name: "피트니스 글러브", imageEmoji: "🧤", rarity: "COMMON", nftType: "ACCESSORY", slot: "HANDGEAR", priceMc: 220, maxSupply: -1, scBonusPercent: 13, ability: ability("RUN", "SC_BONUS", 13),        description: "달리기 시 그립감과 SC 보너스 UP" },
    { name: "스마트 밴드",   imageEmoji: "⌚", rarity: "COMMON", nftType: "ACCESSORY", slot: "HANDGEAR", priceMc: 200, maxSupply: -1,  scBonusPercent: 11, ability: ability("ALWAYS", "SC_BONUS", 11),     description: "활동 추적 스마트 밴드" },

    // RARE HANDGEAR (3) - 100 each
    { name: "파워 그립",     imageEmoji: "💪", rarity: "RARE", nftType: "ACCESSORY", slot: "HANDGEAR", priceMc: 700,  maxSupply: 100, scBonusPercent: 28, ability: ability("RUN", "SC_BONUS", 28),        description: "달리기 시 폭발적인 파워 그립" },
    { name: "택티컬 글러브", imageEmoji: "🥊", rarity: "RARE", nftType: "ACCESSORY", slot: "HANDGEAR", priceMc: 650,  maxSupply: 100, scBonusPercent: 26, ability: ability("BODY_CLASS", "SC_BONUS", 26), description: "BODY 클래스 이동 시 전술적 보너스" },
    { name: "에너지 리스트밴드", imageEmoji: "⚡", rarity: "RARE", nftType: "ACCESSORY", slot: "HANDGEAR", priceMc: 700, maxSupply: 100, scBonusPercent: 25, ability: ability("ALWAYS", "SC_BONUS", 25),   description: "에너지 파동으로 상시 SC 보너스" },

    // EPIC HANDGEAR (2) - 50 each
    { name: "에너지 건틀렛", imageEmoji: "🦾", rarity: "EPIC", nftType: "ACCESSORY", slot: "HANDGEAR", priceMc: 3500, maxSupply: 50, scBonusPercent: 55, ability: ability("BODY_CLASS", "SC_BONUS", 55), description: "BODY 클래스 이동 시 강력한 SC 증폭" },
    { name: "사이버 그립",   imageEmoji: "🤖", rarity: "EPIC", nftType: "ACCESSORY", slot: "HANDGEAR", priceMc: 3500, maxSupply: 50, scBonusPercent: 50, ability: ability("ALWAYS", "SC_BONUS", 50),     description: "사이버네틱 기술의 상시 SC 부스트" },

    // LEGENDARY HANDGEAR (2) - 10 each
    { name: "타이탄 피스트",  imageEmoji: "🔱", rarity: "LEGENDARY", nftType: "ACCESSORY", slot: "HANDGEAR", priceMc: 10000, maxSupply: 10, scBonusPercent: 110, ability: ability("ALWAYS", "SC_BONUS", 110),     description: "타이탄의 힘이 깃든 궁극의 장갑" },
    { name: "드래곤 클로",    imageEmoji: "🐲", rarity: "LEGENDARY", nftType: "ACCESSORY", slot: "HANDGEAR", priceMc: 10000, maxSupply: 10, scBonusPercent: 105, ability: ability("BODY_ECO", "SC_BONUS", 105),    description: "용의 발톱. BODY+ECO 이동 시 극대화" },

    // ============================================================
    // ACCESSORY - FOOTGEAR (10) - Insoles/Shoe parts
    // ============================================================

    // COMMON FOOTGEAR (3) - unlimited
    { name: "쿠셔닝 인솔",   imageEmoji: "🦶", rarity: "COMMON", nftType: "ACCESSORY", slot: "FOOTGEAR", priceMc: 250, maxSupply: -1,  scBonusPercent: 13, ability: ability("WALK", "SC_BONUS", 13),       description: "쿠션감 있는 인솔로 도보 SC 증가" },
    { name: "스포츠 양말",   imageEmoji: "🧦", rarity: "COMMON", nftType: "ACCESSORY", slot: "FOOTGEAR", priceMc: 200, maxSupply: -1,  scBonusPercent: 12, ability: ability("RUN", "SC_BONUS", 12),        description: "달리기 특화 스포츠 양말" },
    { name: "앵클 서포터",   imageEmoji: "🦿", rarity: "COMMON", nftType: "ACCESSORY", slot: "FOOTGEAR", priceMc: 200, maxSupply: -1,  scBonusPercent: 10, ability: ability("ALWAYS", "SC_BONUS", 10),     description: "발목 보호 서포터로 안정적인 보너스" },

    // RARE FOOTGEAR (3) - 100 each
    { name: "스피드 레이스", imageEmoji: "🎯", rarity: "RARE", nftType: "ACCESSORY", slot: "FOOTGEAR", priceMc: 700,  maxSupply: 100, scBonusPercent: 30, ability: ability("RUN", "SC_BONUS", 30),        description: "스피드를 위한 특수 신발끈" },
    { name: "에어 인솔",     imageEmoji: "💨", rarity: "RARE", nftType: "ACCESSORY", slot: "FOOTGEAR", priceMc: 700,  maxSupply: 100, scBonusPercent: 28, ability: ability("WALK_RUN", "SC_BONUS", 28),   description: "에어 쿠션 인솔로 도보/달리기 보너스" },
    { name: "컴프레션 삭스", imageEmoji: "🧲", rarity: "RARE", nftType: "ACCESSORY", slot: "FOOTGEAR", priceMc: 750,  maxSupply: 100, scBonusPercent: 30, ability: ability("BODY_CLASS", "SC_BONUS", 30), description: "압박 양말로 BODY 클래스 SC 증가" },

    // EPIC FOOTGEAR (2) - 50 each
    { name: "카본 플레이트", imageEmoji: "⚫", rarity: "EPIC", nftType: "ACCESSORY", slot: "FOOTGEAR", priceMc: 3500, maxSupply: 50, scBonusPercent: 60, ability: ability("BODY_CLASS", "SC_BONUS", 60), description: "카본 소재로 BODY 클래스 극대화" },
    { name: "제트 인솔",     imageEmoji: "🚀", rarity: "EPIC", nftType: "ACCESSORY", slot: "FOOTGEAR", priceMc: 3300, maxSupply: 50, scBonusPercent: 58, ability: ability("RUN", "SC_BONUS", 58),        description: "제트 추진력의 달리기 특화 인솔" },

    // LEGENDARY FOOTGEAR (2) - 10 each
    { name: "헤르메스 윙",   imageEmoji: "🪽", rarity: "LEGENDARY", nftType: "ACCESSORY", slot: "FOOTGEAR", priceMc: 10000, maxSupply: 10, scBonusPercent: 100, ability: ability("ALWAYS", "SC_BONUS", 100),     description: "헤르메스의 날개. 모든 이동에 SC 폭증" },
    { name: "그래비티 솔",   imageEmoji: "🌍", rarity: "LEGENDARY", nftType: "ACCESSORY", slot: "FOOTGEAR", priceMc: 10000, maxSupply: 10, scBonusPercent: 95,  ability: ability("BODY_ECO", "SC_BONUS", 95),    description: "중력을 지배하는 솔. BODY+ECO 극대화" },

    // ============================================================
    // ACCESSORY - BODYGEAR (10) - Stride protection + SC
    // ============================================================

    // COMMON BODYGEAR (3) - unlimited
    { name: "러닝 조끼",     imageEmoji: "🦺", rarity: "COMMON", nftType: "ACCESSORY", slot: "BODYGEAR", priceMc: 200, maxSupply: -1,  scBonusPercent: 10, ability: ability("STREAK_3", "SC_BONUS", 10),    description: "3일 연속 이동 시 SC 보너스" },
    { name: "스포츠 벨트",   imageEmoji: "🪢", rarity: "COMMON", nftType: "ACCESSORY", slot: "BODYGEAR", priceMc: 200, maxSupply: -1,  scBonusPercent: 10, ability: ability("ALWAYS", "SC_BONUS", 10),     description: "안정감 있는 스포츠 벨트" },
    { name: "리플렉터 밴드", imageEmoji: "🔦", rarity: "COMMON", nftType: "ACCESSORY", slot: "BODYGEAR", priceMc: 220, maxSupply: -1,  scBonusPercent: 12, ability: ability("NIGHT", "SC_BONUS", 12),      description: "야간 이동 시 안전 + SC 보너스" },

    // RARE BODYGEAR (3) - 100 each
    { name: "프로텍터",      imageEmoji: "🛡️", rarity: "RARE", nftType: "ACCESSORY", slot: "BODYGEAR", priceMc: 700,  maxSupply: 100, scBonusPercent: 28, ability: ability("STREAK_7", "SC_BONUS", 28),    description: "7일 연속 이동 시 보호 + SC 증가" },
    { name: "택티컬 베스트", imageEmoji: "🎖️", rarity: "RARE", nftType: "ACCESSORY", slot: "BODYGEAR", priceMc: 650,  maxSupply: 100, scBonusPercent: 26, ability: ability("STREAK_14", "SC_BONUS", 26),   description: "14일 연속 달성 시 전술적 보너스" },
    { name: "윈드 브레이커", imageEmoji: "🌬️", rarity: "RARE", nftType: "ACCESSORY", slot: "BODYGEAR", priceMc: 750,  maxSupply: 100, scBonusPercent: 30, ability: ability("BAD_WEATHER", "SC_BONUS", 30), description: "악천후 속에서도 SC 획득" },

    // EPIC BODYGEAR (2) - 50 each
    { name: "가디언 아머",   imageEmoji: "⚔️", rarity: "EPIC", nftType: "ACCESSORY", slot: "BODYGEAR", priceMc: 3500, maxSupply: 50, scBonusPercent: 55, ability: ability("STREAK_14", "SC_BONUS", 55),   description: "14일 연속의 수호자. 강력한 SC 증폭" },
    { name: "나노 슈트",     imageEmoji: "🧬", rarity: "EPIC", nftType: "ACCESSORY", slot: "BODYGEAR", priceMc: 3500, maxSupply: 50, scBonusPercent: 58, ability: ability("STREAK_7", "SC_BONUS", 58),    description: "나노 기술의 7일 연속 극대화 슈트" },

    // LEGENDARY BODYGEAR (2) - 10 each
    { name: "불멸의 갑옷",   imageEmoji: "🏰", rarity: "LEGENDARY", nftType: "ACCESSORY", slot: "BODYGEAR", priceMc: 10000, maxSupply: 10, scBonusPercent: 100, ability: ability("ALWAYS", "SC_BONUS", 100),     description: "불멸의 의지가 깃든 전설의 갑옷" },
    { name: "발키리 아머",   imageEmoji: "🗡️", rarity: "LEGENDARY", nftType: "ACCESSORY", slot: "BODYGEAR", priceMc: 10000, maxSupply: 10, scBonusPercent: 95,  ability: ability("ALWAYS", "SC_BONUS", 95),      description: "전쟁의 여신이 입던 신성한 갑옷" },

    // ============================================================
    // VEHICLE - SHOES (29) - Main earning gear
    // ============================================================

    // COMMON SHOES (8) - unlimited
    { name: "데일리 워커",     imageEmoji: "👞", rarity: "COMMON", nftType: "VEHICLE", priceMc: 300, maxSupply: -1, scBonusPercent: 15, matchedTransports: transports("WALK"),       transportClass: "BODY", synergyPercent: 15, description: "편안한 일상 워킹화" },
    { name: "모닝 조거",       imageEmoji: "🏃", rarity: "COMMON", nftType: "VEHICLE", priceMc: 350, maxSupply: -1, scBonusPercent: 18, matchedTransports: transports("WALK", "RUN"), transportClass: "BODY", synergyPercent: 18, description: "아침 조깅에 딱 맞는 가벼운 슈즈" },
    { name: "시티 스니커즈",   imageEmoji: "👟", rarity: "COMMON", nftType: "VEHICLE", priceMc: 300, maxSupply: -1, scBonusPercent: 15, matchedTransports: transports("WALK"),       transportClass: "BODY", synergyPercent: 15, description: "도심 산책을 위한 스니커즈" },
    { name: "베이직 러너",     imageEmoji: "🥾", rarity: "COMMON", nftType: "VEHICLE", priceMc: 350, maxSupply: -1, scBonusPercent: 20, matchedTransports: transports("RUN"),        transportClass: "BODY", synergyPercent: 20, description: "달리기 입문자를 위한 기본 러닝화" },
    { name: "에코 페달",       imageEmoji: "🚲", rarity: "COMMON", nftType: "VEHICLE", priceMc: 300, maxSupply: -1, scBonusPercent: 15, matchedTransports: transports("BIKE"),       transportClass: "ECO",  synergyPercent: 15, description: "자전거 라이딩을 위한 클릿 슈즈" },
    { name: "프리라이드 슈즈", imageEmoji: "🛹", rarity: "COMMON", nftType: "VEHICLE", priceMc: 350, maxSupply: -1, scBonusPercent: 18, matchedTransports: transports("SCOOTER"),    transportClass: "ECO",  synergyPercent: 18, description: "킥보드/스쿠터용 그립 슈즈" },
    { name: "캔버스 스텝",     imageEmoji: "👡", rarity: "COMMON", nftType: "VEHICLE", priceMc: 320, maxSupply: -1, scBonusPercent: 17, matchedTransports: transports("WALK", "RUN"), transportClass: "BODY", synergyPercent: 17, description: "캐주얼하면서 실용적인 캔버스 슈즈" },
    { name: "트레이닝 슈즈",   imageEmoji: "⚡", rarity: "COMMON", nftType: "VEHICLE", priceMc: 380, maxSupply: -1, scBonusPercent: 20, matchedTransports: transports("RUN", "WALK"), transportClass: "BODY", synergyPercent: 20, description: "본격 트레이닝을 위한 다목적 슈즈" },

    // RARE SHOES (10) - 100 each
    { name: "에어 조거",       imageEmoji: "💨", rarity: "RARE", nftType: "VEHICLE", priceMc: 1000, maxSupply: 100, scBonusPercent: 40, matchedTransports: transports("RUN", "WALK"), transportClass: "BODY", synergyPercent: 40, description: "에어 쿠션으로 쾌적한 조깅" },
    { name: "트레일 블레이저", imageEmoji: "🏔️", rarity: "RARE", nftType: "VEHICLE", priceMc: 1200, maxSupply: 100, scBonusPercent: 45, matchedTransports: transports("RUN"),        transportClass: "BODY", synergyPercent: 45, description: "트레일 러닝의 개척자" },
    { name: "스피드 스타",     imageEmoji: "⚡", rarity: "RARE", nftType: "VEHICLE", priceMc: 1200, maxSupply: 100, scBonusPercent: 45, matchedTransports: transports("RUN"),        transportClass: "BODY", synergyPercent: 45, description: "스피드에 특화된 경량 러닝화" },
    { name: "카본 사이클러",   imageEmoji: "🚴", rarity: "RARE", nftType: "VEHICLE", priceMc: 1000, maxSupply: 100, scBonusPercent: 40, matchedTransports: transports("BIKE"),       transportClass: "ECO",  synergyPercent: 40, description: "카본 솔의 사이클링 슈즈" },
    { name: "일렉트릭 글라이더", imageEmoji: "⚡", rarity: "RARE", nftType: "VEHICLE", priceMc: 1100, maxSupply: 100, scBonusPercent: 42, matchedTransports: transports("SCOOTER", "BIKE"), transportClass: "ECO", synergyPercent: 42, description: "전동 이동수단에 최적화된 슈즈" },
    { name: "커뮤터 프로",     imageEmoji: "🚇", rarity: "RARE", nftType: "VEHICLE", priceMc: 1000, maxSupply: 100, scBonusPercent: 38, matchedTransports: transports("BUS", "TRAIN"), transportClass: "RIDE", synergyPercent: 38, description: "대중교통 통근자를 위한 스마트 슈즈" },
    { name: "울트라 워커",     imageEmoji: "🦶", rarity: "RARE", nftType: "VEHICLE", priceMc: 1200, maxSupply: 100, scBonusPercent: 50, matchedTransports: transports("WALK"),       transportClass: "BODY", synergyPercent: 50, description: "워킹 특화 울트라 쿠셔닝" },
    { name: "나이트 러너",     imageEmoji: "🌙", rarity: "RARE", nftType: "VEHICLE", priceMc: 1100, maxSupply: 100, scBonusPercent: 42, matchedTransports: transports("RUN", "WALK"), transportClass: "BODY", synergyPercent: 42, description: "야간 러닝을 위한 반사 소재 슈즈" },
    { name: "레인 트레이서",   imageEmoji: "🌧️", rarity: "RARE", nftType: "VEHICLE", priceMc: 1100, maxSupply: 100, scBonusPercent: 43, matchedTransports: transports("RUN", "WALK"), transportClass: "BODY", synergyPercent: 43, description: "우천 시에도 안정적인 그립의 방수 슈즈" },
    { name: "에코 크루저",     imageEmoji: "🌿", rarity: "RARE", nftType: "VEHICLE", priceMc: 1100, maxSupply: 100, scBonusPercent: 42, matchedTransports: transports("BIKE", "SCOOTER"), transportClass: "ECO", synergyPercent: 42, description: "친환경 이동수단 시너지 극대화" },

    // EPIC SHOES (8) - 50 each
    { name: "하이퍼 스프린트", imageEmoji: "💥", rarity: "EPIC", nftType: "VEHICLE", priceMc: 4000, maxSupply: 50, scBonusPercent: 85, matchedTransports: transports("RUN"),              transportClass: "BODY", synergyPercent: 85, description: "폭발적 스프린트를 위한 최상급 러닝화" },
    { name: "울트라부스트 엘리트", imageEmoji: "🔥", rarity: "EPIC", nftType: "VEHICLE", priceMc: 3500, maxSupply: 50, scBonusPercent: 80, matchedTransports: transports("RUN", "WALK"), transportClass: "BODY", synergyPercent: 80, description: "부스트 폼의 엘리트 퍼포먼스 슈즈" },
    { name: "에어로 카본",     imageEmoji: "🖤", rarity: "EPIC", nftType: "VEHICLE", priceMc: 3500, maxSupply: 50, scBonusPercent: 75, matchedTransports: transports("BIKE", "SCOOTER"), transportClass: "ECO", synergyPercent: 75, description: "에어로 다이나믹 카본 라이딩 슈즈" },
    { name: "올터레인 X",      imageEmoji: "🌐", rarity: "EPIC", nftType: "VEHICLE", priceMc: 3000, maxSupply: 50, scBonusPercent: 70, matchedTransports: transports("RUN", "WALK", "BIKE"), transportClass: "BODY", synergyPercent: 70, description: "모든 지형에 대응하는 만능 슈즈" },
    { name: "메트로 익스프레스", imageEmoji: "🚄", rarity: "EPIC", nftType: "VEHICLE", priceMc: 3500, maxSupply: 50, scBonusPercent: 75, matchedTransports: transports("BUS", "TRAIN", "CAR"), transportClass: "RIDE", synergyPercent: 75, description: "대중교통 특화 프리미엄 슈즈" },
    { name: "스톰 러너",       imageEmoji: "⛈️", rarity: "EPIC", nftType: "VEHICLE", priceMc: 4500, maxSupply: 50, scBonusPercent: 90, matchedTransports: transports("RUN"),              transportClass: "BODY", synergyPercent: 90, description: "폭풍 속에서도 달리는 최강의 러닝화" },
    { name: "던 브레이커",     imageEmoji: "🌅", rarity: "EPIC", nftType: "VEHICLE", priceMc: 4000, maxSupply: 50, scBonusPercent: 85, matchedTransports: transports("RUN", "WALK"),      transportClass: "BODY", synergyPercent: 85, description: "새벽을 깨우는 자의 슈즈" },
    { name: "크로스 트레이너", imageEmoji: "🎯", rarity: "EPIC", nftType: "VEHICLE", priceMc: 3200, maxSupply: 50, scBonusPercent: 72, matchedTransports: transports("RUN", "WALK", "SCOOTER"), transportClass: "BODY", synergyPercent: 72, description: "크로스핏 스타일의 멀티 퍼포먼스" },

    // LEGENDARY SHOES (3) - 10 each
    { name: "인피니티 스트라이드", imageEmoji: "♾️", rarity: "LEGENDARY", nftType: "VEHICLE", priceMc: 20000, maxSupply: 10, scBonusPercent: 160, matchedTransports: transports("RUN", "WALK", "BIKE", "SCOOTER", "BUS", "TRAIN", "CAR"), transportClass: "BODY", synergyPercent: 160, description: "무한한 보폭. 모든 이동수단과 완벽 시너지" },
    { name: "제로 그래비티",       imageEmoji: "🕊️", rarity: "LEGENDARY", nftType: "VEHICLE", priceMc: 18000, maxSupply: 10, scBonusPercent: 180, matchedTransports: transports("RUN"),                                              transportClass: "BODY", synergyPercent: 180, description: "중력을 무시하는 궁극의 러닝화" },
    { name: "오메가 하이브리드",   imageEmoji: "🌈", rarity: "LEGENDARY", nftType: "VEHICLE", priceMc: 18000, maxSupply: 10, scBonusPercent: 150, matchedTransports: transports("RUN", "WALK", "BIKE", "SCOOTER"),                     transportClass: "BODY", synergyPercent: 150, description: "BODY+ECO 하이브리드 궁극 슈즈" },

    // ============================================================
    // VEHICLE - BIKES/SCOOTERS/TRANSIT (9) - Transport vehicles
    // ============================================================

    // COMMON VEHICLES (3) - unlimited
    { name: "시티 바이크",       imageEmoji: "🚲", rarity: "COMMON", nftType: "VEHICLE", priceMc: 300, maxSupply: -1, scBonusPercent: 16, matchedTransports: transports("BIKE"),         transportClass: "ECO",  synergyPercent: 16, description: "도심 자전거 라이딩의 기본" },
    { name: "전동 킥보드 베이직", imageEmoji: "🛴", rarity: "COMMON", nftType: "VEHICLE", priceMc: 300, maxSupply: -1, scBonusPercent: 16, matchedTransports: transports("SCOOTER"),      transportClass: "ECO",  synergyPercent: 16, description: "기본형 전동 킥보드" },
    { name: "교통카드",          imageEmoji: "💳", rarity: "COMMON", nftType: "VEHICLE", priceMc: 280, maxSupply: -1, scBonusPercent: 14, matchedTransports: transports("BUS", "TRAIN"), transportClass: "RIDE", synergyPercent: 14, description: "대중교통 기본 패스" },

    // RARE VEHICLES (3) - 100 each
    { name: "카본 로드바이크", imageEmoji: "🚴‍♂️", rarity: "RARE", nftType: "VEHICLE", priceMc: 1100, maxSupply: 100, scBonusPercent: 42, matchedTransports: transports("BIKE"),              transportClass: "ECO",  synergyPercent: 42, description: "카본 프레임 프리미엄 로드바이크" },
    { name: "터보 스쿠터",     imageEmoji: "🏍️",  rarity: "RARE", nftType: "VEHICLE", priceMc: 1000, maxSupply: 100, scBonusPercent: 40, matchedTransports: transports("SCOOTER"),          transportClass: "ECO",  synergyPercent: 40, description: "터보 충전 고성능 전동 스쿠터" },
    { name: "프리미엄 패스",   imageEmoji: "🎫",  rarity: "RARE", nftType: "VEHICLE", priceMc: 1000, maxSupply: 100, scBonusPercent: 38, matchedTransports: transports("BUS", "TRAIN", "CAR"), transportClass: "RIDE", synergyPercent: 38, description: "모든 대중교통+차량 프리미엄 패스" },

    // EPIC VEHICLES (2) - 50 each
    { name: "에어로 TT바이크", imageEmoji: "🚵",  rarity: "EPIC", nftType: "VEHICLE", priceMc: 3800, maxSupply: 50, scBonusPercent: 80, matchedTransports: transports("BIKE", "SCOOTER"),     transportClass: "ECO",  synergyPercent: 80, description: "에어로다이나믹 타임트라이얼 바이크" },
    { name: "퍼스트클래스 패스", imageEmoji: "✈️", rarity: "EPIC", nftType: "VEHICLE", priceMc: 3500, maxSupply: 50, scBonusPercent: 75, matchedTransports: transports("BUS", "TRAIN", "CAR"), transportClass: "RIDE", synergyPercent: 75, description: "퍼스트클래스급 교통 프리미엄 패스" },

    // LEGENDARY VEHICLES (1) - 10 each
    { name: "퀀텀 드라이버",   imageEmoji: "🏎️", rarity: "LEGENDARY", nftType: "VEHICLE", priceMc: 18000, maxSupply: 10, scBonusPercent: 155, matchedTransports: transports("BUS", "TRAIN", "CAR"), transportClass: "RIDE", synergyPercent: 155, description: "양자 엔진의 궁극 탈것. RIDE 클래스 지배" },
  ];

  // Delete existing NFTs and recreate
  await prisma.userNft.deleteMany({});
  await prisma.nftTemplate.deleteMany({});

  let count = 0;
  for (const nft of nftTemplates) {
    await prisma.nftTemplate.create({
      data: {
        name: nft.name,
        imageEmoji: nft.imageEmoji,
        rarity: nft.rarity,
        category: "BADGE", // legacy field
        nftType: nft.nftType,
        priceMc: nft.priceMc,
        maxSupply: nft.maxSupply,
        scBonusPercent: nft.scBonusPercent,
        description: nft.description,
        tier: nft.tier || null,
        slot: nft.slot || null,
        ability: nft.ability || null,
        matchedTransports: nft.matchedTransports || null,
        transportClass: nft.transportClass || null,
        synergyPercent: nft.synergyPercent || 0,
      },
    });
    count++;
  }
  console.log(`Seeded NFT templates: ${count} items`);

  // Summary
  const boosters = nftTemplates.filter(t => t.nftType === "BOOSTER").length;
  const accessories = nftTemplates.filter(t => t.nftType === "ACCESSORY").length;
  const vehicles = nftTemplates.filter(t => t.nftType === "VEHICLE").length;
  const shoes = nftTemplates.filter(t => t.nftType === "VEHICLE" && !["🚲", "🛴", "💳", "🚴‍♂️", "🏍️", "🎫", "🚵", "✈️", "🏎️"].includes(t.imageEmoji)).length;
  console.log(`  Boosters: ${boosters}, Accessories: ${accessories}, Shoes: ${shoes}, Vehicles: ${vehicles - shoes}`);

  // ============================================================
  // === Course Quests (6 courses across 3 categories)
  // ============================================================

  const courseQuests = [
    {
      name: "서울 한강 산책 코스",
      description: "한강변 주요 포인트를 따라 걸으며 서울의 아름다운 풍경을 감상하세요.",
      category: "TOUR",
      estimatedKm: 3.5,
      completionBonus: 150,
      checkpoints: JSON.stringify([
        { name: "여의도 한강공원 입구", lat: 37.5283, lng: 126.9340, address: "서울 영등포구 여의동로 330", rewardSc: 20, radiusM: 100 },
        { name: "63빌딩 전망대 앞", lat: 37.5199, lng: 126.9401, address: "서울 영등포구 63로 50", rewardSc: 25, radiusM: 80 },
        { name: "마포대교 남단", lat: 37.5317, lng: 126.9453, address: "서울 영등포구 여의나루로", rewardSc: 20, radiusM: 100 },
        { name: "여의나루역", lat: 37.5270, lng: 126.9327, address: "서울 영등포구 여의나루로 42", rewardSc: 25, radiusM: 80 },
      ]),
    },
    {
      name: "강남 맛집 투어",
      description: "강남 핫플레이스 맛집 거리를 순회하세요!",
      category: "FOOD",
      estimatedKm: 2.0,
      completionBonus: 120,
      checkpoints: JSON.stringify([
        { name: "강남역 11번 출구", lat: 37.4980, lng: 127.0276, address: "서울 강남구 강남대로 396", rewardSc: 15, radiusM: 80 },
        { name: "가로수길 입구", lat: 37.5186, lng: 127.0231, address: "서울 강남구 신사동 가로수길", rewardSc: 20, radiusM: 80 },
        { name: "압구정 로데오거리", lat: 37.5271, lng: 127.0406, address: "서울 강남구 압구정로 46길", rewardSc: 20, radiusM: 100 },
      ]),
    },
    {
      name: "북촌 한옥마을 탐방",
      description: "전통 한옥마을을 걸으며 한국의 아름다운 전통 건축을 만나보세요.",
      category: "TOUR",
      estimatedKm: 2.5,
      completionBonus: 130,
      checkpoints: JSON.stringify([
        { name: "안국역 1번 출구", lat: 37.5764, lng: 126.9858, address: "서울 종로구 율곡로 지하 59", rewardSc: 15, radiusM: 80 },
        { name: "북촌 8경 첫번째", lat: 37.5828, lng: 126.9850, address: "서울 종로구 북촌로 5길", rewardSc: 25, radiusM: 100 },
        { name: "창덕궁 정문", lat: 37.5794, lng: 126.9910, address: "서울 종로구 율곡로 99", rewardSc: 25, radiusM: 80 },
        { name: "인사동거리", lat: 37.5718, lng: 126.9857, address: "서울 종로구 인사동길", rewardSc: 20, radiusM: 100 },
      ]),
    },
    {
      name: "건강 산책 코스",
      description: "올림픽공원을 한 바퀴 돌며 건강한 하루를 만들어보세요.",
      category: "HEALTH",
      estimatedKm: 4.0,
      completionBonus: 200,
      checkpoints: JSON.stringify([
        { name: "올림픽공원 평화의 문", lat: 37.5208, lng: 127.1155, address: "서울 송파구 올림픽로 424", rewardSc: 25, radiusM: 100 },
        { name: "몽촌토성 산책로", lat: 37.5170, lng: 127.1125, address: "서울 송파구 올림픽로 424", rewardSc: 30, radiusM: 120 },
        { name: "올림픽 조각공원", lat: 37.5190, lng: 127.1210, address: "서울 송파구 올림픽로 424", rewardSc: 25, radiusM: 100 },
        { name: "들꽃마루 정원", lat: 37.5225, lng: 127.1180, address: "서울 송파구 올림픽로 424", rewardSc: 30, radiusM: 100 },
        { name: "올림픽공원 정문", lat: 37.5210, lng: 127.1160, address: "서울 송파구 올림픽로 424", rewardSc: 20, radiusM: 80 },
      ]),
    },
    {
      name: "홍대 카페 투어",
      description: "홍대입구부터 연남동까지 유명 카페들을 방문하세요.",
      category: "FOOD",
      estimatedKm: 1.8,
      completionBonus: 100,
      checkpoints: JSON.stringify([
        { name: "홍대입구역 9번 출구", lat: 37.5572, lng: 126.9241, address: "서울 마포구 양화로 160", rewardSc: 15, radiusM: 80 },
        { name: "걷고싶은거리", lat: 37.5556, lng: 126.9263, address: "서울 마포구 어울마당로", rewardSc: 20, radiusM: 100 },
        { name: "연남동 경의선 숲길", lat: 37.5619, lng: 126.9252, address: "서울 마포구 연남동", rewardSc: 25, radiusM: 100 },
      ]),
    },
    {
      name: "남산 둘레길",
      description: "남산타워를 중심으로 도심 속 자연을 즐기세요.",
      category: "HEALTH",
      estimatedKm: 5.0,
      completionBonus: 250,
      checkpoints: JSON.stringify([
        { name: "남산 순환버스 정류장", lat: 37.5512, lng: 126.9882, address: "서울 중구 소파로 83", rewardSc: 20, radiusM: 100 },
        { name: "남산 북측 순환로", lat: 37.5568, lng: 126.9850, address: "서울 중구 남산공원길", rewardSc: 30, radiusM: 120 },
        { name: "N서울타워", lat: 37.5512, lng: 126.9882, address: "서울 용산구 남산공원길 105", rewardSc: 35, radiusM: 80 },
        { name: "남산 남측 산책로", lat: 37.5470, lng: 126.9900, address: "서울 용산구 남산공원길", rewardSc: 30, radiusM: 120 },
        { name: "한양도성 둘레길", lat: 37.5490, lng: 126.9920, address: "서울 중구 동호로", rewardSc: 25, radiusM: 100 },
        { name: "충무로역", lat: 37.5612, lng: 126.9944, address: "서울 중구 퇴계로 지하 180", rewardSc: 20, radiusM: 80 },
      ]),
    },
  ];

  await prisma.courseAttempt.deleteMany({});
  await prisma.courseQuest.deleteMany({});
  for (const course of courseQuests) {
    await prisma.courseQuest.create({ data: course });
  }
  console.log(`Seeded course quests: ${courseQuests.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

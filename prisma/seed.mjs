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

  // === Store Items: In-App Items (SC/MC) ===
  const inAppItems = [
    { category: "IN_APP", name: "보호막", description: "스트라이드 보호막 1개", price: 100, coinType: "MC", imageUrl: "🛡️", metadata: JSON.stringify({ type: "SHIELD" }) },
    { category: "IN_APP", name: "보호막 3개 묶음", description: "스트라이드 보호막 3개 (할인)", price: 250, coinType: "MC", imageUrl: "🛡️", metadata: JSON.stringify({ type: "SHIELD", quantity: 3 }) },
    { category: "IN_APP", name: "SC 부스터 (2시간)", description: "2시간 동안 SC 1.5배 획득", price: 200, coinType: "MC", imageUrl: "⚡", metadata: JSON.stringify({ type: "SC_BOOST", duration: 7200, multiplier: 1.5 }) },
    { category: "IN_APP", name: "프로필 뱃지", description: "특별한 프로필 뱃지", price: 500, coinType: "SC", imageUrl: "🏅", metadata: JSON.stringify({ type: "BADGE" }) },
    { category: "IN_APP", name: "프리미엄 테마", description: "앱 프리미엄 테마 (영구)", price: 300, coinType: "MC", imageUrl: "🎨", metadata: JSON.stringify({ type: "THEME" }) },
  ];

  // Delete existing store items and recreate
  await prisma.storeItem.deleteMany({});
  for (const item of [...healthFoods, ...inAppItems]) {
    await prisma.storeItem.create({ data: item });
  }
  console.log("Seeded store items:", healthFoods.length + inAppItems.length);

  // === Quiz Questions (12 questions) ===
  const quizQuestions = [
    {
      question: "성인 기준 하루 권장 걸음 수는 몇 보일까요?",
      options: JSON.stringify(["5,000보", "8,000보", "10,000보", "15,000보"]),
      correctIndex: 2,
      explanation: "WHO는 하루 10,000보를 권장하고 있습니다.",
      category: "HEALTH",
    },
    {
      question: "다음 중 단백질이 가장 많은 식품은?",
      options: JSON.stringify(["두부 100g", "닭가슴살 100g", "계란 1개", "우유 200ml"]),
      correctIndex: 1,
      explanation: "닭가슴살 100g에는 약 31g의 단백질이 포함되어 있습니다.",
      category: "NUTRITION",
    },
    {
      question: "유산소 운동의 효과가 아닌 것은?",
      options: JSON.stringify(["심폐기능 향상", "체지방 감소", "근비대 효과", "스트레스 해소"]),
      correctIndex: 2,
      explanation: "근비대(근육 크기 증가)는 주로 저항 운동(웨이트)의 효과입니다.",
      category: "FITNESS",
    },
    {
      question: "하루 권장 수분 섭취량은 약 얼마일까요?",
      options: JSON.stringify(["500ml", "1L", "2L", "4L"]),
      correctIndex: 2,
      explanation: "일반 성인의 하루 권장 수분 섭취량은 약 2리터입니다.",
      category: "HEALTH",
    },
    {
      question: "BMI(체질량지수) 계산 공식은?",
      options: JSON.stringify(["체중(kg) / 신장(m)", "체중(kg) / 신장(m)²", "신장(m) / 체중(kg)", "체중(kg) × 신장(m)"]),
      correctIndex: 1,
      explanation: "BMI = 체중(kg) ÷ 신장(m)의 제곱으로 계산합니다.",
      category: "HEALTH",
    },
    {
      question: "걷기 운동 시 가장 좋은 자세는?",
      options: JSON.stringify(["고개를 숙이고 걷기", "팔을 크게 흔들며 걷기", "등을 펴고 시선은 전방", "최대한 빠르게 걷기"]),
      correctIndex: 2,
      explanation: "등을 펴고 시선은 전방 10~15m를 바라보며 걷는 것이 이상적입니다.",
      category: "FITNESS",
    },
    {
      question: "비타민 D를 자연적으로 합성하려면?",
      options: JSON.stringify(["물을 많이 마시면", "햇빛을 쬐면", "채소를 먹으면", "충분히 자면"]),
      correctIndex: 1,
      explanation: "피부가 자외선(UVB)에 노출되면 비타민 D가 합성됩니다.",
      category: "NUTRITION",
    },
    {
      question: "스트레칭의 효과가 아닌 것은?",
      options: JSON.stringify(["유연성 향상", "부상 예방", "근력 강화", "혈액순환 개선"]),
      correctIndex: 2,
      explanation: "근력 강화는 저항 운동의 효과이며, 스트레칭은 유연성과 혈류 개선에 도움됩니다.",
      category: "FITNESS",
    },
    {
      question: "하루 중 가장 체온이 높은 시간대는?",
      options: JSON.stringify(["오전 6시", "오후 2~4시", "오후 6~8시", "밤 10시"]),
      correctIndex: 2,
      explanation: "체온은 보통 오후 6~8시경에 가장 높으며, 이 시간대 운동 효율이 좋습니다.",
      category: "HEALTH",
    },
    {
      question: "건강한 성인의 안정 시 심박수 범위는?",
      options: JSON.stringify(["40~50bpm", "60~100bpm", "100~120bpm", "120~140bpm"]),
      correctIndex: 1,
      explanation: "일반적인 성인의 안정 시 심박수는 60~100bpm입니다.",
      category: "HEALTH",
    },
    {
      question: "식이섬유가 가장 풍부한 식품은?",
      options: JSON.stringify(["흰쌀밥", "고구마", "귀리", "두부"]),
      correctIndex: 2,
      explanation: "귀리는 100g당 약 10g의 식이섬유를 포함하고 있습니다.",
      category: "NUTRITION",
    },
    {
      question: "근육통이 생기는 주된 이유는?",
      options: JSON.stringify(["근섬유의 미세한 손상", "뼈의 약화", "관절 마모", "혈압 상승"]),
      correctIndex: 0,
      explanation: "운동 후 근육통(DOMS)은 근섬유의 미세 손상에 따른 염증 반응입니다.",
      category: "FITNESS",
    },
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

  // === NFT Templates (10 templates) ===
  const nftTemplates = [
    { name: "첫걸음 뱃지",    imageEmoji: "👟", rarity: "COMMON",    category: "BADGE",     priceMc: 50,   maxSupply: -1, scBonusPercent: 5,  description: "모든 여정의 시작" },
    { name: "러너 뱃지",      imageEmoji: "🏃", rarity: "COMMON",    category: "BADGE",     priceMc: 80,   maxSupply: -1, scBonusPercent: 5,  description: "달리는 자의 상징" },
    { name: "에너지 드링크",  imageEmoji: "🧃", rarity: "COMMON",    category: "BADGE",     priceMc: 60,   maxSupply: -1, scBonusPercent: 5,  description: "에너지 충전!" },
    { name: "스텝 고양이",    imageEmoji: "🐱", rarity: "RARE",      category: "CHARACTER", priceMc: 150,  maxSupply: 100, scBonusPercent: 10, description: "함께 걷는 고양이 친구" },
    { name: "스텝 강아지",    imageEmoji: "🐕", rarity: "RARE",      category: "CHARACTER", priceMc: 150,  maxSupply: 100, scBonusPercent: 10, description: "함께 뛰는 강아지 친구" },
    { name: "한강 러닝",      imageEmoji: "🌉", rarity: "RARE",      category: "LANDSCAPE", priceMc: 200,  maxSupply: 50,  scBonusPercent: 10, description: "한강변의 아름다운 야경" },
    { name: "골든 러너",      imageEmoji: "🏅", rarity: "EPIC",      category: "BADGE",     priceMc: 400,  maxSupply: 30,  scBonusPercent: 20, description: "금빛으로 빛나는 러너" },
    { name: "벚꽃길 산책",    imageEmoji: "🌸", rarity: "EPIC",      category: "LANDSCAPE", priceMc: 500,  maxSupply: 20,  scBonusPercent: 20, description: "봄날의 벚꽃길" },
    { name: "다이아 워커",    imageEmoji: "💎", rarity: "LEGENDARY", category: "BADGE",     priceMc: 1000, maxSupply: 10,  scBonusPercent: 30, description: "다이아몬드처럼 빛나는 워커" },
    { name: "유니콘 러너",    imageEmoji: "🦄", rarity: "LEGENDARY", category: "CHARACTER", priceMc: 1500, maxSupply: 5,   scBonusPercent: 30, description: "전설의 유니콘과 함께" },
  ];

  await prisma.userNft.deleteMany({});
  await prisma.nftTemplate.deleteMany({});
  for (const nft of nftTemplates) {
    await prisma.nftTemplate.create({ data: nft });
  }
  console.log("Seeded NFT templates:", nftTemplates.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// 환율: 1만원 = 200 SC

async function main() {
  // 기존 건강식품 삭제
  await prisma.storeItem.deleteMany({ where: { category: "HEALTH_FOOD" } });
  console.log("Deleted existing health food items");

  // 한국인 선호 건강식품 TOP 20 (실제 시장가 기반, 1만원 = 200 SC)
  const healthFoods = [
    {
      category: "HEALTH_FOOD",
      name: "6년근 홍삼 정과 스틱",
      description: "정관장 홍삼정 에브리타임 10ml x 30포. 피로회복·면역력 증진. 6년근 홍삼 농축액 스틱.",
      price: 1500, // 시장가 약 75,000원
      coinType: "SC",
      imageUrl: "🫚",
      metadata: JSON.stringify({ qr_type: "food", weight: "10ml x 30포", brand: "정관장", marketPrice: 75000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "종합비타민 멀티팩",
      description: "센트룸 멀티비타민 미네랄 90정. 13종 비타민 + 11종 미네랄. 하루 1정 영양 관리.",
      price: 500, // 시장가 약 25,000원
      coinType: "SC",
      imageUrl: "💊",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "90정(3개월분)", brand: "센트룸", marketPrice: 25000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "프로바이오틱스 유산균",
      description: "종근당건강 락토핏 골드 50포. 프로바이오틱스 100억 CFU + 프리바이오틱스. 장 건강.",
      price: 200, // 시장가 약 10,000원
      coinType: "SC",
      imageUrl: "🦠",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "2g x 50포", brand: "종근당건강", marketPrice: 10000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "오메가3 rTG 알티지",
      description: "뉴트리디데이 프리미엄 오메가3 rTG 60캡슐. EPA+DHA 1,000mg. 혈행·기억력 개선.",
      price: 560, // 시장가 약 28,000원
      coinType: "SC",
      imageUrl: "🐟",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "60캡슐(2개월분)", brand: "뉴트리디데이", marketPrice: 28000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "비타민C 1000mg",
      description: "고려은단 비타민C 1000 180정. 항산화·피부건강·면역기능 강화. 영국산 비타민C.",
      price: 440, // 시장가 약 22,000원
      coinType: "SC",
      imageUrl: "🍋",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "180정(6개월분)", brand: "고려은단", marketPrice: 22000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "비타민D 5000IU",
      description: "나우푸드 비타민D3 5000IU 120소프트젤. 칼슘 흡수·뼈 건강·면역력 증진.",
      price: 300, // 시장가 약 15,000원
      coinType: "SC",
      imageUrl: "☀️",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "120소프트젤(4개월분)", brand: "나우푸드", marketPrice: 15000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "가르시니아 다이어트",
      description: "GNM자연의품격 가르시니아 컷 60정. HCA 함유. 탄수화물 억제·체지방 감소.",
      price: 360, // 시장가 약 18,000원
      coinType: "SC",
      imageUrl: "🔥",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "60정(1개월분)", brand: "GNM", marketPrice: 18000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "프로틴 쉐이크 파우더",
      description: "마이프로틴 임팩트 웨이프로틴 1kg. 1회 단백질 21g. 근력 운동 후 회복.",
      price: 700, // 시장가 약 35,000원
      coinType: "SC",
      imageUrl: "🥤",
      metadata: JSON.stringify({ qr_type: "food", weight: "1kg", brand: "마이프로틴", marketPrice: 35000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "당귀추출물 여성건강",
      description: "동국제약 훼라민Q 60정. 당귀추출물 함유. 여성 갱년기·혈행 개선.",
      price: 440, // 시장가 약 22,000원
      coinType: "SC",
      imageUrl: "🌿",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "60정(1개월분)", brand: "동국제약", marketPrice: 22000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "저분자 피쉬콜라겐",
      description: "뉴트리원 저분자 피쉬콜라겐 펩타이드 90포. 1,500Da 저분자. 피부 보습·탄력.",
      price: 700, // 시장가 약 35,000원
      coinType: "SC",
      imageUrl: "✨",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "2g x 90포(3개월분)", brand: "뉴트리원", marketPrice: 35000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "밀크씨슬 간건강",
      description: "종근당 밀크씨슬 에스 60정. 실리마린 함유. 간 건강·피로감 개선.",
      price: 240, // 시장가 약 12,000원
      coinType: "SC",
      imageUrl: "🌸",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "60정(2개월분)", brand: "종근당", marketPrice: 12000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "프로폴리스 스프레이",
      description: "고려은단 프로폴리스 스프레이 30ml. 플라보노이드 함유. 구강 항균·면역력 증진.",
      price: 300, // 시장가 약 15,000원
      coinType: "SC",
      imageUrl: "🍯",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "30ml", brand: "고려은단", marketPrice: 15000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "루테인 지아잔틴",
      description: "안국건강 루테인 지아잔틴 미니 60캡슐. 마리골드꽃 추출. 눈 건강·황반색소밀도 유지.",
      price: 360, // 시장가 약 18,000원
      coinType: "SC",
      imageUrl: "👁️",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "60캡슐(2개월분)", brand: "안국건강", marketPrice: 18000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "마그네슘 400",
      description: "닥터린 마그네슘 400 90정. 산화마그네슘 400mg. 에너지 대사·근육 이완·신경 기능.",
      price: 240, // 시장가 약 12,000원
      coinType: "SC",
      imageUrl: "⚡",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "90정(3개월분)", brand: "닥터린", marketPrice: 12000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "아연 셀레늄 플러스",
      description: "대웅제약 아연 셀레늄 플러스 90정. 면역기능·항산화·정상 세포분열.",
      price: 200, // 시장가 약 10,000원
      coinType: "SC",
      imageUrl: "🛡️",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "90정(3개월분)", brand: "대웅제약", marketPrice: 10000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "철분 헤모글로빈",
      description: "동아제약 철분이 필요한 순간 60정. 헴철 함유. 철 결핍 개선·에너지 생성.",
      price: 240, // 시장가 약 12,000원
      coinType: "SC",
      imageUrl: "🩸",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "60정(2개월분)", brand: "동아제약", marketPrice: 12000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "칼슘 마그네슘 비타민D",
      description: "뉴트리디데이 칼마디 120정. 칼슘+마그네슘+비타민D 복합. 뼈 건강·골다공증 예방.",
      price: 300, // 시장가 약 15,000원
      coinType: "SC",
      imageUrl: "🦴",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "120정(2개월분)", brand: "뉴트리디데이", marketPrice: 15000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "글루코사민 관절건강",
      description: "일양약품 관절팔팔 글루코사민 90정. N-아세틸글루코사민 함유. 관절·연골 건강 유지.",
      price: 600, // 시장가 약 30,000원
      coinType: "SC",
      imageUrl: "🦵",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "90정(1개월분)", brand: "일양약품", marketPrice: 30000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "코엔자임Q10 100mg",
      description: "네이처메이드 코엔자임Q10 100mg 60소프트젤. 항산화·혈압 건강·세포 에너지 생성.",
      price: 500, // 시장가 약 25,000원
      coinType: "SC",
      imageUrl: "❤️",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "60소프트젤(2개월분)", brand: "네이처메이드", marketPrice: 25000 }),
    },
    {
      category: "HEALTH_FOOD",
      name: "남극 크릴오일",
      description: "뉴트리디데이 프리미엄 크릴오일 60캡슐. 인지질 결합 오메가3. 혈중 중성지질·혈행 개선.",
      price: 600, // 시장가 약 30,000원
      coinType: "SC",
      imageUrl: "🦐",
      metadata: JSON.stringify({ qr_type: "supplement", weight: "60캡슐(2개월분)", brand: "뉴트리디데이", marketPrice: 30000 }),
    },
  ];

  for (const item of healthFoods) {
    await prisma.storeItem.create({ data: item });
  }

  console.log(`\nSeeded ${healthFoods.length} health food items (TOP 20)`);
  console.log("환율: 1만원 = 200 SC\n");
  console.log("가격표:");
  for (const item of healthFoods) {
    const meta = JSON.parse(item.metadata);
    console.log(`  ${item.name.padEnd(20)} ${String(item.price).padStart(5)} SC  (시장가 ${meta.marketPrice.toLocaleString()}원)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

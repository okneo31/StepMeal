import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
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

  // Upsert: delete existing and recreate
  const existing = await prisma.courseQuest.count();
  if (existing === 0) {
    for (const course of courseQuests) {
      await prisma.courseQuest.create({ data: course });
    }
    console.log(`Created ${courseQuests.length} course quests`);
  } else {
    console.log(`Course quests already exist (${existing}), skipping.`);
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

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const themes = [
  {
    name: "미드나잇 골드 테마",
    description: "럭셔리한 골드와 블랙의 프리미엄 테마",
    price: 300,
    metadata: JSON.stringify({ type: "THEME", themeId: "midnight-gold" }),
  },
  {
    name: "로즈 쿼츠 테마",
    description: "우아하고 부드러운 핑크 로즈 테마",
    price: 300,
    metadata: JSON.stringify({ type: "THEME", themeId: "rose-quartz" }),
  },
  {
    name: "오션 어비스 테마",
    description: "깊은 심해의 시안 블루 테마",
    price: 400,
    metadata: JSON.stringify({ type: "THEME", themeId: "ocean-abyss" }),
  },
  {
    name: "오로라 보레알리스 테마",
    description: "몽환적인 바이올렛 오로라 테마",
    price: 400,
    metadata: JSON.stringify({ type: "THEME", themeId: "aurora" }),
  },
  {
    name: "크림슨 옵시디언 테마",
    description: "강렬한 레드와 옵시디언 블랙 테마",
    price: 500,
    metadata: JSON.stringify({ type: "THEME", themeId: "crimson-obsidian" }),
  },
];

async function main() {
  console.log("Seeding premium themes...");

  for (const theme of themes) {
    // Check if already exists by name
    const existing = await prisma.storeItem.findFirst({
      where: { name: theme.name },
    });

    if (existing) {
      console.log(`  Skip (exists): ${theme.name}`);
      continue;
    }

    await prisma.storeItem.create({
      data: {
        category: "IN_APP",
        name: theme.name,
        description: theme.description,
        price: theme.price,
        coinType: "MC",
        stock: -1,
        metadata: theme.metadata,
        isActive: true,
      },
    });

    console.log(`  Created: ${theme.name} (${theme.price} MC)`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

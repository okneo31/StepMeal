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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

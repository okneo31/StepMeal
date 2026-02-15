-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "nickname" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'credentials',
    "providerId" TEXT,
    "weight" REAL NOT NULL DEFAULT 70,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CoinBalance" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "scBalance" INTEGER NOT NULL DEFAULT 0,
    "mcBalance" INTEGER NOT NULL DEFAULT 0,
    "scLifetime" INTEGER NOT NULL DEFAULT 0,
    "mcLifetime" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoinBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stride" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "strideLevel" INTEGER NOT NULL DEFAULT 0,
    "strideMultiplier" REAL NOT NULL DEFAULT 1.0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActive" DATETIME,
    "shieldCount" INTEGER NOT NULL DEFAULT 0,
    "totalDistance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startLat" REAL,
    "startLng" REAL,
    "endLat" REAL,
    "endLng" REAL,
    "distanceM" INTEGER NOT NULL DEFAULT 0,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "segments" TEXT NOT NULL DEFAULT '[]',
    "transportClass" TEXT,
    "isMulti" BOOLEAN NOT NULL DEFAULT false,
    "multiClassCount" INTEGER NOT NULL DEFAULT 1,
    "weather" TEXT,
    "timeSlot" TEXT,
    "calories" REAL NOT NULL DEFAULT 0,
    "baseSc" INTEGER NOT NULL DEFAULT 0,
    "transportMult" REAL NOT NULL DEFAULT 1.0,
    "strideMult" REAL NOT NULL DEFAULT 1.0,
    "timeMult" REAL NOT NULL DEFAULT 1.0,
    "weatherMult" REAL NOT NULL DEFAULT 1.0,
    "multiMult" REAL NOT NULL DEFAULT 1.0,
    "bonusSc" INTEGER NOT NULL DEFAULT 0,
    "totalSc" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Movement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoinTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "coinType" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "description" TEXT,
    "multipliers" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoinTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoinTransaction_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Movement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyEarning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "earnDate" DATETIME NOT NULL,
    "scMovement" INTEGER NOT NULL DEFAULT 0,
    "scSocial" INTEGER NOT NULL DEFAULT 0,
    "scChallenge" INTEGER NOT NULL DEFAULT 0,
    "scCheckin" INTEGER NOT NULL DEFAULT 0,
    "mcQr" INTEGER NOT NULL DEFAULT 0,
    "mcGame" INTEGER NOT NULL DEFAULT 0,
    "distanceM" INTEGER NOT NULL DEFAULT 0,
    "strideActive" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DailyEarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Movement_userId_createdAt_idx" ON "Movement"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CoinTransaction_userId_coinType_createdAt_idx" ON "CoinTransaction"("userId", "coinType", "createdAt");

-- CreateIndex
CREATE INDEX "DailyEarning_userId_earnDate_idx" ON "DailyEarning"("userId", "earnDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyEarning_userId_earnDate_key" ON "DailyEarning"("userId", "earnDate");

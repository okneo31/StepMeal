import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QR_SCAN_DAILY_LIMIT } from "@/lib/constants";
import { getBoosterMultiplier, BOOSTER_DURATION_HOURS } from "@/lib/booster-config";

const PARTNER_API_URL = process.env.PARTNER_API_URL || "https://qr.stepmeal.top/api/verify.php";

interface PartnerVerifyResponse {
  success: boolean;
  mc_reward?: number;
  condition_restore?: number;
  product_name?: string;
  qr_type?: string;
  error?: string;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = (await req.json()) as { code: string };

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "QR코드가 유효하지 않습니다." },
        { status: 400 }
      );
    }

    const trimmedCode = code.trim();

    // 1. Call partner portal verify API
    let partnerResult: PartnerVerifyResponse;
    try {
      const res = await fetch(PARTNER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: trimmedCode,
          user_id: session.user.id,
        }),
      });
      partnerResult = (await res.json()) as PartnerVerifyResponse;
    } catch {
      // Partner API unreachable - fall back to local DB
      return await localScan(trimmedCode, session.user.id);
    }

    if (!partnerResult.success) {
      const errorMap: Record<string, { msg: string; status: number }> = {
        invalid_code: { msg: "유효하지 않은 QR코드입니다.", status: 400 },
        code_not_found: { msg: "존재하지 않는 QR코드입니다.", status: 404 },
        expired: { msg: "만료된 QR코드입니다.", status: 410 },
        batch_disabled: { msg: "비활성화된 QR코드입니다.", status: 410 },
        already_used: { msg: "이미 사용된 QR코드입니다.", status: 409 },
        daily_limit: { msg: "일일 사용 한도를 초과했습니다.", status: 429 },
        missing_code: { msg: "QR코드가 비어있습니다.", status: 400 },
      };
      const err = errorMap[partnerResult.error || ""] || {
        msg: "QR 인증에 실패했습니다.",
        status: 400,
      };
      return NextResponse.json({ error: err.msg }, { status: err.status });
    }

    // 2. Partner verified - credit MC to user
    const mcReward = partnerResult.mc_reward || 0;
    const conditionRestore = partnerResult.condition_restore || 0;
    const productName = partnerResult.product_name || "QR 스캔";

    const result = await prisma.$transaction(async (tx) => {
      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayScans = await tx.coinTransaction.count({
        where: {
          userId: session.user.id,
          sourceType: "QR_SCAN",
          createdAt: { gte: today },
        },
      });

      if (todayScans >= QR_SCAN_DAILY_LIMIT) {
        throw new Error(
          `LIMIT:일일 QR 스캔 한도(${QR_SCAN_DAILY_LIMIT}회)를 초과했습니다.`
        );
      }

      // Credit MC
      const balance = await tx.coinBalance.update({
        where: { userId: session.user.id },
        data: {
          mcBalance: { increment: mcReward },
          mcLifetime: { increment: mcReward },
        },
      });

      // Transaction record
      await tx.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "MC",
          amount: mcReward,
          balanceAfter: balance.mcBalance,
          sourceType: "QR_SCAN",
          description: `${productName} QR 스캔 (+${mcReward} MC)`,
        },
      });

      // Update daily earning
      const earnDate = new Date();
      earnDate.setHours(0, 0, 0, 0);
      await tx.dailyEarning.upsert({
        where: {
          userId_earnDate: { userId: session.user.id, earnDate },
        },
        create: { userId: session.user.id, earnDate, mcQr: mcReward },
        update: { mcQr: { increment: mcReward } },
      });

      // Restore character condition if applicable
      if (conditionRestore > 0) {
        const character = await tx.character.findUnique({
          where: { userId: session.user.id },
        });
        if (character) {
          const newCondition = Math.min(
            character.maxCondition,
            character.condition + conditionRestore
          );
          await tx.character.update({
            where: { userId: session.user.id },
            data: { condition: newCondition },
          });
        }
      }

      // Activate SC booster (24h)
      const { multiplier: boostMult, boosterType } = getBoosterMultiplier(partnerResult.qr_type);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + BOOSTER_DURATION_HOURS * 60 * 60 * 1000);

      // Upsert: overwrite existing booster
      const existingBooster = await tx.activeBooster.findFirst({
        where: { userId: session.user.id, expiresAt: { gt: now } },
        orderBy: { activatedAt: "desc" },
      });

      if (existingBooster) {
        await tx.activeBooster.update({
          where: { id: existingBooster.id },
          data: { boosterType, multiplier: boostMult, productName, activatedAt: now, expiresAt },
        });
      } else {
        await tx.activeBooster.create({
          data: { userId: session.user.id, boosterType, multiplier: boostMult, productName, activatedAt: now, expiresAt },
        });
      }

      return { balance, boosterMult: boostMult, boosterType };
    }, { timeout: 15000 });

    return NextResponse.json({
      success: true,
      mcReward,
      description: `${productName} (+${mcReward} MC)`,
      newMcBalance: result.balance.mcBalance,
      conditionRestore,
      qrType: partnerResult.qr_type,
      booster: {
        activated: true,
        multiplier: result.boosterMult,
        type: result.boosterType,
        durationHours: BOOSTER_DURATION_HOURS,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    if (message.startsWith("LIMIT:")) {
      return NextResponse.json({ error: message.slice(6) }, { status: 429 });
    }
    console.error("QR scan error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Fallback: check local Prisma DB (for codes seeded directly)
async function localScan(code: string, userId: string) {
  const qrCode = await prisma.qrCode.findUnique({
    where: { code },
  });

  if (!qrCode) {
    return NextResponse.json(
      { error: "존재하지 않는 QR코드입니다." },
      { status: 404 }
    );
  }

  if (qrCode.isUsed) {
    return NextResponse.json(
      { error: "이미 사용된 QR코드입니다." },
      { status: 409 }
    );
  }

  if (qrCode.expiresAt && qrCode.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "만료된 QR코드입니다." },
      { status: 410 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayScans = await tx.qrCode.count({
      where: { usedBy: userId, usedAt: { gte: today } },
    });

    if (todayScans >= QR_SCAN_DAILY_LIMIT) {
      throw new Error(
        `LIMIT:일일 QR 스캔 한도(${QR_SCAN_DAILY_LIMIT}회)를 초과했습니다.`
      );
    }

    const freshQr = await tx.qrCode.findUnique({ where: { id: qrCode.id } });
    if (!freshQr || freshQr.isUsed) {
      throw new Error("이미 사용된 QR코드입니다.");
    }

    await tx.qrCode.update({
      where: { id: qrCode.id },
      data: { isUsed: true, usedBy: userId, usedAt: new Date() },
    });

    const balance = await tx.coinBalance.update({
      where: { userId },
      data: {
        mcBalance: { increment: qrCode.mcReward },
        mcLifetime: { increment: qrCode.mcReward },
      },
    });

    await tx.coinTransaction.create({
      data: {
        userId,
        coinType: "MC",
        amount: qrCode.mcReward,
        balanceAfter: balance.mcBalance,
        sourceType: "QR_SCAN",
        description: qrCode.description || `QR 스캔 보상 (+${qrCode.mcReward} MC)`,
      },
    });

    const earnDate = new Date();
    earnDate.setHours(0, 0, 0, 0);
    await tx.dailyEarning.upsert({
      where: { userId_earnDate: { userId, earnDate } },
      create: { userId, earnDate, mcQr: qrCode.mcReward },
      update: { mcQr: { increment: qrCode.mcReward } },
    });

    return balance;
  }, { timeout: 15000 });

  return NextResponse.json({
    success: true,
    mcReward: qrCode.mcReward,
    description: qrCode.description,
    newMcBalance: result.mcBalance,
  });
}

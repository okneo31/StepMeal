import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QR_SCAN_DAILY_LIMIT } from "@/lib/constants";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await req.json() as { code: string };

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "QR코드가 유효하지 않습니다." }, { status: 400 });
    }

    // Find QR code first (outside transaction is fine - read only)
    const qrCode = await prisma.qrCode.findUnique({
      where: { code: code.trim() },
    });

    if (!qrCode) {
      return NextResponse.json({ error: "존재하지 않는 QR코드입니다." }, { status: 404 });
    }

    if (qrCode.isUsed) {
      return NextResponse.json({ error: "이미 사용된 QR코드입니다." }, { status: 409 });
    }

    if (qrCode.expiresAt && qrCode.expiresAt < new Date()) {
      return NextResponse.json({ error: "만료된 QR코드입니다." }, { status: 410 });
    }

    // Atomic transaction: check limit + mark QR used + credit MC
    const result = await prisma.$transaction(async (tx) => {
      // Check daily limit INSIDE transaction
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayScans = await tx.qrCode.count({
        where: {
          usedBy: session.user.id,
          usedAt: { gte: today },
        },
      });

      if (todayScans >= QR_SCAN_DAILY_LIMIT) {
        throw new Error(`LIMIT:일일 QR 스캔 한도(${QR_SCAN_DAILY_LIMIT}회)를 초과했습니다.`);
      }

      // Re-check QR is still unused (prevent race condition)
      const freshQr = await tx.qrCode.findUnique({ where: { id: qrCode.id } });
      if (!freshQr || freshQr.isUsed) {
        throw new Error("이미 사용된 QR코드입니다.");
      }

      // Mark QR as used
      await tx.qrCode.update({
        where: { id: qrCode.id },
        data: { isUsed: true, usedBy: session.user.id, usedAt: new Date() },
      });

      // Credit MC
      const balance = await tx.coinBalance.update({
        where: { userId: session.user.id },
        data: {
          mcBalance: { increment: qrCode.mcReward },
          mcLifetime: { increment: qrCode.mcReward },
        },
      });

      // Transaction record
      await tx.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "MC",
          amount: qrCode.mcReward,
          balanceAfter: balance.mcBalance,
          sourceType: "QR_SCAN",
          sourceId: qrCode.id,
          description: qrCode.description || `QR 스캔 보상 (+${qrCode.mcReward} MC)`,
        },
      });

      // Update daily earning
      const earnDate = new Date();
      earnDate.setHours(0, 0, 0, 0);
      await tx.dailyEarning.upsert({
        where: { userId_earnDate: { userId: session.user.id, earnDate } },
        create: { userId: session.user.id, earnDate, mcQr: qrCode.mcReward },
        update: { mcQr: { increment: qrCode.mcReward } },
      });

      return balance;
    });

    return NextResponse.json({
      success: true,
      mcReward: qrCode.mcReward,
      description: qrCode.description,
      newMcBalance: result.mcBalance,
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

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PREMIUM_THEME_IDS } from "@/lib/theme-config";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { storeItemId, quantity = 1 } = await req.json();

    if (!storeItemId) {
      return NextResponse.json({ error: "상품 ID가 필요합니다." }, { status: 400 });
    }

    if (typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity) || quantity > 99) {
      return NextResponse.json({ error: "수량이 올바르지 않습니다." }, { status: 400 });
    }

    const item = await prisma.storeItem.findUnique({
      where: { id: storeItemId },
    });

    if (!item || !item.isActive) {
      return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
    }

    if (item.stock !== -1 && item.stock < quantity) {
      return NextResponse.json({ error: "재고가 부족합니다." }, { status: 400 });
    }

    const totalPrice = item.price * quantity;

    // Sequential atomic operations (no interactive transaction for PgBouncer compatibility)
    // 1. Check balance
    const storeBalance = await prisma.coinBalance.findUnique({
      where: { userId: session.user.id },
    });

    if (!storeBalance) {
      return NextResponse.json({ error: "잔액 정보를 찾을 수 없습니다." }, { status: 400 });
    }

    const currentBalance = item.coinType === "SC" ? storeBalance.scBalance : storeBalance.mcBalance;
    if (currentBalance < totalPrice) {
      return NextResponse.json({ error: "잔액이 부족합니다." }, { status: 400 });
    }

    // 2. Deduct balance
    const storeUpdateData = item.coinType === "SC"
      ? { scBalance: { decrement: totalPrice } }
      : { mcBalance: { decrement: totalPrice } };

    const updatedStoreBalance = await prisma.coinBalance.update({
      where: { userId: session.user.id },
      data: storeUpdateData,
    });

    // 3. Create purchase record
    const purchase = await prisma.purchase.create({
      data: {
        userId: session.user.id,
        storeItemId: item.id,
        coinType: item.coinType,
        amount: totalPrice,
        quantity,
      },
    });

    // 4. Update stock if limited
    if (item.stock !== -1) {
      await prisma.storeItem.update({
        where: { id: item.id },
        data: { stock: { decrement: quantity } },
      });
    }

    // 5. Create transaction record
    const newStoreBalance = item.coinType === "SC" ? updatedStoreBalance.scBalance : updatedStoreBalance.mcBalance;
    await prisma.coinTransaction.create({
      data: {
        userId: session.user.id,
        coinType: item.coinType,
        amount: -totalPrice,
        balanceAfter: newStoreBalance,
        sourceType: "PURCHASE",
        description: `${item.name} 구매 (x${quantity})`,
      },
    });

    // 6. If item is IN_APP type, process special effects
    if (item.category === "IN_APP" && item.metadata) {
      try {
        const meta = JSON.parse(item.metadata);
        if (meta.type === "SHIELD") {
          await prisma.stride.update({
            where: { userId: session.user.id },
            data: { shieldCount: { increment: quantity } },
          });
        } else if (meta.type === "THEME") {
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { unlockedThemes: true },
          });
          let unlocked: string[] = [];
          try {
            unlocked = JSON.parse(user?.unlockedThemes || "[]");
          } catch {
            unlocked = [];
          }
          const alreadyHasAll = PREMIUM_THEME_IDS.every((t) => unlocked.includes(t));
          if (alreadyHasAll) {
            throw new Error("이미 모든 테마가 해금되어 있습니다.");
          }
          const merged = [...new Set([...unlocked, ...PREMIUM_THEME_IDS])];
          await prisma.user.update({
            where: { id: session.user.id },
            data: { unlockedThemes: JSON.stringify(merged) },
          });
        }
      } catch (e) {
        if (e instanceof Error && e.message === "이미 모든 테마가 해금되어 있습니다.") {
          throw e;
        }
        console.warn("Store item metadata parse error:", item.id, e);
      }
    }

    return NextResponse.json({
      purchaseId: purchase.id,
      newScBalance: updatedStoreBalance.scBalance,
      newMcBalance: updatedStoreBalance.mcBalance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    const status = message === "잔액이 부족합니다." || message === "잔액 정보를 찾을 수 없습니다." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

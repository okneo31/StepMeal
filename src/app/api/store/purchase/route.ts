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

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check balance
      const balance = await tx.coinBalance.findUnique({
        where: { userId: session.user.id },
      });

      if (!balance) {
        throw new Error("잔액 정보를 찾을 수 없습니다.");
      }

      const currentBalance = item.coinType === "SC" ? balance.scBalance : balance.mcBalance;
      if (currentBalance < totalPrice) {
        throw new Error("잔액이 부족합니다.");
      }

      // 2. Deduct balance
      const updateData = item.coinType === "SC"
        ? { scBalance: { decrement: totalPrice } }
        : { mcBalance: { decrement: totalPrice } };

      const updatedBalance = await tx.coinBalance.update({
        where: { userId: session.user.id },
        data: updateData,
      });

      // 3. Create purchase record
      const purchase = await tx.purchase.create({
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
        await tx.storeItem.update({
          where: { id: item.id },
          data: { stock: { decrement: quantity } },
        });
      }

      // 5. Create transaction record
      const newBalance = item.coinType === "SC" ? updatedBalance.scBalance : updatedBalance.mcBalance;
      await tx.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: item.coinType,
          amount: -totalPrice,
          balanceAfter: newBalance,
          sourceType: "PURCHASE",
          description: `${item.name} 구매 (x${quantity})`,
        },
      });

      // 6. If item is IN_APP type, process special effects
      if (item.category === "IN_APP" && item.metadata) {
        try {
          const meta = JSON.parse(item.metadata);
          if (meta.type === "SHIELD") {
            await tx.stride.update({
              where: { userId: session.user.id },
              data: { shieldCount: { increment: quantity } },
            });
          } else if (meta.type === "THEME") {
            // Unlock all premium themes at once
            const user = await tx.user.findUnique({
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
            await tx.user.update({
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

      return { purchase, balance: updatedBalance };
    }, { timeout: 15000 });

    return NextResponse.json({
      purchaseId: result.purchase.id,
      newScBalance: result.balance.scBalance,
      newMcBalance: result.balance.mcBalance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    const status = message === "잔액이 부족합니다." || message === "잔액 정보를 찾을 수 없습니다." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

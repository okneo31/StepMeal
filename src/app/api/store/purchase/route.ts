import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
          sourceId: purchase.id,
          description: `${item.name} 구매 (x${quantity})`,
        },
      });

      // 6. If item is SHIELD type, add shield to stride
      if (item.category === "IN_APP" && item.metadata) {
        try {
          const meta = JSON.parse(item.metadata);
          if (meta.type === "SHIELD") {
            await tx.stride.update({
              where: { userId: session.user.id },
              data: { shieldCount: { increment: quantity } },
            });
          }
        } catch {
          // ignore metadata parse errors
        }
      }

      return { purchase, balance: updatedBalance };
    });

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

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        purchase: {
          include: { storeItem: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      orders.map((o) => ({
        id: o.id,
        status: o.status,
        recipientName: o.recipientName,
        phone: o.phone,
        address: o.address,
        addressDetail: o.addressDetail,
        trackingNo: o.trackingNo,
        memo: o.memo,
        createdAt: o.createdAt.toISOString(),
        itemName: o.purchase.storeItem.name,
        itemImage: o.purchase.storeItem.imageUrl,
        quantity: o.purchase.quantity,
        price: o.purchase.amount,
        coinType: o.purchase.coinType,
      }))
    );
  } catch (error) {
    console.error("Orders list error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

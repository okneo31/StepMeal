import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

// GET: list all orders (admin only)
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // filter by status

    const orders = await prisma.order.findMany({
      where: status ? { status } : undefined,
      include: {
        purchase: {
          include: { storeItem: true },
        },
        user: {
          select: { nickname: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(
      orders.map((o) => ({
        id: o.id,
        status: o.status,
        recipientName: o.recipientName,
        phone: o.phone,
        zipCode: o.zipCode,
        address: o.address,
        addressDetail: o.addressDetail,
        trackingNo: o.trackingNo,
        memo: o.memo,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        itemName: o.purchase.storeItem.name,
        itemImage: o.purchase.storeItem.imageUrl,
        quantity: o.purchase.quantity,
        price: o.purchase.amount,
        coinType: o.purchase.coinType,
        userName: o.user.nickname,
        userEmail: o.user.email,
      }))
    );
  } catch (error) {
    console.error("Admin orders error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// PATCH: update order status / tracking number
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { orderId, status, trackingNo } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId가 필요합니다." }, { status: 400 });
    }

    const validStatuses = ["ORDERED", "CONFIRMED", "SHIPPED", "DELIVERED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "잘못된 상태값입니다." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (trackingNo !== undefined) updateData.trackingNo = trackingNo;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    return NextResponse.json({
      id: order.id,
      status: order.status,
      trackingNo: order.trackingNo,
    });
  } catch (error) {
    console.error("Admin order update error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { purchaseId, recipientName, phone, zipCode, address, addressDetail, memo } = await req.json();

    if (!purchaseId || !recipientName || !phone || !zipCode || !address) {
      return NextResponse.json({ error: "필수 배송 정보를 입력해주세요." }, { status: 400 });
    }

    // Validate phone format
    const phoneClean = phone.replace(/[^0-9]/g, "");
    if (phoneClean.length < 10 || phoneClean.length > 11) {
      return NextResponse.json({ error: "올바른 전화번호를 입력해주세요." }, { status: 400 });
    }

    // Verify purchase belongs to user and is a health food
    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, userId: session.user.id },
      include: { storeItem: true },
    });

    if (!purchase) {
      return NextResponse.json({ error: "구매 내역을 찾을 수 없습니다." }, { status: 404 });
    }

    if (purchase.storeItem.category !== "HEALTH_FOOD") {
      return NextResponse.json({ error: "배송 주문은 건강식품만 가능합니다." }, { status: 400 });
    }

    // Check if order already exists for this purchase
    const existingOrder = await prisma.order.findFirst({
      where: { purchaseId },
    });

    if (existingOrder) {
      return NextResponse.json({ error: "이미 주문이 접수되었습니다." }, { status: 409 });
    }

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        purchaseId,
        recipientName: recipientName.trim(),
        phone: phoneClean,
        zipCode: zipCode.trim(),
        address: address.trim(),
        addressDetail: addressDetail?.trim() || null,
        memo: memo?.trim() || null,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
    });
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

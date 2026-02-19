import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EQUIP_SLOTS } from "@/lib/constants";
import type { EquipSlot } from "@/types";

const VALID_SLOTS = new Set<string>(EQUIP_SLOTS);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { nftId, slot } = await req.json() as { nftId: string; slot: EquipSlot };

    if (!nftId || !slot || !VALID_SLOTS.has(slot)) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    // Sequential atomic operations (no interactive transaction for PgBouncer compatibility)
    // Get the NFT with template
    const nft = await prisma.userNft.findUnique({
      where: { id: nftId },
      include: { template: true },
    });

    if (!nft || nft.userId !== session.user.id) {
      throw new Error("NFT를 찾을 수 없습니다.");
    }

    // Validate slot matches NFT type
    const { nftType } = nft.template;
    if (nftType === "BOOSTER" && slot !== "BOOSTER") {
      throw new Error("부스터 NFT는 부스터 슬롯에만 장착할 수 있습니다.");
    }
    if (nftType === "ACCESSORY") {
      const templateSlot = nft.template.slot;
      if (slot !== templateSlot) {
        throw new Error(`이 악세서리는 ${templateSlot} 슬롯에만 장착할 수 있습니다.`);
      }
    }
    if (nftType === "VEHICLE" && slot !== "VEHICLE") {
      throw new Error("탈것 NFT는 탈것 슬롯에만 장착할 수 있습니다.");
    }

    // Unequip any existing NFT in the same slot
    await prisma.userNft.updateMany({
      where: {
        userId: session.user.id,
        equippedSlot: slot,
        isEquipped: true,
      },
      data: {
        isEquipped: false,
        equippedSlot: null,
      },
    });

    // Equip the new NFT
    const equipped = await prisma.userNft.update({
      where: { id: nftId },
      data: {
        isEquipped: true,
        equippedSlot: slot,
      },
      include: { template: true },
    });

    return NextResponse.json({ success: true, nft: equipped });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

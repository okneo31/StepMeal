import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { nftId } = await req.json() as { nftId: string };

    if (!nftId) {
      return NextResponse.json({ error: "NFT ID가 필요합니다." }, { status: 400 });
    }

    const nft = await prisma.userNft.findUnique({
      where: { id: nftId },
    });

    if (!nft || nft.userId !== session.user.id) {
      return NextResponse.json({ error: "NFT를 찾을 수 없습니다." }, { status: 404 });
    }

    const updated = await prisma.userNft.update({
      where: { id: nftId },
      data: {
        isEquipped: false,
        equippedSlot: null,
      },
      include: { template: true },
    });

    return NextResponse.json({ success: true, nft: updated });
  } catch (error) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

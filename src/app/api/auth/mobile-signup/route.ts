import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken } from "@/lib/mobile-auth";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "비밀번호는 6자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다." },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname: name,
        coinBalance: { create: {} },
        stride: { create: {} },
        character: { create: {} },
      },
    });

    const tokenUser = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    };

    const accessToken = await generateAccessToken(tokenUser);
    const refreshToken = await generateRefreshToken(user.id);

    return NextResponse.json(
      {
        accessToken,
        refreshToken,
        user: tokenUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Mobile signup error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

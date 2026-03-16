import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { THEMES } from "@/lib/theme-config";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { activeTheme: true, unlockedThemes: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let unlocked: string[] = [];
  try {
    unlocked = JSON.parse(dbUser.unlockedThemes);
  } catch {
    unlocked = [];
  }

  return NextResponse.json({
    activeTheme: dbUser.activeTheme,
    unlockedThemes: unlocked,
  });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { themeId } = await req.json();

  if (!themeId || typeof themeId !== "string") {
    return NextResponse.json({ error: "테마 ID가 필요합니다." }, { status: 400 });
  }

  // "default" is always available
  if (themeId === "default") {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeTheme: "default" },
    });
    return NextResponse.json({ activeTheme: "default" });
  }

  // Check theme exists
  const themeConfig = THEMES.find((t) => t.id === themeId);
  if (!themeConfig) {
    return NextResponse.json({ error: "존재하지 않는 테마입니다." }, { status: 400 });
  }

  // Check unlocked
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { unlockedThemes: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let unlocked: string[] = [];
  try {
    unlocked = JSON.parse(dbUser.unlockedThemes);
  } catch {
    unlocked = [];
  }

  if (!unlocked.includes(themeId)) {
    return NextResponse.json({ error: "해금되지 않은 테마입니다." }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { activeTheme: themeId },
  });

  return NextResponse.json({ activeTheme: themeId });
}

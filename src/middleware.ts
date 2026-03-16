import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  // If request has a Bearer token, let it pass through.
  // Route handlers will validate the JWT via getAuthUser().
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return NextResponse.next();
  }

  // For web requests (cookie-based), use NextAuth session check
  const session = await auth();
  if (!session) {
    // API routes: return 401 JSON
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    // Page routes: redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/move/:path*",
    "/history/:path*",
    "/stats/:path*",
    "/profile/:path*",
    "/store/:path*",
    "/game/:path*",
    "/api/coins/:path*",
    "/api/stride/:path*",
    "/api/movement/:path*",
    "/api/stats/:path*",
    "/api/store/:path*",
    "/api/game/:path*",
    "/qr/:path*",
    "/nft/:path*",
    "/api/qr/:path*",
    "/api/nft/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/mission/:path*",
    "/api/challenge/:path*",
    "/api/achievement/:path*",
    "/api/course/:path*",
    "/api/home/:path*",
    "/api/quest/:path*",
    "/api/character/:path*",
    "/api/user/:path*",
    "/api/roulette/:path*",
    "/api/ring/:path*",
    "/api/booster/:path*",
  ],
};

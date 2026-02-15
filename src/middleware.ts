export { auth as middleware } from "@/lib/auth";

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
  ],
};

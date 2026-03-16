import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";
import { auth } from "./auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret"
);

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_DAYS = 30;

interface TokenUser {
  id: string;
  email: string;
  nickname: string;
}

/**
 * Generate a short-lived JWT access token (15 min)
 */
export async function generateAccessToken(user: TokenUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    nickname: user.nickname,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer("stepmeal")
    .sign(JWT_SECRET);
}

/**
 * Verify a JWT access token and return its payload
 */
export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "stepmeal",
    });
    return payload;
  } catch {
    return null;
  }
}

/**
 * Hash a raw refresh token with SHA-256 for secure DB storage
 */
function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Generate an opaque refresh token, store its hash in DB (30 day expiry)
 * Returns the raw token to send to client
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const rawToken = randomBytes(40).toString("hex");
  const hashedToken = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

  await prisma.refreshToken.create({
    data: {
      token: hashedToken,
      userId,
      expiresAt,
    },
  });

  return rawToken;
}

/**
 * Rotate a refresh token: verify old, revoke it, create new one
 * Returns { accessToken, refreshToken, user } or null if invalid
 */
export async function rotateRefreshToken(rawToken: string) {
  const hashedToken = hashToken(rawToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    // If token was already revoked, this might be a replay attack
    // Revoke all tokens for this user as a safety measure
    if (stored?.revoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId },
        data: { revoked: true },
      });
    }
    return null;
  }

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  });

  // Generate new tokens
  const user = stored.user;
  const accessToken = await generateAccessToken({
    id: user.id,
    email: user.email,
    nickname: user.nickname,
  });
  const refreshToken = await generateRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    },
  };
}

/**
 * Dual auth: try Bearer JWT first, then fall back to NextAuth session.
 * Returns user { id, email, nickname } or null.
 */
export async function getAuthUser(
  request: Request
): Promise<TokenUser | null> {
  // 1. Try Bearer token (mobile)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = await verifyAccessToken(token);
    if (payload?.sub) {
      return {
        id: payload.sub as string,
        email: (payload.email as string) || "",
        nickname: (payload.nickname as string) || "",
      };
    }
    // Bearer token present but invalid -- don't fall back to session
    return null;
  }

  // 2. Fall back to NextAuth session (web)
  try {
    const session = await auth();
    if (session?.user?.id) {
      return {
        id: session.user.id,
        email: session.user.email || "",
        nickname: session.user.name || "",
      };
    }
  } catch {
    // Session check failed
  }

  return null;
}

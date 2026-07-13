import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { db } from "./db";
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-secret-change-me-now-32",
);
export type Session = { id: string; name: string; email: string; role: Role };
export async function createToken(user: Session) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(secret);
}
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function createRefreshToken(userId: string) {
  const raw = randomBytes(48).toString("base64url");
  await db.refreshToken.create({
    data: {
      tokenHash: hashToken(raw),
      userId,
      expiresAt: new Date(Date.now() + 7 * 864e5),
    },
  });
  return raw;
}
export async function getSession(): Promise<Session | null> {
  try {
    const token = (await cookies()).get("forge_session")?.value;
    if (!token) return null;
    return (await jwtVerify(token, secret)).payload as unknown as Session;
  } catch {
    return null;
  }
}
export function can(role: Role, ...allowed: Role[]) {
  return allowed.includes(role);
}

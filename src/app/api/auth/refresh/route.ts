import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createRefreshToken, createToken, hashToken } from "@/lib/auth";
export async function POST() {
  const jar = await cookies();
  const raw = jar.get("forge_refresh")?.value;
  if (!raw)
    return NextResponse.json(
      { error: "Refresh token required" },
      { status: 401 },
    );
  const stored = await db.refreshToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: true },
  });
  if (
    !stored ||
    stored.revokedAt ||
    stored.expiresAt < new Date() ||
    stored.user.status !== "ACTIVE"
  )
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  await db.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });
  const access = await createToken({
    id: stored.user.id,
    name: stored.user.name,
    email: stored.user.email,
    role: stored.user.role,
  });
  const refresh = await createRefreshToken(stored.user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("forge_session", access, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1800,
    path: "/",
  });
  res.cookies.set("forge_refresh", refresh, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 604800,
    path: "/api/auth",
  });
  return res;
}

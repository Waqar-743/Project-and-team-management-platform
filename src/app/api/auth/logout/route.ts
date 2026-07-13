import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/auth";
export async function POST() {
  const jar = await cookies();
  const refresh = jar.get("forge_refresh")?.value;
  if (refresh)
    await db.refreshToken.updateMany({
      where: { tokenHash: hashToken(refresh), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  const r = NextResponse.json({ ok: true });
  r.cookies.set("forge_session", "", { expires: new Date(0), path: "/" });
  r.cookies.set("forge_refresh", "", {
    expires: new Date(0),
    path: "/api/auth",
  });
  return r;
}

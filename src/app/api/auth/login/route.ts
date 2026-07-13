import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createRefreshToken, createToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!checkRateLimit(`login:${ip}`))
      return NextResponse.json(
        { error: "Too many sign-in attempts. Try again in one minute." },
        { status: 429 },
      );
    const parsed = loginSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid email and password." },
        { status: 422 },
      );
    }

    const user = await db.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (
      !user ||
      user.status !== "ACTIVE" ||
      !(await bcrypt.compare(parsed.data.password, user.passwordHash))
    ) {
      return NextResponse.json(
        { error: "Email or password is incorrect." },
        { status: 401 },
      );
    }

    const token = await createToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await createRefreshToken(user.id);

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, role: user.role },
    });
    res.cookies.set("forge_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1800,
      path: "/",
    });
    res.cookies.set("forge_refresh", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 604800,
      path: "/api/auth",
    });
    return res;
  } catch (err) {
    console.error("POST /api/auth/login failed:", err);
    const message =
      err instanceof Error &&
      /Can't reach database server|P1001|ECONNREFUSED/i.test(err.message)
        ? "Database is unavailable. Start PostgreSQL (Docker) and try again."
        : "Something went wrong while signing in. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

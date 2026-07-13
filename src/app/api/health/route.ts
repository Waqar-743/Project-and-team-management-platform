import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      database: "connected",
      responseTimeMs: Date.now() - startedAt,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
    });
  } catch (error) {
    console.error("GET /api/health database check failed", error);
    return NextResponse.json(
      {
        status: "degraded",
        database: "unavailable",
        hint: process.env.DATABASE_URL
          ? "Check the production database connection and migrations."
          : "DATABASE_URL is not configured.",
      },
      { status: 503 },
    );
  }
}

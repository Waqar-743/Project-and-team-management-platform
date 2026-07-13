import { NextResponse } from "next/server";
import { Role, UserStatus } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(10),
  role: z.nativeEnum(Role),
  title: z.string().max(80).optional(),
});
export async function GET(req: Request) {
  const s = await getSession();
  if (!s || s.role !== Role.ADMIN)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const q = new URL(req.url).searchParams;
  const search = q.get("search") || undefined;
  return NextResponse.json(
    await db.user.findMany({
      where: {
        archivedAt: null,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  );
}
export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== Role.ADMIN)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: "Validation failed", fields: p.error.flatten().fieldErrors },
      { status: 422 },
    );
  const { password, ...profile } = p.data;
  const user = await db.user.create({
    data: {
      ...profile,
      email: profile.email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  await db.auditLog.create({
    data: {
      action: "USER_CREATED",
      entityType: "User",
      entityId: user.id,
      actorId: s.id,
    },
  });
  return NextResponse.json(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    { status: 201 },
  );
}
export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s || s.role !== Role.ADMIN)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z
    .object({
      id: z.string(),
      role: z.nativeEnum(Role).optional(),
      status: z.nativeEnum(UserStatus).optional(),
      archived: z.boolean().optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!p.success || p.data.id === s.id)
    return NextResponse.json({ error: "Invalid user update" }, { status: 422 });
  const user = await db.user.update({
    where: { id: p.data.id },
    data: {
      role: p.data.role,
      status: p.data.status,
      archivedAt: p.data.archived ? new Date() : undefined,
    },
  });
  await db.auditLog.create({
    data: {
      action: "USER_ACCESS_UPDATED",
      entityType: "User",
      entityId: user.id,
      actorId: s.id,
      details: p.data,
    },
  });
  return NextResponse.json({ ok: true });
}

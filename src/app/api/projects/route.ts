import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession, can } from "@/lib/auth";
import { projectSchema } from "@/lib/validation";
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const where =
    s.role === Role.TEAM_MEMBER
      ? { members: { some: { userId: s.id } } }
      : s.role === Role.PROJECT_MANAGER
        ? { managerId: s.id }
        : {};
  return NextResponse.json(
    await db.project.findMany({
      where,
      include: {
        manager: { select: { name: true } },
        _count: { select: { tasks: true, members: true } },
      },
    }),
  );
}
export async function POST(req: Request) {
  const s = await getSession();
  if (!s || !can(s.role, Role.ADMIN, Role.PROJECT_MANAGER))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = projectSchema.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: "Validation failed", fields: p.error.flatten().fieldErrors },
      { status: 422 },
    );
  const project = await db.project.create({
    data: {
      ...p.data,
      managerId: s.role === Role.PROJECT_MANAGER ? s.id : p.data.managerId,
      members: { create: { userId: s.id } },
    },
  });
  return NextResponse.json(project, { status: 201 });
}

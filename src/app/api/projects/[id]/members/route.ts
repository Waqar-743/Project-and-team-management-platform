import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { projectAccess } from "@/lib/access";
import { db } from "@/lib/db";
const schema = z.object({ userId: z.string().min(1) });
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await projectAccess(s, id, true)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json({ error: "User required" }, { status: 422 });
  const user = await db.user.findFirst({
    where: {
      id: p.data.userId,
      role: "TEAM_MEMBER",
      status: "ACTIVE",
      archivedAt: null,
    },
    select: { id: true },
  });
  if (!user)
    return NextResponse.json(
      { error: "Only active team members can be added to a project" },
      { status: 422 },
    );
  await db.projectMember.upsert({
    where: { projectId_userId: { projectId: id, userId: p.data.userId } },
    create: { projectId: id, userId: p.data.userId },
    update: {},
  });
  await Promise.all([
    db.notification.create({
      data: {
        type: "PROJECT_ASSIGNED",
        title: "Added to project",
        message: "You were added to a project",
        link: "/dashboard",
        userId: p.data.userId,
      },
    }),
    db.activity.create({
      data: {
        action: "added project member",
        entityType: "Project",
        entityId: id,
        actorId: s.id,
        metadata: { userId: p.data.userId },
      },
    }),
  ]);
  return NextResponse.json({ ok: true }, { status: 201 });
}
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await projectAccess(s, id, true)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json({ error: "User required" }, { status: 422 });
  const project = await db.project.findUnique({
    where: { id },
    select: { managerId: true },
  });
  if (project?.managerId === p.data.userId)
    return NextResponse.json(
      { error: "The project manager cannot be removed from their project" },
      { status: 422 },
    );
  await db.projectMember.delete({
    where: { projectId_userId: { projectId: id, userId: p.data.userId } },
  });
  return NextResponse.json({ ok: true });
}

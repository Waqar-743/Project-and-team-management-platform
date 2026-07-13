import { NextResponse } from "next/server";
import { z } from "zod";
import { ProjectStatus } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { projectAccess } from "@/lib/access";
import { db } from "@/lib/db";
const schema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
  description: z.string().trim().min(10).max(500).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  dueDate: z.coerce.date().optional(),
});
export async function PATCH(
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
    return NextResponse.json(
      { error: "Validation failed", fields: p.error.flatten().fieldErrors },
      { status: 422 },
    );
  const project = await db.project.update({ where: { id }, data: p.data });
  await db.activity.create({
    data: {
      action: "updated project",
      entityType: "Project",
      entityId: id,
      actorId: s.id,
    },
  });
  return NextResponse.json(project);
}
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await projectAccess(s, id, true)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await db.project.update({ where: { id }, data: { archivedAt: new Date() } });
  return NextResponse.json({ ok: true });
}

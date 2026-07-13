import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { taskAccess } from "@/lib/access";
import { db } from "@/lib/db";
const schema = z.object({ dependsOnId: z.string().min(1) });
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s || s.role === "TEAM_MEMBER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const task = await taskAccess(s, id);
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!task || !p.success || id === p.data.dependsOnId)
    return NextResponse.json({ error: "Invalid dependency" }, { status: 422 });
  const dependency = await db.task.findFirst({
    where: {
      id: p.data.dependsOnId,
      projectId: task.projectId,
      archivedAt: null,
    },
  });
  if (!dependency)
    return NextResponse.json(
      { error: "Dependency must belong to the same project" },
      { status: 422 },
    );
  await db.taskDependency.create({
    data: { taskId: id, dependsOnId: dependency.id },
  });
  if (dependency.status !== "DONE")
    await db.task.update({ where: { id }, data: { status: "BLOCKED" } });
  return NextResponse.json({ ok: true }, { status: 201 });
}

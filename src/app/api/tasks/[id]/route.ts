import { NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { taskAccess } from "@/lib/access";
import { transitionError } from "@/lib/workflow";
const update = z.object({
  status: z.nativeEnum(TaskStatus),
  reviewNote: z.string().trim().max(1000).optional(),
});
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await taskAccess(s, id)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(
    await db.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignee: { select: { id: true, name: true } },
        subtasks: true,
        comments: {
          include: { author: { select: { name: true } }, replies: true },
          orderBy: { createdAt: "asc" },
        },
        timeEntries: { include: { user: { select: { name: true } } } },
        dependencies: {
          include: {
            dependsOn: { select: { id: true, title: true, status: true } },
          },
        },
        deadlineExtensions: true,
        attachments: true,
      },
    }),
  );
}
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const task = await taskAccess(s, id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const p = update.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json({ error: "Invalid status" }, { status: 422 });
  const denied = transitionError(
    s.role,
    task.status,
    p.data.status,
    task.dependencies.some((d) => d.dependsOn.status !== "DONE"),
  );
  if (denied) return NextResponse.json({ error: denied }, { status: 409 });
  const changed = await db.task.update({
    where: { id },
    data: {
      ...p.data,
      submittedAt:
        p.data.status === "IN_REVIEW" ? new Date() : task.submittedAt,
    },
  });
  await db.activity.create({
    data: {
      action: `moved task to ${p.data.status}`,
      entityType: "Task",
      entityId: id,
      actorId: s.id,
      metadata: {
        from: task.status,
        to: p.data.status,
        note: p.data.reviewNote,
      },
    },
  });
  if (task.assigneeId && s.id !== task.assigneeId)
    await db.notification.create({
      data: {
        type: p.data.status === "DONE" ? "TASK_APPROVED" : "TASK_UPDATED",
        title: p.data.status === "DONE" ? "Task approved" : "Task returned",
        message: task.title,
        link: `/dashboard?task=${id}`,
        userId: task.assigneeId,
      },
    });
  return NextResponse.json(changed);
}
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const task = await taskAccess(s, id);
  if (!task || s.role === "TEAM_MEMBER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await db.task.update({ where: { id }, data: { archivedAt: new Date() } });
  return NextResponse.json({ ok: true });
}


import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession, can } from "@/lib/auth";
import { taskSchema } from "@/lib/validation";
export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const projectId = q.get("projectId") || undefined;
  const search = q.get("search") || undefined;
  const status = q.get("status") || undefined;
  const page = Math.max(1, Number(q.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(q.get("limit")) || 25));
  const scope =
    s.role === Role.TEAM_MEMBER
      ? { assigneeId: s.id }
      : s.role === Role.PROJECT_MANAGER
        ? { project: { managerId: s.id } }
        : {};
  const where = {
    ...scope,
    projectId,
    archivedAt: null,
    ...(search
      ? { title: { contains: search, mode: "insensitive" as const } }
      : {}),
    ...(status ? { status: status as never } : {}),
  };
  const [items, total] = await Promise.all([
    db.task.findMany({
      where,
      include: {
        project: { select: { name: true, code: true } },
        assignee: { select: { name: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.task.count({ where }),
  ]);
  return NextResponse.json({
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
export async function POST(req: Request) {
  const s = await getSession();
  if (!s || !can(s.role, Role.ADMIN, Role.PROJECT_MANAGER))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = taskSchema.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: "Validation failed", fields: p.error.flatten().fieldErrors },
      { status: 422 },
    );
  if (
    s.role === Role.PROJECT_MANAGER &&
    !(await db.project.findFirst({
      where: { id: p.data.projectId, managerId: s.id, archivedAt: null },
    }))
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (
    p.data.assigneeId &&
    !(await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: p.data.projectId,
          userId: p.data.assigneeId,
        },
      },
    }))
  )
    return NextResponse.json(
      { error: "Assignee must be a project member" },
      { status: 422 },
    );
  const task = await db.task.create({ data: { ...p.data, creatorId: s.id } });
  if (task.assigneeId)
    await db.notification.create({
      data: {
        type: "TASK_ASSIGNED",
        title: "New task assigned",
        message: task.title,
        link: `/dashboard?task=${task.id}`,
        userId: task.assigneeId,
      },
    });
  await db.activity.create({
    data: {
      action: "created task",
      entityType: "Task",
      entityId: task.id,
      actorId: s.id,
    },
  });
  return NextResponse.json(task, { status: 201 });
}

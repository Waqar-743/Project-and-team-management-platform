import { NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { taskAccess } from "@/lib/access";
import { db } from "@/lib/db";
const schema = z.object({
  requestedDate: z.coerce.date(),
  reason: z.string().trim().min(10).max(500),
});
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role !== Role.TEAM_MEMBER)
    return NextResponse.json(
      { error: "Only the assigned team member can request a deadline extension" },
      { status: 403 },
    );
  const { id } = await params;
  const task = await taskAccess(s, id);
  if (!task || !task.dueDate)
    return NextResponse.json(
      { error: "Task or current deadline not found" },
      { status: 404 },
    );
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      {
        error: "Choose a new deadline and provide an extension reason of at least 10 characters",
        fields: p.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  if (p.data.requestedDate <= task.dueDate)
    return NextResponse.json(
      { error: "Requested deadline must be later than the current task deadline" },
      { status: 422 },
    );
  const item = await db.deadlineExtension.create({
    data: {
      ...p.data,
      originalDate: task.dueDate,
      taskId: id,
      requesterId: s.id,
    },
  });
  await db.notification.create({
    data: {
      type: "DEADLINE_REQUEST",
      title: "Deadline extension requested",
      message: task.title,
      link: `/dashboard?task=${id}`,
      userId: task.project.managerId,
    },
  });
  return NextResponse.json(item, { status: 201 });
}

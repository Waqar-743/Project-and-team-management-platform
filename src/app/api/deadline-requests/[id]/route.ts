import { NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  responseNote: z.string().trim().max(500).optional(),
});
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s || s.role === "TEAM_MEMBER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const request = await db.deadlineExtension.findUnique({
    where: { id },
    include: { task: { include: { project: true } } },
  });
  if (
    !request ||
    (s.role === Role.PROJECT_MANAGER && request.task.project.managerId !== s.id)
  )
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success || request.status !== "PENDING")
    return NextResponse.json({ error: "Invalid review" }, { status: 422 });
  await db.$transaction([
    db.deadlineExtension.update({
      where: { id },
      data: { ...p.data, reviewerId: s.id, reviewedAt: new Date() },
    }),
    ...(p.data.status === "APPROVED"
      ? [
          db.task.update({
            where: { id: request.taskId },
            data: { dueDate: request.requestedDate },
          }),
        ]
      : []),
    db.notification.create({
      data: {
        type: "DEADLINE_RESPONSE",
        title: `Deadline request ${p.data.status.toLowerCase()}`,
        message: request.task.title,
        link: `/dashboard?task=${request.taskId}`,
        userId: request.requesterId,
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
}

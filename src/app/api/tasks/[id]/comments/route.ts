import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { taskAccess } from "@/lib/access";
import { db } from "@/lib/db";
const schema = z.object({
  body: z.string().trim().min(1).max(2000),
  parentId: z.string().optional(),
});
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const task = await taskAccess(s, id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json({ error: "Comment is required" }, { status: 422 });
  const comment = await db.comment.create({
    data: { ...p.data, taskId: id, authorId: s.id },
  });
  const recipients = new Set(
    [task.assigneeId, task.project.managerId].filter(Boolean) as string[],
  );
  recipients.delete(s.id);
  await db.notification.createMany({
    data: [...recipients].map((userId) => ({
      type: "NEW_COMMENT",
      title: "New task comment",
      message: task.title,
      link: `/dashboard?task=${id}`,
      userId,
    })),
  });
  await db.activity.create({
    data: {
      action: "commented on task",
      entityType: "Task",
      entityId: id,
      actorId: s.id,
    },
  });
  return NextResponse.json(comment, { status: 201 });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { taskAccess } from "@/lib/access";
import { db } from "@/lib/db";
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const subtask = await db.subtask.findUnique({ where: { id } });
  if (!subtask || !(await taskAccess(s, subtask.taskId)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const p = z
    .object({ completed: z.boolean() })
    .safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json({ error: "Invalid state" }, { status: 422 });
  return NextResponse.json(
    await db.subtask.update({ where: { id }, data: p.data }),
  );
}

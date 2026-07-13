import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { taskAccess } from "@/lib/access";
import { db } from "@/lib/db";
const schema = z.object({
  title: z.string().trim().min(2).max(160),
  completed: z.boolean().optional(),
});
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await taskAccess(s, id)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: "Valid subtask title required" },
      { status: 422 },
    );
  return NextResponse.json(
    await db.subtask.create({ data: { taskId: id, ...p.data } }),
    { status: 201 },
  );
}

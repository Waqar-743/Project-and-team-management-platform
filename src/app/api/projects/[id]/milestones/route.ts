import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { projectAccess } from "@/lib/access";
import { db } from "@/lib/db";
const schema = z.object({
  title: z.string().trim().min(3).max(120),
  dueDate: z.coerce.date(),
});
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
    return NextResponse.json(
      { error: "Valid milestone required" },
      { status: 422 },
    );
  return NextResponse.json(
    await db.milestone.create({ data: { ...p.data, projectId: id } }),
    { status: 201 },
  );
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { taskAccess } from "@/lib/access";
import { db } from "@/lib/db";
const schema = z.object({
  minutes: z.coerce.number().int().min(1).max(1440),
  description: z.string().trim().min(3).max(500),
  workDate: z.coerce.date(),
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
      {
        error: "Enter valid time and work details",
        fields: p.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  return NextResponse.json(
    await db.timeEntry.create({
      data: { ...p.data, taskId: id, userId: s.id },
    }),
    { status: 201 },
  );
}

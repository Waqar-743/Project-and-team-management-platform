import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth";
import { taskAccess } from "@/lib/access";
import { db } from "@/lib/db";
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX = 5 * 1024 * 1024;
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await taskAccess(s, id)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN)
    return NextResponse.json(
      { error: "File uploads require Vercel Blob storage in production." },
      { status: 503 },
    );
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !ALLOWED.has(file.type) || file.size > MAX)
    return NextResponse.json(
      { error: "Use PNG, JPG, PDF, TXT or DOCX files up to 5 MB" },
      { status: 422 },
    );
  const safe = `${randomUUID()}${path.extname(file.name).toLowerCase()}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safe), Buffer.from(await file.arrayBuffer()));
  const item = await db.attachment.create({
    data: {
      name: file.name,
      url: `/uploads/${safe}`,
      mimeType: file.type,
      size: file.size,
      uploaderId: s.id,
      taskId: id,
    },
  });
  return NextResponse.json(item, { status: 201 });
}

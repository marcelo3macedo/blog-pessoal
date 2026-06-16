import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { checkAuth } from "@/lib/auth";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

function sanitizeFilename(name: string): string {
  const ext = name.match(/\.[^.]+$/)?.[0] ?? "";
  const base = name
    .slice(0, -ext.length)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return (base || "image") + ext.toLowerCase();
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form" }, { status: 400 });
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Field 'image' is required" }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type '${file.type}'. Allowed: jpeg, png, webp, gif, svg` },
      { status: 415 }
    );
  }

  const filename = sanitizeFilename(file.name);
  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ filename, url: `/uploads/${filename}` }, { status: 201 });
}

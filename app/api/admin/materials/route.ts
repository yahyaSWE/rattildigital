import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "video/mp4",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "text/plain",
]);
const MATERIAL_TYPES = new Set(["pdf", "video", "note", "audio"]);

export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { data, error: err } = await supabase!
    .from("materials")
    .select("*, course:courses(id, title), lesson:lessons(id, title)")
    .order("created_at", { ascending: false });

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string;
  const course_id = (formData.get("course_id") as string) || null;
  const lesson_id = formData.get("lesson_id") as string | null;
  const type = formData.get("type") as string | null;

  if (!file || !title?.trim() || title.trim().length > 160) {
    return NextResponse.json({ error: "fil och titel krävs" }, { status: 400 });
  }
  if (file.size < 1 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Filen får vara högst 20 MB" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Filtypen är inte tillåten" }, { status: 400 });
  }
  if (!type || !MATERIAL_TYPES.has(type)) {
    return NextResponse.json({ error: "Ogiltig materialtyp" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const folder = course_id ?? "general";
  const path = `${folder}/${Date.now()}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadErr } = await adminClient.storage
    .from("materials")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data, error: dbErr } = await adminClient
    .from("materials")
    .insert({
      title: title.trim(),
      course_id: course_id || null,
      lesson_id: lesson_id || null,
      type: type || null,
      url: path,
      file_size_bytes: file.size,
    })
    .select()
    .single();

  if (dbErr) {
    await adminClient.storage.from("materials").remove([path]);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id, url } = await req.json();
  const adminClient = createAdminClient();

  if (url) {
    try {
      const marker = "/object/public/materials/";
      const idx = url.indexOf(marker);
      const storagePath = idx !== -1 ? url.slice(idx + marker.length) : url;
      if (!storagePath.startsWith("http://") && !storagePath.startsWith("https://")) {
        await adminClient.storage.from("materials").remove([storagePath]);
      }
    } catch { /* ignore */ }
  }

  const { error: err } = await adminClient.from("materials").delete().eq("id", id);
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

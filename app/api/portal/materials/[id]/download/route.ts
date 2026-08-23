import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data: material } = await admin
    .from("materials")
    .select("id, course_id, url")
    .eq("id", id)
    .maybeSingle();
  if (!material?.url) return NextResponse.json({ error: "Materialet hittades inte" }, { status: 404 });

  if (material.course_id) {
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id")
      .eq("student_id", user.id)
      .eq("course_id", material.course_id)
      .eq("status", "active")
      .maybeSingle();
    if (!enrollment) return NextResponse.json({ error: "Inte behörig" }, { status: 403 });
  }

  if (material.url.startsWith("http://") || material.url.startsWith("https://")) {
    return NextResponse.redirect(material.url);
  }
  const { data, error } = await admin.storage.from("materials").createSignedUrl(material.url, 60);
  if (error || !data?.signedUrl) {
    console.error("Signed material URL error:", error?.message);
    return NextResponse.json({ error: "Kunde inte öppna materialet" }, { status: 500 });
  }
  return NextResponse.redirect(data.signedUrl);
}

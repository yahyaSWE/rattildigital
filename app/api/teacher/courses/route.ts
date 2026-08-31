import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/supabase/require-teacher";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { user, error } = await requireTeacher();
  if (error) return error;

  const admin = createAdminClient();

  const { data: courses, error: err } = await admin
    .from("courses")
    .select("*")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false });

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  // Räkna aktiva elever per kurs
  const courseIds = (courses ?? []).map((c) => c.id);
  if (courseIds.length === 0) return NextResponse.json([]);

  const { data: enrollments } = await admin
    .from("enrollments")
    .select("course_id")
    .in("course_id", courseIds)
    .eq("status", "active");

  const counts = new Map<string, number>();
  for (const e of enrollments ?? []) {
    counts.set(e.course_id, (counts.get(e.course_id) ?? 0) + 1);
  }

  const enriched = (courses ?? []).map((c) => ({
    ...c,
    student_count: counts.get(c.id) ?? 0,
  }));

  return NextResponse.json(enriched);
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireTeacher();
  if (error) return error;

  const body = await req.json();
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const rawLink = body.meeting_link == null ? "" : String(body.meeting_link).trim();
  if (!id) return NextResponse.json({ error: "Kurs-id saknas" }, { status: 400 });
  if (rawLink.length > 2000) return NextResponse.json({ error: "Länken är för lång" }, { status: 400 });
  if (rawLink) {
    try {
      const url = new URL(rawLink);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid protocol");
    } catch {
      return NextResponse.json({ error: "Ange en giltig http- eller https-länk" }, { status: 400 });
    }
  }

  const admin = createAdminClient();
  const { data, error: updateError } = await admin
    .from("courses")
    .update({ meeting_link: rawLink || null })
    .eq("id", id)
    .eq("teacher_id", user!.id)
    .select("id, meeting_link")
    .maybeSingle();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Kursen hittades inte eller tillhör inte dig" }, { status: 404 });
  return NextResponse.json(data);
}

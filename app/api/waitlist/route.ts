import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { cleanOptionalString, cleanString, enforceRateLimit, normalizeEmail } from "@/lib/security";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig förfrågan" }, { status: 400 });
  }
  const course_id = cleanString(body.course_id, 64);
  const name = cleanString(body.name, 120);
  const email = normalizeEmail(body.email);
  const phone = cleanString(body.phone, 40);
  const level_description = cleanOptionalString(body.level_description, 2000);

  if (!course_id || !name || !email || !phone) {
    return NextResponse.json({ error: "Kontrollera att alla obligatoriska fält är giltiga" }, { status: 400 });
  }

  const limited = await enforceRateLimit(req, "waitlist", 5, 3600, email);
  if (limited) return limited;

  const adminClient = createAdminClient();

  // Check course exists and is full
  const { data: course } = await adminClient
    .from("courses")
    .select("id, title, max_participants")
    .eq("id", course_id)
    .eq("is_active", true)
    .single();

  if (!course) {
    return NextResponse.json({ error: "Kursen hittades inte" }, { status: 404 });
  }

  if (!course.max_participants) {
    return NextResponse.json({ error: "Kursen har ingen väntelista" }, { status: 400 });
  }
  const { count } = await adminClient
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("course_id", course_id)
    .eq("status", "active");
  if ((count ?? 0) < course.max_participants) {
    return NextResponse.json({ error: "Kursen har fortfarande lediga platser" }, { status: 400 });
  }

  // Check already in waitlist
  const { data: existing } = await adminClient
    .from("waitlist")
    .select("id")
    .eq("course_id", course_id)
    .eq("email", email)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Du är redan i kön för denna kurs" }, { status: 409 });
  }

  const { error } = await adminClient.from("waitlist").insert({
    course_id,
    name,
    email,
    phone,
    level_description: level_description || null,
  });

  if (error) {
    console.error("Waitlist insert error:", error.message);
    return NextResponse.json({ error: "Kunde inte spara väntelistan" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewApplicationEmail } from "@/lib/email";
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
  const address = cleanString(body.address, 200);
  const postal_code = cleanString(body.postal_code, 20);
  const city = cleanString(body.city, 100);
  const experience = cleanOptionalString(body.experience, 2000);

  if (!course_id || !name || !email || !phone || !address || !postal_code || !city) {
    return NextResponse.json({ error: "Kontrollera att alla obligatoriska fält är giltiga" }, { status: 400 });
  }

  const limited = await enforceRateLimit(req, "application", 5, 3600, email);
  if (limited) return limited;

  const admin = createAdminClient();

  // Fetch course + teacher info
  const { data: course } = await admin
    .from("courses")
    .select("id, title, is_active, max_participants, teacher_id, teacher:profiles!teacher_id(full_name, email)")
    .eq("id", course_id)
    .single();

  if (!course || !course.is_active) {
    return NextResponse.json({ error: "Kursen hittades inte" }, { status: 404 });
  }

  // Check already applied
  const { data: existing } = await admin
    .from("applications")
    .select("id")
    .eq("course_id", course_id)
    .eq("email", email)
    .not("status", "eq", "rejected")
    .single();

  if (existing) {
    return NextResponse.json({ error: "Du har redan en aktiv ansökan till denna kurs" }, { status: 409 });
  }

  const { data: application, error } = await admin
    .from("applications")
    .insert({
      course_id,
      name,
      email,
      phone,
      address,
      postal_code,
      city,
      experience: experience || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Application insert error:", error.message);
    return NextResponse.json({ error: "Kunde inte spara ansökan" }, { status: 500 });
  }

  // Send email to teacher if assigned
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teacher = (course as any).teacher as { full_name: string | null; email: string | null } | null;
  if (teacher?.email) {
    await sendNewApplicationEmail({
      toEmail: teacher.email,
      toName: teacher.full_name ?? "Lärare",
      applicantName: name,
      applicantEmail: email,
      courseName: course.title,
      applicationId: application.id,
    }).catch(() => {}); // Don't fail if email fails
  }

  // Also notify admin (fetch admin profiles)
  const { data: admins } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("role", "admin");

  for (const a of admins ?? []) {
    if (a.email && a.email !== teacher?.email) {
      await sendNewApplicationEmail({
        toEmail: a.email,
        toName: a.full_name ?? "Admin",
        applicantName: name,
        applicantEmail: email,
        courseName: course.title,
        applicationId: application.id,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}

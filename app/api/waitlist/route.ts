import { sendNewApplicationEmail } from "@/lib/email";
import { cleanOptionalString, cleanString, enforceRateLimit, normalizeEmail } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/** Backwards compatibility for older clients: create a normal pending application. */
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
  const experience = cleanOptionalString(body.level_description, 2000);

  if (!course_id || !name || !email || !phone) {
    return NextResponse.json({ error: "Kontrollera att alla obligatoriska fält är giltiga" }, { status: 400 });
  }

  const limited = await enforceRateLimit(req, "waitlist", 5, 3600, email);
  if (limited) return limited;

  const admin = createAdminClient();
  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("id, title, is_active, teacher:profiles!teacher_id(full_name, email)")
    .eq("id", course_id)
    .single();

  if (courseError || !course?.is_active) {
    return NextResponse.json({ error: "Kursen hittades inte" }, { status: 404 });
  }

  const { data: existing, error: existingError } = await admin
    .from("applications")
    .select("id")
    .eq("course_id", course_id)
    .ilike("email", email)
    .not("status", "eq", "rejected")
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error("Application lookup error:", existingError.message);
    return NextResponse.json({ error: "Kunde inte kontrollera befintliga ansökningar" }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({ error: "Du har redan en aktiv ansökan till denna kurs" }, { status: 409 });
  }

  const { data: application, error: insertError } = await admin
    .from("applications")
    .insert({
      course_id,
      name,
      email,
      phone,
      address: "Ej angiven via äldre formulär",
      postal_code: "Ej angivet",
      city: "Ej angiven",
      experience: experience || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !application) {
    console.error("Legacy waitlist application insert error:", insertError?.message);
    if (insertError?.code === "23505") {
      return NextResponse.json({ error: "Du har redan en aktiv ansökan till denna kurs" }, { status: 409 });
    }
    return NextResponse.json({ error: "Kunde inte spara ansökan" }, { status: 500 });
  }

  const teacher = course.teacher as unknown as { full_name: string | null; email: string | null } | null;
  const { data: admins } = await admin.from("profiles").select("full_name, email").eq("role", "admin");
  const recipients = [
    ...(teacher?.email ? [{ full_name: teacher.full_name, email: teacher.email }] : []),
    ...(admins ?? []).filter((profile) => profile.email && profile.email !== teacher?.email),
  ];

  for (const recipient of recipients) {
    if (!recipient.email) continue;
    await sendNewApplicationEmail({
      toEmail: recipient.email,
      toName: recipient.full_name ?? "Administratör",
      applicantName: name,
      applicantEmail: email,
      courseName: course.title,
      applicationId: application.id,
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    application_id: application.id,
    message: "Ansökan är mottagen och visas för läraren under Väntar.",
  });
}

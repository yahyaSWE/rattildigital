import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewApplicationEmail } from "@/lib/email";
import { isIndividualArea, INDIVIDUAL_AREAS } from "@/lib/individual-lessons";
import { cleanOptionalString, cleanString, enforceRateLimit, normalizeEmail } from "@/lib/security";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Ogiltig förfrågan" }, { status: 400 }); }
  const teacherId = cleanString(body.teacher_id, 64);
  const name = cleanString(body.name, 120);
  const email = normalizeEmail(body.email);
  const phone = cleanString(body.phone, 40);
  const address = cleanString(body.address, 200);
  const postalCode = cleanString(body.postal_code, 20);
  const city = cleanString(body.city, 100);
  const experience = cleanOptionalString(body.experience, 2000);
  const alternative = cleanOptionalString(body.alternative_time_request, 1000);
  const area = body.area;
  const preferences = Array.isArray(body.preferences) ? body.preferences.slice(0, 3) : [];
  const requestedSessions = Number(body.requested_sessions_per_week) || 1;
  if (!teacherId || !name || !email || !phone || !address || !postalCode || !city || !isIndividualArea(area)
    || requestedSessions < 1 || requestedSessions > 7 || (preferences.length === 0 && !alternative)) {
    return NextResponse.json({ error: "Kontrollera obligatoriska uppgifter och välj minst en tid eller ange ett önskemål" }, { status: 400 });
  }
  const limited = await enforceRateLimit(req, "individual-application", 5, 3600, email);
  if (limited) return limited;
  const admin = createAdminClient();
  const { data: teacher } = await admin.from("profiles").select("id, full_name, email, role").eq("id", teacherId).single();
  if (!teacher || teacher.role !== "teacher") return NextResponse.json({ error: "Läraren hittades inte" }, { status: 404 });

  const cleanedPreferences: Array<{ availability_id: string | null; weekday: number; start_time: string; rank: number }> = [];
  for (let index = 0; index < preferences.length; index += 1) {
    const item = preferences[index] as Record<string, unknown>;
    const availabilityId = cleanString(item.availability_id, 64);
    const weekday = Number(item.weekday);
    const startTime = cleanString(item.start_time, 8);
    if (!availabilityId || weekday < 1 || weekday > 7 || !startTime || !/^\d{2}:\d{2}/.test(startTime)) {
      return NextResponse.json({ error: "Ett tidsval är ogiltigt" }, { status: 400 });
    }
    const { data: available } = await admin.from("teacher_availability").select("id").eq("id", availabilityId).eq("teacher_id", teacherId).eq("is_active", true).maybeSingle();
    if (!available) return NextResponse.json({ error: "En vald tid är inte längre tillgänglig" }, { status: 409 });
    cleanedPreferences.push({ availability_id: availabilityId, weekday, start_time: startTime.slice(0, 5), rank: index + 1 });
  }
  const { data: application, error } = await admin.from("individual_applications").insert({
    teacher_id: teacherId, area, name, email, phone, address, postal_code: postalCode, city,
    experience: experience || null, alternative_time_request: alternative || null,
    requested_sessions_per_week: requestedSessions,
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Du har redan en väntande ansökan hos denna lärare" : "Kunde inte spara ansökan" }, { status: error.code === "23505" ? 409 : 500 });
  if (cleanedPreferences.length > 0) {
    const { error: prefError } = await admin.from("individual_application_preferences").insert(cleanedPreferences.map((item) => ({ ...item, application_id: application.id })));
    if (prefError) return NextResponse.json({ error: "Ansökan sparades men tidsönskemålen kunde inte sparas" }, { status: 500 });
  }
  if (teacher.email) await sendNewApplicationEmail({
    toEmail: teacher.email, toName: teacher.full_name ?? "Lärare", applicantName: name,
    applicantEmail: email, courseName: `Individuell ${INDIVIDUAL_AREAS[area]}`, applicationId: application.id,
  }).catch(() => {});
  return NextResponse.json({ ok: true, application_id: application.id });
}

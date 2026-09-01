import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/supabase/require-teacher";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTeacherSlotsAvailable, createOrRecoverIndividualStudent, INDIVIDUAL_AREAS, isIndividualArea, type WeeklySlot } from "@/lib/individual-lessons";
import { sendIndividualBookingEmail } from "@/lib/email";

const DAYS = ["måndagar", "tisdagar", "onsdagar", "torsdagar", "fredagar", "lördagar", "söndagar"];

async function actor() {
  const auth = await requireTeacher();
  if (auth.error) return { ...auth, isAdmin: false };
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("role").eq("id", auth.user!.id).single();
  return { ...auth, isAdmin: data?.role === "admin" };
}

export async function GET(req: NextRequest) {
  const auth = await actor();
  if (auth.error) return auth.error;
  const requestedTeacher = req.nextUrl.searchParams.get("teacher_id");
  const teacherId = auth.isAdmin && requestedTeacher ? requestedTeacher : auth.user!.id;
  const admin = createAdminClient();
  const [{ data: applications, error }, { data: bookings, error: bookingError }, { data: courses, error: courseError }] = await Promise.all([
    admin.from("individual_applications")
      .select("*, teacher:profiles!teacher_id(id, full_name), preferences:individual_application_preferences(*)")
      .eq("teacher_id", teacherId).order("created_at", { ascending: false }),
    admin.from("individual_bookings")
      .select("*, student:profiles!student_id(id, full_name, email), teacher:profiles!teacher_id(id, full_name), slots:individual_booking_slots(*)")
      .eq("teacher_id", teacherId).order("created_at", { ascending: false }),
    admin.from("courses").select("id, title, weekly_schedule, meeting_link").eq("teacher_id", teacherId).eq("is_active", true),
  ]);
  if (error || bookingError || courseError) return NextResponse.json({ error: error?.message ?? bookingError?.message ?? courseError?.message }, { status: 500 });
  return NextResponse.json({ applications: applications ?? [], bookings: bookings ?? [], courses: courses ?? [] });
}

export async function PATCH(req: NextRequest) {
  const auth = await actor();
  if (auth.error) return auth.error;
  const body = await req.json();
  const admin = createAdminClient();
  const { data: application } = await admin.from("individual_applications").select("*, teacher:profiles!teacher_id(full_name)").eq("id", body.id).single();
  if (!application) return NextResponse.json({ error: "Ansökan hittades inte" }, { status: 404 });
  if (!auth.isAdmin && application.teacher_id !== auth.user!.id) return NextResponse.json({ error: "Inte behörig" }, { status: 403 });
  if (body.status === "rejected") {
    const { error } = await admin.from("individual_applications").update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: auth.user!.id, admin_notes: body.admin_notes || null }).eq("id", body.id).eq("status", "pending");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  const duration = Number(body.duration_minutes);
  const buffer = body.buffer_minutes == null ? 5 : Number(body.buffer_minutes);
  const slots = Array.isArray(body.slots) ? body.slots.map((slot: Record<string, unknown>) => ({ weekday: Number(slot.weekday), start_time: String(slot.start_time ?? "").slice(0, 5) })) : [];
  const meetingLink = typeof body.meeting_link === "string" ? body.meeting_link.trim() : "";
  if (body.status !== "approved" || duration < 15 || duration > 240 || buffer < 0 || buffer > 60 || slots.length < 1 || slots.length > 7 || !meetingLink || !isIndividualArea(application.area)) {
    return NextResponse.json({ error: "Kontrollera tider, längd och möteslänk" }, { status: 400 });
  }
  try { const url = new URL(meetingLink); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); } catch { return NextResponse.json({ error: "Möteslänken är ogiltig" }, { status: 400 }); }
  if (new Set(slots.map((slot: WeeklySlot) => `${slot.weekday}-${slot.start_time}`)).size !== slots.length || slots.some((slot: WeeklySlot) => slot.weekday < 1 || slot.weekday > 7 || !/^\d{2}:\d{2}$/.test(slot.start_time))) {
    return NextResponse.json({ error: "Ett eller flera tidsval är ogiltiga" }, { status: 400 });
  }
  try {
    await assertTeacherSlotsAvailable({ teacherId: application.teacher_id, slots, durationMinutes: duration, bufferMinutes: buffer });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const { studentId, passwordSetupLink } = await createOrRecoverIndividualStudent({ email: application.email.trim().toLowerCase(), name: application.name, siteUrl });
    const { data: bookingId, error: rpcError } = await admin.rpc("approve_individual_application", {
      p_application_id: application.id, p_student_id: studentId, p_duration_minutes: duration,
      p_buffer_minutes: buffer, p_meeting_link: meetingLink, p_starts_on: body.starts_on || new Date().toISOString().slice(0, 10),
      p_slots: slots, p_reviewer_id: auth.user!.id,
    });
    if (rpcError) throw new Error(rpcError.message.includes("CONFLICT") ? "Tiden hann bokas av någon annan. Ladda om och välj en ny tid." : rpcError.message);
    const teacherName = Array.isArray(application.teacher) ? application.teacher[0]?.full_name : application.teacher?.full_name;
    const scheduleText = slots.map((slot: WeeklySlot) => `${DAYS[slot.weekday - 1]} ${slot.start_time}`).join(" och ");
    const area = application.area as keyof typeof INDIVIDUAL_AREAS;
    await sendIndividualBookingEmail({ toEmail: application.email, applicantName: application.name, teacherName: teacherName ?? "din lärare", areaName: INDIVIDUAL_AREAS[area], scheduleText, durationMinutes: duration, meetingLink, passwordSetupLink });
    return NextResponse.json({ ok: true, booking_id: bookingId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Kunde inte godkänna ansökan" }, { status: 409 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await actor();
  if (auth.error) return auth.error;
  const body = await req.json();
  const admin = createAdminClient();
  const { data: booking } = await admin.from("individual_bookings").select("id, teacher_id").eq("id", body.id).single();
  if (!booking) return NextResponse.json({ error: "Bokningen hittades inte" }, { status: 404 });
  if (!auth.isAdmin && booking.teacher_id !== auth.user!.id) return NextResponse.json({ error: "Inte behörig" }, { status: 403 });
  if (body.original_date) {
    const date = String(body.original_date);
    const exceptionStatus = body.exception_status;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !["cancelled", "rescheduled"].includes(exceptionStatus)) return NextResponse.json({ error: "Ogiltig schemaändring" }, { status: 400 });
    const replacement = exceptionStatus === "rescheduled" && body.replacement_start ? new Date(body.replacement_start) : null;
    if (exceptionStatus === "rescheduled" && (!replacement || Number.isNaN(replacement.getTime()))) return NextResponse.json({ error: "Välj en giltig ny tid" }, { status: 400 });
    const { error } = await admin.from("individual_lesson_exceptions").upsert({ booking_id: booking.id, original_date: date, status: exceptionStatus, replacement_start: replacement?.toISOString() ?? null, note: typeof body.note === "string" ? body.note.slice(0, 300) : null }, { onConflict: "booking_id,original_date" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  const updates: Record<string, unknown> = {};
  if (typeof body.meeting_link === "string") {
    try { const url = new URL(body.meeting_link); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); updates.meeting_link = body.meeting_link.trim(); }
    catch { return NextResponse.json({ error: "Möteslänken är ogiltig" }, { status: 400 }); }
  }
  if (["active", "paused", "cancelled"].includes(body.status)) updates.status = body.status;
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Ingen ändring angiven" }, { status: 400 });
  updates.updated_at = new Date().toISOString();
  const { error } = await admin.from("individual_bookings").update(updates).eq("id", booking.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

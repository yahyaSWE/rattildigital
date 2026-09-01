import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/supabase/require-teacher";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { user, error } = await requireTeacher();
  if (error) return error;
  const admin = createAdminClient();
  const [{ data, error: readError }, { data: exceptions, error: exceptionError }] = await Promise.all([
    admin.from("teacher_availability").select("*").eq("teacher_id", user!.id).order("weekday").order("start_time"),
    admin.from("teacher_availability_exceptions").select("*").eq("teacher_id", user!.id).order("exception_date"),
  ]);
  if (readError || exceptionError) return NextResponse.json({ error: readError?.message ?? exceptionError?.message }, { status: 500 });
  return NextResponse.json({ availability: data ?? [], exceptions: exceptions ?? [] });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireTeacher();
  if (error) return error;
  const body = await req.json();
  const weekday = body.weekday == null ? null : Number(body.weekday);
  const specificDate = typeof body.specific_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.specific_date) ? body.specific_date : null;
  const startTime = typeof body.start_time === "string" ? body.start_time.slice(0, 5) : "";
  const endTime = typeof body.end_time === "string" ? body.end_time.slice(0, 5) : "";
  const duration = Number(body.lesson_duration_minutes) || 60;
  const buffer = body.buffer_minutes == null ? 5 : Number(body.buffer_minutes);
  if ((weekday == null) === (specificDate == null) || (weekday != null && (weekday < 1 || weekday > 7))
    || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime) || endTime <= startTime
    || duration < 15 || duration > 240 || buffer < 0 || buffer > 60) {
    return NextResponse.json({ error: "Ogiltig tillgänglighet" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data, error: insertError } = await admin.from("teacher_availability").insert({
    teacher_id: user!.id, weekday, specific_date: specificDate, start_time: startTime,
    end_time: endTime, lesson_duration_minutes: duration, buffer_minutes: buffer,
  }).select().single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await requireTeacher();
  if (error) return error;
  const { id } = await req.json();
  const admin = createAdminClient();
  const { error: deleteError } = await admin.from("teacher_availability").delete().eq("id", id).eq("teacher_id", user!.id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const { user, error } = await requireTeacher();
  if (error) return error;
  const body = await req.json();
  const date = typeof body.exception_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.exception_date) ? body.exception_date : null;
  if (!date) return NextResponse.json({ error: "Välj ett giltigt datum" }, { status: 400 });
  const admin = createAdminClient();
  const { data, error: insertError } = await admin.from("teacher_availability_exceptions").insert({
    teacher_id: user!.id, exception_date: date,
    start_time: body.start_time || null, end_time: body.end_time || null,
    reason: typeof body.reason === "string" ? body.reason.slice(0, 300) : null,
  }).select().single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json(data);
}

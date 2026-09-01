import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createAdminClient();
  const [{ data: teachers, error }, { data: availability, error: availabilityError }] = await Promise.all([
    admin.from("profiles").select("id, full_name, avatar_url").eq("role", "teacher").order("full_name"),
    admin.from("teacher_availability")
      .select("id, teacher_id, weekday, specific_date, start_time, end_time, lesson_duration_minutes, buffer_minutes")
      .eq("is_active", true)
      .order("weekday").order("start_time"),
  ]);
  if (error || availabilityError) {
    return NextResponse.json({ error: error?.message ?? availabilityError?.message }, { status: 500 });
  }
  return NextResponse.json((teachers ?? []).map((teacher) => ({
    ...teacher,
    availability: (availability ?? []).filter((item) => item.teacher_id === teacher.id),
  })), { headers: { "Cache-Control": "no-store" } });
}

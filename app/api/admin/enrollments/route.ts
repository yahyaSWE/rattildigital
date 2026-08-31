import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { provisionManualStudent } from "@/lib/approval";
import { cleanString, normalizeEmail } from "@/lib/security";

export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { data, error: err } = await supabase!
    .from("enrollments")
    .select("*, student:profiles!student_id(id, full_name, email), course:courses(id, title)")
    .order("enrolled_at", { ascending: false });

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const studentId = cleanString(body.student_id, 100);
  const courseId = cleanString(body.course_id, 100);
  if (!studentId || !courseId) {
    return NextResponse.json({ error: "student_id och course_id krävs" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", studentId)
    .maybeSingle();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  const email = normalizeEmail(profile?.email);
  const fullName = cleanString(profile?.full_name, 120);
  if (!profile || profile.role !== "student" || !email || !fullName) {
    return NextResponse.json({ error: "Eleven saknar ett giltigt namn eller en giltig e-postadress" }, { status: 400 });
  }

  const result = await provisionManualStudent({
    email,
    fullName,
    courseId,
    expandCapacity: body.expand_capacity === true,
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { id } = await req.json();
  const { error: err } = await supabase!.from("enrollments").delete().eq("id", id);
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { provisionManualStudent } from "@/lib/approval";
import { cleanString, normalizeEmail } from "@/lib/security";

export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { data, error: err } = await supabase!
    .from("profiles")
    .select("*")
    .in("role", ["student", "teacher"])
    .order("created_at", { ascending: false });

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const email = normalizeEmail(body.email);
  const fullName = cleanString(body.full_name, 120);
  const courseId = cleanString(body.course_id, 100);
  if (!email || !fullName || !courseId) {
    return NextResponse.json({ error: "Namn, giltig e-postadress och kurs krävs" }, { status: 400 });
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

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id, role } = await req.json();
  if (!id || !["student", "teacher"].includes(role)) {
    return NextResponse.json({ error: "id och role (student/teacher) krävs" }, { status: 400 });
  }

  // Use admin client to bypass RLS on profiles
  const adminClient = createAdminClient();
  const { data, error: err } = await adminClient
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select()
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await req.json();
  const adminClient = createAdminClient();
  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(id);
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

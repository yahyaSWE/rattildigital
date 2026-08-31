import { resendApprovalInstructions } from "@/lib/approval";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
  }

  const { data: application, error: applicationError } = await admin
    .from("applications")
    .select("*, course:courses!course_id(id, title, teacher_id, is_active, max_participants)")
    .eq("id", id)
    .single();

  if (applicationError || !application) {
    return NextResponse.json({ error: "Ansökan hittades inte" }, { status: 404 });
  }
  const course = application.course as unknown as { teacher_id: string | null } | null;
  if (profile.role !== "admin" && course?.teacher_id !== user.id) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
  }
  if (application.status !== "approved") {
    return NextResponse.json({ error: "Ansökan är inte godkänd" }, { status: 400 });
  }

  const result = await resendApprovalInstructions(application);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}

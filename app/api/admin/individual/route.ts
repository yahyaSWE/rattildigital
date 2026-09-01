import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanString, normalizeEmail } from "@/lib/security";
import { isIndividualArea } from "@/lib/individual-lessons";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  const teacherId = cleanString(body.teacher_id, 64);
  const name = cleanString(body.name, 120);
  const email = normalizeEmail(body.email);
  if (!teacherId || !name || !email || !isIndividualArea(body.area)) return NextResponse.json({ error: "Lärare, namn, e-post och område krävs" }, { status: 400 });
  const admin = createAdminClient();
  const { data: teacher } = await admin.from("profiles").select("id").eq("id", teacherId).eq("role", "teacher").maybeSingle();
  if (!teacher) return NextResponse.json({ error: "Läraren hittades inte" }, { status: 404 });
  const { data, error: insertError } = await admin.from("individual_applications").insert({
    teacher_id: teacherId, area: body.area, name, email,
    phone: cleanString(body.phone, 40) || "Ej angivet", address: cleanString(body.address, 200) || "Ej angivet",
    postal_code: cleanString(body.postal_code, 20) || "-", city: cleanString(body.city, 100) || "Ej angivet",
    experience: cleanString(body.experience, 2000) || null,
    alternative_time_request: "Manuellt skapad av admin", requested_sessions_per_week: Number(body.requested_sessions_per_week) || 1,
  }).select("id").single();
  if (insertError) return NextResponse.json({ error: insertError.code === "23505" ? "Det finns redan en väntande ansökan" : insertError.message }, { status: 409 });
  return NextResponse.json(data);
}

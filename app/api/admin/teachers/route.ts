import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTeacherInviteEmail } from "@/lib/email";
import { siteUrl } from "@/lib/brand";
import { cleanString, normalizeEmail } from "@/lib/security";

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await req.json();
  const email = normalizeEmail(body.email);
  const fullName = cleanString(body.full_name, 120);
  if (!email || !fullName) {
    return NextResponse.json({ error: "Namn och giltig e-postadress krävs" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existingProfile, error: profileError } = await admin
    .from("profiles")
    .select("id, role")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (existingProfile?.role === "admin") {
    return NextResponse.json({ error: "E-postadressen tillhör ett adminkonto och kan inte ändras" }, { status: 409 });
  }
  if (existingProfile?.role === "student" && body.confirm_existing !== true) {
    return NextResponse.json({
      error: "Det finns redan ett elevkonto med denna e-postadress. Vill du ändra det till ett lärarkonto?",
      code: "existing_student",
    }, { status: 409 });
  }

  const redirectTo = `${siteUrl().replace(/\/$/, "")}/satt-losenord`;
  let userId = existingProfile?.id ?? null;
  let passwordSetupLink: string | null = null;
  let created = false;

  if (userId) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (error || !data.properties?.action_link) {
      return NextResponse.json({ error: `Kunde inte skapa inloggningslänk: ${error?.message ?? "okänt fel"}` }, { status: 500 });
    }
    passwordSetupLink = data.properties.action_link;
  } else {
    const invite = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { data: { full_name: fullName }, redirectTo },
    });
    if (!invite.error && invite.data.user?.id && invite.data.properties?.action_link) {
      userId = invite.data.user.id;
      passwordSetupLink = invite.data.properties.action_link;
      created = true;
    } else {
      const recovery = await admin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo } });
      if (recovery.error || !recovery.data.user?.id || !recovery.data.properties?.action_link) {
        return NextResponse.json({ error: `Kunde inte skapa lärarkonto: ${recovery.error?.message ?? invite.error?.message ?? "okänt fel"}` }, { status: 500 });
      }
      userId = recovery.data.user.id;
      passwordSetupLink = recovery.data.properties.action_link;
    }
  }

  const { error: saveError } = await admin.from("profiles").upsert({
    id: userId,
    email,
    full_name: fullName,
    role: "teacher",
  }, { onConflict: "id" });
  if (saveError) return NextResponse.json({ error: `Kunde inte spara lärarprofilen: ${saveError.message}` }, { status: 500 });

  try {
    await sendTeacherInviteEmail({ toEmail: email, teacherName: fullName, passwordSetupLink });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Lärarinbjudan kunde inte skickas" }, { status: 500 });
  }

  return NextResponse.json({ id: userId, created, promoted: existingProfile?.role === "student" });
}

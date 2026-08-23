import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApprovalEmail } from "@/lib/email";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await ctx.params;
  const admin = createAdminClient();

  const { data: application } = await admin
    .from("applications")
    .select("*, course:courses!course_id(id, title)")
    .eq("id", id)
    .single();

  if (!application) {
    return NextResponse.json({ error: "Ansökan hittades inte" }, { status: 404 });
  }
  if (application.status !== "approved") {
    return NextResponse.json({ error: "Ansökan är inte godkänd" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const course = (application as any).course as { id: string; title: string } | null;
  if (!course?.id) {
    return NextResponse.json({ error: "Kursen saknas" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Hitta eller skapa profil + generera lösenordslänk
  let studentId: string | null = null;
  let passwordSetupLink: string | null = null;
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("email", application.email)
    .maybeSingle();

  if (existing) {
    studentId = existing.id;
    // Användaren finns redan — skicka recovery-länk så de kan sätta/återställa lösenord
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: application.email,
      options: { redirectTo: `${siteUrl}/satt-losenord` },
    });
    passwordSetupLink = linkData?.properties?.action_link ?? null;
  } else {
    // Skapa konto via invite (ger samtidigt en länk där de kan sätta lösenord)
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "invite",
      email: application.email,
      options: {
        data: { full_name: application.name },
        redirectTo: `${siteUrl}/satt-losenord`,
      },
    });
    if (linkErr || !linkData?.user) {
      return NextResponse.json({ error: "Kunde inte skapa konto: " + (linkErr?.message ?? "okänt fel") }, { status: 500 });
    }
    studentId = linkData.user.id;
    passwordSetupLink = linkData.properties?.action_link ?? null;
    await admin.from("profiles").update({ full_name: application.name, role: "student" }).eq("id", studentId);
  }

  // Hitta eller skapa enrollment – godkänd ansökan ger aktiv tillgång
  const { data: existingEnroll } = await admin
    .from("enrollments")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("course_id", course.id)
    .maybeSingle();

  const wasAlreadyActive = existingEnroll?.status === "active";

  if (existingEnroll) {
    if (!wasAlreadyActive) {
      await admin.from("enrollments").update({ status: "active" }).eq("id", existingEnroll.id);
    }
  } else {
    await admin.from("enrollments").insert({
      student_id: studentId,
      course_id: course.id,
      status: "active",
    });
  }

  await sendApprovalEmail({
    toEmail: application.email,
    applicantName: application.name,
    courseName: course.title,
    passwordSetupLink,
  });

  return NextResponse.json({ ok: true, sent: true, alreadyActive: wasAlreadyActive });
}

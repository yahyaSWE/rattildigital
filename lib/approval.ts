import { createAdminClient } from "@/lib/supabase/admin";
import { sendApprovalEmail, sendApplicationStatusEmail } from "@/lib/email";

type ApplicationWithCourse = {
  id: string;
  name: string;
  email: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  course?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  redirect_course?: any;
};

type RunApprovalArgs = {
  application: ApplicationWithCourse;
  status: "approved" | "rejected" | "redirected";
  reviewerId: string;
  redirectCourseId?: string | null;
  adminNotes?: string | null;
};

/**
 * Kör det fullständiga godkännande-flödet (eller skickar status-mejl vid neka/hänvisa).
 * Vid "approved": skapar Supabase-konto (om saknas), aktiverar enrollment
 * och skickar välkomstmejl med lösenordslänk.
 */
export async function runApprovalFlow({
  application,
  status,
  reviewerId,
  redirectCourseId,
  adminNotes,
}: RunApprovalArgs): Promise<{ ok: true } | { error: string }> {
  const admin = createAdminClient();

  // Uppdatera ansökans status
  const { error: updateErr } = await admin
    .from("applications")
    .update({
      status,
      redirect_course_id: status === "redirected" ? redirectCourseId : null,
      admin_notes: adminNotes ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq("id", application.id);

  if (updateErr) return { error: updateErr.message };

  const course = application.course as { id: string; title: string } | null;

  // Slå upp namnet på hänvisningskursen FÄRSKT (den joinade redirect_course
  // är stale eftersom redirect_course_id precis sattes i denna request)
  let redirectName: string | undefined =
    (application.redirect_course as { title?: string } | null)?.title;
  if (status === "redirected" && redirectCourseId) {
    const { data: rc } = await admin
      .from("courses")
      .select("title")
      .eq("id", redirectCourseId)
      .maybeSingle();
    redirectName = rc?.title ?? redirectName;
  }

  // Godkännande: skapa konto + aktiv enrollment + välkomstmejl
  if (status === "approved" && course?.id) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    let studentId: string | null = null;
    let passwordSetupLink: string | null = null;

    try {
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("email", application.email)
        .maybeSingle();

      if (existing) {
        studentId = existing.id;
      } else {
        const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
          type: "invite",
          email: application.email,
          options: {
            data: { full_name: application.name },
            redirectTo: `${siteUrl}/satt-losenord`,
          },
        });

        if (!linkErr && linkData?.user) {
          studentId = linkData.user.id;
          passwordSetupLink = linkData.properties?.action_link ?? null;
          await admin.from("profiles").update({
            full_name: application.name,
            role: "student",
          }).eq("id", studentId);
        }
      }

      if (studentId) {
        // Skapa enrollment om det inte redan finns – godkännandet ger direkt tillgång
        const { data: existingEnroll } = await admin
          .from("enrollments")
          .select("id")
          .eq("student_id", studentId)
          .eq("course_id", course.id)
          .maybeSingle();

        if (existingEnroll?.id) {
          // Redan anmäld (t.ex. tidigare pausad) – aktivera på nytt
          await admin
            .from("enrollments")
            .update({ status: "active" })
            .eq("id", existingEnroll.id);
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

        return { ok: true };
      }
    } catch (e) {
      console.error("[runApprovalFlow]", e);
      // Faller vidare till standardmail nedan
    }
  }

  // Standardmail (nekad/hänvisad/fallback)
  await sendApplicationStatusEmail({
    toEmail: application.email,
    applicantName: application.name,
    courseName: course?.title ?? "",
    status,
    redirectCourseName: redirectName,
    notes: adminNotes ?? undefined,
  }).catch(() => {});

  return { ok: true };
}

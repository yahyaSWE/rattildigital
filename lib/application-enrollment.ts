import { createAdminClient } from "@/lib/supabase/admin";

type ApplicationLike = {
  status: string;
  email: string;
  course_id: string;
};

export async function attachEnrollmentStatuses<T extends ApplicationLike>(applications: T[]): Promise<Array<T & {
  enrollment_status: "pending" | "active" | "paused" | "cancelled" | null;
}>> {
  const admin = createAdminClient();
  const approved = applications.filter((application) =>
    application.status === "approved" && application.email && application.course_id,
  );
  if (approved.length === 0) {
    return applications.map((application) => ({ ...application, enrollment_status: null }));
  }

  const emails = Array.from(new Set(approved.map((application) => application.email.trim().toLowerCase())));
  const profileResults = await Promise.all(emails.map((email) => admin
    .from("profiles")
    .select("id, email")
    .ilike("email", email)
    .limit(1)
    .maybeSingle()));

  const emailToStudentId = new Map<string, string>();
  for (const result of profileResults) {
    if (result.error) throw new Error(`Kunde inte läsa elevprofiler: ${result.error.message}`);
    const profile = result.data;
    if (profile?.email) emailToStudentId.set(profile.email.trim().toLowerCase(), profile.id);
  }

  const studentIds = Array.from(emailToStudentId.values());
  const courseIds = Array.from(new Set(approved.map((application) => application.course_id)));
  const enrollmentMap = new Map<string, "pending" | "active" | "paused" | "cancelled">();

  if (studentIds.length > 0 && courseIds.length > 0) {
    const { data: enrollments, error: enrollmentError } = await admin
      .from("enrollments")
      .select("student_id, course_id, status")
      .in("student_id", studentIds)
      .in("course_id", courseIds);
    if (enrollmentError) throw new Error(`Kunde inte läsa kursplatser: ${enrollmentError.message}`);
    for (const enrollment of enrollments ?? []) {
      enrollmentMap.set(
        `${enrollment.student_id}::${enrollment.course_id}`,
        enrollment.status as "pending" | "active" | "paused" | "cancelled",
      );
    }
  }

  return applications.map((application) => {
    const studentId = emailToStudentId.get(application.email.trim().toLowerCase());
    return {
      ...application,
      enrollment_status: studentId
        ? enrollmentMap.get(`${studentId}::${application.course_id}`) ?? null
        : null,
    };
  });
}

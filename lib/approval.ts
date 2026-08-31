import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendApprovalEmail,
  sendApplicationStatusEmail,
  sendNewApplicationEmail,
} from "@/lib/email";

type CourseSummary = {
  id: string;
  title: string;
  teacher_id: string | null;
  is_active: boolean;
  max_participants: number | null;
  teacher?: { full_name: string | null; email: string | null } | null;
};

export type ApplicationWithCourse = {
  id: string;
  course_id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  experience?: string | null;
  status?: "pending" | DecisionStatus;
  course?: CourseSummary | null;
};

type DecisionStatus = "approved" | "rejected" | "redirected";

type RunApprovalArgs = {
  application: ApplicationWithCourse;
  status: DecisionStatus;
  reviewerId: string;
  redirectCourseId?: string | null;
  adminNotes?: string | null;
  expandCapacity?: boolean;
};

type ProfileSummary = { id: string };
type EnrollmentSummary = { id: string; status: "pending" | "active" | "paused" | "cancelled" };
type EnrollmentClaim = {
  enrollmentId: string;
  wasAlreadyActive: boolean;
  capacityExpanded: boolean;
  newCapacity: number | null;
};
type OpenApplication = { id: string; status: string };
type Recipient = { full_name: string | null; email: string | null };

export type ApprovalRepository = {
  getCourse(courseId: string): Promise<CourseSummary | null>;
  countActiveEnrollments(courseId: string): Promise<number>;
  findProfileByEmail(email: string): Promise<ProfileSummary | null>;
  createOrRecoverStudent(args: {
    email: string;
    name: string;
    existingProfileId: string | null;
    redirectTo: string;
  }): Promise<{ studentId: string; passwordSetupLink: string }>;
  ensureStudentProfile(args: { studentId: string; email: string; name: string; isNew: boolean }): Promise<void>;
  findEnrollment(studentId: string, courseId: string): Promise<EnrollmentSummary | null>;
  claimActiveEnrollment(args: {
    studentId: string;
    courseId: string;
    expectedMaxParticipants: number | null;
    expandCapacity: boolean;
  }): Promise<EnrollmentClaim>;
  findOpenApplication(courseId: string, email: string): Promise<OpenApplication | null>;
  createTransferredApplication(application: ApplicationWithCourse, courseId: string, email: string): Promise<string>;
  updateApplicationStatus(args: {
    applicationId: string;
    status: DecisionStatus;
    reviewerId: string;
    redirectCourseId: string | null;
    adminNotes: string | null;
    reviewedAt: string;
  }): Promise<void>;
  listAdmins(): Promise<Recipient[]>;
};

export type ApprovalDependencies = {
  repository: ApprovalRepository;
  sendApprovalEmail: typeof sendApprovalEmail;
  sendApplicationStatusEmail: typeof sendApplicationStatusEmail;
  sendNewApplicationEmail: typeof sendNewApplicationEmail;
  now: () => string;
  siteUrl: () => string;
};

export type ApprovalSuccess = {
  ok: true;
  course_id?: string;
  enrollment_status?: "active";
  enrollment_id?: string;
  active_count_increased?: boolean;
  transferred_application_id?: string;
  capacity_expanded?: boolean;
  new_capacity?: number;
};

export type ApprovalFailure = { error: string; status: number };

export type ManualStudentArgs = {
  fullName: string;
  email: string;
  courseId: string;
  expandCapacity?: boolean;
};

class ApprovalFlowError extends Error {
  constructor(message: string, readonly status = 500) {
    super(message);
  }
}

function assertNoError(error: { message: string } | null, context: string): void {
  if (error) throw new ApprovalFlowError(`${context}: ${error.message}`);
}

function normalizeApplicationEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createSupabaseRepository(): ApprovalRepository {
  const admin = createAdminClient();

  return {
    async getCourse(courseId) {
      const { data, error } = await admin
        .from("courses")
        .select("id, title, teacher_id, is_active, max_participants, teacher:profiles!teacher_id(full_name, email)")
        .eq("id", courseId)
        .maybeSingle();
      assertNoError(error, "Kunde inte läsa kursen");
      return data as unknown as CourseSummary | null;
    },

    async countActiveEnrollments(courseId) {
      const { count, error } = await admin
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("course_id", courseId)
        .eq("status", "active");
      assertNoError(error, "Kunde inte räkna kursens elever");
      return count ?? 0;
    },

    async findProfileByEmail(email) {
      const { data, error } = await admin
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .limit(1)
        .maybeSingle();
      assertNoError(error, "Kunde inte kontrollera elevkontot");
      return data;
    },

    async createOrRecoverStudent({ email, name, existingProfileId, redirectTo }) {
      if (existingProfileId) {
        const { data, error } = await admin.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo },
        });
        assertNoError(error, "Kunde inte skapa lösenordslänk");
        const link = data?.properties?.action_link;
        if (!link) throw new ApprovalFlowError("Kunde inte skapa en giltig lösenordslänk");
        return { studentId: existingProfileId, passwordSetupLink: link };
      }

      const invite = await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: { data: { full_name: name }, redirectTo },
      });
      if (!invite.error && invite.data?.user && invite.data.properties?.action_link) {
        return {
          studentId: invite.data.user.id,
          passwordSetupLink: invite.data.properties.action_link,
        };
      }

      // Ett Auth-konto kan finnas även om profilen saknas. Då skapar vi en
      // recovery-länk i stället för att försöka skapa en dubblett.
      const recovery = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });
      assertNoError(recovery.error, `Kunde inte skapa elevkonto (${invite.error?.message ?? "okänt fel"})`);
      const studentId = recovery.data?.user?.id;
      const link = recovery.data?.properties?.action_link;
      if (!studentId || !link) throw new ApprovalFlowError("Kunde inte skapa elevkonto eller lösenordslänk");
      return { studentId, passwordSetupLink: link };
    },

    async ensureStudentProfile({ studentId, email, name, isNew }) {
      if (isNew) {
        const { error } = await admin.from("profiles").upsert({
          id: studentId,
          email,
          full_name: name,
          role: "student",
        }, { onConflict: "id" });
        assertNoError(error, "Kunde inte säkerställa elevprofilen");
        return;
      }

      const { error } = await admin
        .from("profiles")
        .update({ email, full_name: name })
        .eq("id", studentId);
      assertNoError(error, "Kunde inte uppdatera elevprofilen");
    },

    async findEnrollment(studentId, courseId) {
      const { data, error } = await admin
        .from("enrollments")
        .select("id, status")
        .eq("student_id", studentId)
        .eq("course_id", courseId)
        .maybeSingle();
      assertNoError(error, "Kunde inte kontrollera kursplatsen");
      return data as EnrollmentSummary | null;
    },

    async claimActiveEnrollment({ studentId, courseId, expectedMaxParticipants, expandCapacity }) {
      const { data, error } = await admin.rpc("claim_active_enrollment", {
        p_student_id: studentId,
        p_course_id: courseId,
        p_expected_max_participants: expectedMaxParticipants,
        p_expand_capacity: expandCapacity,
      });
      if (error) {
        const status = error.message.includes("COURSE_FULL") || error.message.includes("CAPACITY_CHANGED")
          ? 409
          : 500;
        const message = error.message.includes("CAPACITY_CHANGED")
          ? "Kursens kapacitet ändrades samtidigt. Ladda om och försök igen."
          : error.message.includes("COURSE_FULL")
          ? "Kursen är full. Bekräfta kapacitetsutökning eller välj en annan kurs."
          : `Kunde inte aktivera kursplatsen: ${error.message}`;
        throw new ApprovalFlowError(message, status);
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.enrollment_id) throw new ApprovalFlowError("Kunde inte aktivera kursplatsen");
      return {
        enrollmentId: row.enrollment_id,
        wasAlreadyActive: Boolean(row.was_already_active),
        capacityExpanded: Boolean(row.capacity_expanded),
        newCapacity: row.new_capacity ?? null,
      };
    },

    async findOpenApplication(courseId, email) {
      const { data, error } = await admin
        .from("applications")
        .select("id, status")
        .eq("course_id", courseId)
        .ilike("email", email)
        .neq("status", "rejected")
        .limit(1)
        .maybeSingle();
      assertNoError(error, "Kunde inte kontrollera tidigare hänvisning");
      return data;
    },

    async createTransferredApplication(application, courseId, email) {
      const { data, error } = await admin
        .from("applications")
        .insert({
          course_id: courseId,
          name: application.name,
          email,
          phone: application.phone ?? "",
          address: application.address ?? "",
          postal_code: application.postal_code ?? "",
          city: application.city ?? "",
          experience: application.experience ?? null,
          status: "pending",
        })
        .select("id")
        .single();
      assertNoError(error, "Kunde inte skapa ansökan till hänvisningskursen");
      if (!data?.id) throw new ApprovalFlowError("Kunde inte skapa ansökan till hänvisningskursen");
      return data.id;
    },

    async updateApplicationStatus({ applicationId, status, reviewerId, redirectCourseId, adminNotes, reviewedAt }) {
      const { error } = await admin
        .from("applications")
        .update({
          status,
          redirect_course_id: status === "redirected" ? redirectCourseId : null,
          admin_notes: adminNotes,
          reviewed_at: reviewedAt,
          reviewed_by: reviewerId,
        })
        .eq("id", applicationId);
      assertNoError(error, "Kunde inte uppdatera ansökan");
    },

    async listAdmins() {
      const { data, error } = await admin
        .from("profiles")
        .select("full_name, email")
        .eq("role", "admin");
      assertNoError(error, "Kunde inte läsa administratörer");
      return data ?? [];
    },
  };
}

function defaultSiteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (value) return value.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  throw new ApprovalFlowError("NEXT_PUBLIC_SITE_URL saknas");
}

function createDefaultDependencies(): ApprovalDependencies {
  return {
    repository: createSupabaseRepository(),
    sendApprovalEmail,
    sendApplicationStatusEmail,
    sendNewApplicationEmail,
    now: () => new Date().toISOString(),
    siteUrl: defaultSiteUrl,
  };
}

async function inspectCourseCapacity(
  repository: ApprovalRepository,
  course: CourseSummary,
  expandCapacity: boolean,
): Promise<{ expectedMaxParticipants: number | null }> {
  const enrolledCount = await repository.countActiveEnrollments(course.id);
  const maxParticipants = course.max_participants;
  if (maxParticipants === null || enrolledCount < maxParticipants) {
    return { expectedMaxParticipants: maxParticipants };
  }
  if (!expandCapacity) {
    throw new ApprovalFlowError(
      `Kursen "${course.title}" är full (${enrolledCount}/${maxParticipants}). Bekräfta att kapaciteten ska utökas med en plats.`,
      409,
    );
  }

  if (enrolledCount > maxParticipants) {
    throw new ApprovalFlowError(
      `Kursen har fler aktiva elever än angiven kapacitet (${enrolledCount}/${maxParticipants}). Justera kursen innan ansökan hanteras.`,
      409,
    );
  }
  return { expectedMaxParticipants: maxParticipants };
}

function approvalFailure(error: unknown, context: string): ApprovalFailure {
  const message = error instanceof Error ? error.message : "Okänt fel";
  const status = error instanceof ApprovalFlowError
    ? error.status
    : message.includes("COURSE_FULL") || message.includes("CAPACITY_CHANGED") ? 409 : 500;
  console.error(`[${context}]`, error);
  return { error: message, status };
}

async function provisionStudentAccess(
  args: ManualStudentArgs,
  dependencies: ApprovalDependencies,
): Promise<ApprovalSuccess> {
  const repository = dependencies.repository;
  const course = await repository.getCourse(args.courseId);
  if (!course) throw new ApprovalFlowError("Kursen finns inte", 404);
  if (!course.is_active) throw new ApprovalFlowError("Kursen är inte aktiv", 400);

  const email = normalizeApplicationEmail(args.email);
  const existingProfile = await repository.findProfileByEmail(email);
  const enrollment = existingProfile
    ? await repository.findEnrollment(existingProfile.id, course.id)
    : null;
  const preflight = enrollment?.status === "active"
    ? { expectedMaxParticipants: course.max_participants }
    : await inspectCourseCapacity(repository, course, args.expandCapacity === true);

  const { studentId, passwordSetupLink } = await repository.createOrRecoverStudent({
    email,
    name: args.fullName,
    existingProfileId: existingProfile?.id ?? null,
    redirectTo: `${dependencies.siteUrl()}/satt-losenord`,
  });
  await repository.ensureStudentProfile({
    studentId,
    email,
    name: args.fullName,
    isNew: !existingProfile,
  });

  const claim = await repository.claimActiveEnrollment({
    studentId,
    courseId: course.id,
    expectedMaxParticipants: preflight.expectedMaxParticipants,
    expandCapacity: args.expandCapacity === true,
  });

  await dependencies.sendApprovalEmail({
    toEmail: email,
    applicantName: args.fullName,
    courseName: course.title,
    passwordSetupLink,
  });

  return {
    ok: true,
    course_id: course.id,
    enrollment_status: "active",
    enrollment_id: claim.enrollmentId,
    active_count_increased: !claim.wasAlreadyActive,
    ...(claim.capacityExpanded
      ? { capacity_expanded: true, new_capacity: claim.newCapacity ?? undefined }
      : {}),
  };
}

async function approveApplication(
  args: RunApprovalArgs,
  dependencies: ApprovalDependencies,
): Promise<ApprovalSuccess> {
  const result = await provisionStudentAccess({
    fullName: args.application.name,
    email: args.application.email,
    courseId: args.application.course_id,
    expandCapacity: args.expandCapacity,
  }, dependencies);

  await dependencies.repository.updateApplicationStatus({
    applicationId: args.application.id,
    status: "approved",
    reviewerId: args.reviewerId,
    redirectCourseId: null,
    adminNotes: args.adminNotes ?? null,
    reviewedAt: dependencies.now(),
  });

  return result;
}

async function redirectApplication(
  args: RunApprovalArgs,
  dependencies: ApprovalDependencies,
): Promise<ApprovalSuccess> {
  const targetId = args.redirectCourseId;
  if (!targetId) throw new ApprovalFlowError("Välj en kurs att hänvisa eleven till", 400);
  if (targetId === args.application.course_id) {
    throw new ApprovalFlowError("Det går inte att hänvisa till samma kurs", 400);
  }

  const repository = dependencies.repository;
  const targetCourse = await repository.getCourse(targetId);
  if (!targetCourse) throw new ApprovalFlowError("Hänvisningskursen finns inte", 404);
  if (!targetCourse.is_active) throw new ApprovalFlowError("Hänvisningskursen är inte aktiv", 400);
  // En lärare får inte utöka en annan lärares kurs genom en hänvisning.
  // Målkursen måste därför ha en befintlig ledig plats.
  await inspectCourseCapacity(repository, targetCourse, false);

  const email = normalizeApplicationEmail(args.application.email);
  const existing = await repository.findOpenApplication(targetId, email);
  const transferredApplicationId = existing?.id
    ?? await repository.createTransferredApplication(args.application, targetId, email);

  await dependencies.sendApplicationStatusEmail({
    toEmail: email,
    applicantName: args.application.name,
    courseName: args.application.course?.title ?? "",
    status: "redirected",
    redirectCourseName: targetCourse.title,
    notes: args.adminNotes ?? undefined,
  });

  await repository.updateApplicationStatus({
    applicationId: args.application.id,
    status: "redirected",
    reviewerId: args.reviewerId,
    redirectCourseId: targetId,
    adminNotes: args.adminNotes ?? null,
    reviewedAt: dependencies.now(),
  });

  if (!existing) {
    const recipients = new Map<string, string>();
    if (targetCourse.teacher?.email) {
      recipients.set(targetCourse.teacher.email, targetCourse.teacher.full_name ?? "Lärare");
    }
    for (const admin of await repository.listAdmins()) {
      if (admin.email) recipients.set(admin.email, admin.full_name ?? "Admin");
    }
    for (const [toEmail, toName] of recipients) {
      await dependencies.sendNewApplicationEmail({
        toEmail,
        toName,
        applicantName: args.application.name,
        applicantEmail: email,
        courseName: targetCourse.title,
        applicationId: transferredApplicationId,
      }).catch((error) => console.error("[approval] kunde inte notifiera om hänvisning", error));
    }
  }

  return {
    ok: true,
    course_id: targetCourse.id,
    transferred_application_id: transferredApplicationId,
  };
}

/**
 * Kör ett fullständigt beslut. Ansökans slutstatus sparas sist, efter att
 * nödvändigt konto, kursplats och elevmejl har skapats. Flödet innehåller
 * avsiktligt ingen betalning: godkännande ger direkt aktiv kursåtkomst.
 */
export async function runApprovalFlow(
  args: RunApprovalArgs,
  dependencies: ApprovalDependencies = createDefaultDependencies(),
): Promise<ApprovalSuccess | ApprovalFailure> {
  try {
    if (args.application.status && args.application.status !== "pending" && args.application.status !== args.status) {
      throw new ApprovalFlowError(
        `Ansökan är redan behandlad med status ${args.application.status}. Ladda om sidan innan du fortsätter.`,
        409,
      );
    }
    if (args.status === "approved") return await approveApplication(args, dependencies);
    if (args.status === "redirected") return await redirectApplication(args, dependencies);

    const email = normalizeApplicationEmail(args.application.email);
    await dependencies.sendApplicationStatusEmail({
      toEmail: email,
      applicantName: args.application.name,
      courseName: args.application.course?.title ?? "",
      status: "rejected",
      notes: args.adminNotes ?? undefined,
    });
    await dependencies.repository.updateApplicationStatus({
      applicationId: args.application.id,
      status: "rejected",
      reviewerId: args.reviewerId,
      redirectCourseId: null,
      adminNotes: args.adminNotes ?? null,
      reviewedAt: dependencies.now(),
    });
    return { ok: true };
  } catch (error) {
    return approvalFailure(error, "runApprovalFlow");
  }
}

/**
 * Skapar eller återanvänder ett elevkonto, aktiverar kursplatsen och skickar
 * en giltig inbjudnings-/lösenordslänk. Används när admin lägger till manuellt.
 */
export async function provisionManualStudent(
  args: ManualStudentArgs,
  dependencies: ApprovalDependencies = createDefaultDependencies(),
): Promise<ApprovalSuccess | ApprovalFailure> {
  try {
    return await provisionStudentAccess(args, dependencies);
  } catch (error) {
    return approvalFailure(error, "provisionManualStudent");
  }
}

/**
 * Skapar en ny giltig lösenordslänk för en redan godkänd ansökan. Funktionen
 * återanvänder konto och kursplats och skapar aldrig en parallell enrollment.
 */
export async function resendApprovalInstructions(
  application: ApplicationWithCourse,
  dependencies: ApprovalDependencies = createDefaultDependencies(),
): Promise<ApprovalSuccess | ApprovalFailure> {
  try {
    return await provisionStudentAccess({
      fullName: application.name,
      email: application.email,
      courseId: application.course_id,
      expandCapacity: false,
    }, dependencies);
  } catch (error) {
    return approvalFailure(error, "resendApprovalInstructions");
  }
}

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  runApprovalFlow,
  resendApprovalInstructions,
  provisionManualStudent,
  type ApplicationWithCourse,
  type ApprovalDependencies,
  type ApprovalRepository,
} from "./approval";

type FakeCourse = {
  id: string;
  title: string;
  teacher_id: string | null;
  is_active: boolean;
  max_participants: number | null;
  teacher?: { full_name: string | null; email: string | null } | null;
};

class FakeRepository implements ApprovalRepository {
  courses = new Map<string, FakeCourse>();
  profiles = new Map<string, { id: string }>();
  enrollments: Array<{ id: string; studentId: string; courseId: string; status: "pending" | "active" | "paused" | "cancelled" }> = [];
  applications: Array<{ id: string; courseId: string; email: string; status: string }> = [];
  statusUpdates: Array<{ applicationId: string; status: string }> = [];
  capacityConflict = false;
  nextStudent = 1;
  nextEnrollment = 1;
  nextApplication = 1;

  async getCourse(courseId: string) {
    return this.courses.get(courseId) ?? null;
  }

  async countActiveEnrollments(courseId: string) {
    return this.enrollments.filter((item) => item.courseId === courseId && item.status === "active").length;
  }

  async expandCourseCapacity(courseId: string, expectedMax: number, newMax: number) {
    const course = this.courses.get(courseId);
    if (this.capacityConflict || !course || course.max_participants !== expectedMax) return false;
    course.max_participants = newMax;
    return true;
  }

  async findProfileByEmail(email: string) {
    return this.profiles.get(email.toLowerCase()) ?? null;
  }

  async createOrRecoverStudent(args: { email: string; existingProfileId: string | null }) {
    return {
      studentId: args.existingProfileId ?? `student-${this.nextStudent++}`,
      passwordSetupLink: `https://example.test/password/${encodeURIComponent(args.email)}`,
    };
  }

  async ensureStudentProfile(args: { studentId: string; email: string }) {
    this.profiles.set(args.email.toLowerCase(), { id: args.studentId });
  }

  async findEnrollment(studentId: string, courseId: string) {
    const enrollment = this.enrollments.find((item) => item.studentId === studentId && item.courseId === courseId);
    return enrollment ? { id: enrollment.id, status: enrollment.status } : null;
  }

  async createEnrollment(studentId: string, courseId: string) {
    const enrollment = { id: `enrollment-${this.nextEnrollment++}`, studentId, courseId, status: "active" as const };
    this.enrollments.push(enrollment);
    return { id: enrollment.id, status: enrollment.status };
  }

  async activateEnrollment(enrollmentId: string) {
    const enrollment = this.enrollments.find((item) => item.id === enrollmentId);
    if (!enrollment) throw new Error("Enrollment missing");
    enrollment.status = "active";
  }

  async claimActiveEnrollment(args: {
    studentId: string;
    courseId: string;
    expectedMaxParticipants: number | null;
    expandCapacity: boolean;
  }) {
    const course = this.courses.get(args.courseId);
    if (!course) throw new Error("COURSE_NOT_ACTIVE");
    const existing = this.enrollments.find((item) => item.studentId === args.studentId && item.courseId === args.courseId);
    if (existing?.status === "active") {
      return { enrollmentId: existing.id, wasAlreadyActive: true, capacityExpanded: false, newCapacity: course.max_participants };
    }
    const activeCount = await this.countActiveEnrollments(args.courseId);
    let capacityExpanded = false;
    if (course.max_participants !== null && activeCount >= course.max_participants) {
      if (!args.expandCapacity) throw new Error("COURSE_FULL");
      if (this.capacityConflict || course.max_participants !== args.expectedMaxParticipants) throw new Error("CAPACITY_CHANGED");
      if (activeCount > course.max_participants) throw new Error("COURSE_OVER_CAPACITY");
      course.max_participants += 1;
      capacityExpanded = true;
    }
    if (existing) {
      existing.status = "active";
      return { enrollmentId: existing.id, wasAlreadyActive: false, capacityExpanded, newCapacity: course.max_participants };
    }
    const enrollment = { id: `enrollment-${this.nextEnrollment++}`, studentId: args.studentId, courseId: args.courseId, status: "active" as const };
    this.enrollments.push(enrollment);
    return { enrollmentId: enrollment.id, wasAlreadyActive: false, capacityExpanded, newCapacity: course.max_participants };
  }

  async findOpenApplication(courseId: string, email: string) {
    const application = this.applications.find((item) => item.courseId === courseId
      && item.email.toLowerCase() === email.toLowerCase()
      && item.status !== "rejected");
    return application ? { id: application.id, status: application.status } : null;
  }

  async createTransferredApplication(application: ApplicationWithCourse, courseId: string, email: string) {
    const id = `transferred-${this.nextApplication++}`;
    this.applications.push({ id, courseId, email, status: "pending" });
    return id;
  }

  async updateApplicationStatus(args: { applicationId: string; status: "approved" | "rejected" | "redirected" }) {
    this.statusUpdates.push({ applicationId: args.applicationId, status: args.status });
  }

  async listAdmins() {
    return [{ full_name: "Admin", email: "admin@example.test" }];
  }
}

const application: ApplicationWithCourse = {
  id: "application-1",
  course_id: "course-1",
  name: "Test Elev",
  email: "  Student@Example.COM ",
  phone: "0700000000",
  course: { id: "course-1", title: "Kurs 1", teacher_id: "teacher-1", is_active: true, max_participants: 2 },
};

function setup() {
  const repository = new FakeRepository();
  repository.courses.set("course-1", {
    id: "course-1", title: "Kurs 1", teacher_id: "teacher-1", is_active: true, max_participants: 2,
  });
  repository.courses.set("course-2", {
    id: "course-2", title: "Kurs 2", teacher_id: "teacher-2", is_active: true, max_participants: 2,
    teacher: { full_name: "Lärare 2", email: "teacher2@example.test" },
  });
  const approvalEmail = vi.fn(async () => undefined) as unknown as ApprovalDependencies["sendApprovalEmail"];
  const statusEmail = vi.fn(async () => undefined) as unknown as ApprovalDependencies["sendApplicationStatusEmail"];
  const newApplicationEmail = vi.fn(async () => undefined) as unknown as ApprovalDependencies["sendNewApplicationEmail"];
  const dependencies: ApprovalDependencies = {
    repository,
    sendApprovalEmail: approvalEmail,
    sendApplicationStatusEmail: statusEmail,
    sendNewApplicationEmail: newApplicationEmail,
    now: () => "2026-08-31T12:00:00.000Z",
    siteUrl: () => "https://example.test",
  };
  return { repository, dependencies, approvalEmail, statusEmail, newApplicationEmail };
}

function fillCourse(repository: FakeRepository, courseId: string, count = 2) {
  for (let index = 0; index < count; index += 1) {
    repository.enrollments.push({
      id: `full-${courseId}-${index}`,
      studentId: `other-${courseId}-${index}`,
      courseId,
      status: "active",
    });
  }
}

describe("Stripe-fritt ansökningsflöde", () => {
  beforeEach(() => vi.clearAllMocks());

  it("godkänner en ny elev och skapar en aktiv kursplats", async () => {
    const { repository, dependencies, approvalEmail } = setup();
    const result = await runApprovalFlow({ application, status: "approved", reviewerId: "teacher-1" }, dependencies);

    expect(result).toMatchObject({ ok: true, enrollment_status: "active", active_count_increased: true });
    expect(repository.profiles.get("student@example.com")).toBeDefined();
    expect(repository.enrollments).toHaveLength(1);
    expect(repository.statusUpdates).toEqual([{ applicationId: "application-1", status: "approved" }]);
    expect(approvalEmail).toHaveBeenCalledWith(expect.objectContaining({ toEmail: "student@example.com" }));
  });

  it("återanvänder befintlig elev och kursplats utan dubbletter", async () => {
    const { repository, dependencies } = setup();
    repository.profiles.set("student@example.com", { id: "student-existing" });
    repository.enrollments.push({ id: "enrollment-existing", studentId: "student-existing", courseId: "course-1", status: "paused" });

    const result = await runApprovalFlow({ application, status: "approved", reviewerId: "teacher-1" }, dependencies);

    expect(result).toMatchObject({ ok: true, enrollment_id: "enrollment-existing", active_count_increased: true });
    expect(repository.enrollments).toHaveLength(1);
    expect(repository.enrollments[0].status).toBe("active");
  });

  it("ändrar inte en redan aktiv kursplats och blockeras inte av full kurs", async () => {
    const { repository, dependencies } = setup();
    repository.profiles.set("student@example.com", { id: "student-existing" });
    repository.enrollments.push({ id: "enrollment-existing", studentId: "student-existing", courseId: "course-1", status: "active" });
    fillCourse(repository, "course-1", 1);

    const result = await runApprovalFlow({ application, status: "approved", reviewerId: "teacher-1" }, dependencies);

    expect(result).toMatchObject({ ok: true, enrollment_id: "enrollment-existing", active_count_increased: false });
    expect(repository.enrollments).toHaveLength(2);
  });

  it("markerar inte ansökan som godkänd om mejlet misslyckas", async () => {
    const { repository, dependencies } = setup();
    dependencies.sendApprovalEmail = vi.fn(async () => { throw new Error("Resend unavailable"); }) as unknown as ApprovalDependencies["sendApprovalEmail"];

    const result = await runApprovalFlow({ application, status: "approved", reviewerId: "teacher-1" }, dependencies);

    expect(result).toMatchObject({ status: 500, error: "Resend unavailable" });
    expect(repository.statusUpdates).toEqual([]);
  });

  it("stoppar godkännande när kursen är full utan explicit utökning", async () => {
    const { repository, dependencies } = setup();
    fillCourse(repository, "course-1");

    const result = await runApprovalFlow({ application, status: "approved", reviewerId: "teacher-1" }, dependencies);

    expect(result).toMatchObject({ status: 409 });
    expect(repository.profiles).toHaveLength(0);
    expect(repository.statusUpdates).toEqual([]);
  });

  it("utökar en full kurs med exakt en plats och godkänner", async () => {
    const { repository, dependencies } = setup();
    fillCourse(repository, "course-1");

    const result = await runApprovalFlow({ application, status: "approved", reviewerId: "teacher-1", expandCapacity: true }, dependencies);

    expect(result).toMatchObject({ ok: true, capacity_expanded: true, new_capacity: 3 });
    expect(repository.courses.get("course-1")?.max_participants).toBe(3);
  });

  it("upptäcker en samtidig kapacitetsändring", async () => {
    const { repository, dependencies } = setup();
    fillCourse(repository, "course-1");
    repository.capacityConflict = true;

    const result = await runApprovalFlow({ application, status: "approved", reviewerId: "teacher-1", expandCapacity: true }, dependencies);

    expect(result).toMatchObject({ status: 409 });
    expect(repository.statusUpdates).toEqual([]);
  });

  it("vägrar hänvisning till en full kurs", async () => {
    const { repository, dependencies } = setup();
    fillCourse(repository, "course-2");

    const result = await runApprovalFlow({
      application, status: "redirected", reviewerId: "teacher-1", redirectCourseId: "course-2",
    }, dependencies);

    expect(result).toMatchObject({ status: 409 });
    expect(repository.applications).toEqual([]);
    expect(repository.statusUpdates).toEqual([]);
  });

  it("hänvisar till aktiv kurs med ledig plats och skapar pending-ansökan", async () => {
    const { repository, dependencies, statusEmail, newApplicationEmail } = setup();

    const result = await runApprovalFlow({
      application, status: "redirected", reviewerId: "teacher-1", redirectCourseId: "course-2",
    }, dependencies);

    expect(result).toMatchObject({ ok: true, transferred_application_id: "transferred-1" });
    expect(repository.applications[0]).toMatchObject({ courseId: "course-2", email: "student@example.com", status: "pending" });
    expect(repository.statusUpdates).toEqual([{ applicationId: "application-1", status: "redirected" }]);
    expect(statusEmail).toHaveBeenCalledOnce();
    expect(newApplicationEmail).toHaveBeenCalledTimes(2);
  });

  it("återanvänder befintlig hänvisningsansökan och skapar ingen dubblett", async () => {
    const { repository, dependencies, newApplicationEmail } = setup();
    repository.applications.push({ id: "existing-target", courseId: "course-2", email: "student@example.com", status: "pending" });

    const result = await runApprovalFlow({
      application, status: "redirected", reviewerId: "teacher-1", redirectCourseId: "course-2",
    }, dependencies);

    expect(result).toMatchObject({ ok: true, transferred_application_id: "existing-target" });
    expect(repository.applications).toHaveLength(1);
    expect(newApplicationEmail).not.toHaveBeenCalled();
  });

  it("markerar inte en nekad ansökan om statusmejlet misslyckas", async () => {
    const { repository, dependencies } = setup();
    dependencies.sendApplicationStatusEmail = vi.fn(async () => { throw new Error("Email failed"); }) as unknown as ApprovalDependencies["sendApplicationStatusEmail"];

    const result = await runApprovalFlow({ application, status: "rejected", reviewerId: "teacher-1" }, dependencies);

    expect(result).toMatchObject({ status: 500, error: "Email failed" });
    expect(repository.statusUpdates).toEqual([]);
  });

  it("byter inte beslut på en redan behandlad ansökan", async () => {
    const { repository, dependencies, statusEmail } = setup();
    const processed = { ...application, status: "approved" as const };

    const result = await runApprovalFlow({ application: processed, status: "rejected", reviewerId: "teacher-1" }, dependencies);

    expect(result).toMatchObject({ status: 409 });
    expect(repository.statusUpdates).toEqual([]);
    expect(statusEmail).not.toHaveBeenCalled();
  });

  it("skickar en ny lösenordslänk utan att duplicera en aktiv kursplats", async () => {
    const { repository, dependencies, approvalEmail } = setup();
    repository.profiles.set("student@example.com", { id: "student-existing" });
    repository.enrollments.push({ id: "enrollment-existing", studentId: "student-existing", courseId: "course-1", status: "active" });

    const result = await resendApprovalInstructions(application, dependencies);

    expect(result).toMatchObject({ ok: true, enrollment_id: "enrollment-existing", active_count_increased: false });
    expect(repository.enrollments).toHaveLength(1);
    expect(approvalEmail).toHaveBeenCalledOnce();
    expect(repository.statusUpdates).toEqual([]);
  });

  it("överbokar inte en full kurs när en äldre godkänd ansökan saknar kursplats", async () => {
    const { repository, dependencies, approvalEmail } = setup();
    fillCourse(repository, "course-1");

    const result = await resendApprovalInstructions(application, dependencies);

    expect(result).toMatchObject({ status: 409 });
    expect(repository.enrollments).toHaveLength(2);
    expect(approvalEmail).not.toHaveBeenCalled();
  });

  it("skapar en manuell elev med aktiv kursplats och inloggningsmejl", async () => {
    const { repository, dependencies, approvalEmail } = setup();

    const result = await provisionManualStudent({
      fullName: "Manuell Elev",
      email: "  MANUELL@EXAMPLE.COM ",
      courseId: "course-1",
    }, dependencies);

    expect(result).toMatchObject({ ok: true, enrollment_status: "active", active_count_increased: true });
    expect(repository.profiles.get("manuell@example.com")).toBeDefined();
    expect(repository.enrollments).toHaveLength(1);
    expect(approvalEmail).toHaveBeenCalledWith(expect.objectContaining({
      toEmail: "manuell@example.com",
      applicantName: "Manuell Elev",
      courseName: "Kurs 1",
    }));
    expect(repository.statusUpdates).toEqual([]);
  });

  it("återanvänder en manuellt vald elevs aktiva kursplats utan dubblett", async () => {
    const { repository, dependencies, approvalEmail } = setup();
    repository.profiles.set("student@example.com", { id: "student-existing" });
    repository.enrollments.push({ id: "enrollment-existing", studentId: "student-existing", courseId: "course-1", status: "active" });

    const result = await provisionManualStudent({
      fullName: "Test Elev",
      email: "student@example.com",
      courseId: "course-1",
    }, dependencies);

    expect(result).toMatchObject({ ok: true, enrollment_id: "enrollment-existing", active_count_increased: false });
    expect(repository.enrollments).toHaveLength(1);
    expect(approvalEmail).toHaveBeenCalledOnce();
  });

  it("kräver ett explicit val för manuell elev när kursen är full", async () => {
    const { repository, dependencies, approvalEmail } = setup();
    fillCourse(repository, "course-1");

    const result = await provisionManualStudent({
      fullName: "Manuell Elev",
      email: "manuell@example.com",
      courseId: "course-1",
    }, dependencies);

    expect(result).toMatchObject({ status: 409 });
    expect(repository.profiles.has("manuell@example.com")).toBe(false);
    expect(approvalEmail).not.toHaveBeenCalled();
  });

  it("utökar en full kurs med exakt en plats för en manuell elev", async () => {
    const { repository, dependencies } = setup();
    fillCourse(repository, "course-1");

    const result = await provisionManualStudent({
      fullName: "Manuell Elev",
      email: "manuell@example.com",
      courseId: "course-1",
      expandCapacity: true,
    }, dependencies);

    expect(result).toMatchObject({ ok: true, capacity_expanded: true, new_capacity: 3 });
    expect(repository.courses.get("course-1")?.max_participants).toBe(3);
  });
});

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import type { Profile, Course } from "@/lib/supabase/types";
import type { Tab, ApplicationRow, WaitlistRow, EnrollmentRow, MessageRow, MaterialRow, DaySchedule, LessonRow } from "./components/types";
import { inputCls, btnPrimary, btnSecondary } from "./components/types";
import { Modal, Field } from "./components/shared";
import { OverviewTab } from "./components/OverviewTab";
import { StudentsTab } from "./components/StudentsTab";
import { TeachersTab } from "./components/TeachersTab";
import { CoursesTab } from "./components/CoursesTab";
import { LessonsTab } from "./components/LessonsTab";
import { MessagesTab } from "./components/MessagesTab";
import { MaterialTab } from "./components/MaterialTab";
import { WaitlistTab } from "./components/WaitlistTab";
import { ApplicationsTab } from "./components/ApplicationsTab";

const DAY_NAMES = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];

function generateLessonDates(startDateStr: string, weeksCount: number, daySchedules: DaySchedule[]): Date[] {
  if (!startDateStr) return [];
  const start = new Date(startDateStr + "T00:00:00");
  const daysFromMonday = (start.getDay() + 6) % 7;
  const monday = new Date(start);
  monday.setDate(start.getDate() - daysFromMonday);

  const dates: Date[] = [];
  for (let week = 0; week < weeksCount; week++) {
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      if (!daySchedules[dayIdx].enabled) continue;
      const d = new Date(monday);
      d.setDate(monday.getDate() + week * 7 + dayIdx);
      const [h, m] = daySchedules[dayIdx].time.split(":").map(Number);
      d.setHours(h, m, 0, 0);
      if (d >= start) dates.push(d);
    }
  }
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

const defaultDays = (): DaySchedule[] => Array.from({ length: 7 }, () => ({ enabled: false, time: "18:00" }));

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("overview");

  const [students, setStudents] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [appFilter, setAppFilter] = useState("pending");
  const [appReviewing, setAppReviewing] = useState<ApplicationRow | null>(null);
  const [appReviewForm, setAppReviewForm] = useState({ status: "approved", redirect_course_id: "", admin_notes: "", expand_capacity: false });

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [msgRecipient, setMsgRecipient] = useState<Profile | null>(null);

  const [courseForm, setCourseForm] = useState({ title: "", description: "", level: "beginner", price_sek: "", sessions_per_week: "2", duration_weeks: "", max_participants: "", teacher_id: "", meeting_link: "", weekly_schedule: defaultDays() });
  const [bulkForm, setBulkForm] = useState({ course_id: "", title_prefix: "Lektion", start_date: "", weeks: "4", duration_minutes: "60", meeting_link: "", days: defaultDays() });
  const [studentForm, setStudentForm] = useState({ email: "", full_name: "", course_id: "", expand_capacity: false });
  const [enrollForm, setEnrollForm] = useState({ student_id: "", course_id: "", expand_capacity: false });
  const [msgForm, setMsgForm] = useState({ subject: "", content: "" });
  const [materialForm, setMaterialForm] = useState({ title: "", course_id: "", lesson_id: "", type: "pdf", file: null as File | null });
  const [uploadProgress, setUploadProgress] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    const [s, c, e, l, m, mat, wl, apps] = await Promise.all([
      fetch("/api/admin/students").then((r) => r.json()),
      fetch("/api/admin/courses").then((r) => r.json()),
      fetch("/api/admin/enrollments").then((r) => r.json()),
      fetch("/api/admin/lessons").then((r) => r.json()),
      fetch("/api/admin/messages").then((r) => r.json()),
      fetch("/api/admin/materials").then((r) => r.json()),
      fetch("/api/admin/waitlist").then((r) => r.json()),
      fetch("/api/admin/applications").then((r) => r.json()),
    ]);
    if (!s.error) setStudents(s);
    if (!c.error) setCourses(c);
    if (!e.error) setEnrollments(e);
    if (!l.error) setLessons(l);
    if (!m.error) setMessages(m);
    if (!mat.error) setMaterials(mat);
    if (!wl.error) setWaitlist(wl);
    if (!apps.error) setApplications(apps);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const toast = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(""), 3500); };

  // Courses
  const openCreateCourse = () => {
    setEditCourse(null);
    setCourseForm({ title: "", description: "", level: "beginner", price_sek: "", sessions_per_week: "2", duration_weeks: "", max_participants: "", teacher_id: "", meeting_link: "", weekly_schedule: defaultDays() });
    setShowCourseModal(true);
  };
  const openEditCourse = (c: Course) => {
    setEditCourse(c);
    setCourseForm({ title: c.title, description: c.description ?? "", level: c.level ?? "beginner", price_sek: String(c.price_sek), sessions_per_week: String(c.sessions_per_week), duration_weeks: c.duration_weeks ? String(c.duration_weeks) : "", max_participants: c.max_participants ? String(c.max_participants) : "", teacher_id: c.teacher_id ?? "", meeting_link: c.meeting_link ?? "", weekly_schedule: Array.isArray(c.weekly_schedule) && c.weekly_schedule.length === 7 ? c.weekly_schedule : defaultDays() });
    setShowCourseModal(true);
  };
  const saveCourse = async () => {
    setSaving(true);
    const method = editCourse ? "PUT" : "POST";
    const body = editCourse ? { id: editCourse.id, ...courseForm } : courseForm;
    const res = await fetch("/api/admin/courses", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { setShowCourseModal(false); load(); toast(editCourse ? "Kurs uppdaterad!" : "Kurs skapad!"); }
    else toast("Något gick fel.");
  };
  const deleteCourse = async (id: string) => {
    if (!confirm("Ta bort kursen?")) return;
    await fetch("/api/admin/courses", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load(); toast("Kurs borttagen.");
  };

  // Bulk lessons
  const scheduleFromCourse = (courseId: string): DaySchedule[] => {
    const c = courses.find((x) => x.id === courseId);
    return Array.isArray(c?.weekly_schedule) && c!.weekly_schedule.length === 7
      ? (c!.weekly_schedule as DaySchedule[])
      : defaultDays();
  };
  const openBulkModal = (courseId?: string) => {
    const id = courseId ?? courses[0]?.id ?? "";
    const c = courses.find((x) => x.id === id);
    setBulkForm({
      course_id: id,
      title_prefix: "Lektion",
      start_date: "",
      weeks: "4",
      duration_minutes: "60",
      meeting_link: c?.meeting_link ?? "",
      days: scheduleFromCourse(id),
    });
    setShowBulkModal(true);
  };
  const previewDates = generateLessonDates(bulkForm.start_date, parseInt(bulkForm.weeks) || 0, bulkForm.days);
  const saveBulkLessons = async () => {
    if (!bulkForm.course_id || previewDates.length === 0) { toast("Välj kurs, startdatum och minst en dag."); return; }
    setSaving(true);
    let failed = 0;
    for (let i = 0; i < previewDates.length; i++) {
      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: bulkForm.course_id, title: `${bulkForm.title_prefix} ${i + 1}`, scheduled_at: previewDates[i].toISOString(), duration_minutes: parseInt(bulkForm.duration_minutes) || 60, meeting_link: bulkForm.meeting_link || null }),
      });
      if (!res.ok) failed++;
    }
    setSaving(false);
    setShowBulkModal(false);
    load();
    toast(failed > 0 ? `${previewDates.length - failed}/${previewDates.length} lektioner skapade.` : `${previewDates.length} lektioner skapade!`);
  };
  const deleteLesson = async (id: string) => {
    if (!confirm("Ta bort lektionen?")) return;
    await fetch("/api/admin/lessons", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load(); toast("Lektion borttagen.");
  };

  // Students
  const saveStudent = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(studentForm) });
    setSaving(false);
    if (res.ok) {
      const result = await res.json();
      setShowStudentModal(false);
      load();
      toast(result.active_count_increased === false
        ? "Kursplatsen var redan aktiv. Ett nytt inloggningsmejl har skickats."
        : "Eleven är aktiv och inloggningsmejlet har skickats.");
    }
    else { const d = await res.json(); toast(d.error ?? "Något gick fel."); }
  };
  const deleteStudent = async (id: string) => {
    if (!confirm("Ta bort eleven permanent?")) return;
    await fetch("/api/admin/students", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load(); toast("Elev borttagen.");
  };
  const changeRole = async (id: string, role: "student" | "teacher") => {
    const res = await fetch("/api/admin/students", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, role }) });
    if (res.ok) { load(); toast(role === "teacher" ? "Utsedd till lärare!" : "Ändrad till elev."); }
    else toast("Något gick fel.");
  };

  // Enrollments
  const saveEnroll = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(enrollForm) });
    setSaving(false);
    if (res.ok) {
      const result = await res.json();
      setShowEnrollModal(false);
      load();
      toast(result.active_count_increased === false
        ? "Kursplatsen var redan aktiv. Ett nytt inloggningsmejl har skickats."
        : "Eleven är aktiv och inloggningsmejlet har skickats.");
    }
    else { const d = await res.json(); toast(d.error ?? "Något gick fel."); }
  };
  const removeEnroll = async (id: string) => {
    if (!confirm("Ta bort eleven från kursen?")) return;
    await fetch("/api/admin/enrollments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load(); toast("Borttagen från kurs.");
  };

  // Messages
  const openMsg = (student: Profile) => { setMsgRecipient(student); setMsgForm({ subject: "", content: "" }); setShowMsgModal(true); };
  const sendMsg = async () => {
    if (!msgRecipient) return;
    setSaving(true);
    const res = await fetch("/api/admin/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipient_id: msgRecipient.id, ...msgForm }) });
    setSaving(false);
    if (res.ok) { setShowMsgModal(false); load(); toast("Meddelande skickat!"); }
    else toast("Något gick fel.");
  };

  // Materials
  const saveMaterial = async () => {
    if (!materialForm.file || !materialForm.title) { toast("Välj fil och titel."); return; }
    setUploadProgress(true);
    const fd = new FormData();
    fd.append("file", materialForm.file);
    fd.append("title", materialForm.title);
    fd.append("course_id", materialForm.course_id);
    fd.append("type", materialForm.type);
    if (materialForm.lesson_id) fd.append("lesson_id", materialForm.lesson_id);
    const res = await fetch("/api/admin/materials", { method: "POST", body: fd });
    setUploadProgress(false);
    if (res.ok) { setShowMaterialModal(false); load(); toast("Fil uppladdad!"); }
    else { const d = await res.json(); toast(d.error ?? "Uppladdning misslyckades."); }
  };
  const deleteMaterial = async (id: string, url: string | null) => {
    if (!confirm("Ta bort filen permanent?")) return;
    await fetch("/api/admin/materials", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, url }) });
    load(); toast("Fil borttagen.");
  };

  // Waitlist
  const deleteWaitlist = async (id: string, name: string) => {
    if (!confirm(`Ta bort ${name} från kön?`)) return;
    await fetch("/api/admin/waitlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setWaitlist((prev) => prev.filter((x) => x.id !== id));
    toast("Borttagen från kön.");
  };

  // Applications
  const [resendingAppId, setResendingAppId] = useState<string | null>(null);
  const resendApplicationEmail = async (app: ApplicationRow) => {
    setResendingAppId(app.id);
    const res = await fetch(`/api/admin/applications/${app.id}/resend`, { method: "POST" });
    setResendingAppId(null);
    if (res.ok) {
      toast(`Mejl skickat till ${app.email}.`);
    } else {
      const d = await res.json();
      toast(d.error ?? "Kunde inte skicka mejl.");
    }
  };

  const submitReview = async () => {
    if (!appReviewing) return;
    setSaving(true);
    const res = await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: appReviewing.id, ...appReviewForm }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setApplications((prev) => prev.map((a) => a.id === appReviewing.id ? { ...a, status: appReviewForm.status } : a));
      if (data.enrollment_status === "active" && data.course_id) {
        setCourses((prev) => prev.map((course) => course.id === data.course_id
          ? {
              ...course,
              enrolled_count: (course.enrolled_count ?? 0) + (data.active_count_increased ? 1 : 0),
              max_participants: data.capacity_expanded ? data.new_capacity : course.max_participants,
            }
          : course));
      }
      setAppReviewing(null);
      toast("Ansökan uppdaterad och sökande notifierad.");
    } else {
      toast(data.error ?? "Något gick fel.");
    }
  };

  const totalRevenue = enrollments
    .filter((e) => e.status === "active")
    .reduce((sum, e) => sum + ((e.course as { price_sek?: number } | null)?.price_sek ?? 0), 0);
  const activeCourses = courses.filter((course) => course.is_active);
  const selectedStudentCourse = courses.find((course) => course.id === studentForm.course_id);
  const selectedEnrollCourse = courses.find((course) => course.id === enrollForm.course_id);
  const selectedEnrollmentAlreadyActive = enrollments.some((enrollment) => enrollment.student_id === enrollForm.student_id
    && enrollment.course_id === enrollForm.course_id
    && enrollment.status === "active");
  const courseIsFull = (course: Course | undefined) => course?.max_participants != null
    && (course.enrolled_count ?? 0) >= course.max_participants;
  const studentCourseFull = courseIsFull(selectedStudentCourse);
  const enrollCourseFull = courseIsFull(selectedEnrollCourse) && !selectedEnrollmentAlreadyActive;

  const tabs: [Tab, string][] = [
    ["overview", "Översikt"],
    ["students", "Elever"],
    ["teachers", "Lärare"],
    ["courses", "Kurser"],
    ["lessons", "Lektioner"],
    ["messages", "Meddelanden"],
    ["material", "Material"],
    ["waitlist", `Kö (${waitlist.length})`],
    ["applications", `Ansökningar${applications.filter((a) => a.status === "pending").length > 0 ? ` (${applications.filter((a) => a.status === "pending").length})` : ""}`],
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {feedback && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {feedback}
        </div>
      )}

      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-14 w-auto" priority />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Adminpanel</h1>
              <p className="text-xs text-gray-400">Hantera elever, kurser och lektioner</p>
            </div>
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Tillbaka till hemsidan</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8 flex-wrap">
          {tabs.map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <OverviewTab students={students} courses={courses} enrollments={enrollments} lessons={lessons} totalRevenue={totalRevenue} />
        )}
        {tab === "students" && (
          <StudentsTab students={students} enrollments={enrollments} onNewStudent={() => { setStudentForm({ email: "", full_name: "", course_id: "", expand_capacity: false }); setShowStudentModal(true); }} onEnroll={() => { setEnrollForm({ student_id: "", course_id: "", expand_capacity: false }); setShowEnrollModal(true); }} onMessage={openMsg} onChangeRole={changeRole} onDelete={deleteStudent} onRemoveEnroll={removeEnroll} />
        )}
        {tab === "teachers" && (
          <TeachersTab students={students} courses={courses} onMessage={openMsg} onChangeRole={changeRole} onDelete={deleteStudent} />
        )}
        {tab === "courses" && (
          <CoursesTab courses={courses} enrollments={enrollments} onCreateCourse={openCreateCourse} onEditCourse={openEditCourse} onDeleteCourse={deleteCourse} onBulkLessons={(id) => { setSelectedCourseId(id); openBulkModal(id); }} />
        )}
        {tab === "lessons" && (
          <LessonsTab lessons={lessons} courses={courses} selectedCourseId={selectedCourseId} onSelectCourse={setSelectedCourseId} onAddLessons={openBulkModal} onDeleteLesson={deleteLesson} />
        )}
        {tab === "messages" && (
          <MessagesTab students={students} messages={messages} onMessage={openMsg} />
        )}
        {tab === "material" && (
          <MaterialTab materials={materials} onUpload={() => { setMaterialForm({ title: "", course_id: courses[0]?.id ?? "", lesson_id: "", type: "pdf", file: null }); setShowMaterialModal(true); }} onDelete={deleteMaterial} />
        )}
        {tab === "waitlist" && (
          <WaitlistTab waitlist={waitlist} onDelete={deleteWaitlist} />
        )}
        {tab === "applications" && (
          <ApplicationsTab applications={applications} courses={courses} appFilter={appFilter} onFilterChange={setAppFilter} appReviewing={appReviewing} appReviewForm={appReviewForm} onReviewFormChange={setAppReviewForm} onStartReview={(app) => { setAppReviewing(app); setAppReviewForm({ status: "approved", redirect_course_id: "", admin_notes: "", expand_capacity: false }); }} onCancelReview={() => setAppReviewing(null)} onSubmitReview={submitReview} onResendEmail={resendApplicationEmail} resendingId={resendingAppId} saving={saving} />
        )}
      </div>

      {/* Course Modal */}
      {showCourseModal && (
        <Modal title={editCourse ? "Redigera kurs" : "Ny kurs"} onClose={() => setShowCourseModal(false)}>
          <div className="space-y-4">
            <Field label="Titel *"><input className={inputCls} value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="T.ex. Nybörjarkurs" /></Field>
            <Field label="Beskrivning"><textarea className={inputCls} rows={3} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} /></Field>
            <Field label="Nivå">
              <select className={inputCls} value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}>
                <option value="beginner">Nybörjare</option>
                <option value="intermediate">Mellannivå</option>
                <option value="advanced">Avancerad</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pris (öre) *"><input className={inputCls} type="number" placeholder="49900 = 499 kr" value={courseForm.price_sek} onChange={(e) => setCourseForm({ ...courseForm, price_sek: e.target.value })} /></Field>
              <Field label="Lekt./vecka"><input className={inputCls} type="number" value={courseForm.sessions_per_week} onChange={(e) => setCourseForm({ ...courseForm, sessions_per_week: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Längd (veckor)"><input className={inputCls} type="number" placeholder="Lämna tomt om löpande" value={courseForm.duration_weeks} onChange={(e) => setCourseForm({ ...courseForm, duration_weeks: e.target.value })} /></Field>
              <Field label="Max deltagare"><input className={inputCls} type="number" placeholder="Lämna tomt för obegränsat" value={courseForm.max_participants} onChange={(e) => setCourseForm({ ...courseForm, max_participants: e.target.value })} /></Field>
            </div>
            <Field label="Lärare">
              <select className={inputCls} value={courseForm.teacher_id} onChange={(e) => setCourseForm({ ...courseForm, teacher_id: e.target.value })}>
                <option value="">Ingen lärare tilldelad</option>
                {students.filter((s) => s.role === "teacher").map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name ?? t.email}</option>
                ))}
              </select>
            </Field>
            <Field label="Lektionslänk (Microsoft Teams)">
              <input
                className={inputCls}
                type="url"
                value={courseForm.meeting_link}
                onChange={(e) => setCourseForm({ ...courseForm, meeting_link: e.target.value })}
                placeholder="https://teams.microsoft.com/l/meetup-join/..."
              />
              <p className="text-xs text-gray-400 mt-1">Samma länk används för alla lektioner i kursen och visas tydligt på elevens portal.</p>
            </Field>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Veckoschema</label>
                <div className="space-y-2 rounded-xl border border-gray-100 p-3 bg-gray-50">
                  {DAY_NAMES.map((day, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={courseForm.weekly_schedule[idx]?.enabled ?? false}
                          onChange={(e) => {
                            const sched = [...courseForm.weekly_schedule];
                            sched[idx] = { ...sched[idx], enabled: e.target.checked };
                            setCourseForm({ ...courseForm, weekly_schedule: sched });
                          }}
                          className="w-4 h-4 rounded accent-primary"
                        />
                        <span className="text-sm text-gray-700 w-20">{day}</span>
                      </label>
                      {courseForm.weekly_schedule[idx]?.enabled && (
                        <input
                          type="time"
                          value={courseForm.weekly_schedule[idx]?.time ?? "18:00"}
                          onChange={(e) => {
                            const sched = [...courseForm.weekly_schedule];
                            sched[idx] = { ...sched[idx], time: e.target.value };
                            setCourseForm({ ...courseForm, weekly_schedule: sched });
                          }}
                          className="px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">Sparas på kursen och fylls i automatiskt när du skapar nya lektioner.</p>
              </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveCourse} disabled={saving} className={`flex-1 ${btnPrimary}`} style={{ backgroundColor: "var(--primary)" }}>{saving ? "Sparar..." : editCourse ? "Spara ändringar" : "Skapa kurs"}</button>
              <button onClick={() => setShowCourseModal(false)} className={btnSecondary}>Avbryt</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Lesson Modal */}
      {showBulkModal && (
        <Modal title="Lägg till lektioner" onClose={() => setShowBulkModal(false)} wide>
          <div className="space-y-4">
            <Field label="Kurs *">
              <select className={inputCls} value={bulkForm.course_id} onChange={(e) => {
                const newId = e.target.value;
                const c = courses.find((x) => x.id === newId);
                setBulkForm({
                  ...bulkForm,
                  course_id: newId,
                  days: scheduleFromCourse(newId),
                  meeting_link: c?.meeting_link ?? bulkForm.meeting_link,
                });
              }}>
                <option value="">Välj kurs...</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Titelprefix"><input className={inputCls} value={bulkForm.title_prefix} onChange={(e) => setBulkForm({ ...bulkForm, title_prefix: e.target.value })} /></Field>
              <Field label="Antal veckor"><input className={inputCls} type="number" min="1" max="52" value={bulkForm.weeks} onChange={(e) => setBulkForm({ ...bulkForm, weeks: e.target.value })} /></Field>
            </div>
            <Field label="Startdatum *">
              <input className={inputCls} type="date" value={bulkForm.start_date} onChange={(e) => setBulkForm({ ...bulkForm, start_date: e.target.value })} />
            </Field>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Veckodagar & tider *</label>
              <div className="space-y-2 rounded-xl border border-gray-100 p-3 bg-gray-50">
                {DAY_NAMES.map((day, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input type="checkbox" checked={bulkForm.days[idx].enabled} onChange={(e) => { const days = [...bulkForm.days]; days[idx] = { ...days[idx], enabled: e.target.checked }; setBulkForm({ ...bulkForm, days }); }} className="w-4 h-4 rounded accent-primary" />
                      <span className="text-sm text-gray-700 w-20">{day}</span>
                    </label>
                    {bulkForm.days[idx].enabled && (
                      <input type="time" value={bulkForm.days[idx].time} onChange={(e) => { const days = [...bulkForm.days]; days[idx] = { ...days[idx], time: e.target.value }; setBulkForm({ ...bulkForm, days }); }} className="px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Längd (min)"><input className={inputCls} type="number" value={bulkForm.duration_minutes} onChange={(e) => setBulkForm({ ...bulkForm, duration_minutes: e.target.value })} /></Field>
              <Field label="Möteslänk"><input className={inputCls} value={bulkForm.meeting_link} onChange={(e) => setBulkForm({ ...bulkForm, meeting_link: e.target.value })} placeholder="meet.google.com/..." /></Field>
            </div>
            {previewDates.length > 0 && (
              <div className="rounded-xl bg-purple-50 border border-purple-100 p-3">
                <p className="text-xs font-semibold text-purple-700 mb-2">{previewDates.length} lektioner kommer skapas:</p>
                <div className="max-h-32 overflow-y-auto space-y-0.5">
                  {previewDates.map((d, i) => (
                    <p key={i} className="text-xs text-purple-600">{bulkForm.title_prefix} {i + 1} – {d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  ))}
                </div>
              </div>
            )}
            {bulkForm.start_date && previewDates.length === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">Välj minst en dag i veckan.</p>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={saveBulkLessons} disabled={saving || previewDates.length === 0} className={`flex-1 ${btnPrimary}`} style={{ backgroundColor: "var(--primary)" }}>
                {saving ? "Skapar..." : `Skapa ${previewDates.length > 0 ? previewDates.length + " " : ""}lektioner`}
              </button>
              <button onClick={() => setShowBulkModal(false)} className={btnSecondary}>Avbryt</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Student Modal */}
      {showStudentModal && (
        <Modal title="Ny elev" onClose={() => setShowStudentModal(false)}>
          <div className="space-y-4">
            <Field label="Fullständigt namn *"><input className={inputCls} value={studentForm.full_name} onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })} placeholder="Fatima Svensson" /></Field>
            <Field label="E-postadress *"><input className={inputCls} type="email" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} placeholder="fatima@example.com" /></Field>
            <Field label="Kurs *">
              <select className={inputCls} value={studentForm.course_id} onChange={(e) => setStudentForm({ ...studentForm, course_id: e.target.value, expand_capacity: false })}>
                <option value="">Välj aktiv kurs...</option>
                {activeCourses.map((course) => <option key={course.id} value={course.id}>{course.title} ({course.enrolled_count ?? 0}/{course.max_participants ?? "∞"})</option>)}
              </select>
            </Field>
            {activeCourses.length === 0 && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">Skapa och aktivera först en kurs innan du lägger till eleven.</p>}
            {studentCourseFull && selectedStudentCourse && (
              <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 cursor-pointer">
                <input type="checkbox" checked={studentForm.expand_capacity} onChange={(e) => setStudentForm({ ...studentForm, expand_capacity: e.target.checked })} className="mt-0.5 h-4 w-4 accent-amber-600" />
                <span>Kursen är full ({selectedStudentCourse.enrolled_count ?? 0}/{selectedStudentCourse.max_participants}). Utöka kursens kapacitet med 1 plats för den här eleven.</span>
              </label>
            )}
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">Kontot skapas eller återanvänds automatiskt. Eleven får direkt en aktiv kursplats och ett mejl med en säker länk för att välja lösenord.</p>
            <div className="flex gap-2 pt-2">
              <button onClick={saveStudent} disabled={saving || !studentForm.full_name.trim() || !studentForm.email.trim() || !studentForm.course_id || (studentCourseFull && !studentForm.expand_capacity)} className={`flex-1 ${btnPrimary}`} style={{ backgroundColor: "var(--primary)" }}>{saving ? "Skapar..." : "Skapa och skicka inloggning"}</button>
              <button onClick={() => setShowStudentModal(false)} className={btnSecondary}>Avbryt</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <Modal title="Lägg till elev i kurs" onClose={() => setShowEnrollModal(false)}>
          <div className="space-y-4">
            <Field label="Elev *">
              <select className={inputCls} value={enrollForm.student_id} onChange={(e) => setEnrollForm({ ...enrollForm, student_id: e.target.value })}>
                <option value="">Välj elev...</option>
                {students.filter((student) => student.role === "student").map((student) => <option key={student.id} value={student.id}>{student.full_name ?? student.email}</option>)}
              </select>
            </Field>
            <Field label="Kurs *">
              <select className={inputCls} value={enrollForm.course_id} onChange={(e) => setEnrollForm({ ...enrollForm, course_id: e.target.value, expand_capacity: false })}>
                <option value="">Välj aktiv kurs...</option>
                {activeCourses.map((course) => <option key={course.id} value={course.id}>{course.title} ({course.enrolled_count ?? 0}/{course.max_participants ?? "∞"})</option>)}
              </select>
            </Field>
            {activeCourses.length === 0 && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">Det finns ingen aktiv kurs att lägga till eleven i.</p>}
            {enrollCourseFull && selectedEnrollCourse && (
              <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 cursor-pointer">
                <input type="checkbox" checked={enrollForm.expand_capacity} onChange={(e) => setEnrollForm({ ...enrollForm, expand_capacity: e.target.checked })} className="mt-0.5 h-4 w-4 accent-amber-600" />
                <span>Kursen är full ({selectedEnrollCourse.enrolled_count ?? 0}/{selectedEnrollCourse.max_participants}). Utöka kursens kapacitet med 1 plats för den här eleven.</span>
              </label>
            )}
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">Eleven aktiveras direkt och får ett nytt mejl med en giltig inloggnings- och lösenordslänk.</p>
            <div className="flex gap-2 pt-2">
              <button onClick={saveEnroll} disabled={saving || !enrollForm.student_id || !enrollForm.course_id || (enrollCourseFull && !enrollForm.expand_capacity)} className={`flex-1 ${btnPrimary}`} style={{ backgroundColor: "var(--primary)" }}>{saving ? "Lägger till..." : "Aktivera och skicka inloggning"}</button>
              <button onClick={() => setShowEnrollModal(false)} className={btnSecondary}>Avbryt</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Material Upload Modal */}
      {showMaterialModal && (
        <Modal title="Ladda upp fil" onClose={() => setShowMaterialModal(false)}>
          <div className="space-y-4">
            <Field label="Fil *">
              <input type="file" accept=".pdf,.mp4,.mov,.mp3,.m4a,.txt,.docx" className={inputCls}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file) {
                    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
                    const autoType = ext === "pdf" ? "pdf" : ["mp4","mov","webm"].includes(ext) ? "video" : ["mp3","m4a","wav"].includes(ext) ? "audio" : "note";
                    setMaterialForm({ ...materialForm, file, type: autoType });
                  }
                }}
              />
              {materialForm.file && <p className="text-xs text-gray-400 mt-1">{materialForm.file.name} ({(materialForm.file.size / (1024 * 1024)).toFixed(1)} MB)</p>}
            </Field>
            <Field label="Titel *"><input className={inputCls} value={materialForm.title} onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })} placeholder="T.ex. Arbetsblad – Lektion 3" /></Field>
            <Field label="Synligt för">
              <select className={inputCls} value={materialForm.course_id} onChange={(e) => setMaterialForm({ ...materialForm, course_id: e.target.value, lesson_id: "" })}>
                <option value="">🌐 Alla elever (generellt)</option>
                {courses.map((c) => <option key={c.id} value={c.id}>📚 {c.title}</option>)}
              </select>
            </Field>
            <Field label="Lektion (valfritt)">
              <select className={inputCls} value={materialForm.lesson_id} onChange={(e) => setMaterialForm({ ...materialForm, lesson_id: e.target.value })}>
                <option value="">Inte kopplad till lektion</option>
                {lessons.filter((l) => !materialForm.course_id || l.course_id === materialForm.course_id).map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </Field>
            <Field label="Typ">
              <select className={inputCls} value={materialForm.type} onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value })}>
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
                <option value="audio">Ljud</option>
                <option value="note">Anteckning</option>
              </select>
            </Field>
            <div className="flex gap-2 pt-2">
              <button onClick={saveMaterial} disabled={uploadProgress || !materialForm.file} className={`flex-1 ${btnPrimary}`} style={{ backgroundColor: "var(--primary)" }}>
                {uploadProgress ? "Laddar upp..." : "Ladda upp"}
              </button>
              <button onClick={() => setShowMaterialModal(false)} className={btnSecondary}>Avbryt</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Message Modal */}
      {showMsgModal && msgRecipient && (
        <Modal title={`Meddelande till ${msgRecipient.full_name ?? msgRecipient.email}`} onClose={() => setShowMsgModal(false)}>
          <div className="space-y-4">
            <Field label="Ämne"><input className={inputCls} value={msgForm.subject} onChange={(e) => setMsgForm({ ...msgForm, subject: e.target.value })} placeholder="T.ex. Feedback från lektionen" /></Field>
            <Field label="Meddelande *"><textarea className={inputCls} rows={5} value={msgForm.content} onChange={(e) => setMsgForm({ ...msgForm, content: e.target.value })} placeholder="Skriv ditt meddelande här..." /></Field>
            <div className="flex gap-2 pt-2">
              <button onClick={sendMsg} disabled={saving || !msgForm.content} className={`flex-1 ${btnPrimary}`} style={{ backgroundColor: "var(--primary)" }}>{saving ? "Skickar..." : "Skicka"}</button>
              <button onClick={() => setShowMsgModal(false)} className={btnSecondary}>Avbryt</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

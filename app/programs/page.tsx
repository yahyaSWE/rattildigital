"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

type CourseData = {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  price_sek: number;
  duration_weeks: number | null;
  sessions_per_week: number;
  max_participants: number | null;
  enrolled_count: number;
  weekly_schedule: Array<{ enabled: boolean; time: string }> | null;
};

const DAY_NAMES_FULL = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];

function formatSchedule(sched: CourseData["weekly_schedule"]): string | null {
  if (!Array.isArray(sched)) return null;
  const enabled = sched
    .map((d, i) => (d?.enabled ? { day: DAY_NAMES_FULL[i], time: d.time } : null))
    .filter((x): x is { day: string; time: string } => x !== null);
  if (enabled.length === 0) return null;
  // Group days sharing the same time: "Mondays & Thursdays at 18:00"
  const byTime = new Map<string, string[]>();
  for (const { day, time } of enabled) {
    if (!byTime.has(time)) byTime.set(time, []);
    byTime.get(time)!.push(day);
  }
  return Array.from(byTime.entries())
    .map(([time, days]) => `${days.join(" & ")} at ${time}`)
    .join(" · ");
}

type WaitlistForm = {
  name: string;
  email: string;
  phone: string;
  level_description: string;
};

type ApplicationForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  postal_code: string;
  city: string;
  experience: string;
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const faqs = [
  { q: "Who can join Rattil Digital Academy?", a: "Our academy welcomes children, teenagers, and adults from all over the world. Lessons are tailored to each student's level and goals." },
  { q: "Do I need previous knowledge?", a: "No. We teach complete beginners as well as intermediate and advanced students." },
  { q: "How are the lessons delivered?", a: "All lessons are conducted live online through interactive one-to-one sessions with qualified teachers." },
  { q: "Is the trial lesson really free?", a: "Yes. Your first lesson is completely free with no obligation to enroll afterward." },
];

const programPaths = [
  { title: "Quran Reading", href: "/programs/quran-reading", text: "Learn to read the Holy Quran correctly from the very beginning using a structured step-by-step approach.", points: ["Arabic Alphabet", "Letter Pronunciation", "Reading Fluency", "Personal Guidance"] },
  { title: "Tajweed", href: "/programs/tajweed", text: "Master the rules of Quran recitation and improve pronunciation with experienced teachers.", points: ["Makharij", "Tajweed Rules", "Error Correction", "Beautiful Recitation"] },
  { title: "Quran Memorization", href: "/programs/quran-memorization", text: "Follow a personalized memorization and revision plan designed around your goals.", points: ["Daily Hifz Plan", "Revision Sessions", "Progress Tracking", "Continuous Motivation"] },
  { title: "Arabic Language", href: "/programs/arabic-language", text: "Develop your speaking, listening, reading, and writing skills through interactive online lessons.", points: ["Modern Standard Arabic", "Conversation Practice", "Grammar", "Reading & Writing"] },
];

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelCls = "block text-xs font-semibold text-text-muted mb-1";

function SpotsBar({ enrolled, max }: { enrolled: number; max: number | null }) {
  if (!max) return null;
  const pct  = Math.min((enrolled / max) * 100, 100);
  const left = max - enrolled;
  const full = left <= 0;
  const low  = left > 0 && left <= 3;

  return (
    <div className="mb-5">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-text-muted">{enrolled} of {max} places taken</span>
        <span className={`font-semibold ${full ? "text-red-500" : low ? "text-amber-500" : "text-green-600"}`}>
          {full ? "Fully booked" : low ? `Only ${left} places left!` : `${left} places available`}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: full ? "#EF4444" : low ? "#F59E0B" : "var(--accent)" }} />
      </div>
    </div>
  );
}

function ApplyButton({ course, enrolledIds, appliedIds, onApply, onWaitlist }: {
  course: CourseData;
  enrolledIds: Set<string>;
  appliedIds: Set<string>;
  onApply: (course: CourseData) => void;
  onWaitlist: (course: CourseData) => void;
}) {
  const isFull     = course.max_participants !== null && course.enrolled_count >= course.max_participants;
  const isEnrolled = enrolledIds.has(course.id);
  const hasApplied = appliedIds.has(course.id);

  if (isEnrolled) {
    return <div className="w-full text-center font-semibold py-3 rounded-lg bg-green-50 text-green-600 text-sm">✓ Approved &amp; enrolled</div>;
  }
  if (hasApplied) {
    return (
      <div className="w-full text-center font-semibold py-3 rounded-lg text-sm"
        style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
        ✓ Application sent – awaiting reply
      </div>
    );
  }
  if (isFull) {
    return (
      <button onClick={() => onWaitlist(course)}
        className="block w-full text-center font-semibold py-3 rounded-lg border-2 transition-all hover:bg-amber-50"
        style={{ borderColor: "#F59E0B", color: "#B45309" }}>
        Join the waiting list
      </button>
    );
  }
  return (
    <button onClick={() => onApply(course)}
      className="block w-full text-center font-semibold py-3 rounded-lg transition-all active:scale-95 hover:opacity-90"
      style={{ backgroundColor: "var(--accent)", color: "white" }}>
      Book Free Trial
    </button>
  );
}

const emptyWaitlist: WaitlistForm       = { name: "", email: "", phone: "", level_description: "" };
const emptyApplication: ApplicationForm = { name: "", email: "", phone: "", address: "", postal_code: "", city: "", experience: "" };

export default function Programs() {
  const [courses, setCourses]         = useState<CourseData[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds]   = useState<Set<string>>(new Set());
  const [loading, setLoading]         = useState(true);
  const [openFaq, setOpenFaq]         = useState<number | null>(null);
  const [toast, setToast]             = useState("");

  // Application modal
  const [applyCourse, setApplyCourse]   = useState<CourseData | null>(null);
  const [appForm, setAppForm]           = useState<ApplicationForm>(emptyApplication);
  const [appLoading, setAppLoading]     = useState(false);
  const [appDone, setAppDone]           = useState(false);

  // Waitlist modal
  const [waitlistCourse, setWaitlistCourse] = useState<CourseData | null>(null);
  const [wForm, setWForm]                   = useState<WaitlistForm>(emptyWaitlist);
  const [wLoading, setWLoading]             = useState(false);
  const [wDone, setWDone]                   = useState(false);

  // Lock background scroll while a modal is open
  useEffect(() => {
    if (applyCourse || waitlistCourse) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = original; };
    }
  }, [applyCourse, waitlistCourse]);

  useEffect(() => {
    (async () => {
      const [coursesRes, supabase] = await Promise.all([
        fetch("/api/courses").then((r) => r.json()),
        Promise.resolve(createClient()),
      ]);
      setCourses(Array.isArray(coursesRes) ? coursesRes : []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: enr } = await supabase
          .from("enrollments").select("course_id")
          .eq("student_id", user.id).neq("status", "cancelled");
        setEnrolledIds(new Set((enr ?? []).map((e) => e.course_id)));
      }
      setLoading(false);
    })();
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  const openApply = (course: CourseData) => {
    setApplyCourse(course);
    setAppForm(emptyApplication);
    setAppDone(false);
  };

  const submitApplication = async () => {
    if (!applyCourse) return;
    if (!appForm.name || !appForm.email || !appForm.phone || !appForm.address || !appForm.postal_code || !appForm.city) {
      showToast("Please fill in all required fields (*).");
      return;
    }
    setAppLoading(true);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: applyCourse.id, ...appForm }),
    });
    const data = await res.json();
    setAppLoading(false);
    if (res.ok) {
      setAppDone(true);
      setAppliedIds((prev) => new Set([...prev, applyCourse.id]));
    } else {
      showToast(data.error ?? "Something went wrong.");
    }
  };

  const openWaitlist = (course: CourseData) => {
    setWaitlistCourse(course);
    setWForm(emptyWaitlist);
    setWDone(false);
  };

  const submitWaitlist = async () => {
    if (!waitlistCourse) return;
    if (!wForm.name || !wForm.email || !wForm.phone) {
      showToast("Please fill in your name, email and phone number.");
      return;
    }
    setWLoading(true);
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: waitlistCourse.id, ...wForm }),
    });
    const data = await res.json();
    setWLoading(false);
    if (res.ok) {
      setWDone(true);
    } else {
      showToast(data.error ?? "Something went wrong.");
    }
  };

  return (
    <>
      <Navbar />
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg max-w-sm">
          {toast}
        </div>
      )}

      {/* Application modal */}
      {applyCourse && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setApplyCourse(null); }}
        >
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col my-4 max-h-[calc(100vh-2rem)] overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--primary)" }}>
                    Book a free trial – {applyCourse.title}
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    Fill in your details and your teacher will review your application.
                  </p>
                </div>
                <button
                  onClick={() => setApplyCourse(null)}
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-600 -mr-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {appDone ? (
                <div className="px-6 py-10 text-center overflow-y-auto">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="font-semibold mb-1" style={{ color: "var(--primary)" }}>Application sent!</p>
                  <p className="text-sm text-text-muted mb-6">
                    You will hear from us by email once your teacher has reviewed your application.
                  </p>
                  <button onClick={() => setApplyCourse(null)} className="text-sm text-text-muted hover:text-text underline">
                    Close
                  </button>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-4 overflow-y-auto">
                  <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: "var(--primary-light)" }}>
                    <p className="font-semibold mb-1" style={{ color: "var(--primary)" }}>Good to know</p>
                    <p className="text-text-muted">
                      Applying is free. If your application is approved we will send invoicing details
                      separately — nothing is charged through this website.
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>Name *</label>
                    <input value={appForm.name} onChange={(e) => setAppForm(p => ({ ...p, name: e.target.value }))}
                      className={inputCls} placeholder="Your full name" />
                  </div>
                  <div>
                    <label className={labelCls}>Email *</label>
                    <input type="email" value={appForm.email} onChange={(e) => setAppForm(p => ({ ...p, email: e.target.value }))}
                      className={inputCls} placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Phone number *</label>
                    <input type="tel" value={appForm.phone} onChange={(e) => setAppForm(p => ({ ...p, phone: e.target.value }))}
                      className={inputCls} placeholder="+46 70 123 45 67" />
                  </div>
                  <div>
                    <label className={labelCls}>Street address *</label>
                    <input value={appForm.address} onChange={(e) => setAppForm(p => ({ ...p, address: e.target.value }))}
                      className={inputCls} placeholder="1 Main Street" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Postcode *</label>
                      <input value={appForm.postal_code} onChange={(e) => setAppForm(p => ({ ...p, postal_code: e.target.value }))}
                        className={inputCls} placeholder="123 45" />
                    </div>
                    <div>
                      <label className={labelCls}>City *</label>
                      <input value={appForm.city} onChange={(e) => setAppForm(p => ({ ...p, city: e.target.value }))}
                        className={inputCls} placeholder="Stockholm" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Describe your previous experience</label>
                    <textarea value={appForm.experience} onChange={(e) => setAppForm(p => ({ ...p, experience: e.target.value }))}
                      className={`${inputCls} resize-none`} rows={3}
                      placeholder="Tell us briefly about your level and what you want to achieve..." />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setApplyCourse(null)}
                      className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-text-muted hover:bg-gray-50">
                      Cancel
                    </button>
                    <button onClick={submitApplication} disabled={appLoading}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90"
                      style={{ backgroundColor: "var(--accent)" }}>
                      {appLoading ? "Sending..." : "Send application"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Waitlist modal */}
      {waitlistCourse && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setWaitlistCourse(null); }}
        >
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col my-4 max-h-[calc(100vh-2rem)] overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--primary)" }}>
                    Join the waiting list – {waitlistCourse.title}
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    This programme is fully booked. Leave your details and we will contact you when a place opens up.
                  </p>
                </div>
                <button
                  onClick={() => setWaitlistCourse(null)}
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-600 -mr-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {wDone ? (
                <div className="px-6 py-10 text-center overflow-y-auto">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="font-semibold mb-1" style={{ color: "var(--primary)" }}>You are on the list!</p>
                  <p className="text-sm text-text-muted mb-6">
                    We will get in touch by email or phone as soon as a place opens up.
                  </p>
                  <button onClick={() => setWaitlistCourse(null)} className="text-sm text-text-muted hover:text-text underline">
                    Close
                  </button>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-4 overflow-y-auto">
                  <div>
                    <label className={labelCls}>Name *</label>
                    <input value={wForm.name} onChange={(e) => setWForm(p => ({ ...p, name: e.target.value }))}
                      className={inputCls} placeholder="Your full name" />
                  </div>
                  <div>
                    <label className={labelCls}>Email *</label>
                    <input type="email" value={wForm.email} onChange={(e) => setWForm(p => ({ ...p, email: e.target.value }))}
                      className={inputCls} placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Phone number *</label>
                    <input type="tel" value={wForm.phone} onChange={(e) => setWForm(p => ({ ...p, phone: e.target.value }))}
                      className={inputCls} placeholder="+46 70 123 45 67" />
                  </div>
                  <div>
                    <label className={labelCls}>Describe your level</label>
                    <textarea value={wForm.level_description} onChange={(e) => setWForm(p => ({ ...p, level_description: e.target.value }))}
                      className={`${inputCls} resize-none`} rows={3}
                      placeholder="Tell us briefly about your level and what you want to achieve..." />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setWaitlistCourse(null)}
                      className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-text-muted hover:bg-gray-50">
                      Cancel
                    </button>
                    <button onClick={submitWaitlist} disabled={wLoading}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                      style={{ backgroundColor: "#F59E0B" }}>
                      {wLoading ? "Sending..." : "Join the list"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div
            className="max-w-7xl mx-auto rounded-2xl px-6 sm:px-10 lg:px-16 py-16 text-center"
            style={{ backgroundColor: "var(--primary-light)" }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: "var(--primary)" }}>
              Our Programs
            </h1>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">
              Discover personalized online programs that help students of all ages build confidence in Quran recitation, memorization, Tajweed, and the Arabic language through engaging one-to-one lessons.
            </p>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12"><h2 className="text-3xl font-bold mb-4" style={{ color: "var(--primary)" }}>Choose Your Learning Path</h2><p className="text-text-muted max-w-3xl mx-auto">Whether you are taking your first steps in learning the Quran or looking to strengthen your Arabic language skills, our flexible programs are designed to meet your individual goals and learning pace.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {programPaths.map((program) => <article key={program.href} className="rounded-2xl border border-gray-100 p-7 flex flex-col"><h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>{program.title}</h2><p className="text-sm text-text-muted leading-relaxed mb-5">{program.text}</p><ul className="space-y-2 text-sm text-text-muted mb-6">{program.points.map((point) => <li key={point}>✓ {point}</li>)}</ul><Link href={program.href} className="mt-auto font-semibold text-sm" style={{ color: "var(--primary)" }}>Learn More →</Link></article>)}
            </div>
          </div>
        </section>

        {/* Programme cards */}
        <section id="available-programs" className="pb-20 pt-16" style={{ backgroundColor: "var(--surface-muted)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12"><h2 className="text-3xl font-bold mb-4" style={{ color: "var(--primary)" }}>Available Programs &amp; Pricing</h2><p className="text-text-muted">Book your free assessment lesson and receive a personalized study plan.</p></div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 h-96 animate-pulse" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center text-text-muted py-20">
                No active programmes right now. Please check back soon.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {courses.map((course, idx) => {
                  const isFull    = course.max_participants !== null && course.enrolled_count >= course.max_participants;
                  const isPopular = idx === Math.floor(courses.length / 2);
                  return (
                    <div key={course.id}
                      className={`relative rounded-2xl overflow-hidden border transition-shadow hover:shadow-lg ${
                        isPopular ? "shadow-md" : "border-gray-200 bg-white"
                      }`}
                      style={isPopular ? { borderColor: "var(--accent)" } : undefined}
                    >
                      {isPopular && (
                        <div className="text-center py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>
                          Most popular
                        </div>
                      )}
                      {isFull && (
                        <div className="text-center py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: "#F59E0B" }}>
                          Fully booked – join the waiting list
                        </div>
                      )}
                      <div className="p-8 bg-white">
                        <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                          style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                          {course.level ? (LEVEL_LABELS[course.level] ?? course.level) : "Programme"}
                        </span>

                        <h2 className="text-xl font-bold mt-4 mb-2" style={{ color: "var(--primary)" }}>{course.title}</h2>
                        {course.description && (
                          <ul className="text-text-muted text-sm leading-relaxed mb-6 space-y-1.5">
                            {course.description
                              .split(/\s*-\s+/)
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .map((item, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="shrink-0" style={{ color: "var(--accent)" }}>•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                          </ul>
                        )}

                        <div className="flex items-end gap-1 mb-1">
                          <span className="text-4xl font-bold" style={{ color: "var(--primary)" }}>
                            {(course.price_sek / 100).toLocaleString("sv-SE")}
                          </span>
                          <span className="text-text-muted mb-1">SEK/month</span>
                        </div>
                        <div className="flex gap-3 text-xs text-text-muted mb-3">
                          {course.duration_weeks && <span>{course.duration_weeks} weeks</span>}
                          {course.duration_weeks && <span>•</span>}
                          <span>{course.sessions_per_week} lessons/week</span>
                        </div>
                        {formatSchedule(course.weekly_schedule) && (
                          <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--primary-light)" }}>
                            <svg className="w-4 h-4 shrink-0" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-medium" style={{ color: "var(--primary)" }}>
                              {formatSchedule(course.weekly_schedule)}
                            </span>
                          </div>
                        )}

                        <SpotsBar enrolled={course.enrolled_count} max={course.max_participants} />

                        <ApplyButton
                          course={course}
                          enrolledIds={enrolledIds}
                          appliedIds={appliedIds}
                          onApply={openApply}
                          onWaitlist={openWaitlist}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-center text-sm text-text-muted mt-8">
              Applying is free. Invoicing details are sent separately once your application has been approved.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20" style={{ backgroundColor: "var(--surface-muted)" }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: "var(--primary)" }}>
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span className="font-medium" style={{ color: "var(--primary)" }}>{faq.q}</span>
                    <svg className={`w-5 h-5 text-text-muted transition-transform ${openFaq === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4 text-sm text-text-muted leading-relaxed border-t border-gray-100 pt-3">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/supabase/types";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Nybörjare",
  intermediate: "Mellannivå",
  advanced: "Avancerad",
};

const DAY_NAMES = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

type CourseWithCount = Course & { student_count: number };

export default function LarareKurser() {
  const [courses, setCourses] = useState<CourseWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkValues, setLinkValues] = useState<Record<string, string>>({});
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetch("/api/teacher/courses")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCourses(data);
          setLinkValues(Object.fromEntries(data.map((course: CourseWithCount) => [course.id, course.meeting_link ?? ""])));
        }
        setLoading(false);
      });
  }, []);

  const saveMeetingLink = async (courseId: string) => {
    setSavingCourseId(courseId);
    const res = await fetch("/api/teacher/courses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: courseId, meeting_link: linkValues[courseId] ?? "" }),
    });
    const data = await res.json();
    setSavingCourseId(null);
    if (!res.ok) {
      setFeedback(data.error ?? "Kunde inte spara länken.");
      setTimeout(() => setFeedback(""), 3500);
      return;
    }
    setCourses((previous) => previous.map((course) => course.id === courseId ? { ...course, meeting_link: data.meeting_link } : course));
    setFeedback("Lektionslänken är uppdaterad för alla.");
    setTimeout(() => setFeedback(""), 3500);
  };

  const formatSchedule = (sched: Course["weekly_schedule"]) => {
    if (!Array.isArray(sched)) return null;
    const enabled = sched
      .map((d, i) => (d?.enabled ? `${DAY_NAMES[i]} ${d.time}` : null))
      .filter(Boolean);
    return enabled.length > 0 ? enabled.join(" · ") : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {feedback && <div className="fixed top-4 right-4 z-50 bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">{feedback}</div>}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mina kurser</h1>
        <p className="text-gray-500 mt-1">{courses.length} kurser tilldelade dig.</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <p className="text-sm">Du är inte tilldelad någon kurs ännu. Kontakta admin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => {
            const schedule = formatSchedule(c.weekly_schedule);
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {c.level && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                          {LEVEL_LABELS[c.level] ?? c.level}
                        </span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.is_active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                        {c.is_active ? "Aktiv" : "Inaktiv"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{c.title}</h3>
                    {c.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.description}</p>}

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {c.student_count} {c.student_count === 1 ? "elev" : "elever"}
                      </span>
                      {schedule && (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {schedule}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {c.meeting_link && (
                      <a
                        href={c.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold px-4 py-2 rounded-xl text-white hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: "var(--primary)" }}
                      >
                        Starta lektion →
                      </a>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={linkValues[c.id] ?? ""}
                        onChange={(event) => setLinkValues((previous) => ({ ...previous, [c.id]: event.target.value }))}
                        placeholder="Klistra in lektionslänk"
                        aria-label={`Lektionslänk för ${c.title}`}
                        className="w-56 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={() => saveMeetingLink(c.id)}
                        disabled={savingCourseId === c.id}
                        className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {savingCourseId === c.id ? "Sparar..." : "Spara länk"}
                      </button>
                    </div>
                    <Link
                      href="/larare/elever"
                      className="text-xs font-medium px-4 py-2 rounded-xl text-center"
                      style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
                    >
                      Se elever
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

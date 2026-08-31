"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type StudentEnrollment = {
  id: string;
  enrolled_at: string;
  student: { id: string; full_name: string | null; email: string | null } | null;
  course: { id: string; title: string } | null;
};

type Student = {
  id: string;
  full_name: string | null;
  email: string | null;
  courses: { id: string; title: string }[];
};

export default function LarareElever() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgStudent, setMsgStudent] = useState<Student | null>(null);
  const [msgForm, setMsgForm] = useState({ subject: "", content: "" });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  const toast = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(""), 3000); };

  useEffect(() => {
    fetch("/api/teacher/students")
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any) => {
        if (data.error || !Array.isArray(data)) { setLoading(false); return; }
        const enrollments: StudentEnrollment[] = data;
        // Group by student
        const map = new Map<string, Student>();
        for (const e of enrollments) {
          if (!e.student) continue;
          const existing = map.get(e.student.id);
          if (existing) {
            if (e.course && !existing.courses.some((course) => course.id === e.course?.id)) {
              existing.courses.push(e.course);
            }
          } else {
            map.set(e.student.id, {
              id: e.student.id,
              full_name: e.student.full_name,
              email: e.student.email,
              courses: e.course ? [e.course] : [],
            });
          }
        }
        setStudents(Array.from(map.values()));
        setLoading(false);
      });
  }, []);

  const sendMsg = async () => {
    if (!msgStudent || !msgForm.content) return;
    setSending(true);
    const res = await fetch("/api/teacher/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient_id: msgStudent.id, ...msgForm }),
    });
    setSending(false);
    if (res.ok) {
      setMsgStudent(null);
      setMsgForm({ subject: "", content: "" });
      toast("Meddelande skickat!");
    } else {
      toast("Något gick fel.");
    }
  };

  const groupedStudents = Array.from(students.reduce((groups, student) => {
    for (const course of student.courses) {
      const group = groups.get(course.id) ?? { id: course.id, title: course.title, students: [] as Student[] };
      if (!group.students.some((item: Student) => item.id === student.id)) group.students.push(student);
      groups.set(course.id, group);
    }
    return groups;
  }, new Map<string, { id: string; title: string; students: Student[] }>()).values());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {feedback && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {feedback}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mina elever</h1>
        <p className="text-gray-500 mt-1">{students.length} elever i dina kurser.</p>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <p className="text-sm">Du har inga elever ännu. Kontakta admin för att bli tilldelad en kurs.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedStudents.map((group) => (
            <section key={group.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                <div>
                  <h2 className="font-semibold text-gray-900">{group.title}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{group.students.length} {group.students.length === 1 ? "elev" : "elever"}</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>Min kurs</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Elev</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Övriga kurser</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                {group.students.map((s) => (
                  <tr key={`${group.id}-${s.id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: "var(--primary)" }}>
                        {(s.full_name ?? s.email ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.full_name ?? "–"}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {s.courses.filter((course) => course.id !== group.id).map((course) => (
                        <span key={course.id} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                          {course.title}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/larare/elever/${s.id}`}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg text-white hover:opacity-90"
                        style={{ backgroundColor: "var(--primary)" }}
                      >
                        Anteckningar →
                      </Link>
                      <button
                        onClick={() => { setMsgStudent(s); setMsgForm({ subject: "", content: "" }); }}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
                      >
                        Meddelande
                      </button>
                    </div>
                  </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}

      {/* Message modal */}
      {msgStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Meddelande till {msgStudent.full_name ?? msgStudent.email}</h2>
              <button onClick={() => setMsgStudent(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ämne</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={msgForm.subject}
                  onChange={(e) => setMsgForm({ ...msgForm, subject: e.target.value })}
                  placeholder="T.ex. Feedback från lektionen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meddelande *</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={5}
                  value={msgForm.content}
                  onChange={(e) => setMsgForm({ ...msgForm, content: e.target.value })}
                  placeholder="Skriv ditt meddelande här..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={sendMsg}
                  disabled={sending || !msgForm.content}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  {sending ? "Skickar..." : "Skicka"}
                </button>
                <button
                  onClick={() => setMsgStudent(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

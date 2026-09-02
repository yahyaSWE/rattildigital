import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { expandIndividualBooking, expandWeeklySchedule } from "@/lib/lessons";
import { INDIVIDUAL_AREAS } from "@/lib/individual-lessons";

const levelLabels: Record<string, string> = {
  beginner: "Nybörjare",
  intermediate: "Mellannivå",
  advanced: "Avancerad",
};

const dayNames = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];

type IndividualBooking = {
  id: string;
  area: keyof typeof INDIVIDUAL_AREAS;
  starts_on: string;
  duration_minutes: number;
  meeting_link: string | null;
  teacher: { full_name: string | null } | null;
  slots: Array<{ weekday: number; start_time: string }> | null;
  exceptions: Array<{ original_date: string; replacement_start: string | null; status: string }> | null;
};

export default async function MinaKurser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/logga-in");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, course:courses(*, teacher:profiles!teacher_id(full_name))")
    .eq("student_id", user.id)
    .eq("status", "active");

  const { data: individualBookingRows } = await supabase
    .from("individual_bookings")
    .select("id, area, starts_on, duration_minutes, meeting_link, teacher:profiles!teacher_id(full_name), slots:individual_booking_slots(weekday, start_time), exceptions:individual_lesson_exceptions(original_date, replacement_start, status)")
    .eq("student_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const now = new Date();
  const horizon = new Date(now.getTime() + 60 * 86_400_000); // 60 dagar fram

  const enriched = await Promise.all(
    (enrollments ?? []).map(async (enrollment) => {
      const [{ count: total }, { count: completed }, { data: nextLessons }] = await Promise.all([
        supabase
          .from("lessons")
          .select("*", { count: "exact", head: true })
          .eq("course_id", enrollment.course_id)
          .eq("is_cancelled", false),
        supabase
          .from("lessons")
          .select("*", { count: "exact", head: true })
          .eq("course_id", enrollment.course_id)
          .eq("is_cancelled", false)
          .lt("scheduled_at", now.toISOString()),
        supabase
          .from("lessons")
          .select("scheduled_at, meeting_link, title")
          .eq("course_id", enrollment.course_id)
          .eq("is_cancelled", false)
          .gte("scheduled_at", now.toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(1),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const course = enrollment.course as any;
      const virtuals = expandWeeklySchedule(
        { id: enrollment.course_id, title: course?.title, weekly_schedule: course?.weekly_schedule, meeting_link: course?.meeting_link },
        now,
        horizon,
        1,
      );

      // Plocka närmaste lektion av (databas-lektion, virtuell lektion)
      const dbNext = nextLessons?.[0] ?? null;
      const virtNext = virtuals[0] ?? null;
      let nextLesson: { scheduled_at: string; meeting_link: string | null; title: string } | null = null;
      if (dbNext && virtNext) {
        nextLesson = new Date(dbNext.scheduled_at) <= new Date(virtNext.scheduled_at) ? dbNext : virtNext;
      } else {
        nextLesson = dbNext ?? virtNext;
      }

      return {
        ...enrollment,
        total: total ?? 0,
        completed: completed ?? 0,
        progress: total ? Math.round(((completed ?? 0) / total) * 100) : 0,
        nextLesson,
      };
    })
  );

  const individualBookings = ((individualBookingRows ?? []) as unknown as IndividualBooking[]).map((booking) => {
    const horizon = new Date(now.getTime() + 180 * 86_400_000);
    return { ...booking, nextLesson: expandIndividualBooking(booking, now, horizon)[0] ?? null };
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mina kurser</h1>
        <p className="text-gray-500 mt-1">Översikt över dina registrerade kurser.</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Gruppkurser</h2>
      {enriched.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--primary-light)" }}>
            <svg className="w-8 h-8" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Inga kurser ännu</h3>
          <p className="text-gray-500 text-sm mb-6">Du är inte anmäld till någon kurs ännu.</p>
          <Link href="/programs" className="inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl" style={{ backgroundColor: "var(--primary)" }}>
            Se tillgängliga kurser
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {enriched.map((e) => {
            const course = e.course as { title: string; level: string | null; teacher?: { full_name: string } | null } | null;
            const next = e.nextLesson as { scheduled_at: string; meeting_link: string | null; title: string } | null;
            const nextDate = next?.scheduled_at ? new Date(next.scheduled_at) : null;
            const nextStr = nextDate
              ? nextDate.toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm", weekday: "long", day: "numeric", month: "long" }) +
                " " +
                nextDate.toLocaleTimeString("sv-SE", { timeZone: "Europe/Stockholm", hour: "2-digit", minute: "2-digit" })
              : null;

            return (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {course?.level && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                          {levelLabels[course.level] ?? course.level}
                        </span>
                      )}
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-600">Aktiv</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">{course?.title}</h2>
                    {course?.teacher && <p className="text-sm text-gray-500">Lärare: {course.teacher.full_name}</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-500">Framsteg</span>
                    <span className="font-medium text-gray-900">{e.completed} / {e.total} lektioner</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${e.progress}%`, backgroundColor: "var(--primary)" }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{e.progress}% slutfört</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Nästa lektion</p>
                    <p className="text-sm font-medium text-gray-700">{nextStr ?? "Inga inbokade lektioner"}</p>
                  </div>
                  {next?.meeting_link && (
                    <a href={next.meeting_link} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold px-4 py-2 rounded-xl text-white hover:opacity-90"
                      style={{ backgroundColor: "var(--primary)" }}>
                      Gå med i lektion
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Mina individuella lektioner</h2>
          <p className="text-sm text-gray-500 mt-1">Dina personliga återkommande lektioner med läraren.</p>
        </div>
        {individualBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-sm text-gray-500">Du har inga aktiva individuella lektioner.</p>
            <Link href="/individual-lessons" className="inline-flex mt-4 text-sm font-semibold hover:underline" style={{ color: "var(--primary)" }}>Ansök om individuell lektion</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {individualBookings.map((booking) => {
              const nextDate = booking.nextLesson ? new Date(booking.nextLesson.scheduled_at) : null;
              const nextText = nextDate
                ? `${nextDate.toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm", weekday: "long", day: "numeric", month: "long" })} ${nextDate.toLocaleTimeString("sv-SE", { timeZone: "Europe/Stockholm", hour: "2-digit", minute: "2-digit" })}`
                : "Inga inbokade lektioner";
              const recurringTimes = [...(booking.slots ?? [])]
                .sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time))
                .map((slot) => `${dayNames[slot.weekday - 1]} ${slot.start_time.slice(0, 5)}`)
                .join(" · ");
              return (
                <article key={booking.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-600">Aktiv</span>
                        <span className="text-xs text-gray-400">{booking.duration_minutes} min</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{INDIVIDUAL_AREAS[booking.area] ?? booking.area}</h3>
                      <p className="text-sm text-gray-500">Lärare: {booking.teacher?.full_name ?? "Ej angiven"}</p>
                    </div>
                    <Link href="/portal/schema" className="text-sm font-medium hover:underline" style={{ color: "var(--primary)" }}>Visa i schema →</Link>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400">Återkommande tider</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">{recurringTimes || "Ingen återkommande tid angiven"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Nästa lektion</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">{nextText}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end">
                    {booking.meeting_link ? (
                      <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold px-4 py-2 rounded-xl text-white hover:opacity-90" style={{ backgroundColor: "var(--primary)" }}>Gå med i lektion</a>
                    ) : (
                      <span className="text-sm text-gray-400">Länk saknas</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

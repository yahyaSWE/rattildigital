export type WeeklySlot = { enabled: boolean; time: string } | null | undefined;
export type WeeklySchedule = WeeklySlot[];

export type VirtualLesson = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string | null;
  is_cancelled: boolean;
  virtual: true;
  course?: { title: string } | null;
};

function stockholmDate(year: number, month: number, day: number, hour: number, minute: number) {
  const target = Date.UTC(year, month, day, hour, minute);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(target));
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const shownAsUtc = Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day), Number(value.hour), Number(value.minute));
  return new Date(target - (shownAsUtc - target));
}

export function expandIndividualBooking(
  booking: { id: string; area: string; starts_on: string; duration_minutes: number; meeting_link: string | null; teacher?: { full_name?: string | null } | null; slots?: Array<{ weekday: number; start_time: string }> | null; exceptions?: Array<{ original_date: string; replacement_start: string | null; status: string }> | null },
  fromDate: Date,
  toDate: Date,
) {
  const areaNames: Record<string, string> = { quran_reading: "Quran Reading", tajweed: "Tajweed", quran_memorization: "Quran Memorization", arabic_language: "Arabic Language" };
  const out: VirtualLesson[] = [];
  const cursor = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()));
  const startsOn = new Date(`${booking.starts_on}T00:00:00Z`);
  for (; cursor <= toDate; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    if (cursor < startsOn) continue;
    const weekday = cursor.getUTCDay() === 0 ? 7 : cursor.getUTCDay();
    for (const slot of booking.slots ?? []) {
      if (slot.weekday !== weekday) continue;
      const dateKey = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-${String(cursor.getUTCDate()).padStart(2, "0")}`;
      const exception = booking.exceptions?.find((item) => item.original_date === dateKey);
      if (exception?.status === "cancelled") continue;
      const [hour, minute] = slot.start_time.slice(0, 5).split(":").map(Number);
      const scheduled = exception?.status === "rescheduled" && exception.replacement_start ? new Date(exception.replacement_start) : stockholmDate(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate(), hour, minute);
      if (scheduled < fromDate || scheduled > toDate) continue;
      out.push({ id: `individual-${booking.id}-${scheduled.toISOString()}`, course_id: booking.id, title: `Individuell ${areaNames[booking.area] ?? "lektion"}`, description: null, scheduled_at: scheduled.toISOString(), duration_minutes: booking.duration_minutes, meeting_link: booking.meeting_link, is_cancelled: false, virtual: true, course: { title: booking.teacher?.full_name ? `Med ${booking.teacher.full_name}` : "Individuell lektion" } });
    }
  }
  return out;
}

/**
 * Generera virtuella lektioner från en kurs weekly_schedule.
 * Schemaindex: 0 = måndag, 6 = söndag (samma som admin-formuläret).
 */
export function expandWeeklySchedule(
  course: {
    id: string;
    title?: string | null;
    weekly_schedule?: WeeklySchedule | null;
    meeting_link?: string | null;
  },
  fromDate: Date,
  toDate: Date,
  limit = 50,
): VirtualLesson[] {
  const schedule = course.weekly_schedule;
  if (!Array.isArray(schedule)) return [];
  if (!schedule.some((s) => s?.enabled && s.time)) return [];

  const out: VirtualLesson[] = [];
  const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const end = toDate.getTime();
  const oneDay = 86_400_000;

  for (let ms = start.getTime(); ms <= end && out.length < limit; ms += oneDay) {
    const date = new Date(ms);
    const jsDay = date.getDay(); // 0=Sön, 1=Mån
    const idx = jsDay === 0 ? 6 : jsDay - 1; // 0=Mån, 6=Sön

    const slot = schedule[idx];
    if (!slot?.enabled || !slot.time) continue;

    const [hh, mm] = slot.time.split(":").map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) continue;

    const occur = new Date(date);
    occur.setHours(hh, mm, 0, 0);
    if (occur < fromDate || occur > toDate) continue;

    out.push({
      id: `virtual-${course.id}-${occur.toISOString()}`,
      course_id: course.id,
      title: course.title ?? "Lektion",
      description: null,
      scheduled_at: occur.toISOString(),
      duration_minutes: 60,
      meeting_link: course.meeting_link ?? null,
      is_cancelled: false,
      virtual: true,
      course: course.title ? { title: course.title } : null,
    });
  }

  return out;
}

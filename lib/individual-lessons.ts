import { createAdminClient } from "@/lib/supabase/admin";

export const INDIVIDUAL_AREAS = {
  quran_reading: "Quran Reading",
  tajweed: "Tajweed",
  quran_memorization: "Quran Memorization",
  arabic_language: "Arabic Language",
} as const;

export type IndividualArea = keyof typeof INDIVIDUAL_AREAS;
export type WeeklySlot = { weekday: number; start_time: string };

export function isIndividualArea(value: unknown): value is IndividualArea {
  return typeof value === "string" && value in INDIVIDUAL_AREAS;
}

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

export function intervalsOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

export async function assertTeacherSlotsAvailable(args: {
  teacherId: string;
  slots: WeeklySlot[];
  durationMinutes: number;
  bufferMinutes: number;
  excludeBookingId?: string;
}) {
  const admin = createAdminClient();
  const [{ data: courses, error: courseError }, { data: bookings, error: bookingError }] = await Promise.all([
    admin.from("courses").select("id, title, weekly_schedule").eq("teacher_id", args.teacherId).eq("is_active", true),
    admin.from("individual_bookings")
      .select("id, duration_minutes, buffer_minutes, slots:individual_booking_slots(weekday, start_time)")
      .eq("teacher_id", args.teacherId)
      .eq("status", "active"),
  ]);
  if (courseError) throw new Error(`Kunde inte kontrollera gruppschemat: ${courseError.message}`);
  if (bookingError) throw new Error(`Kunde inte kontrollera individuella bokningar: ${bookingError.message}`);

  for (const candidate of args.slots) {
    const candidateStart = timeToMinutes(candidate.start_time);
    const candidateEnd = candidateStart + args.durationMinutes + args.bufferMinutes;

    for (const course of courses ?? []) {
      const schedule = Array.isArray(course.weekly_schedule) ? course.weekly_schedule : [];
      const groupSlot = schedule[candidate.weekday - 1] as { enabled?: boolean; time?: string } | undefined;
      if (!groupSlot?.enabled || !groupSlot.time) continue;
      const groupStart = timeToMinutes(groupSlot.time);
      if (intervalsOverlap(candidateStart, candidateEnd, groupStart, groupStart + 60)) {
        throw new Error(`Tiden krockar med gruppkursen ${course.title}.`);
      }
    }

    for (const booking of bookings ?? []) {
      if (booking.id === args.excludeBookingId) continue;
      for (const existing of booking.slots ?? []) {
        if (existing.weekday !== candidate.weekday) continue;
        const existingStart = timeToMinutes(existing.start_time);
        const existingEnd = existingStart + booking.duration_minutes + booking.buffer_minutes;
        if (intervalsOverlap(candidateStart, candidateEnd, existingStart, existingEnd)) {
          throw new Error("Tiden krockar med en annan individuell lektion.");
        }
      }
    }
  }
}

export async function createOrRecoverIndividualStudent(args: { email: string; name: string; siteUrl: string }) {
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles").select("id, role").ilike("email", args.email).limit(1).maybeSingle();
  if (profileError) throw new Error(`Kunde inte kontrollera elevkontot: ${profileError.message}`);

  let studentId = profile?.id ?? null;
  let passwordSetupLink: string | null = null;
  const redirectTo = `${args.siteUrl.replace(/\/$/, "")}/satt-losenord`;

  if (studentId) {
    const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email: args.email, options: { redirectTo } });
    if (error || !data.properties?.action_link) throw new Error(`Kunde inte skapa lösenordslänk: ${error?.message ?? "okänt fel"}`);
    passwordSetupLink = data.properties.action_link;
  } else {
    const invite = await admin.auth.admin.generateLink({
      type: "invite", email: args.email, options: { data: { full_name: args.name }, redirectTo },
    });
    if (!invite.error && invite.data.user?.id && invite.data.properties?.action_link) {
      studentId = invite.data.user.id;
      passwordSetupLink = invite.data.properties.action_link;
    } else {
      const recovery = await admin.auth.admin.generateLink({ type: "recovery", email: args.email, options: { redirectTo } });
      if (recovery.error || !recovery.data.user?.id || !recovery.data.properties?.action_link) {
        throw new Error(`Kunde inte skapa elevkonto: ${recovery.error?.message ?? invite.error?.message ?? "okänt fel"}`);
      }
      studentId = recovery.data.user.id;
      passwordSetupLink = recovery.data.properties.action_link;
    }
  }

  const profileValues = { id: studentId, email: args.email, full_name: args.name, ...(profile ? {} : { role: "student" }) };
  const { error: upsertError } = await admin.from("profiles").upsert(profileValues, { onConflict: "id" });
  if (upsertError) throw new Error(`Kunde inte säkerställa elevprofilen: ${upsertError.message}`);
  return { studentId, passwordSetupLink };
}

export type Availability = {
  id: string;
  weekday: number | null;
  start_time: string;
  end_time: string;
  lesson_duration_minutes: number;
  buffer_minutes: number;
};

export type IndividualTeacher = {
  id: string;
  full_name: string | null;
  availability: Availability[];
};

export const TEACHERS_LOAD_ERROR = "Could not load teachers. Please try again.";

function isAvailability(value: unknown): value is Availability {
  if (!value || typeof value !== "object") return false;
  const slot = value as Partial<Availability>;
  return typeof slot.id === "string"
    && (slot.weekday === null || (Number.isInteger(slot.weekday) && slot.weekday! >= 1 && slot.weekday! <= 7))
    && typeof slot.start_time === "string"
    && typeof slot.end_time === "string"
    && Number.isFinite(slot.lesson_duration_minutes) && slot.lesson_duration_minutes! > 0
    && Number.isFinite(slot.buffer_minutes) && slot.buffer_minutes! >= 0;
}

function isTeacher(value: unknown): value is IndividualTeacher {
  if (!value || typeof value !== "object") return false;
  const teacher = value as Partial<IndividualTeacher>;
  return typeof teacher.id === "string"
    && (typeof teacher.full_name === "string" || teacher.full_name === null)
    && Array.isArray(teacher.availability)
    && teacher.availability.every(isAvailability);
}

export async function loadIndividualTeachers(signal?: AbortSignal): Promise<IndividualTeacher[]> {
  const response = await fetch("/api/individual/teachers", { cache: "no-store", signal });
  if (!response.ok) throw new Error(TEACHERS_LOAD_ERROR);

  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(isTeacher)) throw new Error(TEACHERS_LOAD_ERROR);

  return data;
}

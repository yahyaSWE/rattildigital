export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: "student" | "teacher" | "admin"
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  title: string
  description: string | null
  level: "beginner" | "intermediate" | "advanced" | null
  price_sek: number
  duration_weeks: number | null
  sessions_per_week: number
  image_url: string | null
  teacher_id: string | null
  is_active: boolean
  meeting_link: string | null
  weekly_schedule: WeeklySchedule | null
  max_participants: number | null
  created_at: string
  teacher?: Profile
}

export type WeeklySchedule = Array<{ enabled: boolean; time: string }>

export type EnrollmentStatus = "pending" | "active" | "paused" | "cancelled"

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
  /** 'active' ger tillgång till lektioner och material (styrs även av RLS) */
  status: EnrollmentStatus
  course?: Course
  student?: Profile
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  description: string | null
  scheduled_at: string | null
  duration_minutes: number
  meeting_link: string | null
  is_cancelled: boolean
  created_at: string
  course?: Course
}

export interface Material {
  id: string
  lesson_id: string | null
  course_id: string | null
  title: string
  type: "pdf" | "video" | "note" | "audio" | null
  url: string | null
  file_size_bytes: number | null
  created_at: string
  lesson?: Lesson
  course?: Course
}

/** En lärares anteckning för en lektion (append-only historik) */
export interface LessonNote {
  id: string
  student_id: string
  course_id: string
  teacher_id: string | null
  lesson_date: string
  /** Vad ni gjorde / var ni slutade – syns för eleven */
  summary: string | null
  /** Läxa till nästa gång – syns för eleven */
  homework: string | null
  /** Interna anteckningar – endast lärare */
  notes: string | null
  created_at: string
  student?: Profile
  course?: Course
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject: string | null
  content: string
  is_read: boolean
  created_at: string
  sender?: Profile
  recipient?: Profile
}

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/brand";

/* TODO(brand): PLACEHOLDER. The teachers listed here previously were named
   individuals from the original project and have been removed. Fill in your
   own teachers before launch. */
const teachers = [
  {
    name: "Teacher name",
    title: "Subject or specialism",
    bio: "Placeholder text. A short introduction to the teacher: background, qualifications, how long they have taught and what they care about.",
    specialties: ["Skill", "Skill", "Skill"],
    initials: "TN",
  },
  {
    name: "Teacher name",
    title: "Subject or specialism",
    bio: "Placeholder text. A short introduction to the teacher: background, qualifications, how long they have taught and what they care about.",
    specialties: ["Skill", "Skill", "Skill"],
    initials: "TN",
  },
];

/* TODO(brand): replace with your own selling points */
const reasons = [
  "100% online – learn from home",
  "Qualified and experienced teachers",
  "Lessons tailored to the individual",
  "Flexible times that fit your schedule",
  "Course materials in the student portal",
  "Placeholder – your sixth point",
];

async function getStats() {
  try {
    const supabase = await createClient();
    const [{ count: students }, { count: teacherCount }, { count: courses }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
      supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_active", true),
    ]);
    return { students: students ?? 0, teachers: teacherCount ?? 0, courses: courses ?? 0 };
  } catch {
    return { students: 0, teachers: 0, courses: 0 };
  }
}

export default async function About() {
  const stats = await getStats();
  const courseLabel = stats.courses > 0 ? `${stats.courses}` : "3";

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div
            className="max-w-7xl mx-auto rounded-2xl px-6 sm:px-10 lg:px-16 py-16 text-center"
            style={{ backgroundColor: "var(--primary-light)" }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: "var(--primary)" }}>
              About {BRAND.name}
            </h1>
            {/* TODO(brand): placeholder copy */}
            <p className="text-text-muted text-lg leading-relaxed max-w-2xl mx-auto">
              Placeholder text. One or two sentences summarising who you are and what you exist to do.
            </p>
          </div>
        </section>

        {/* Vision */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6" style={{ color: "var(--primary)" }}>
                  Our vision and purpose
                </h2>
                {/* TODO(brand): placeholder copy – write your own vision and background */}
                <div className="space-y-4 text-text-muted leading-relaxed">
                  <p>
                    Placeholder text. The first paragraph explains why {BRAND.name} was started and
                    which need you set out to fill.
                  </p>
                  <p>
                    The second paragraph explains how the teaching works in practice and what makes
                    the setup good for the student.
                  </p>
                  <p>
                    The third paragraph explains your long-term goal and what you want students to
                    take away with them.
                  </p>
                </div>

                {/* TODO(brand): the figures below are placeholders – fill in your real values */}
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    { label: "Founded", value: "–" },
                    { label: "Happy students", value: "–" },
                    { label: "Experienced teachers", value: "–" },
                    { label: "Active programmes", value: courseLabel },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
                      <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>{item.value}</p>
                      <p className="text-sm text-text-muted mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why us */}
              <div
                className="relative rounded-3xl p-10 text-white overflow-hidden"
                style={{ background: "var(--gradient-dark)" }}
              >
                <div className="absolute top-0 right-0 opacity-10">
                  <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                    <path d="M100 10 L190 100 L100 190 L10 100 Z" stroke="white" strokeWidth="2" fill="none" />
                    <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="1.5" fill="none" />
                    <circle cx="100" cy="100" r="30" stroke="white" strokeWidth="1" fill="none" />
                    <path d="M100 40 L160 100 L100 160 L40 100 Z" stroke="white" strokeWidth="1" fill="none" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold mb-6">Why {BRAND.name}?</h3>
                <ul className="space-y-4">
                  {reasons.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: "var(--accent)" }}
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Teachers */}
        <section className="py-20" style={{ backgroundColor: "var(--surface-muted)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--primary)" }}>Our teachers</h2>
              <p className="text-text-muted max-w-xl mx-auto">
                Meet the qualified and experienced teachers who will guide you through your studies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {teachers.map((teacher, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 flex gap-6">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    {teacher.initials}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-lg" style={{ color: "var(--primary)" }}>{teacher.name}</h3>
                    <p className="text-sm font-medium mb-3" style={{ color: "var(--accent-dark)" }}>{teacher.title}</p>
                    <p className="text-text-muted text-sm leading-relaxed mb-4">{teacher.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {teacher.specialties.map((s, j) => (
                        <span
                          key={j}
                          className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
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

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/brand";

async function getStats() {
  try {
    const supabase = await createClient();
    const [{ count: students }, { count: teachers }, { count: courses }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
      supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_active", true),
    ]);
    return {
      students: students ?? 0,
      teachers: teachers ?? 0,
      courses: courses ?? 0,
    };
  } catch {
    return { students: 0, teachers: 0, courses: 0 };
  }
}

/* TODO(brand): all copy on this page is placeholder text. */
const heroChecks = [
  "Live Online Lessons",
  "One-to-One Classes",
  "Flexible Schedule",
  "Qualified Teachers",
];

const trialPoints = [
  "One-to-One Classes",
  "Flexible Timetable",
  "Male & Female Teachers",
  "Children & Adults",
  "Worldwide Online Learning",
];

const offerings = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: "Program One",
    desc: "Placeholder text. Describe the first of your main programmes in roughly two lines.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Program Two",
    desc: "Placeholder text. Describe the second of your main programmes in roughly two lines.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Program Three",
    desc: "Placeholder text. Describe the third of your main programmes in roughly two lines.",
  },
];

const steps = [
  { step: "1", title: "Choose your programme", desc: "Browse our programmes and pick the level that suits you best." },
  { step: "2", title: "Send your application", desc: "Fill in the form and we will get back to you as soon as it has been reviewed." },
  { step: "3", title: "Start learning", desc: "Log in to the student portal and get going with your teacher." },
];

const portalFeatures = [
  { title: "Direct access to the classroom", desc: "One click and you are in the video call — the same link for every lesson." },
  { title: "See your homework and where you left off", desc: "Your teacher writes down what to do next, so you always know what is coming." },
  { title: "Message your teacher", desc: "Send messages straight from the portal — no email back and forth." },
  { title: "Schedule and materials in one place", desc: "See upcoming lessons and reach your course materials whenever you want." },
];

const faqs = [
  { q: "How are the lessons delivered?", a: "All teaching takes place online over video call. You only need a computer, tablet or phone with a camera and microphone." },
  { q: "What happens if I miss a lesson?", a: "If you miss a lesson you can catch up on what you missed through the student portal." },
  { q: "What if the teacher has to cancel a lesson?", a: "Your teacher will do their best to reschedule the lesson for another time." },
  { q: "Can I apply to a programme that is full?", a: "Yes — you will be placed on the waiting list and we will contact you when a place opens up." },
  { q: "Are the programmes suitable for all ages?", a: "Placeholder answer — state which age groups you accept." },
  { q: "How does payment work?", a: "We send invoicing details separately once your application has been approved." },
];

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default async function Home() {
  const stats = await getStats();
  const courseLabel = stats.courses > 0 ? String(stats.courses) : "3";

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div
            className="max-w-7xl mx-auto rounded-2xl px-6 sm:px-10 lg:px-16 py-14 lg:py-20"
            style={{ backgroundColor: "var(--primary-light)" }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-center">
              {/* Left column */}
              <div>
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6 text-xs font-semibold tracking-wide uppercase"
                  style={{ backgroundColor: "var(--accent-light)", color: "var(--accent-dark)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent-dark)" }} />
                  Enrolment open
                </div>

                <h1
                  className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] mb-6"
                  style={{ color: "var(--primary)" }}
                >
                  Main headline describing what you offer
                </h1>

                <p className="text-base sm:text-lg text-text-muted leading-relaxed mb-9 max-w-xl">
                  Placeholder text. Two or three sentences that explain what you teach, who it is for,
                  and why a visitor should choose you. Keep it concrete and easy to scan.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                  <Link
                    href="/programs"
                    className="inline-flex items-center justify-center text-base font-semibold text-white px-7 py-3.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    Book Your Free Trial
                  </Link>
                  <Link
                    href="/programs"
                    className="inline-flex items-center justify-center text-base font-semibold px-7 py-3.5 rounded-lg border-2 transition-all hover:bg-white active:scale-95"
                    style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
                  >
                    Explore Programs
                  </Link>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {heroChecks.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "var(--primary)" }}>
                      <CheckIcon className="w-4 h-4 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right column – trial card */}
              <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10">
                <h2 className="text-2xl font-bold text-center mb-3" style={{ color: "var(--primary)" }}>
                  Start Learning Today
                </h2>
                <p className="text-center text-text-muted leading-relaxed mb-7">
                  Book a free trial lesson and meet your teacher before enrolling.
                </p>
                <ul className="space-y-3 mb-8">
                  {trialPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm text-text">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
                        style={{ backgroundColor: "var(--accent)" }}
                      />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/programs"
                  className="block w-full text-center text-sm font-semibold text-white px-5 py-3 rounded-lg transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  Book Free Trial
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-14 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center items-start gap-12 sm:gap-20 text-center">
              {/* TODO(brand): student and teacher counts are placeholders. Set your real
                  numbers, or read them from stats.students / stats.teachers above.
                  "Active programmes" already comes from the database. */}
              {[
                { value: "–", label: "Happy students" },
                { value: "–", label: "Experienced teachers" },
                { value: courseLabel, label: "Active programmes" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-bold" style={{ color: "var(--primary)" }}>{stat.value}</p>
                  <p className="text-sm text-text-muted mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What we offer */}
        <section className="py-20" style={{ backgroundColor: "var(--surface-muted)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--primary)" }}>What we offer</h2>
              <p className="text-text-muted max-w-xl mx-auto">
                Short text summarising what you offer and what makes you different.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {offerings.map((item) => (
                <div key={item.title} className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-md transition-shadow">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--primary)" }}>{item.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--primary)" }}>How it works</h2>
              <p className="text-text-muted max-w-xl mx-auto">Three simple steps to get started.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {steps.map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mb-5"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--primary)" }}>{item.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Student portal */}
        <section className="py-20" style={{ backgroundColor: "var(--primary-light)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span
                  className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                  style={{ backgroundColor: "var(--accent-light)", color: "var(--accent-dark)" }}
                >
                  Student Portal
                </span>
                <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--primary)" }}>
                  Everything in one place
                </h2>
                <p className="text-text-muted mb-8 leading-relaxed">
                  As a student you get a personal portal where you keep track of everything to do with your studies.
                </p>
                <ul className="space-y-4">
                  {portalFeatures.map((feature) => (
                    <li key={feature.title} className="flex gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: "var(--primary)" }}
                      >
                        <CheckIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: "var(--primary)" }}>{feature.title}</p>
                        <p className="text-sm text-text-muted mt-0.5">{feature.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/logga-in"
                  className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  Go to the student portal
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>

              {/* Portal preview */}
              <div className="rounded-3xl p-8 shadow-xl" style={{ background: "var(--gradient-dark)" }}>
                <div className="bg-white rounded-2xl p-5 mb-4 shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--primary-light)" }}>
                      <svg className="w-5 h-5" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Classroom</p>
                      <p className="font-semibold text-sm" style={{ color: "var(--primary)" }}>Programme name</p>
                    </div>
                  </div>
                  <div
                    className="text-xs font-semibold text-white px-4 py-2.5 rounded-lg text-center"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    Join lesson →
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Your homework</p>
                  <p className="text-sm text-text mb-3">
                    This is where the homework your teacher set for the next lesson appears.
                  </p>
                  <p className="text-xs text-text-muted">Where we left off: summary of the latest lesson</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: "var(--primary)" }}>
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details key={i} className="group rounded-xl border border-gray-100 overflow-hidden" style={{ backgroundColor: "var(--surface-muted)" }}>
                  <summary className="px-5 py-4 cursor-pointer font-semibold flex items-center justify-between list-none" style={{ color: "var(--primary)" }}>
                    {faq.q}
                    <svg className="w-5 h-5 text-text-muted transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="px-5 pb-4 text-text-muted text-sm leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/programs#faq" className="text-sm font-medium hover:underline" style={{ color: "var(--primary)" }}>
                See all questions →
              </Link>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-20" style={{ background: "var(--gradient-dark)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-white/60 mb-8 text-lg">
              A closing line that encourages the visitor to take the next step with {BRAND.name}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/programs"
                className="inline-flex items-center justify-center font-semibold text-white px-8 py-3.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: "var(--accent)" }}
              >
                Book Your Free Trial
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center border-2 border-white/30 text-white font-medium px-8 py-3.5 rounded-lg hover:bg-white/10 transition-all"
              >
                Contact us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

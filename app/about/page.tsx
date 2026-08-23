import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BRAND } from "@/lib/brand";

const values = [
  { title: "Excellence", text: "We strive for the highest standards in teaching and student support." },
  { title: "Integrity", text: "Honesty, trust, and sincerity guide every lesson and interaction." },
  { title: "Personal Growth", text: "Every student deserves a personalized path toward success." },
  { title: "Respect", text: "We create a welcoming environment for learners of all ages and backgrounds." },
];

const reasons = [
  { title: "Qualified Teachers", text: "Experienced educators committed to helping every student succeed." },
  { title: "Flexible Scheduling", text: "Study at times that fit your family's daily routine." },
  { title: "One-to-One Learning", text: "Personal attention ensures faster progress and greater confidence." },
  { title: "Worldwide Access", text: "Learn from anywhere through secure and interactive online classes." },
];

export default function About() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="max-w-7xl mx-auto rounded-2xl px-6 sm:px-10 lg:px-16 py-16 text-center" style={{ backgroundColor: "var(--primary-light)" }}>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: "var(--primary)" }}>About {BRAND.name}</h1>
            <p className="text-text-muted text-lg leading-relaxed max-w-3xl mx-auto">Empowering students around the world to learn the Quran and the Arabic language through personalized online education, experienced teachers, and a supportive learning environment.</p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-6" style={{ color: "var(--primary)" }}>Our Story</h2>
              <div className="space-y-4 text-text-muted leading-relaxed">
                <p>{BRAND.name} was founded with a simple vision: to make high-quality Quran and Arabic education accessible to students everywhere. We understand that every learner has unique goals, schedules, and learning styles.</p>
                <p>Through live one-to-one online lessons, we provide an engaging learning experience that combines authentic Islamic knowledge with modern educational methods.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="rounded-2xl p-8" style={{ backgroundColor: "var(--primary-light)" }}>
                <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--primary)" }}>Our Mission</h3>
                <p className="text-text-muted leading-relaxed">To provide accessible, high-quality online Quran and Arabic education that inspires lifelong learning and helps every student build a meaningful relationship with the Quran.</p>
              </div>
              <div className="rounded-2xl p-8" style={{ background: "var(--gradient-dark)" }}>
                <h3 className="text-2xl font-bold mb-3 text-white">Our Vision</h3>
                <p className="text-white/70 leading-relaxed">To become one of the leading online academies for Quran and Arabic education, recognized for excellence, professionalism, and student-centered learning.</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-center mb-10" style={{ color: "var(--primary)" }}>Our Core Values</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
              {values.map((value) => (
                <div key={value.title} className="rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--primary)" }}>{value.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{value.text}</p>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-bold text-center mb-10" style={{ color: "var(--primary)" }}>Why Families Choose Rattil</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {reasons.map((reason) => (
                <div key={reason.title} className="flex gap-4 rounded-2xl p-6" style={{ backgroundColor: "var(--surface-muted)" }}>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: "var(--accent)" }}>✓</span>
                  <div><h3 className="font-semibold mb-1" style={{ color: "var(--primary)" }}>{reason.title}</h3><p className="text-sm text-text-muted">{reason.text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 text-center" style={{ background: "var(--gradient-dark)" }}>
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-white mb-4">Begin Your Learning Journey Today</h2>
            <p className="text-white/70 mb-8">Book your free trial lesson and discover how {BRAND.name} can help you achieve your Quran and Arabic learning goals.</p>
            <Link href="/programs#available-programs" className="inline-flex px-8 py-3.5 rounded-lg font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>Book Your Free Trial</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

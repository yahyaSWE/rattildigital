import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const teachers = [
  {
    name: "Elsayed Gad",
    title: "Senior Quran & Tajweed Instructor",
    meta: "15 Years Experience · Al-Azhar University, Egypt",
    bio: "Sheikh Elsayed Gad has over fifteen years of experience teaching the Holy Quran, Tajweed, and memorization. A graduate of Al-Azhar University in Egypt, he has helped hundreds of students from different backgrounds develop confidence in Quran recitation through structured, engaging, and personalized lessons.",
    subjects: ["Quran Reading", "Tajweed", "Quran Memorization", "Arabic Language", "Languages: Arabic & English"],
    initials: "EG",
  },
  {
    name: "Ahmed Fraag",
    title: "Quran & Arabic Instructor",
    meta: "5 Years Experience · Al-Azhar University, Egypt",
    bio: "Ahmed Fraag is an enthusiastic Quran and Arabic instructor with five years of teaching experience. As a graduate of Al-Azhar University, he specializes in helping students strengthen their Quran reading skills while developing fluency in the Arabic language through interactive one-to-one lessons.",
    subjects: ["Quran Reading", "Tajweed", "Quran Memorization", "Arabic Language", "Personalized Learning", "Languages: Arabic & English"],
    initials: "AF",
  },
  {
    name: "Samah",
    title: "Female Quran & Arabic Instructor",
    meta: "10 Years Experience · Egypt",
    bio: "Samah is an experienced Quran and Arabic teacher with over ten years of teaching experience. She is passionate about helping women and children learn the Quran in a supportive and encouraging environment. Her lessons focus on building confidence, improving recitation, and strengthening Arabic language skills through personalized online education.",
    subjects: ["Quran Reading", "Tajweed", "Quran Memorization", "Arabic Language", "Languages: Arabic & English"],
    initials: "SA",
  },
];

const benefits = [
  { title: "Qualified Teachers", text: "Graduates from respected educational institutions with strong academic backgrounds." },
  { title: "Extensive Experience", text: "Years of teaching experience with students from different ages and backgrounds." },
  { title: "Bilingual Instruction", text: "All of our teachers speak both Arabic and English, ensuring clear communication for every student." },
  { title: "Personalized Learning", text: "Every lesson is tailored to the student's goals, pace, and learning style." },
];

export default function Teachers() {
  return <>
    <Navbar />
    <main className="flex-1">
      <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto rounded-2xl px-6 sm:px-10 lg:px-16 py-16 text-center" style={{ backgroundColor: "var(--primary-light)" }}>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: "var(--primary)" }}>Meet Our Teachers</h1>
          <p className="text-text-muted text-lg max-w-3xl mx-auto">Our experienced instructors are committed to providing high-quality Quran and Arabic education through personalized online lessons. Every teacher brings years of experience, strong academic qualifications, and a passion for helping students succeed.</p>
        </div>
      </section>
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--primary)" }}>Our Teaching Team</h2>
            <p className="text-text-muted max-w-3xl mx-auto">At Rattil Digital Academy, we carefully select our teachers based on their academic background, teaching experience, and dedication to student success. Every lesson is designed to inspire confidence, encourage progress, and build a lasting connection with the Quran and the Arabic language.</p>
          </div>
          <div className="grid grid-cols-1 gap-7">
            {teachers.map((teacher) => <article key={teacher.name} className="rounded-2xl border border-gray-100 p-7 sm:p-9 flex flex-col sm:flex-row gap-6">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0" style={{ backgroundColor: "var(--primary)" }}>{teacher.initials}</div>
              <div>
                <h3 className="text-2xl font-bold" style={{ color: "var(--primary)" }}>{teacher.name}</h3>
                <p className="font-medium mt-1" style={{ color: "var(--accent-dark)" }}>{teacher.title}</p>
                <p className="text-sm text-text-muted mt-1 mb-4">{teacher.meta}</p>
                <p className="text-text-muted leading-relaxed mb-5">{teacher.bio}</p>
                <div className="flex flex-wrap gap-2">{teacher.subjects.map((subject) => <span key={subject} className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>✓ {subject}</span>)}</div>
              </div>
            </article>)}
          </div>
        </div>
      </section>
      <section className="py-20" style={{ backgroundColor: "var(--surface-muted)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4" style={{ color: "var(--primary)" }}>Why Learn With Our Teachers?</h2>
          <p className="text-text-muted text-center max-w-3xl mx-auto mb-10">Our instructors combine authentic Islamic knowledge with modern teaching methods to provide an engaging and effective learning experience for every student.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{benefits.map((benefit) => <div key={benefit.title} className="bg-white rounded-2xl p-6"><h3 className="font-semibold mb-2" style={{ color: "var(--primary)" }}>{benefit.title}</h3><p className="text-sm text-text-muted leading-relaxed">{benefit.text}</p></div>)}</div>
        </div>
      </section>
      <section className="py-20 text-center" style={{ background: "var(--gradient-dark)" }}><div className="max-w-3xl mx-auto px-4"><h2 className="text-3xl font-bold text-white mb-4">Start Your Learning Journey Today</h2><p className="text-white/70 mb-8">Join Rattil Digital Academy and learn from experienced Quran and Arabic teachers dedicated to helping you achieve your goals through personalized online education.</p><Link href="/individual-lessons" className="inline-flex px-8 py-3.5 rounded-lg font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>Book Your Free Trial</Link></div></section>
    </main>
    <Footer />
  </>;
}

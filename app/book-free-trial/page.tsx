import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BRAND } from "@/lib/brand";

const benefits = [
  { title: "Meet Your Teacher", text: "Get to know your instructor and experience our teaching style firsthand." },
  { title: "Level Assessment", text: "We evaluate your current level to recommend the most suitable learning path." },
  { title: "Ask Questions", text: "Discuss your goals, schedule, and learning expectations with our team." },
  { title: "No Commitment", text: "The trial lesson is completely free with no obligation to continue." },
];

const steps = [
  { title: "Submit Your Request", text: "Choose a program and complete the trial lesson form with your contact details and learning preferences." },
  { title: "We Contact You", text: "Our team will review your request and contact you within 24 hours." },
  { title: "Schedule Your Lesson", text: "Choose a convenient date and time for your one-to-one online lesson." },
  { title: "Meet Your Teacher", text: "Join your free live lesson and experience our teaching approach before enrolling." },
];

export default function BookFreeTrial() {
  return <>
    <Navbar />
    <main className="flex-1">
      <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10"><div className="max-w-7xl mx-auto rounded-2xl px-6 sm:px-10 lg:px-16 py-16 text-center" style={{ backgroundColor: "var(--primary-light)" }}><h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: "var(--primary)" }}>Book Your Free Trial Lesson</h1><p className="text-text-muted text-lg max-w-3xl mx-auto">Experience personalized Quran and Arabic lessons with one of our qualified teachers. Your first lesson is completely free, allowing you to explore our teaching approach before enrolling in a program.</p></div></section>
      <section className="py-20 bg-white"><div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"><h2 className="text-3xl font-bold text-center mb-4" style={{ color: "var(--primary)" }}>Why Book a Free Trial?</h2><p className="text-text-muted text-center max-w-3xl mx-auto mb-12">Our free trial lesson gives you the opportunity to meet your teacher, evaluate your current level, and experience our interactive online learning environment with no commitment.</p><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{benefits.map((item) => <div key={item.title} className="rounded-2xl p-7" style={{ backgroundColor: "var(--surface-muted)" }}><h3 className="font-semibold mb-2" style={{ color: "var(--primary)" }}>{item.title}</h3><p className="text-sm text-text-muted leading-relaxed">{item.text}</p></div>)}</div><div className="text-center mt-10"><Link href="/programs#available-programs" className="inline-flex px-8 py-3.5 rounded-lg font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>Request Your Free Trial</Link><p className="text-sm text-text-muted mt-3">Complete the form and our team will contact you within 24 hours to arrange your free lesson.</p></div></div></section>
      <section className="py-20" style={{ backgroundColor: "var(--surface-muted)" }}><div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"><h2 className="text-3xl font-bold text-center mb-12" style={{ color: "var(--primary)" }}>What Happens Next?</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{steps.map((item, index) => <div key={item.title} className="text-center"><span className="w-12 h-12 rounded-full inline-flex items-center justify-center text-white font-bold mb-4" style={{ backgroundColor: "var(--accent)" }}>{index + 1}</span><h3 className="font-semibold mb-2" style={{ color: "var(--primary)" }}>{item.title}</h3><p className="text-sm text-text-muted leading-relaxed">{item.text}</p></div>)}</div></div></section>
      <section className="py-20 bg-white"><div className="max-w-3xl mx-auto px-4 text-center"><h2 className="text-3xl font-bold mb-4" style={{ color: "var(--primary)" }}>Need Help?</h2><p className="text-text-muted mb-8">If you have any questions before booking your free trial lesson, feel free to contact us. We are happy to help you choose the right program and answer any questions about our academy.</p><div className="flex flex-wrap justify-center gap-3"><a href={`mailto:${BRAND.email}`} className="px-7 py-3 rounded-lg font-semibold border-2" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>Email Us</a><a href={`https://wa.me/${BRAND.phoneHref.replace("+", "")}`} className="px-7 py-3 rounded-lg font-semibold text-white" style={{ backgroundColor: "var(--primary)" }}>WhatsApp</a></div></div></section>
    </main>
    <Footer />
  </>;
}

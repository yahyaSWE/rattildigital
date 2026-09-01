import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export type ProgramContent = {
  eyebrow: string;
  title: string;
  intro: string;
  assessment: string;
  overviewTitle: string;
  overview: string[];
  benefits: Array<{ title: string; text: string }>;
  learning: Array<{ title: string; text: string }>;
  steps: Array<{ title: string; text: string }>;
  schedule: string;
  price: string;
  priceFeatures: string[];
  reasons: Array<{ title: string; text: string }>;
  faqs: Array<{ q: string; a: string }>;
  ctaTitle: string;
  ctaText: string;
};

export default function ProgramDetailPage({ content }: { content: ProgramContent }) {
  return <>
    <Navbar />
    <main className="flex-1">
      <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto rounded-2xl px-6 sm:px-10 lg:px-16 py-16" style={{ backgroundColor: "var(--primary-light)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--accent-dark)" }}>{content.eyebrow}</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 max-w-4xl" style={{ color: "var(--primary)" }}>{content.title}</h1>
          <p className="text-text-muted text-lg leading-relaxed max-w-3xl mb-4">{content.intro}</p>
          <p className="text-text-muted leading-relaxed max-w-3xl mb-8">{content.assessment}</p>
          <div className="flex flex-wrap gap-3"><Link href="/individual-lessons" className="px-7 py-3.5 rounded-lg font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>Book Your Free Trial</Link><Link href="/contact" className="px-7 py-3.5 rounded-lg font-semibold border-2" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>Contact Us</Link></div>
        </div>
      </section>

      <section className="py-20 bg-white"><div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"><h2 className="text-3xl font-bold mb-6" style={{ color: "var(--primary)" }}>{content.overviewTitle}</h2><div className="space-y-4 text-text-muted leading-relaxed max-w-4xl mb-12">{content.overview.map((p) => <p key={p}>{p}</p>)}</div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{content.benefits.map((item) => <div key={item.title} className="rounded-2xl p-6" style={{ backgroundColor: "var(--surface-muted)" }}><h3 className="font-semibold mb-2" style={{ color: "var(--primary)" }}>{item.title}</h3><p className="text-sm text-text-muted leading-relaxed">{item.text}</p></div>)}</div></div></section>

      <section className="py-20" style={{ backgroundColor: "var(--surface-muted)" }}><div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-12"><h2 className="text-3xl font-bold mb-4" style={{ color: "var(--primary)" }}>What You Will Learn</h2><p className="text-text-muted">A structured, personalized curriculum designed around your level and goals.</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{content.learning.map((item) => <div key={item.title} className="bg-white rounded-2xl p-7"><h3 className="font-semibold text-lg mb-2" style={{ color: "var(--primary)" }}>{item.title}</h3><p className="text-sm text-text-muted leading-relaxed">{item.text}</p></div>)}</div></div></section>

      <section className="py-20 bg-white"><div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"><h2 className="text-3xl font-bold text-center mb-12" style={{ color: "var(--primary)" }}>How It Works</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{content.steps.map((item, index) => <div key={item.title} className="text-center"><span className="w-12 h-12 rounded-full inline-flex items-center justify-center text-white text-lg font-bold mb-4" style={{ backgroundColor: "var(--accent)" }}>{index + 1}</span><h3 className="font-semibold mb-2" style={{ color: "var(--primary)" }}>{item.title}</h3><p className="text-sm text-text-muted leading-relaxed">{item.text}</p></div>)}</div></div></section>

      <section className="py-20" style={{ backgroundColor: "var(--primary-light)" }}><div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start"><div><h2 className="text-3xl font-bold mb-5" style={{ color: "var(--primary)" }}>Flexible Lesson Schedule</h2><p className="text-text-muted leading-relaxed">{content.schedule}</p></div><div className="bg-white rounded-2xl shadow-lg p-8"><p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--accent-dark)" }}>Simple &amp; Transparent Pricing</p><p className="text-4xl font-bold mb-5" style={{ color: "var(--primary)" }}>{content.price}</p><ul className="space-y-3 text-sm text-text-muted">{content.priceFeatures.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul></div></div></section>

      <section className="py-20 bg-white"><div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"><h2 className="text-3xl font-bold text-center mb-4" style={{ color: "var(--primary)" }}>Why Choose Rattil Digital Academy?</h2><p className="text-text-muted text-center max-w-3xl mx-auto mb-12">We combine authentic education with modern online teaching and continuous personal support.</p><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{content.reasons.map((item) => <div key={item.title} className="rounded-2xl border border-gray-100 p-7"><h3 className="font-semibold mb-2" style={{ color: "var(--primary)" }}>{item.title}</h3><p className="text-sm text-text-muted leading-relaxed">{item.text}</p></div>)}</div></div></section>

      <section className="py-20" style={{ backgroundColor: "var(--surface-muted)" }}><div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"><h2 className="text-3xl font-bold text-center mb-12" style={{ color: "var(--primary)" }}>Frequently Asked Questions</h2><div className="space-y-3">{content.faqs.map((faq) => <details key={faq.q} className="group bg-white rounded-xl border border-gray-100 overflow-hidden"><summary className="px-5 py-4 cursor-pointer font-semibold list-none" style={{ color: "var(--primary)" }}>{faq.q}</summary><p className="px-5 pb-4 text-sm text-text-muted leading-relaxed">{faq.a}</p></details>)}</div></div></section>

      <section className="py-20 text-center" style={{ background: "var(--gradient-dark)" }}><div className="max-w-4xl mx-auto px-4"><h2 className="text-3xl font-bold text-white mb-4">{content.ctaTitle}</h2><p className="text-white/70 leading-relaxed mb-8">{content.ctaText}</p><Link href="/individual-lessons" className="inline-flex px-8 py-3.5 rounded-lg font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>Book Your FREE Trial</Link><p className="text-white/50 text-sm mt-4">No commitment required. Start with a free assessment lesson.</p></div></section>
    </main>
    <Footer />
  </>;
}

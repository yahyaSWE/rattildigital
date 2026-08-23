"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BRAND } from "@/lib/brand";

const inputCls =
  "w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/resend/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

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
              Contact Us
            </h1>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">
              We are here to answer your questions and help you begin your Quran and Arabic learning journey. Feel free to contact us at any time.
            </p>
          </div>
        </section>

        <section className="pb-20 pt-4 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              {/* Contact details */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--primary)" }}>Get In Touch</h2>
                  <p className="text-text-muted text-sm">Whether you have questions about our programs, trial lessons, schedules, or teachers, our team will be happy to assist you.</p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      label: "Email",
                      value: (
                        <a href={`mailto:${BRAND.email}`} className="text-sm font-medium text-text hover:text-primary">
                          {BRAND.email}
                        </a>
                      ),
                      icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      ),
                    },
                    {
                      label: "WhatsApp",
                      value: (
                        <a href={`https://wa.me/${BRAND.phoneHref.replace("+", "")}`} className="text-sm font-medium text-text hover:text-primary">
                          {BRAND.phone}
                        </a>
                      ),
                      icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.49a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.49 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
                      ),
                    },
                    {
                      label: "Languages",
                      value: <p className="text-sm font-medium text-text">Arabic, English &amp; Swedish</p>,
                      icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.05 9.5A18.02 18.02 0 016 9m7 11l4-9 4 9m-1.5-3h-5M12 5c-.7 4.2-3.2 7.7-7 10" />
                      ),
                    },
                    {
                      label: "Response time",
                      value: <p className="text-sm font-medium text-text">Within 24 hours</p>,
                      icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ),
                    },
                    {
                      label: "Teaching Mode",
                      value: <p className="text-sm font-medium text-text">100% online</p>,
                      icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                      ),
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4 bg-white rounded-xl p-4 border border-gray-100">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {item.icon}
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-0.5">{item.label}</p>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact form */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl border border-gray-100 p-8">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--primary)" }}>Send Us a Message</h2>
                  <p className="text-sm text-text-muted mb-6">Complete the form below and our team will reply as soon as possible.</p>

                  {status === "success" ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--primary-light)" }}>
                        <svg className="w-8 h-8" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--primary)" }}>Message sent!</h3>
                      <p className="text-text-muted text-sm">We will get back to you within 24 hours. Thank you for reaching out.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1.5">Name</label>
                          <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Your name"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1.5">Email</label>
                          <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="you@example.com"
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1.5">Subject</label>
                        <select
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          required
                          className={`${inputCls} bg-white`}
                        >
                          <option value="">Choose a subject</option>
                          <option value="Question about a programme">Question about a programme</option>
                          <option value="Booking a free trial">Booking a free trial</option>
                          <option value="Billing question">Billing question</option>
                          <option value="Technical support">Technical support</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1.5">Message</label>
                        <textarea
                          required
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          placeholder="Tell us about yourself and include your country, age, the program you are interested in, your preferred language and preferred lesson time..."
                          rows={5}
                          className={`${inputCls} resize-none`}
                        />
                      </div>

                      {status === "error" && (
                        <p className="text-red-500 text-sm">Something went wrong. Please try again or email us directly.</p>
                      )}

                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                        style={{ backgroundColor: "var(--accent)" }}
                      >
                        {status === "loading" ? "Sending..." : "Send message"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

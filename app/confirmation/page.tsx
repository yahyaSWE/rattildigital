import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Confirmation() {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "var(--primary-light)" }}>
            <svg className="w-10 h-10" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--primary)" }}>Thank you for your application!</h1>
          <p className="text-text-muted leading-relaxed mb-2">
            We have received your application and sent a confirmation to your email.
          </p>
          <p className="text-text-muted text-sm mb-8">
            We will review it and get back to you as soon as possible. If you are accepted you will
            receive a welcome email with a link to set your student portal password.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Back to home
            </Link>
            <Link
              href="/programs"
              className="px-6 py-3 rounded-lg font-semibold border-2 transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              See other programmes
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

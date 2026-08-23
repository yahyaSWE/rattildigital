import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BRAND } from "@/lib/brand";

export default function Privacy() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div
            className="max-w-7xl mx-auto rounded-2xl px-6 sm:px-10 py-14 text-center"
            style={{ backgroundColor: "var(--primary-light)" }}
          >
            <h1 className="text-4xl font-bold mb-3" style={{ color: "var(--primary)" }}>Privacy Policy</h1>
            <p className="text-text-muted text-sm">Last updated: August 2026</p>
          </div>
        </section>

        <section className="pb-20 pt-6">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-10 text-text leading-relaxed">

              <p>Your privacy is important to us. This Privacy Policy explains how {BRAND.name} collects, uses, and protects your personal information.</p>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>1. Data controller</h2>
                <p>
                  {BRAND.name} is the data controller for the processing of your personal data. If you
                  have questions about how we handle your data, you are welcome to contact us at{" "}
                  <a href={`mailto:${BRAND.email}`} className="underline" style={{ color: "var(--primary)" }}>
                    {BRAND.email}
                  </a>.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>2. What data do we collect?</h2>
                <p>We collect the following categories of personal data:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li><strong>Contact details:</strong> name, email address and phone number</li>
                  <li><strong>Address details:</strong> street address, postcode and city (when applying)</li>
                  <li><strong>Educational information:</strong> previous experience in the subject</li>
                  <li><strong>User account:</strong> email address and encrypted password via Supabase</li>
                  <li><strong>Communication:</strong> messages sent through our platform</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>3. Why do we process your data?</h2>
                <p>We process your personal data for the following purposes:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Handling your application and enrolment</li>
                  <li>Providing the student portal with lesson materials and schedule</li>
                  <li>Enabling communication between students and teachers</li>
                  <li>Sending information about programmes and lessons</li>
                  <li>Meeting legal obligations</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>4. Legal basis</h2>
                <p>
                  We process your personal data on the basis of contract (to fulfil the teaching
                  agreement), legitimate interest (to administer the business) and consent (for
                  marketing communications, where applicable).
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>5. How long do we keep your data?</h2>
                <p>
                  We keep your data for as long as your account is active, or as long as required to
                  fulfil the purposes above. Accounting records are kept in line with the Swedish
                  Accounting Act (7 years). You may request deletion of your account at any time.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>6. Third parties</h2>
                <p>We share data with the following service providers:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li><strong>Supabase</strong> – database and authentication (EU data storage)</li>
                  <li><strong>Resend</strong> – email delivery</li>
                  <li><strong>Vercel</strong> – web hosting</li>
                </ul>
                <p className="mt-3">
                  All providers are bound by data processing agreements and process data solely on our
                  instructions.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>7. Your rights</h2>
                <p>Under the GDPR you have the right to:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Access the data we process about you</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request erasure of your data (the &ldquo;right to be forgotten&rdquo;)</li>
                  <li>Request restriction of processing</li>
                  <li>Object to processing</li>
                  <li>Data portability</li>
                </ul>
                <p className="mt-3">
                  To exercise your rights, contact us at{" "}
                  <a href={`mailto:${BRAND.email}`} className="underline" style={{ color: "var(--primary)" }}>
                    {BRAND.email}
                  </a>. You also have the right to lodge a complaint with the{" "}
                  <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--primary)" }}>
                    Swedish Authority for Privacy Protection (IMY)
                  </a>.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>8. Cookies</h2>
                <p>
                  We use necessary cookies to manage your login session. No tracking cookies or
                  third-party advertising cookies are used.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>9. Children&apos;s privacy</h2>
                <p>Many of our students are children. Personal information relating to children is provided by a parent or legal guardian. Parents or guardians remain responsible for supervising their child&apos;s participation and communication with the academy.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>10. Contact</h2>
                <p>
                  For questions about this policy, contact us at{" "}
                  <a href={`mailto:${BRAND.email}`} className="underline" style={{ color: "var(--primary)" }}>
                    {BRAND.email}
                  </a>.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Link href="/" className="text-sm font-medium" style={{ color: "var(--primary)" }}>
                  ← Back to home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

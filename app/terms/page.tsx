import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BRAND } from "@/lib/brand";

/* TODO(brand): These terms are inherited boilerplate. Have them reviewed against how
   you actually operate — and by a lawyer — before launch. */
export default function Terms() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div
            className="max-w-7xl mx-auto rounded-2xl px-6 sm:px-10 py-14 text-center"
            style={{ backgroundColor: "var(--primary-light)" }}
          >
            <h1 className="text-4xl font-bold mb-3" style={{ color: "var(--primary)" }}>Terms and Conditions</h1>
            <p className="text-text-muted text-sm">Last updated: May 2026</p>
          </div>
        </section>

        <section className="pb-20 pt-6">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-10 text-text leading-relaxed">

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>1. About the service</h2>
                <p>
                  {BRAND.name} provides online teaching through our digital platform. Lessons take
                  place over video call and are supported by materials in the student portal. These
                  terms apply to everyone who applies to and takes part in {BRAND.name} programmes.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>2. Applications and approval</h2>
                <p>
                  Applications are made through our website. Each application is reviewed by an
                  administrator and may be approved, declined, or redirected to a different level.
                  An application becomes binding once it has been approved and confirmation has been
                  sent by email.
                </p>
              </div>

              <div>
                {/* TODO(brand): check this against your actual invoicing routine before launch. */}
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>3. Payment</h2>
                <p>
                  Programme fees are invoiced in advance. Invoicing details are sent separately once
                  an application has been approved. Prices are stated including VAT unless otherwise
                  specified.
                </p>
                <p className="mt-3">
                  Contact us for the current price list and invoicing terms.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>4. Cancellation and termination</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Cancelling a lesson:</strong> notify your teacher at least 24 hours in
                    advance. Lessons missed without notice are not replaced.
                  </li>
                  <li>
                    <strong>Ending a programme:</strong> a programme can be terminated with 30 days&apos;
                    notice. Fees already paid are not refunded, but teaching continues throughout the
                    notice period.
                  </li>
                  <li>
                    <strong>Right of withdrawal:</strong> under Swedish distance selling law you have
                    a 14-day right of withdrawal from the date of agreement, provided teaching has
                    not yet started.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>5. Missed lessons</h2>
                <p>
                  If you miss a lesson without notice, no replacement lesson is offered. In case of
                  illness or force majeure, contact your teacher as soon as possible and we will do
                  our best to find a solution.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>6. Code of conduct</h2>
                <p>{BRAND.name} is a safe and respectful environment. All participants are expected to:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Treat teachers and fellow students with respect</li>
                  <li>Keep to agreed lesson times</li>
                  <li>Use the platform for educational purposes only</li>
                  <li>Not share login details with anyone else</li>
                </ul>
                <p className="mt-3">
                  Breaching the code of conduct may result in the programme being ended without refund.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>7. Intellectual property</h2>
                <p>
                  All material in the student portal — including PDFs, videos and audio — belongs to{" "}
                  {BRAND.name} and/or the respective teacher. It may not be distributed, copied or
                  used outside the purpose of teaching.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>8. Limitation of liability</h2>
                <p>
                  {BRAND.name} is not liable for technical disruptions outside our control, such as
                  internet outages or downtime at third-party providers. We reserve the right to
                  change the lesson schedule in cases of force majeure and will offer alternative
                  times where possible.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>9. Changes to these terms</h2>
                <p>
                  We reserve the right to update these terms. Material changes will be communicated by
                  email at least 30 days in advance. Continued use of the service after the changes
                  take effect means you accept the new terms.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>10. Governing law</h2>
                <p>
                  These terms are governed by Swedish law. Disputes should first be resolved through
                  dialogue. Failing that, a dispute may be referred to the Swedish National Board for
                  Consumer Disputes (ARN) or to a general court, with Stockholm as the venue.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "var(--primary)" }}>11. Contact</h2>
                <p>
                  For questions about these terms, contact us at{" "}
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

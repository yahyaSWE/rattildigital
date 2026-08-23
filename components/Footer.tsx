import Link from "next/link";
import Image from "next/image";
import { BRAND } from "@/lib/brand";

const pageLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/teachers", label: "Teachers" },
  { href: "/contact", label: "Contact" },
  { href: "/logga-in", label: "Student Portal" },
];

export default function Footer() {
  return (
    <footer className="bg-dark text-white">
      {/* Decorative top border */}
      <div className="h-1 w-full" style={{ background: "var(--gradient-primary)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0">
                <Image
                  src={BRAND.logo}
                  alt={BRAND.logoAlt}
                  width={52}
                  height={52}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">{BRAND.name}</p>
                <p className="text-xs" style={{ color: "var(--primary-on-dark)" }}>{BRAND.tagline}</p>
              </div>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed">
              Personalized one-to-one Quran and Arabic lessons for children, adults, and families worldwide.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-white/70 mb-4">Pages</h3>
            <ul className="space-y-2">
              {pageLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-white/70 mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-white/50">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${BRAND.email}`} className="hover:text-white transition-colors">
                  {BRAND.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.49a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.49 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
                </svg>
                <a href={`https://wa.me/${BRAND.phoneHref.replace("+", "")}`} className="hover:text-white transition-colors">
                  WhatsApp: {BRAND.phone}
                </a>
              </li>
            </ul>
            <p className="text-xs text-white/40 mt-6">All lessons take place online via video call.</p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/lib/brand";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/contact", label: "Contact" },
];

type AuthState = { name: string; initial: string } | null;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState | undefined>(undefined);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setAuth(null); return; }
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();
      const name = data?.full_name ?? data?.email ?? "My account";
      setAuth({ name, initial: name.charAt(0).toUpperCase() });
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src={BRAND.logo}
              alt={BRAND.logoAlt}
              width={48}
              height={48}
              className="object-contain w-12 h-12"
              priority
            />
            <span
              className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap"
              style={{ color: "var(--primary)" }}
            >
              {BRAND.name}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href ? "text-primary" : "text-gray-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth + CTA – desktop */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            {auth === undefined ? (
              /* Loading – render nothing to avoid a flash */
              <div className="w-40 h-9" />
            ) : auth ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/portal"
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    {auth.initial}
                  </div>
                  <span className="hidden xl:block max-w-[120px] truncate">{auth.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
                >
                  Log out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/logga-in"
                  className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                >
                  Student Portal
                </Link>
                <Link
                  href="/programs"
                  className="text-sm font-semibold text-white px-5 py-2.5 rounded-lg transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  Book Free Trial
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-md text-gray-700"
            onClick={() => setOpen(!open)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            {open ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block text-sm font-medium py-2 transition-colors hover:text-primary ${
                pathname === link.href ? "text-primary" : "text-gray-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            {auth ? (
              <>
                <Link
                  href="/portal"
                  onClick={() => setOpen(false)}
                  className="block text-sm font-medium text-gray-600 py-2 hover:text-primary"
                >
                  My pages ({auth.name})
                </Link>
                <button
                  onClick={() => { setOpen(false); handleLogout(); }}
                  className="block w-full text-left text-sm font-medium text-red-500 py-2"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/logga-in"
                  onClick={() => setOpen(false)}
                  className="block text-sm font-medium text-gray-600 py-2 hover:text-primary"
                >
                  Student Portal
                </Link>
                <Link
                  href="/programs"
                  onClick={() => setOpen(false)}
                  className="block text-sm font-semibold text-white text-center px-4 py-2.5 rounded-lg"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  Book Free Trial
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

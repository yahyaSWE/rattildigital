"use client";

import { useState } from "react";
import { BRAND } from "@/lib/brand";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error, data } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error || !data.user) {
      setError("Incorrect email address or password. Please try again.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const dest =
      profile?.role === "admin" ? "/admin" :
      profile?.role === "teacher" ? "/larare" :
      "/portal";
    router.push(dest);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-dark)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-xs text-center">
          <h2 className="text-3xl font-bold mb-4">Welcome back</h2>
          <p className="text-white/70 leading-relaxed">
            Sign in to reach your programmes, see your schedule and message your teacher.
          </p>
        </div>

        {/* Decorative ornament */}
        <div className="mt-16 opacity-20">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <path d="M60 5 L115 60 L60 115 L5 60 Z" stroke="white" strokeWidth="2" fill="none" />
            <circle cx="60" cy="60" r="35" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="60" cy="60" r="18" stroke="white" strokeWidth="1" fill="none" />
            <path d="M60 25 L95 60 L60 95 L25 60 Z" stroke="white" strokeWidth="1" fill="none" />
          </svg>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:bg-white lg:rounded-l-3xl">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:bg-transparent lg:rounded-none lg:shadow-none lg:p-0">
            <Link href="/" className="flex flex-col items-center mb-8">
            <p className="font-bold text-xl" style={{ color: "var(--primary)" }}>
              {BRAND.name}
            </p>
          </Link>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--primary)" }}>Sign in</h1>
            <p className="text-text-muted">Welcome back to the student portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link href="/aterstall-losenord" className="text-xs hover:underline" style={{ color: "var(--primary)" }}>
                  Forgot your password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Your password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Not registered yet?{" "}
              <Link href="/programs" className="font-medium hover:underline" style={{ color: "var(--primary)" }}>
                See our programmes and apply
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;

  if (!user && (pathname.startsWith("/portal") || pathname.startsWith("/admin") || pathname.startsWith("/larare"))) {
    const url = req.nextUrl.clone();
    url.pathname = "/logga-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  let role: string | null = null;
  if (user && (pathname.startsWith("/admin") || pathname.startsWith("/larare") || pathname === "/logga-in")) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    role = profile?.role ?? null;
  }

  if (user && pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(role === "teacher" ? "/larare" : "/portal", req.url));
  }
  if (user && pathname.startsWith("/larare") && !["teacher", "admin"].includes(role ?? "")) {
    return NextResponse.redirect(new URL("/portal", req.url));
  }
  if (user && pathname === "/logga-in") {
    const destination = role === "admin" ? "/admin" : role === "teacher" ? "/larare" : "/portal";
    return NextResponse.redirect(new URL(destination, req.url));
  }

  return res;
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*", "/larare/:path*", "/logga-in"],
};

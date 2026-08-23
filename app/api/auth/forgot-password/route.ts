import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetEmail } from "@/lib/email";
import { enforceRateLimit, normalizeEmail } from "@/lib/security";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig förfrågan" }, { status: 400 });
  }
  const email = normalizeEmail(body.email);
  if (!email) {
    return NextResponse.json({ error: "Ogiltig e-postadress" }, { status: 400 });
  }

  const limited = await enforceRateLimit(req, "password-reset", 5, 900, email);
  if (limited) return limited;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const admin = createAdminClient();

  // Generera recovery-länk via Supabase admin (skickar inte mejl själv)
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${siteUrl}/satt-losenord`,
    },
  });

  // Säkerhet: avslöja inte om kontot finns – returnera alltid success
  if (linkErr || !linkData?.properties?.action_link) {
    return NextResponse.json({ ok: true });
  }

  await sendPasswordResetEmail({
    toEmail: email,
    resetLink: linkData.properties.action_link,
  }).catch((e) => console.error("Password reset email error:", e));

  return NextResponse.json({ ok: true });
}

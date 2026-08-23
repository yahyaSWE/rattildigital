import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function cleanString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maxLength) return null;
  return cleaned;
}

export function cleanOptionalString(value: unknown, maxLength: number): string | null {
  if (value == null || value === "") return "";
  return cleanString(value, maxLength);
}

export function normalizeEmail(value: unknown): string | null {
  const email = cleanString(value, 254)?.toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function cleanHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ");
}

function clientAddress(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}

export async function enforceRateLimit(
  req: NextRequest,
  scope: string,
  limit: number,
  windowSeconds: number,
  discriminator = "",
): Promise<NextResponse | null> {
  const rawKey = `${scope}:${clientAddress(req)}:${discriminator.toLowerCase()}`;
  const key = `${scope}:${createHash("sha256").update(rawKey).digest("hex")}`;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error(`[rate-limit:${scope}]`, error.message);
    return NextResponse.json({ error: "Tjänsten är tillfälligt otillgänglig" }, { status: 503 });
  }
  if (data !== true) {
    return NextResponse.json(
      { error: "För många försök. Vänta en stund och försök igen." },
      { status: 429, headers: { "Retry-After": String(windowSeconds) } },
    );
  }
  return null;
}

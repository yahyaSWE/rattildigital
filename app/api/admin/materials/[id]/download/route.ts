import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data: material } = await admin.from("materials").select("url").eq("id", id).maybeSingle();
  if (!material?.url) return NextResponse.json({ error: "Materialet hittades inte" }, { status: 404 });

  if (material.url.startsWith("http://") || material.url.startsWith("https://")) {
    return NextResponse.redirect(material.url);
  }
  const { data, error } = await admin.storage.from("materials").createSignedUrl(material.url, 60);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Kunde inte öppna materialet" }, { status: 500 });
  }
  return NextResponse.redirect(data.signedUrl);
}

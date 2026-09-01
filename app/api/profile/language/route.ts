import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const LANGUAGES = new Set(["sv", "en", "ar"]);

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const body = await request.json();
  if (!LANGUAGES.has(body.language)) return NextResponse.json({ error: "Ogiltigt språk" }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ preferred_language: body.language }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

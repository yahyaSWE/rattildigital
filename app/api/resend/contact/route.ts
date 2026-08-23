import { NextRequest, NextResponse } from "next/server";
import { BRAND, siteUrl } from "@/lib/brand";
import { Resend } from "resend";

// OBS: e-postklienter stödjer inte CSS-variabler – färger måste vara
// literala hex-koder. De hämtas därför från BRAND.colors, inte globals.css.
export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Saknade fält" }, { status: 400 });
    }

    const from = process.env.RESEND_FROM ?? `${BRAND.name} <noreply@${BRAND.domain}>`;

    // Skicka till oss
    await resend.emails.send({
      from,
      to: BRAND.email,
      replyTo: email,
      subject: `[Kontaktformulär] ${subject || "Meddelande från hemsidan"}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${BRAND.colors.primary};">Nytt meddelande via kontaktformuläret</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 100px;">Namn:</td>
              <td style="padding: 8px 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">E-post:</td>
              <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Ämne:</td>
              <td style="padding: 8px 0;">${subject || "–"}</td>
            </tr>
          </table>
          <hr style="border: 1px solid #eee; margin: 16px 0;" />
          <h3 style="color: #333;">Meddelande:</h3>
          <p style="color: #555; line-height: 1.6; white-space: pre-line;">${message}</p>
          <hr style="border: 1px solid #eee; margin: 16px 0;" />
          <p style="font-size: 12px; color: #999;">Skickat från ${BRAND.domain}</p>
        </div>
      `,
    });

    // Bekräftelse till avsändaren
    await resend.emails.send({
      from,
      to: email,
      subject: `Vi har mottagit ditt meddelande – ${BRAND.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, ${BRAND.colors.primaryDark}, ${BRAND.colors.primary}); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${BRAND.name}</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">${BRAND.tagline}</p>
          </div>
          <div style="padding: 32px; background: #fff; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
            <h2 style="color: ${BRAND.colors.dark};">Assalamu alaikum, ${name}!</h2>
            <p style="color: #555; line-height: 1.6;">
              Tack för ditt meddelande. Vi har mottagit det och återkommer inom 24 timmar.
            </p>
            <p style="color: #555; line-height: 1.6;">
              Under tiden är du välkommen att läsa mer om våra kurser på vår hemsida.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${siteUrl()}/programs"
                 style="background: ${BRAND.colors.primary}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Se kurser &amp; priser
              </a>
            </div>
            <hr style="border: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">
              Med vänliga hälsningar<br/>
              <strong>${BRAND.name}</strong> · ${BRAND.email}
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Resend error:", err);
    return NextResponse.json({ error: "E-postfel" }, { status: 500 });
  }
}

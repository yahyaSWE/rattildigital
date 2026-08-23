import { NextRequest, NextResponse } from "next/server";
import { BRAND, siteUrl } from "@/lib/brand";
import { Resend } from "resend";

// OBS: e-postklienter stödjer inte CSS-variabler – färger måste vara
// literala hex-koder. De hämtas därför från BRAND.colors, inte globals.css.
export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { studentName, studentEmail, courseTitle, amount } = await req.json();

    await resend.emails.send({
      from: process.env.RESEND_FROM ?? `${BRAND.name} <noreply@${BRAND.domain}>`,
      to: studentEmail,
      subject: `Bekräftelse på anmälan – ${courseTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, ${BRAND.colors.primaryDark}, ${BRAND.colors.primary}); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${BRAND.name}</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Bekräftelse på anmälan</p>
          </div>
          <div style="padding: 32px; background: #fff; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
            <h2 style="color: ${BRAND.colors.dark};">Assalamu alaikum, ${studentName}!</h2>
            <p style="color: #555; line-height: 1.6;">
              Välkommen till ${BRAND.name}! Din anmälan är bekräftad.
            </p>

            <div style="background: ${BRAND.colors.primaryLight}; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: ${BRAND.colors.primary}; margin: 0 0 12px;">Din kursbokning</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="color: #555; padding: 4px 0;">Kurs:</td>
                  <td style="font-weight: bold; color: #333;">${courseTitle}</td>
                </tr>
                <tr>
                  <td style="color: #555; padding: 4px 0;">Belopp:</td>
                  <td style="font-weight: bold; color: #333;">${amount} kr/mån</td>
                </tr>
              </table>
            </div>

            <p style="color: #555; line-height: 1.6;">
              Du kan nu logga in i din elevportal för att se ditt schema och lektionsmaterial.
            </p>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${siteUrl()}/logga-in"
                 style="background: ${BRAND.colors.primary}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Gå till elevportalen
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
    console.error("Resend confirmation error:", err);
    return NextResponse.json({ error: "E-postfel" }, { status: 500 });
  }
}

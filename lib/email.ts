import { Resend } from "resend";
import { BRAND, siteUrl } from "@/lib/brand";

const FROM = process.env.RESEND_FROM ?? `${BRAND.name} <noreply@${BRAND.domain}>`;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendNewApplicationEmail({
  toEmail,
  toName,
  applicantName,
  applicantEmail,
  courseName,
  applicationId,
}: {
  toEmail: string;
  toName: string;
  applicantName: string;
  applicantEmail: string;
  courseName: string;
  applicationId: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Ny ansökan till ${courseName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:${BRAND.colors.primary}">Ny ansökan mottagen</h2>
        <p>Hej ${toName},</p>
        <p><strong>${applicantName}</strong> (${applicantEmail}) har ansökt till kursen <strong>${courseName}</strong>.</p>
        <p>Logga in på din portal för att granska ansökan.</p>
        <a href="${siteUrl()}/larare/ansokningar"
           style="display:inline-block;margin-top:12px;padding:10px 20px;background:${BRAND.colors.primary};color:white;border-radius:8px;text-decoration:none;font-weight:600">
          Granska ansökan
        </a>
        <p style="margin-top:24px;color:#999;font-size:12px">Ansöknings-ID: ${applicationId}</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({
  toEmail,
  resetLink,
}: {
  toEmail: string;
  resetLink: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Återställ ditt lösenord – ${BRAND.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <div style="background:linear-gradient(135deg,${BRAND.colors.primaryDark},${BRAND.colors.primary});padding:32px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:22px">${BRAND.name}</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0">Återställ ditt lösenord</p>
        </div>
        <div style="padding:28px;background:#fff;border:1px solid #eee;border-radius:0 0 12px 12px">
          <p style="color:#555;line-height:1.6">
            Klicka på knappen nedan för att välja ett nytt lösenord till ditt konto. Länken är giltig i 24 timmar.
          </p>
          <div style="text-align:center;margin:28px 0">
            <a href="${resetLink}"
               style="display:inline-block;background:${BRAND.colors.primary};color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
              Välj nytt lösenord
            </a>
          </div>
          <p style="color:#999;font-size:12px;line-height:1.6">
            Om du inte begärde en lösenordsåterställning kan du ignorera detta mejl — ditt lösenord ändras inte förrän du klickar på länken och väljer ett nytt.
          </p>
          <p style="color:#999;font-size:12px;text-align:center;margin-top:24px">
            <strong>${BRAND.name}</strong> · ${BRAND.email}
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendApprovalEmail({
  toEmail,
  applicantName,
  courseName,
  passwordSetupLink,
}: {
  toEmail: string;
  applicantName: string;
  courseName: string;
  passwordSetupLink: string | null;
}) {
  const resend = getResend();
  if (!resend) return;

  const passwordBlock = passwordSetupLink
    ? `
      <div style="background:#FAFAFA;border:1px solid #EEE;border-radius:10px;padding:20px;margin:14px 0">
        <p style="margin:0 0 6px;color:#666;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Skapa konto</p>
        <p style="margin:0 0 14px;color:${BRAND.colors.dark};font-weight:600">Sätt ditt lösenord och logga in i elevportalen</p>
        <a href="${passwordSetupLink}"
           style="display:inline-block;background:white;color:${BRAND.colors.primary};border:2px solid ${BRAND.colors.primary};padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Skapa lösenord
        </a>
        <p style="margin:12px 0 0;color:#999;font-size:12px">Länken är giltig i 24 timmar.</p>
      </div>`
    : "";

  const intro = passwordSetupLink
    ? "Sätt ditt lösenord så kommer du åt din elevportal:"
    : "Du har nu tillgång till din elevportal – logga in med ditt befintliga lösenord.";

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Din ansökan till ${courseName} är godkänd!`,
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto">
        <div style="background:linear-gradient(135deg,${BRAND.colors.primaryDark},${BRAND.colors.primary});padding:32px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:22px">${BRAND.name}</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0">Din ansökan är godkänd</p>
        </div>
        <div style="padding:28px;background:#fff;border:1px solid #eee;border-radius:0 0 12px 12px">
          <h2 style="color:${BRAND.colors.dark};margin-top:0">Assalamu alaikum, ${applicantName}!</h2>
          <p style="color:#555;line-height:1.6">
            Din ansökan till <strong>${courseName}</strong> är godkänd. ${intro}
          </p>
          ${passwordBlock}
          <p style="color:#999;font-size:12px;text-align:center;margin-top:24px">
            Frågor? Kontakta oss på <a href="mailto:${BRAND.email}" style="color:${BRAND.colors.primary}">${BRAND.email}</a><br/>
            <strong>${BRAND.name}</strong>
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendApplicationStatusEmail({
  toEmail,
  applicantName,
  courseName,
  status,
  redirectCourseName,
  notes,
}: {
  toEmail: string;
  applicantName: string;
  courseName: string;
  status: "approved" | "rejected" | "redirected";
  redirectCourseName?: string;
  notes?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const subjects: Record<string, string> = {
    approved: `Grattis! Din ansökan till ${courseName} har godkänts`,
    rejected: `Svar på din ansökan till ${courseName}`,
    redirected: `Vi rekommenderar en annan kurs för dig`,
  };

  const messages: Record<string, string> = {
    approved: `Vi är glada att meddela att din ansökan till <strong>${courseName}</strong> har <strong>godkänts</strong>! Vi kontaktar dig snart med uppstartsdetaljer.`,
    rejected: `Tyvärr kan vi inte ta emot din ansökan till <strong>${courseName}</strong> just nu.`,
    redirected: `Efter att ha granskat din ansökan till <strong>${courseName}</strong> rekommenderar vi att du börjar med <strong>${redirectCourseName ?? "en annan kurs"}</strong> som passar din nuvarande nivå bättre.`,
  };

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: subjects[status],
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:${BRAND.colors.primary}">Svar på din ansökan</h2>
        <p>Hej ${applicantName},</p>
        <p>${messages[status]}</p>
        ${notes ? `<p style="background:#f9f9f9;padding:12px;border-radius:8px;color:#555"><em>"${notes}"</em></p>` : ""}
        <p style="margin-top:24px">Med vänliga hälsningar,<br/><strong>${BRAND.name}</strong></p>
      </div>
    `,
  });
}

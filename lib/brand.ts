/**
 * Varumärkesidentitet – ett ställe för namn, kontaktuppgifter och e-postfärger.
 *
 * Byt värdena här vid rebranding. Färger för sidan i övrigt ligger som
 * CSS-variabler i app/globals.css; konstanterna nedan finns bara för
 * e-postmallarna i lib/email.ts, eftersom e-postklienter inte stödjer
 * CSS-variabler och kräver literala hex-koder.
 *
 * Håll BRAND.colors i synk med :root i app/globals.css.
 */
export const BRAND = {
  /** Visningsnamn, används i rubriker, mejl och sidtitlar */
  name: "Rattil Digital Academy",

  /** Kort undertext under logotypen */
  tagline: "Quran & Arabic Online",

  /** Kontaktadress som visas publikt och i mejlsidfötter */
  email: "contact@rattildigital.com",

  /** WhatsApp-nummer som visas publikt */
  phone: "+46 72 017 17 16",

  /** Telefonnumret i länkvänligt format */
  phoneHref: "+46720171716",

  /** Domän utan protokoll, för visning i text */
  domain: "rattildigital.com",

  /**
   * Literala hex-koder för e-postmallar. Måste spegla :root i globals.css.
   * CSS-variabler fungerar inte i Gmail, Outlook m.fl.
   */
  colors: {
    primary: "#1B3B5F",
    primaryDark: "#142C47",
    primaryLight: "#F6F3EA",
    primaryBorder: "#D5DEE8",
    dark: "#142C47",
    /** Guld – används för knappar i mejl */
    accent: "#C9A46B",
  },
} as const;

/** Basadress för länkar i e-post och auth-redirects */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

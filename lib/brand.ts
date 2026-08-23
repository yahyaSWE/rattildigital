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
  // TODO(brand): bekräfta tagline
  tagline: "Quran & Arabic Online",

  /** Kontaktadress som visas publikt och i mejlsidfötter */
  // TODO(brand): byt till er riktiga adress
  email: "info@rattildigital.se",

  /** Domän utan protokoll, för visning i text */
  // TODO(brand): byt till er riktiga domän
  domain: "rattildigital.se",

  /** Sökväg till logotypen i /public */
  // TODO(brand): ersätt public/images/logo.png med Rattil-loggan
  logo: "/images/logo.png",

  /** Alt-text för logotypen */
  logoAlt: "Rattil Digital Academy logotyp",

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

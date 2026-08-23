# Kursplattform

Online-plattform för kursverksamhet med ansökningsflöde, elevportal, lärarportal och adminpanel.

> **Status:** systemet är kopierat från ett tidigare projekt, rensat från betalningsintegrationer
> och tokeniserat inför rebranding. Varumärke och publika texter är fortfarande platshållare —
> sök på `TODO(brand)` för de ställen som behöver din text.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** – styling via design-tokens
- **Supabase** – databas, autentisering, RLS
- **Resend** – transaktionella e-postutskick
- **Vercel** – deployment

Ingen betalningsintegration. Kurspriser visas publikt, men fakturering sker utanför systemet.

---

## Kom igång

### 1. Installera beroenden
```bash
npm install
```

### 2. Konfigurera miljövariabler
```bash
cp .env.local.example .env.local
```
Fyll i dina nycklar för Supabase och Resend i `.env.local`.

### 3. Sätt upp Supabase-databasen
1. Skapa ett projekt på [supabase.com](https://supabase.com)
2. Gå till **SQL Editor**
3. Kör hela innehållet i `supabase/schema.sql` — den innehåller alla tabeller, index, RLS-policies och triggers
4. Valfritt: kör `supabase/seed.sql` för exempeldata

### 4. Starta lokalt
```bash
npm run dev
```
Öppna [http://localhost:3000](http://localhost:3000)

---

## Rebranding

All varumärkesidentitet är samlad på två ställen:

| Vad | Var |
|-----|-----|
| Färger, gradienter, typsnitt | `app/globals.css` — `:root`-blocket |
| Namn, tagline, e-post, domän, logotyp | `lib/brand.ts` — `BRAND`-objektet |

Byt värdena där så slår ändringen igenom i hela appen. Logotypfilen ligger i
`public/images/` och pekas ut av `BRAND.logo`.

**Viktigt:** e-postmallar kan inte använda CSS-variabler (e-postklienter stödjer dem inte),
så färgerna i `lib/email.ts` och `app/api/resend/*` hämtas från `BRAND.colors`. Håll det
objektet i synk med `:root` i `globals.css`.

---

## Projektstruktur

```
├── app/
│   ├── page.tsx                  # Startsida
│   ├── om-oss/                   # Om oss
│   ├── kurser/                   # Kurser, ansökningsformulär, väntelista
│   ├── kontakt/                  # Kontaktformulär
│   ├── logga-in/                 # Inloggning
│   ├── portal/                   # Elevportal (skyddad)
│   │   ├── kurser/  schema/  material/  meddelanden/  profil/
│   ├── larare/                   # Lärarportal (skyddad)
│   │   ├── ansokningar/  elever/  kurser/  meddelanden/
│   ├── admin/                    # Adminpanel (skyddad)
│   └── api/                      # API-routes
├── components/                   # Navbar, Footer, ScrollToTop
├── lib/
│   ├── brand.ts                  # Varumärkeskonstanter
│   ├── email.ts                  # E-postmallar (Resend)
│   ├── approval.ts               # Godkännandeflöde för ansökningar
│   ├── lessons.ts                # Expandering av veckoschema
│   └── supabase/                 # Klienter, typer, behörighetskontroller
├── proxy.ts                      # Auth-skydd för /portal, /larare, /admin
└── supabase/
    ├── schema.sql                # Komplett schema – kör denna
    └── seed.sql                  # Exempeldata (valfritt)
```

---

## Roller och flöden

Tre roller styrs av `profiles.role`: `student`, `teacher`, `admin`.

**Ansökningsflödet:**
1. Besökare fyller i ansökan på `/kurser`
2. Lärare eller admin granskar under `/larare/ansokningar` respektive `/admin`
3. Vid godkännande skapas ett elevkonto, en enrollment sätts till `active`,
   och eleven får ett välkomstmejl med länk för att sätta lösenord
4. Eleven loggar in och ser sitt schema, sitt material och kan meddela läraren

**Åtkomstkontroll:** en elev ser en kurs lektioner och material endast när
`enrollments.status = 'active'`. Detta upprätthålls i RLS, inte bara i UI:t.

---

## Driftsättning på Vercel

1. Pusha koden till GitHub
2. Importera repot på [vercel.com](https://vercel.com)
3. Lägg till miljövariablerna från `.env.local.example` under Settings
4. Sätt `NEXT_PUBLIC_SITE_URL` till produktionsdomänen
5. Deployera — Vercel hanterar SSL automatiskt

---

## E-post via Resend

Utskick som skickas:

| Trigger | Mottagare |
|---------|-----------|
| Ny ansökan | Läraren för kursen |
| Ansökan mottagen | Den sökande |
| Ansökan godkänd | Den sökande (med lösenordslänk) |
| Ansökan nekad/hänvisad | Den sökande |
| Kontaktformulär | Verksamheten + bekräftelse till avsändaren |
| Glömt lösenord | Användaren |

Verifiera din domän på [resend.com](https://resend.com) och sätt `RESEND_FROM`
till en adress på den domänen.

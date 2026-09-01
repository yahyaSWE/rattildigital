"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type PortalLanguage = "sv" | "en" | "ar";

const translations: Record<"en" | "ar", Record<string, string>> = {
  en: {
    "Inga olästa":"None unread", "Inga väntande":"None pending",
    "Översikt":"Overview", "Mina kurser":"My courses", "Schema":"Schedule", "Lektionsmaterial":"Lesson material", "Meddelanden":"Messages", "Min profil":"My profile",
    "Elevportal":"Student portal", "Lärarportal":"Teacher portal", "Inloggad som":"Signed in as", "Logga ut":"Log out", "Språk":"Language",
    "Välkommen till din lärarportal.":"Welcome to your teacher portal.", "Elever totalt":"Total students", "Olästa meddelanden":"Unread messages", "Ansökningar":"Applications", "Senaste elever":"Latest students",
    "Här är en översikt av dina kurser och kommande lektioner.":"Here is an overview of your courses and upcoming lessons.", "Lektionsrum":"Lesson room", "Klicka för att gå med i Microsoft Teams-mötet.":"Click to join the Microsoft Teams meeting.", "Läxa till nästa lektion":"Homework for the next lesson", "Din läxa":"Your homework", "Var slutade vi senast":"Where we last stopped", "Aktiva kurser":"Active courses", "Slutförda lektioner":"Completed lessons", "Kommande lektioner":"Upcoming lessons", "Snabblänkar":"Quick links", "Aktiv":"Active", "Okänd kurs":"Unknown course", "Kurs":"Course",
    "Översikt över dina registrerade kurser.":"Overview of your enrolled courses.", "Inga kurser ännu":"No courses yet", "Du är inte anmäld till någon kurs ännu.":"You are not enrolled in a course yet.", "Nybörjare":"Beginner", "Mellannivå":"Intermediate", "Avancerad":"Advanced", "Framsteg":"Progress", "Nästa lektion":"Next lesson", "Inga inbokade lektioner":"No scheduled lessons",
    "Dina lektioner visade i kalender.":"Your lessons shown in the calendar.", "Lektion":"Lesson", "Idag":"Today", "Inga lektioner denna dag.":"No lessons on this day.", "Länk saknas":"Link missing", "Gå med":"Join", "Visa i kalender":"Show in calendar", "Inga lektioner inbokade":"No lessons scheduled", "Grupplektioner och individuella lektioner syns här när de har bokats.":"Group and individual lessons appear here once booked.",
    "Filer, videos och anteckningar från dina lektioner.":"Files, videos and notes from your lessons.", "Inget material ännu":"No material yet", "Material läggs upp av din lärare inför och efter lektionerna.":"Material is uploaded by your teacher before and after lessons.", "Anteckning":"Note", "Ljud":"Audio", "Ladda ner":"Download",
    "Kommunikation med dina lärare.":"Communication with your teachers.", "Kommunikation med dina elever.":"Communication with your students.", "Konversationer":"Conversations", "Inga meddelanden ännu.":"No messages yet.", "Lärare":"Teacher", "Elev":"Student", "Du: ":"You: ", "Välj en konversation":"Select a conversation", "eller skriv ett nytt meddelande till din lärare":"or write a new message to your teacher", "eller skriv ett nytt meddelande till en elev":"or write a new message to a student", "Nytt meddelande":"New message", "Till *":"To *", "Ingen lärare tilldelad":"No teacher assigned", "Välj elev…":"Select student…", "Ämne (valfritt)":"Subject (optional)", "Meddelande *":"Message *", "Skriv ditt meddelande här…":"Write your message here…", "Skriv ditt meddelande här...":"Write your message here...", "Skicka":"Send", "Skickar…":"Sending…", "Enter för att skicka · Shift+Enter för ny rad":"Enter to send · Shift+Enter for a new line", "Skicka (Enter)":"Send (Enter)",
    "Uppdatera ditt namn och lösenord här.":"Update your name and password here.", "Profilinformation":"Profile information", "Fullständigt namn":"Full name", "Ditt namn":"Your name", "E-postadress":"Email address", "E-postadressen kan ej ändras här. Kontakta administratören.":"The email address cannot be changed here. Contact the administrator.", "Spara ändringar":"Save changes", "Sparar...":"Saving...", "Sparat!":"Saved!", "Byt lösenord":"Change password", "Nytt lösenord":"New password", "Bekräfta nytt lösenord":"Confirm new password", "Minst 6 tecken":"At least 6 characters", "Upprepa lösenordet":"Repeat the password", "Byter...":"Changing...", "Lösenord bytt!":"Password changed!",
    "Mina elever":"My students", "Du har inga elever ännu. Kontakta admin för att bli tilldelad en kurs.":"You have no students yet. Contact admin to be assigned a course.", "Min kurs":"My course", "Övriga kurser":"Other courses", "Ämne":"Subject", "T.ex. Feedback från lektionen":"E.g. feedback from the lesson", "Du är inte tilldelad någon kurs ännu. Kontakta admin.":"You have not been assigned a course yet. Contact admin.", "Klistra in lektionslänk":"Paste lesson link",
    "E-post":"Email", "Adress":"Address", "Erfarenhet / nivå":"Experience / level", "Anteckningar":"Notes", "Beslut":"Decision", "Hänvisa till kurs":"Redirect to course", "Välj kurs...":"Select course...", "Anteckning till sökande (valfri)":"Note to applicant (optional)", "Sökande får automatiskt ett e-postmeddelande med ditt svar.":"The applicant automatically receives an email with your response.", "Godkänn":"Approve", "Avslå":"Reject", "Väntar":"Pending",
    "Tillgänglighet":"Availability", "Ange återkommande tider. Längden och pausen används när eleven ser bokningsbara starttider.":"Add recurring times. Lesson length and buffer are used when students see bookable start times.", "Veckodag":"Weekday", "Från":"From", "Till":"To", "Längd (min)":"Length (min)", "Paus (min)":"Buffer (min)", "Lägg till tillgänglig tid":"Add available time", "Återkommande tider":"Recurring times", "Inga tider har lagts in.":"No times have been added.", "Ta bort":"Remove", "Undantag":"Exceptions", "Blockera en hel dag vid ledighet eller avvikelse.":"Block a full day for leave or exceptions.", "Orsak (valfritt)":"Reason (optional)", "Lägg till undantag":"Add exception",
    "Individuella lektioner":"Individual lessons", "Granska ansökningar och se alla återkommande individuella bokningar.":"Review applications and view all recurring individual bookings.", "Hantera lärare":"Manage teacher", "Välj lärare":"Select teacher", "Boka elev manuellt":"Book student manually", "Namn":"Name", "Telefon":"Phone", "Skapa för bokning":"Create for booking", "Väntande ansökningar":"Pending applications", "Inga ansökningar väntar.":"No applications are waiting.", "Har bett om annan tid":"Requested another time", "Granska →":"Review →", "Ingen tidigare erfarenhet angiven.":"No previous experience provided.", "Önskemål:":"Request:", "Längd":"Length", "Paus":"Buffer", "Startdatum":"Start date", "Möteslänk":"Meeting link", "Återkommande lektioner per vecka":"Recurring lessons per week", "+ Lägg till lektion":"+ Add lesson", "Godkänn och boka":"Approve and book", "Stäng":"Close", "Aktiva bokningar":"Active bookings", "Inga individuella lektioner är bokade.":"No individual lessons are booked.", "Öppna länk":"Open link", "Ändra länk":"Change link", "Omboka/ställ in":"Reschedule/cancel", "Samlat veckoschema":"Combined weekly schedule", "Grupp":"Group", "Individuell":"Individual",
    "Ny anteckning":"New note", "Lektionsdatum":"Lesson date", "Tidigare anteckningar":"Previous notes", "Vad ni gjorde":"What you covered", "Läxa":"Homework", "Intern anteckning":"Internal note", "Eleven hittades inte eller är inte i någon av dina kurser.":"The student was not found or is not in one of your courses.",
    "Godkänd":"Approved", "Godkända":"Approved", "Hänvisad":"Redirected", "Hänvisade":"Redirected", "→ Hänvisa till annan kurs":"→ Redirect to another course", "✓ Godkänn":"✓ Approve", "✓ Aktiv kursplats":"✓ Active enrollment", "⚠ Saknar aktiv kursplats":"⚠ Active enrollment missing", "Skicka svar":"Send response", "Skicka välkomstmejl igen":"Resend welcome email", "Spara anteckning":"Save note", "Spara länk":"Save link", "Allmänt material":"General material", "🌐 Allmänt material":"🌐 General material", "Okänd":"Unknown", "Något gick fel.":"Something went wrong.", "Kunde inte spara. Försök igen.":"Could not save. Please try again.", "Kunde inte byta lösenord.":"Could not change the password.", "Lösenordet måste vara minst 6 tecken.":"The password must be at least 6 characters.", "Lösenorden matchar inte.":"The passwords do not match.", "Spara nytt lösenord":"Save new password", "Skapa nytt lösenord":"Create new password", "Lösenord uppdaterat!":"Password updated!", "Du skickas nu till elevportalen...":"You are being redirected to the student portal...",
    "Januari":"January", "Februari":"February", "Mars":"March", "April":"April", "Maj":"May", "Juni":"June", "Juli":"July", "Augusti":"August", "September":"September", "Oktober":"October", "November":"November", "December":"December", "Mån":"Mon", "Tis":"Tue", "Ons":"Wed", "Tor":"Thu", "Fre":"Fri", "Lör":"Sat", "Sön":"Sun", "Måndag":"Monday", "Tisdag":"Tuesday", "Onsdag":"Wednesday", "Torsdag":"Thursday", "Fredag":"Friday", "Lördag":"Saturday", "Söndag":"Sunday", "Igår":"Yesterday"
  },
  ar: {
    "Inga olästa":"لا توجد رسائل غير مقروءة", "Inga väntande":"لا توجد طلبات معلقة",
    "Översikt":"نظرة عامة", "Mina kurser":"دوراتي", "Schema":"الجدول", "Lektionsmaterial":"مواد الدروس", "Meddelanden":"الرسائل", "Min profil":"ملفي الشخصي",
    "Elevportal":"بوابة الطالب", "Lärarportal":"بوابة المعلم", "Inloggad som":"مسجل الدخول باسم", "Logga ut":"تسجيل الخروج", "Språk":"اللغة",
    "Välkommen till din lärarportal.":"مرحبًا بك في بوابة المعلم.", "Elever totalt":"إجمالي الطلاب", "Olästa meddelanden":"رسائل غير مقروءة", "Väntande ansökningar":"طلبات قيد الانتظار", "Mina elever":"طلابي", "Ansökningar":"الطلبات", "Senaste elever":"أحدث الطلاب",
    "Här är en översikt av dina kurser och kommande lektioner.":"إليك نظرة عامة على دوراتك ودروسك القادمة.", "Lektionsrum":"غرفة الدرس", "Klicka för att gå med i Microsoft Teams-mötet.":"انقر للانضمام إلى اجتماع Microsoft Teams.", "Läxa till nästa lektion":"واجب الدرس القادم", "Din läxa":"واجبك", "Var slutade vi senast":"أين توقفنا آخر مرة", "Aktiva kurser":"الدورات النشطة", "Slutförda lektioner":"الدروس المكتملة", "Kommande lektioner":"الدروس القادمة", "Snabblänkar":"روابط سريعة", "Aktiv":"نشط", "Okänd kurs":"دورة غير معروفة", "Kurs":"الدورة",
    "Översikt över dina registrerade kurser.":"نظرة عامة على دوراتك المسجلة.", "Inga kurser ännu":"لا توجد دورات بعد", "Du är inte anmäld till någon kurs ännu.":"لم تسجل في أي دورة بعد.", "Nybörjare":"مبتدئ", "Mellannivå":"متوسط", "Avancerad":"متقدم", "Lärare":"المعلم", "Framsteg":"التقدم", "Nästa lektion":"الدرس القادم", "Inga inbokade lektioner":"لا توجد دروس مجدولة",
    "Dina lektioner visade i kalender.":"دروسك معروضة في التقويم.", "Lektion":"درس", "Idag":"اليوم", "Inga lektioner denna dag.":"لا توجد دروس في هذا اليوم.", "Länk saknas":"الرابط غير متوفر", "Gå med":"انضم", "Visa i kalender":"عرض في التقويم", "Inga lektioner inbokade":"لا توجد دروس مجدولة", "Grupplektioner och individuella lektioner syns här när de har bokats.":"تظهر دروس المجموعات والدروس الفردية هنا بعد حجزها.",
    "Filer, videos och anteckningar från dina lektioner.":"ملفات وفيديوهات وملاحظات من دروسك.", "Inget material ännu":"لا توجد مواد بعد", "Material läggs upp av din lärare inför och efter lektionerna.":"يرفع معلمك المواد قبل الدروس وبعدها.", "Anteckning":"ملاحظة", "Ljud":"صوت", "Ladda ner":"تنزيل",
    "Kommunikation med dina lärare.":"التواصل مع معلميك.", "Kommunikation med dina elever.":"التواصل مع طلابك.", "Konversationer":"المحادثات", "Inga meddelanden ännu.":"لا توجد رسائل بعد.", "Elev":"الطالب", "Du: ":"أنت: ", "Välj en konversation":"اختر محادثة", "eller skriv ett nytt meddelande till din lärare":"أو اكتب رسالة جديدة لمعلمك", "eller skriv ett nytt meddelande till en elev":"أو اكتب رسالة جديدة لطالب", "Nytt meddelande":"رسالة جديدة", "Till *":"إلى *", "Ingen lärare tilldelad":"لم يتم تعيين معلم", "Välj elev…":"اختر طالبًا…", "Ämne (valfritt)":"الموضوع (اختياري)", "Meddelande *":"الرسالة *", "Skriv ditt meddelande här…":"اكتب رسالتك هنا…", "Skriv ditt meddelande här...":"اكتب رسالتك هنا...", "Skicka":"إرسال", "Skickar…":"جارٍ الإرسال…", "Enter för att skicka · Shift+Enter för ny rad":"Enter للإرسال · Shift+Enter لسطر جديد", "Skicka (Enter)":"إرسال (Enter)",
    "Uppdatera ditt namn och lösenord här.":"حدّث اسمك وكلمة المرور هنا.", "Profilinformation":"معلومات الملف الشخصي", "Fullständigt namn":"الاسم الكامل", "Ditt namn":"اسمك", "E-postadress":"البريد الإلكتروني", "E-postadressen kan ej ändras här. Kontakta administratören.":"لا يمكن تغيير البريد الإلكتروني هنا. تواصل مع الإدارة.", "Spara ändringar":"حفظ التغييرات", "Sparar...":"جارٍ الحفظ...", "Sparat!":"تم الحفظ!", "Byt lösenord":"تغيير كلمة المرور", "Nytt lösenord":"كلمة مرور جديدة", "Bekräfta nytt lösenord":"تأكيد كلمة المرور الجديدة", "Minst 6 tecken":"6 أحرف على الأقل", "Upprepa lösenordet":"أعد كتابة كلمة المرور", "Byter...":"جارٍ التغيير...", "Lösenord bytt!":"تم تغيير كلمة المرور!",
    "Du har inga elever ännu. Kontakta admin för att bli tilldelad en kurs.":"ليس لديك طلاب بعد. تواصل مع الإدارة لتعيين دورة.", "Min kurs":"دورتي", "Övriga kurser":"دورات أخرى", "Ämne":"الموضوع", "T.ex. Feedback från lektionen":"مثال: ملاحظات من الدرس", "Du är inte tilldelad någon kurs ännu. Kontakta admin.":"لم يتم تعيين دورة لك بعد. تواصل مع الإدارة.", "Klistra in lektionslänk":"ألصق رابط الدرس",
    "E-post":"البريد الإلكتروني", "Telefon":"الهاتف", "Adress":"العنوان", "Erfarenhet / nivå":"الخبرة / المستوى", "Anteckningar":"ملاحظات", "Beslut":"القرار", "Hänvisa till kurs":"تحويل إلى دورة", "Välj kurs...":"اختر دورة...", "Anteckning till sökande (valfri)":"ملاحظة لمقدم الطلب (اختياري)", "Sökande får automatiskt ett e-postmeddelande med ditt svar.":"سيتلقى مقدم الطلب ردك تلقائيًا عبر البريد الإلكتروني.", "Godkänn":"موافقة", "Avslå":"رفض", "Väntar":"قيد الانتظار",
    "Tillgänglighet":"الأوقات المتاحة", "Ange återkommande tider. Längden och pausen används när eleven ser bokningsbara starttider.":"أضف أوقاتًا متكررة. تُستخدم مدة الدرس والفاصل لعرض الأوقات القابلة للحجز.", "Veckodag":"يوم الأسبوع", "Från":"من", "Till":"إلى", "Längd (min)":"المدة (دقيقة)", "Paus (min)":"الفاصل (دقيقة)", "Lägg till tillgänglig tid":"إضافة وقت متاح", "Återkommande tider":"أوقات متكررة", "Inga tider har lagts in.":"لم تتم إضافة أوقات.", "Ta bort":"إزالة", "Undantag":"الاستثناءات", "Blockera en hel dag vid ledighet eller avvikelse.":"احظر يومًا كاملًا للإجازة أو الاستثناء.", "Orsak (valfritt)":"السبب (اختياري)", "Lägg till undantag":"إضافة استثناء",
    "Individuella lektioner":"دروس فردية", "Granska ansökningar och se alla återkommande individuella bokningar.":"راجع الطلبات واعرض جميع الحجوزات الفردية المتكررة.", "Hantera lärare":"إدارة المعلم", "Välj lärare":"اختر المعلم", "Boka elev manuellt":"حجز طالب يدويًا", "Namn":"الاسم", "Skapa för bokning":"إنشاء للحجز", "Inga ansökningar väntar.":"لا توجد طلبات قيد الانتظار.", "Har bett om annan tid":"طلب وقتًا آخر", "Granska →":"مراجعة ←", "Ingen tidigare erfarenhet angiven.":"لم تُذكر خبرة سابقة.", "Önskemål:":"الطلب:", "Längd":"المدة", "Paus":"الفاصل", "Startdatum":"تاريخ البدء", "Möteslänk":"رابط الاجتماع", "Återkommande lektioner per vecka":"دروس متكررة أسبوعيًا", "+ Lägg till lektion":"+ إضافة درس", "Godkänn och boka":"موافقة وحجز", "Stäng":"إغلاق", "Aktiva bokningar":"الحجوزات النشطة", "Inga individuella lektioner är bokade.":"لا توجد دروس فردية محجوزة.", "Öppna länk":"فتح الرابط", "Ändra länk":"تغيير الرابط", "Omboka/ställ in":"إعادة الجدولة/الإلغاء", "Samlat veckoschema":"الجدول الأسبوعي الموحد", "Grupp":"مجموعة", "Individuell":"فردي",
    "Ny anteckning":"ملاحظة جديدة", "Lektionsdatum":"تاريخ الدرس", "Tidigare anteckningar":"ملاحظات سابقة", "Vad ni gjorde":"ما تمت دراسته", "Läxa":"الواجب", "Intern anteckning":"ملاحظة داخلية", "Eleven hittades inte eller är inte i någon av dina kurser.":"لم يتم العثور على الطالب أو أنه ليس ضمن دوراتك.",
    "Godkänd":"مقبول", "Godkända":"المقبولة", "Hänvisad":"محوّل", "Hänvisade":"المحوّلة", "→ Hänvisa till annan kurs":"← تحويل إلى دورة أخرى", "✓ Godkänn":"✓ موافقة", "✓ Aktiv kursplats":"✓ تسجيل نشط", "⚠ Saknar aktiv kursplats":"⚠ لا يوجد تسجيل نشط", "Skicka svar":"إرسال الرد", "Skicka välkomstmejl igen":"إعادة إرسال رسالة الترحيب", "Spara anteckning":"حفظ الملاحظة", "Spara länk":"حفظ الرابط", "Allmänt material":"مواد عامة", "🌐 Allmänt material":"🌐 مواد عامة", "Okänd":"غير معروف", "Något gick fel.":"حدث خطأ ما.", "Kunde inte spara. Försök igen.":"تعذر الحفظ. حاول مرة أخرى.", "Kunde inte byta lösenord.":"تعذر تغيير كلمة المرور.", "Lösenordet måste vara minst 6 tecken.":"يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.", "Lösenorden matchar inte.":"كلمتا المرور غير متطابقتين.", "Spara nytt lösenord":"حفظ كلمة المرور الجديدة", "Skapa nytt lösenord":"إنشاء كلمة مرور جديدة", "Lösenord uppdaterat!":"تم تحديث كلمة المرور!", "Du skickas nu till elevportalen...":"سيتم تحويلك الآن إلى بوابة الطالب...",
    "Januari":"يناير", "Februari":"فبراير", "Mars":"مارس", "April":"أبريل", "Maj":"مايو", "Juni":"يونيو", "Juli":"يوليو", "Augusti":"أغسطس", "September":"سبتمبر", "Oktober":"أكتوبر", "November":"نوفمبر", "December":"ديسمبر", "Mån":"الاثنين", "Tis":"الثلاثاء", "Ons":"الأربعاء", "Tor":"الخميس", "Fre":"الجمعة", "Lör":"السبت", "Sön":"الأحد", "Måndag":"الاثنين", "Tisdag":"الثلاثاء", "Onsdag":"الأربعاء", "Torsdag":"الخميس", "Fredag":"الجمعة", "Lördag":"السبت", "Söndag":"الأحد", "Igår":"أمس"
  }
};

export function translatePortalText(source: string, language: PortalLanguage) {
  if (language === "sv") return source;
  const exact = translations[language][source];
  if (exact) return exact;
  let value = source;
  const welcome = source.match(/^Välkommen tillbaka, (.+)!$/);
  if (welcome) return language === "ar" ? `مرحبًا بعودتك، ${welcome[1]}!` : `Welcome back, ${welcome[1]}!`;
  const teacher = source.match(/^Lärare: (.+)$/);
  if (teacher) return language === "ar" ? `المعلم: ${teacher[1]}` : `Teacher: ${teacher[1]}`;
  const pendingReview = source.match(/^(\d+) väntar på granskning$/);
  if (pendingReview) return language === "ar" ? `${pendingReview[1]} بانتظار المراجعة` : `${pendingReview[1]} awaiting review`;
  const pendingReply = source.match(/^(\d+) väntar på svar$/);
  if (pendingReply) return language === "ar" ? `${pendingReply[1]} بانتظار الرد` : `${pendingReply[1]} awaiting reply`;
  const unread = source.match(/^(\d+) olästa$/);
  if (unread) return language === "ar" ? `${unread[1]} غير مقروءة` : `${unread[1]} unread`;
  const students = source.match(/^(\d+) elever i dina kurser$/);
  if (students) return language === "ar" ? `${students[1]} طالب في دوراتك` : `${students[1]} students in your courses`;
  for (const [sv, translated] of Object.entries(translations[language]).sort(([a], [b]) => b.length - a.length)) {
    if (sv.length < 3 || !value.includes(sv)) continue;
    value = value.replaceAll(sv, translated);
  }
  return value;
}

type LanguageContextValue = { language: PortalLanguage; setLanguage: (language: PortalLanguage) => Promise<void> };
const LanguageContext = createContext<LanguageContextValue>({ language: "sv", setLanguage: async () => undefined });

export function PortalLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<PortalLanguage>("sv");
  const root = useRef<HTMLDivElement>(null);
  const textSources = useRef(new WeakMap<Text, string>());
  const attributeSources = useRef(new WeakMap<Element, Record<string, string>>());

  useEffect(() => {
    const stored = window.localStorage.getItem("portal-language");
    if (stored === "sv" || stored === "en" || stored === "ar") {
      queueMicrotask(() => setLanguageState(stored));
      void fetch("/api/profile/language", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: stored }) });
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("preferred_language").eq("id", user.id).single();
      if (data?.preferred_language && ["sv", "en", "ar"].includes(data.preferred_language)) setLanguageState(data.preferred_language as PortalLanguage);
    });
  }, []);

  const setLanguage = useCallback(async (next: PortalLanguage) => {
    setLanguageState(next);
    window.localStorage.setItem("portal-language", next);
    document.cookie = `portal_language=${next}; path=/; max-age=31536000; samesite=lax`;
    await fetch("/api/profile/language", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: next }) });
  }, []);

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const apply = (scope: Node) => {
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);
      if (scope.nodeType === Node.TEXT_NODE) nodes.unshift(scope as Text);
      for (const node of nodes) {
        const parent = node.parentElement;
        if (!parent || parent.closest("[data-no-portal-translate]") || ["SCRIPT", "STYLE"].includes(parent.tagName)) continue;
        if (!textSources.current.has(node)) textSources.current.set(node, node.data);
        const source = textSources.current.get(node) ?? node.data;
        const trimmed = source.trim();
        if (!trimmed) continue;
        const translated = translatePortalText(trimmed, language);
        const nextValue = source.replace(trimmed, translated);
        if (node.data !== nextValue) node.data = nextValue;
      }
      const elements = scope.nodeType === Node.ELEMENT_NODE ? [scope as Element, ...(scope as Element).querySelectorAll("*")] : [];
      for (const element of elements) {
        if (element.closest("[data-no-portal-translate]")) continue;
        const sources = attributeSources.current.get(element) ?? {};
        for (const attribute of ["placeholder", "title", "aria-label"]) {
          const current = element.getAttribute(attribute);
          if (current && !sources[attribute]) sources[attribute] = current;
          if (sources[attribute]) {
            const nextValue = translatePortalText(sources[attribute], language);
            if (element.getAttribute(attribute) !== nextValue) element.setAttribute(attribute, nextValue);
          }
        }
        attributeSources.current.set(element, sources);
      }
    };
    apply(container);
    const observer = new MutationObserver((mutations) => mutations.forEach((mutation) => apply(mutation.target)));
    observer.observe(container, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  useEffect(() => {
    const previousLanguage = document.documentElement.lang;
    const previousDirection = document.documentElement.dir;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    return () => {
      document.documentElement.lang = previousLanguage;
      document.documentElement.dir = previousDirection;
    };
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}><div ref={root} dir={language === "ar" ? "rtl" : "ltr"} className="contents">{children}</div></LanguageContext.Provider>;
}

export function usePortalLanguage() { return useContext(LanguageContext); }

export function PortalLanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = usePortalLanguage();
  const label = language === "ar" ? "اللغة" : language === "en" ? "Language" : "Språk";
  return <label data-no-portal-translate className={`flex items-center gap-2 ${compact ? "" : "px-3 py-2"}`}>
    {!compact && <span className="text-xs font-medium text-gray-400">{label}</span>}
    <select aria-label={label} value={language} onChange={(event) => void setLanguage(event.target.value as PortalLanguage)} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700">
      <option value="sv">Svenska</option><option value="en">English</option><option value="ar">العربية</option>
    </select>
  </label>;
}

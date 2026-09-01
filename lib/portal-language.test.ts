import { describe, expect, it } from "vitest";
import { translatePortalText } from "./portal-language";

describe("portal languages", () => {
  it("translates shared navigation to English and Arabic", () => {
    expect(translatePortalText("Mina kurser", "en")).toBe("My courses");
    expect(translatePortalText("Mina kurser", "ar")).toBe("دوراتي");
  });

  it("translates dynamic welcome text without changing the name", () => {
    expect(translatePortalText("Välkommen tillbaka, Yahya!", "en")).toBe("Welcome back, Yahya!");
    expect(translatePortalText("Välkommen tillbaka, Yahya!", "ar")).toBe("مرحبًا بعودتك، Yahya!");
  });

  it("keeps authored content that has no interface translation", () => {
    expect(translatePortalText("Surah Al-Fatiha", "ar")).toBe("Surah Al-Fatiha");
  });
});

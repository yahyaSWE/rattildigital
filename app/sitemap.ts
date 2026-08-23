import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/brand";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl().replace(/\/$/, "");
  const paths = [
    "", "/about", "/programs", "/teachers", "/contact", "/book-free-trial", "/privacy", "/terms",
    "/programs/quran-reading", "/programs/tajweed", "/programs/quran-memorization", "/programs/arabic-language",
  ];
  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}

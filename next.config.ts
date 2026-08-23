import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/quran-reading", destination: "/programs/quran-reading", permanent: true },
      { source: "/tajweed", destination: "/programs/tajweed", permanent: true },
      { source: "/quran-memorization-program", destination: "/programs/quran-memorization", permanent: true },
      { source: "/arabic-language-program", destination: "/programs/arabic-language", permanent: true },
      { source: "/privacy-policy-2", destination: "/privacy", permanent: true },
      { source: "/terms-conditions", destination: "/terms", permanent: true },
    ];
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;

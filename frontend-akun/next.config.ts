import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    // Header dasar. CSP penuh menunggu keputusan layanan eksternal (K10: foto, tile peta).
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
  // Data akun bersifat privat: jangan masuk cache bersama/CDN (Kontrak bagian 13).
  // Cache-Control per respons diatur backend; halaman ini hanya shell statis tanpa data pengguna.
};

export default config;

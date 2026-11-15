import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { Providers } from "../providers/Providers";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap" });
const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-sora", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Singgah Sana", template: "%s · Singgah Sana" },
  description: "Temukan, simpan, dan tanyakan kos dengan informasi yang ditinjau admin.",
  robots: { index: false, follow: false }, // pra-rilis, mengikuti pengaturan Figma Make sebelumnya
};
export const viewport: Viewport = { themeColor: "#7c3aed" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${sora.variable}`}>
      <body>
        <Providers>
          {/* useSearchParams di komponen klien memerlukan batas Suspense agar build statis lolos. */}
          <Suspense>{children}</Suspense>
        </Providers>
      </body>
    </html>
  );
}

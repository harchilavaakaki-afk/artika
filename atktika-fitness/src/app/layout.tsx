import type { Metadata } from "next";
import { Suspense } from "react";
import { Unbounded, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StickyCTA from "@/components/ui/StickyCTA";
import YandexMetrika from "@/components/analytics/YandexMetrika";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Фитнес-студия Арктика, Видное",
    default:
      "Фитнес-студия Арктика в Видном — тренажерный зал, групповые занятия",
  },
  description:
    "Фитнес-студия Арктика в г. Видное: тренажерный зал, йога, пилатес, стретчинг, 20+ направлений. Запишитесь на пробное занятие.",
  metadataBase: new URL("https://arcfit.ru"),
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://arcfit.ru",
    siteName: "Фитнес-студия Арктика",
    title: "Фитнес-студия Арктика в Видном",
    description:
      "20+ направлений групповых занятий в г. Видное. Запишитесь на пробное.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  icons: {
    icon: [
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://arcfit.ru",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${unbounded.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#111111" />
      </head>
      <body className="min-h-full flex flex-col bg-dark-800 text-white font-body">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <StickyCTA />
        <Analytics />
        <Suspense fallback={null}>
          <YandexMetrika />
        </Suspense>
      </body>
    </html>
  );
}

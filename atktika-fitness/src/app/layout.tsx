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
        {/* Yandex.Metrika counter — server-rendered in <head> */}
        {process.env.NEXT_PUBLIC_YM_ID && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${process.env.NEXT_PUBLIC_YM_ID},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`,
              }}
            />
            <noscript>
              <div>
                <img
                  src={`https://mc.yandex.ru/watch/${process.env.NEXT_PUBLIC_YM_ID}`}
                  style={{ position: "absolute", left: "-9999px" }}
                  alt=""
                />
              </div>
            </noscript>
          </>
        )}
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

import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/constants";
import TrackedLink from "@/components/analytics/TrackedLink";

const NAV_LINKS = [
  { href: "/programs", label: "Направления" },
  { href: "/schedule", label: "Расписание" },
  { href: "/trainers", label: "Тренеры" },
  { href: "/pricing", label: "Цены" },
  { href: "/facilities", label: "Зоны клуба" },
  { href: "/blog", label: "Блог" },
  { href: "/contacts", label: "Контакты" },
];

const SCHEMA_LD = {
  "@context": "https://schema.org",
  "@type": "ExerciseGym",
  name: SITE.name,
  url: SITE.url,
  telephone: "+79361423841",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Зелёный переулок, 10",
    addressLocality: "Видное",
    addressRegion: "Московская область",
    postalCode: "142700",
    addressCountry: "RU",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: SITE.geo.lat,
    longitude: SITE.geo.lng,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "07:00",
    closes: "22:00",
  },
};

export default function Footer() {
  return (
    <footer className="bg-dark-900 border-t border-dark-600/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {/* Column 1: Logo + description */}
          <div>
            <Link href="/">
              <Image
                src="/icons/logo.svg"
                alt={SITE.name}
                width={160}
                height={32}
                className="h-7 w-auto mb-4"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Фитнес-студия в спортивном комплексе Арктика, г.&nbsp;Видное.
              20+ направлений, 9&nbsp;тренеров, современный тренажёрный зал.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h3 className="font-heading text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Навигация
            </h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contacts */}
          <div>
            <h3 className="font-heading text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Контакты
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <svg
                  className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
                <span>{SITE.address}</span>
              </li>
              <li>
                <TrackedLink
                  goal="phone_click"
                  goalParams={{ source: "footer" }}
                  href={`tel:${SITE.phoneSales.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <svg
                    className="h-4 w-4 flex-shrink-0 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                    />
                  </svg>
                  {SITE.phoneSales}
                </TrackedLink>
              </li>
              <li>
                <TrackedLink
                  goal="tg_click"
                  goalParams={{ source: "footer" }}
                  href={SITE.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <svg
                    className="h-4 w-4 flex-shrink-0 text-accent"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  @arcfit
                </TrackedLink>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 flex-shrink-0 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{SITE.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-dark-600/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} {SITE.name}
          </p>
          <Link
            href="/privacy"
            className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            Политика конфиденциальности
          </Link>
        </div>
      </div>

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_LD) }}
      />
    </footer>
  );
}

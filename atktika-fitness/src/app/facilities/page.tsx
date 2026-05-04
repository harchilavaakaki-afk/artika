import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { FACILITIES, SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Зоны клуба — тренажёрный зал и групповые залы в Видном | Арктика",
  description:
    "Тренажёрный зал, кардиозона, залы для групповых занятий, вело-зал в фитнес-клубе Арктика, Видное (Зелёный пер., 10). 6 зон для тренировок, современное оборудование.",
  alternates: { canonical: `${SITE.url}/facilities` },
  openGraph: {
    title: "Зоны клуба — Фитнес-клуб Арктика, Видное",
    description:
      "Тренажёрный зал, кардио, групповые залы, вело-зал в Видном.",
    url: `${SITE.url}/facilities`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE.name,
  },
};

export default function FacilitiesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <Breadcrumbs items={[{ name: "Зоны клуба", href: "/facilities" }]} />

      <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4 mb-4">
        Зоны клуба
      </h1>
      <p className="text-gray-400 text-lg mb-12 max-w-2xl">
        Фитнес-студия Арктика в Видном — это 6 функциональных зон для любых
        тренировочных целей.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FACILITIES.map((facility) => (
          <Link
            key={facility.slug}
            href={`/facilities/${facility.slug}`}
            className="group bg-dark-700 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/10"
          >
            <div className="relative aspect-video overflow-hidden bg-dark-600">
              <Image
                src={`/images/facilities/${facility.slug}.jpg`}
                alt={`${facility.name} — фитнес-студия Арктика, Видное`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            <div className="p-5">
              <h2 className="font-heading text-lg font-semibold text-white group-hover:text-accent transition-colors mb-2">
                {facility.name}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                {facility.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {facility.features.slice(0, 3).map((f) => (
                  <span
                    key={f}
                    className="text-xs px-2 py-1 rounded-full bg-dark-600 text-gray-400"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <section className="mt-16 bg-gradient-to-r from-accent/10 to-accent-dark/10 rounded-2xl p-8 sm:p-12 text-center">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-4">
          Хотите увидеть вживую?
        </h2>
        <p className="text-gray-400 mb-6 max-w-xl mx-auto">
          Приходите на экскурсию по клубу — покажем все залы и подберём программу
        </p>
        <a
          href={`tel:${SITE.phoneSales.replace(/\s/g, "")}`}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-medium px-8 py-3 rounded-full transition-colors"
        >
          Записаться на экскурсию
        </a>
      </section>
    </div>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { FACILITIES, PROGRAMS, SITE } from "@/lib/constants";
import { FACILITY_CONTENT } from "@/lib/facility-content";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return FACILITIES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const facility = FACILITIES.find((f) => f.slug === slug);
  if (!facility) return {};

  return {
    title: facility.metaTitle,
    description: facility.metaDescription,
    alternates: { canonical: `${SITE.url}/facilities/${slug}` },
    openGraph: {
      title: facility.metaTitle,
      description: facility.metaDescription,
      url: `${SITE.url}/facilities/${slug}`,
      type: "website",
      locale: "ru_RU",
      siteName: SITE.name,
    },
  };
}

export default async function FacilityPage({ params }: Props) {
  const { slug } = await params;
  const facility = FACILITIES.find((f) => f.slug === slug);
  if (!facility) notFound();

  const content = FACILITY_CONTENT[slug];
  const relatedPrograms = content
    ? PROGRAMS.filter((p) => content.programs.includes(p.slug))
    : [];

  const placeSchema = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: `${facility.name} — ${SITE.name}`,
    description: facility.description,
    url: `${SITE.url}/facilities/${slug}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Зелёный переулок, 10",
      addressLocality: "Видное",
      addressRegion: "Московская область",
      addressCountry: "RU",
    },
    containedInPlace: {
      "@type": "SportsActivityLocation",
      name: SITE.name,
      url: SITE.url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <Breadcrumbs
          items={[
            { name: "Зоны клуба", href: "/facilities" },
            { name: facility.name, href: `/facilities/${slug}` },
          ]}
        />

        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4 mb-6">
          {facility.name}
        </h1>

        {/* Hero Image */}
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-12">
          <Image
            src={`/images/facilities/${slug}.jpg`}
            alt={`${facility.name} — фитнес-студия Арктика, Видное`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>

        {/* Description */}
        <div className="max-w-3xl mb-12">
          <p className="text-gray-300 text-lg leading-relaxed">
            {content?.longDescription || facility.description}
          </p>
        </div>

        {/* Features & Equipment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-dark-700 rounded-2xl p-6 sm:p-8">
            <h2 className="font-heading text-xl font-bold text-white mb-4">
              Оборудование
            </h2>
            <ul className="space-y-3">
              {(content?.equipment || facility.features).map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-gray-300"
                >
                  <svg
                    className="w-5 h-5 text-accent shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {content?.tips && (
            <div className="bg-dark-700 rounded-2xl p-6 sm:p-8">
              <h2 className="font-heading text-xl font-bold text-white mb-4">
                Советы
              </h2>
              <ul className="space-y-3">
                {content.tips.map((tip) => (
                  <li
                    key={tip}
                    className="flex items-start gap-3 text-gray-300"
                  >
                    <svg
                      className="w-5 h-5 text-accent shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                      />
                    </svg>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Related Programs */}
        {relatedPrograms.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold text-white mb-6">
              Занятия в этом зале
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPrograms.map((program) => (
                <Link
                  key={program.slug}
                  href={`/programs/${program.slug}`}
                  className="group bg-dark-700 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/10"
                >
                  <h3 className="font-heading font-semibold text-white group-hover:text-accent transition-colors">
                    {program.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-2">
                    {program.shortDescription}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {program.duration} &middot; {program.intensity} интенсивность
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-gradient-to-r from-accent/10 to-accent-dark/10 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-4">
            Попробуйте бесплатно
          </h2>
          <p className="text-gray-400 mb-6">
            Запишитесь на пробное занятие в фитнес-студию Арктика
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`tel:${SITE.phoneSales.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-medium px-8 py-3 rounded-full transition-colors"
            >
              Позвонить
            </a>
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 border border-accent text-accent hover:bg-accent hover:text-white font-medium px-8 py-3 rounded-full transition-colors"
            >
              Расписание
            </Link>
          </div>
        </section>

        {/* Back link */}
        <div className="mt-10 text-center">
          <Link
            href="/facilities"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Все зоны клуба
          </Link>
        </div>
      </div>
    </>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { PROGRAMS, TRAINERS, CATEGORY_LABELS, SITE } from "@/lib/constants";
import { PROGRAM_CONTENT } from "@/lib/program-content";

interface Props {
  params: Promise<{ slug: string }>;
}

/* ---------- Static generation ---------- */
export async function generateStaticParams() {
  return PROGRAMS.map((p) => ({ slug: p.slug }));
}

/* ---------- Dynamic metadata ---------- */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = PROGRAMS.find((p) => p.slug === slug);
  if (!program) return {};

  return {
    title: program.metaTitle,
    description: program.metaDescription,
    openGraph: {
      title: program.metaTitle,
      description: program.metaDescription,
      url: `${SITE.url}/programs/${slug}`,
      images: [`/images/programs/${slug}.jpg`],
    },
    alternates: {
      canonical: `${SITE.url}/programs/${slug}`,
    },
  };
}

/* ---------- Page ---------- */
export default async function ProgramPage({ params }: Props) {
  const { slug } = await params;
  const program = PROGRAMS.find((p) => p.slug === slug);
  if (!program) notFound();

  const content = PROGRAM_CONTENT[slug];
  const trainers = TRAINERS.filter((t) =>
    program.trainers.includes(t.slug)
  );

  /* Schema.org: SportsActivityLocation */
  const sportsSchema = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: `${program.name} — ${SITE.name}`,
    description: program.metaDescription,
    url: `${SITE.url}/programs/${slug}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Зелёный переулок, 10",
      addressLocality: "Видное",
      addressRegion: "Московская область",
      addressCountry: "RU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE.geo.lat,
      longitude: SITE.geo.lng,
    },
    telephone: SITE.phone,
    openingHours: "Mo-Su 07:00-22:00",
    image: `${SITE.url}/images/programs/${slug}.jpg`,
  };

  /* Schema.org: Service — конкретная услуга «программа в Видном» */
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${program.name} в Видном`,
    serviceType: program.name,
    description: program.metaDescription,
    provider: {
      "@type": "SportsActivityLocation",
      name: SITE.name,
      url: SITE.url,
      telephone: SITE.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Зелёный переулок, 10",
        addressLocality: "Видное",
        addressRegion: "Московская область",
        addressCountry: "RU",
      },
    },
    areaServed: {
      "@type": "City",
      name: "Видное",
    },
    url: `${SITE.url}/programs/${slug}`,
    image: `${SITE.url}/images/programs/${slug}.jpg`,
  };

  /* Schema.org: FAQPage */
  const faqSchema = content
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: content.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;

  const intensityLabel: Record<string, string> = {
    низкая: "Низкая",
    средняя: "Средняя",
    высокая: "Высокая",
  };

  const intensityColor: Record<string, string> = {
    низкая: "bg-green-500/10 text-green-400",
    средняя: "bg-yellow-500/10 text-yellow-400",
    высокая: "bg-red-500/10 text-red-400",
  };

  return (
    <>
      {/* Schema.org */}
      <BreadcrumbSchema
        items={[
          { name: "Направления", href: "/programs" },
          { name: program.name, href: `/programs/${slug}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { name: "Направления", href: "/programs" },
            { name: program.name, href: `/programs/${slug}` },
          ]}
        />

        {/* Hero */}
        <section className="relative rounded-2xl overflow-hidden mt-4 mb-12">
          <div
            className={`relative ${
              slug === "fitball"
                ? "aspect-[4/3] sm:aspect-[16/9]"
                : "aspect-[21/9] sm:aspect-[3/1]"
            }`}
          >
            {slug === "lady-style" ? (
              <video
                src="/videos/lady-style.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover"
                aria-label={`${program.name} — занятие в фитнес-студии Арктика, Видное`}
              />
            ) : slug === "fitball" ? (
              <video
                src="/videos/fitball.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: "center 40%" }}
                aria-label={`${program.name} — занятие в фитнес-студии Арктика, Видное`}
              />
            ) : (
              <Image
                src={`/images/programs/${slug}.jpg`}
                alt={`${program.name} — занятие в фитнес-студии Арктика, Видное`}
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-dark-800/40 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-accent/20 text-accent">
                {CATEGORY_LABELS[program.category]}
              </span>
              <span className="text-xs text-gray-400">
                {program.duration}
              </span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full ${intensityColor[program.intensity]}`}
              >
                {intensityLabel[program.intensity]} интенсивность
              </span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              {program.name}
            </h1>
          </div>
        </section>

        {content && (
          <>
            {/* Description */}
            <section className="mb-12">
              <p className="text-gray-300 text-lg leading-relaxed max-w-4xl">
                {content.description}
              </p>
            </section>

            {/* Info grid: Для кого + Чего ожидать */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* Для кого подходит */}
              <div className="bg-dark-700 rounded-2xl p-6 sm:p-8">
                <h2 className="font-heading text-xl font-bold mb-5 text-white">
                  Для кого подходит
                </h2>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-accent text-sm font-medium mb-1">
                      Уровень подготовки
                    </dt>
                    <dd className="text-gray-300">{content.forWhom.level}</dd>
                  </div>
                  <div>
                    <dt className="text-accent text-sm font-medium mb-1">
                      Возраст
                    </dt>
                    <dd className="text-gray-300">{content.forWhom.age}</dd>
                  </div>
                  <div>
                    <dt className="text-accent text-sm font-medium mb-1">
                      Противопоказания
                    </dt>
                    <dd className="text-gray-300">
                      {content.forWhom.contraindications}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Чего ожидать */}
              <div className="bg-dark-700 rounded-2xl p-6 sm:p-8">
                <h2 className="font-heading text-xl font-bold mb-5 text-white">
                  Чего ожидать на занятии
                </h2>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-accent text-sm font-medium mb-1">
                      Ход занятия
                    </dt>
                    <dd className="text-gray-300">
                      {content.whatToExpect.flow}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-accent text-sm font-medium mb-1">
                      Что понадобится
                    </dt>
                    <dd className="text-gray-300">
                      {content.whatToExpect.equipment}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </>
        )}

        {/* Trainers */}
        {trainers.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold mb-6 text-white">
              Тренеры направления
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainers.map((trainer) => (
                <Link
                  key={trainer.slug}
                  href={`/trainers#${trainer.slug}`}
                  className="group bg-dark-700 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/10"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={`/images/trainers/${trainer.slug}.jpg`}
                      alt={`${trainer.name} — тренер ${program.name} в Арктика Фитнес, Видное`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading text-lg font-semibold group-hover:text-accent transition-colors">
                      {trainer.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">{trainer.role}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Schedule preview */}
        <section className="mb-12">
          <div className="bg-dark-700 rounded-2xl p-6 sm:p-8 text-center">
            <h2 className="font-heading text-2xl font-bold mb-3 text-white">
              Расписание: {program.name}
            </h2>
            <p className="text-gray-400 mb-6">
              Посмотрите актуальное расписание занятий и запишитесь онлайн
            </p>
            <Link
              href={`/schedule?program=${slug}`}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-medium px-8 py-3 rounded-full transition-colors"
            >
              Смотреть расписание
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
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        {content && content.faq.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold mb-6 text-white">
              Часто задаваемые вопросы
            </h2>
            <div className="space-y-4">
              {content.faq.map((item, i) => (
                <details
                  key={i}
                  className="group bg-dark-700 rounded-2xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer p-6 text-white font-medium hover:text-accent transition-colors list-none">
                    <span>{item.question}</span>
                    <svg
                      className="w-5 h-5 shrink-0 ml-4 transition-transform duration-300 group-open:rotate-180 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6 text-gray-400 leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-gradient-to-r from-accent/10 to-accent-dark/10 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-4 text-white">
            Записаться на {program.name}
          </h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Приходите на пробное занятие в фитнес-студию Арктика. Первое
            посещение — по специальной цене.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`tel:${SITE.phoneSales.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-medium px-8 py-3 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Позвонить
            </a>
            <a
              href={SITE.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-accent text-accent hover:bg-accent hover:text-white font-medium px-8 py-3 rounded-full transition-colors"
            >
              Написать в Telegram
            </a>
          </div>
        </section>

        {/* Back link */}
        <div className="mt-10 text-center">
          <Link
            href="/programs"
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
            Все направления
          </Link>
        </div>
      </article>
    </>
  );
}

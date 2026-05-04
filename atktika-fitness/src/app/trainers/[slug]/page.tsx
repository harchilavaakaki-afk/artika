import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { TRAINERS, PROGRAMS, SITE } from "@/lib/constants";
import { TRAINER_CONTENT } from "@/lib/trainer-content";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return TRAINERS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const trainer = TRAINERS.find((t) => t.slug === slug);
  if (!trainer) return {};

  return {
    title: trainer.metaTitle,
    description: trainer.metaDescription,
    openGraph: {
      title: trainer.metaTitle,
      description: trainer.metaDescription,
      url: `${SITE.url}/trainers/${slug}`,
      images: [`/images/trainers/${slug}.jpg`],
    },
    alternates: {
      canonical: `${SITE.url}/trainers/${slug}`,
    },
  };
}

export default async function TrainerPage({ params }: Props) {
  const { slug } = await params;
  const trainer = TRAINERS.find((t) => t.slug === slug);
  if (!trainer) notFound();

  const content = TRAINER_CONTENT[slug];
  const trainerPrograms = PROGRAMS.filter((p) =>
    trainer.programs.includes(p.slug)
  );

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: trainer.name,
    jobTitle: trainer.role,
    worksFor: {
      "@type": "SportsActivityLocation",
      name: SITE.name,
      url: SITE.url,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Зелёный переулок, 10",
        addressLocality: "Видное",
        addressRegion: "Московская область",
        addressCountry: "RU",
      },
    },
    url: `${SITE.url}/trainers/${slug}`,
    image: `${SITE.url}/images/trainers/${slug}.jpg`,
  };

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Тренеры", href: "/trainers" },
          { name: trainer.name, href: `/trainers/${slug}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <Breadcrumbs
          items={[
            { name: "Тренеры", href: "/trainers" },
            { name: trainer.name, href: `/trainers/${slug}` },
          ]}
        />

        {/* Hero */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 mb-12">
          <div className="relative aspect-[3/4] md:aspect-auto rounded-2xl overflow-hidden">
            <Image
              src={`/images/trainers/${slug}.jpg`}
              alt={`${trainer.name} — тренер фитнес-студии Арктика, Видное`}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
              {trainer.name}
            </h1>
            <p className="text-accent text-lg mb-4">{trainer.role}</p>

            {/* Specializations */}
            <div className="flex flex-wrap gap-2 mb-6">
              {trainer.specializations.map((spec) => (
                <span
                  key={spec}
                  className="text-sm px-3 py-1.5 rounded-full bg-accent/10 text-accent"
                >
                  {spec}
                </span>
              ))}
            </div>

            {/* Bio */}
            {content && (
              <p className="text-gray-300 leading-relaxed mb-6">
                {content.bio}
              </p>
            )}

            {/* Achievements */}
            {content && (
              <ul className="space-y-2 mb-6">
                {content.achievements.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-400">
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
                    {a}
                  </li>
                ))}
              </ul>
            )}

            {/* Philosophy */}
            {content && (
              <blockquote className="border-l-2 border-accent pl-4 italic text-gray-400">
                &laquo;{content.philosophy}&raquo;
              </blockquote>
            )}
          </div>
        </section>

        {/* Programs */}
        {trainerPrograms.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold mb-6 text-white">
              Направления {trainer.name.split(" ")[0]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainerPrograms.map((program) => (
                <Link
                  key={program.slug}
                  href={`/programs/${program.slug}`}
                  className="group bg-dark-700 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/10"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={`/images/programs/${program.slug}.jpg`}
                      alt={`${program.name} — занятие в Арктика Фитнес, Видное`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading font-semibold group-hover:text-accent transition-colors">
                      {program.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {program.duration} &middot; {program.intensity}{" "}
                      интенсивность
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Schedule link */}
        <section className="mb-12">
          <div className="bg-dark-700 rounded-2xl p-6 sm:p-8 text-center">
            <h2 className="font-heading text-2xl font-bold mb-3 text-white">
              Расписание: {trainer.name.split(" ")[0]}
            </h2>
            <p className="text-gray-400 mb-6">
              Посмотрите, когда проходят занятия с {trainer.name.split(" ")[0]}
            </p>
            <Link
              href={`/schedule?trainer=${encodeURIComponent(trainer.name)}`}
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

        {/* CTA */}
        <section className="bg-gradient-to-r from-accent/10 to-accent-dark/10 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-4 text-white">
            Записаться к {trainer.name.split(" ")[0]}
          </h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Запишитесь на групповое или персональное занятие в фитнес-студию
            Арктика
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
            href="/trainers"
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
            Все тренеры
          </Link>
        </div>
      </article>
    </>
  );
}

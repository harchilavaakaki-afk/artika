import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { TRAINERS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Тренеры в Видном — 9 фитнес-инструкторов",
  description:
    "9 фитнес-тренеров в Видном (фитнес-клуб Арктика, Зелёный пер., 10): инструкторы по йоге, пилатесу, силовым и групповым программам. Персональные и групповые тренировки.",
  openGraph: {
    title: "Тренеры фитнес-клуба Арктика — Видное",
    description:
      "Фитнес-тренеры в Видном: йога, пилатес, силовые, групповые программы.",
    url: "https://arcfit.ru/trainers",
  },
  alternates: {
    canonical: "https://arcfit.ru/trainers",
  },
};

export default function TrainersPage() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Breadcrumbs items={[{ name: "Тренеры", href: "/trainers" }]} />

      <div className="text-center mb-12">
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold">
          Наши <span className="text-accent">тренеры</span>
        </h1>
        <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
          9 профессионалов, которые помогут вам достичь ваших целей в
          фитнес-студии Арктика
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TRAINERS.map((trainer) => (
          <Link
            key={trainer.slug}
            id={trainer.slug}
            href={`/trainers/${trainer.slug}`}
            className="group bg-dark-700 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-accent/10"
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src={`/images/trainers/${trainer.slug}.jpg`}
                alt={`${trainer.name} — тренер фитнес-студии Арктика, Видное`}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-105 grayscale group-hover:grayscale-0"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-transparent to-transparent" />
            </div>
            <div className="p-5 -mt-16 relative z-10">
              <h2 className="font-heading text-xl font-bold text-white group-hover:text-accent transition-colors">
                {trainer.name}
              </h2>
              <p className="text-gray-400 text-sm mt-1">{trainer.role}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {trainer.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

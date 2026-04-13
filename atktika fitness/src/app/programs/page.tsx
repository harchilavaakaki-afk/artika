import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ProgramsGrid from "@/components/sections/ProgramsGrid";

export const metadata: Metadata = {
  title: "Групповые занятия — 20+ направлений | Арктика Фитнес, Видное",
  description:
    "Йога, стретчинг, пилатес, кроссфит, единоборства и другие направления в фитнес-студии Арктика, г. Видное.",
  openGraph: {
    title: "Групповые занятия — 20+ направлений | Арктика Фитнес",
    description:
      "Йога, стретчинг, пилатес, силовые и танцевальные тренировки в Видном.",
    url: "https://arcfit.ru/programs",
  },
  alternates: {
    canonical: "https://arcfit.ru/programs",
  },
};

export default function ProgramsPage() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Breadcrumbs items={[{ name: "Направления", href: "/programs" }]} />

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold">
          Групповые занятия —{" "}
          <span className="text-accent">20+ направлений</span>
        </h1>
        <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
          Йога, стретчинг, пилатес, кроссфит, единоборства и другие направления
          в фитнес-студии Арктика, г.&nbsp;Видное
        </p>
      </div>

      <ProgramsGrid />
    </section>
  );
}

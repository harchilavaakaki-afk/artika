import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ProgramsGrid from "@/components/sections/ProgramsGrid";

export const metadata: Metadata = {
  title: "Групповые занятия в Видном — 20+ направлений",
  description:
    "Групповые занятия в фитнес-клубе Арктика, Видное: йога, пилатес, стретчинг, функциональный тренинг, силовые, танцы, сайкл. 20+ направлений, расписание 7:00–22:00.",
  openGraph: {
    title: "Групповые занятия в Видном — 20+ направлений | Арктика",
    description:
      "Йога, пилатес, стретчинг, силовые и танцевальные тренировки в фитнес-клубе Арктика, Видное.",
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

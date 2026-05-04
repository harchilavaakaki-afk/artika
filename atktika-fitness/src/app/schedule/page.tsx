import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ScheduleView from "@/components/sections/ScheduleView";

export const metadata: Metadata = {
  title: "Расписание фитнес-клуба Арктика в Видном — групповые занятия",
  description:
    "Расписание занятий фитнес-клуба Арктика в Видном (Зелёный пер., 10): йога, пилатес, стретчинг, функциональный тренинг, силовые. Запись онлайн на актуальную неделю.",
  openGraph: {
    title: "Расписание фитнес-клуба Арктика — групповые занятия в Видном",
    description:
      "Йога, пилатес, стретчинг, силовые. Расписание занятий в Видном на текущую неделю.",
    url: "https://arcfit.ru/schedule",
  },
  alternates: {
    canonical: "https://arcfit.ru/schedule",
  },
};

export default function SchedulePage() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Breadcrumbs items={[{ name: "Расписание", href: "/schedule" }]} />

      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold">
          Расписание <span className="text-accent">занятий</span>
        </h1>
        <p className="mt-3 text-accent font-semibold text-base sm:text-lg">
          Неделя 4 — 10 мая 2026
        </p>
        <p className="mt-3 text-gray-400 text-lg max-w-xl mx-auto">
          Групповые программы фитнес-студии Арктика. Выберите день и запишитесь
          онлайн.
        </p>
      </div>

      <ScheduleView />
    </section>
  );
}

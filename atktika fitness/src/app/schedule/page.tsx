import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ScheduleView from "@/components/sections/ScheduleView";

export const metadata: Metadata = {
  title: "Расписание занятий — Фитнес-студия Арктика, Видное",
  description:
    "Актуальное расписание групповых занятий фитнес-студии Арктика в Видном. Йога, пилатес, стретчинг, функциональный тренинг. Онлайн-запись.",
  openGraph: {
    title: "Расписание занятий — Арктика Фитнес",
    description:
      "Расписание групповых занятий фитнес-студии Арктика в Видном.",
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
        <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
          Актуальное расписание групповых программ. Выберите день и запишитесь
          онлайн.
        </p>
      </div>

      <ScheduleView />
    </section>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  PROGRAMS,
  CATEGORY_LABELS,
  type ProgramCategory,
} from "@/lib/constants";

const ALL_CATEGORIES: (ProgramCategory | "all")[] = [
  "all",
  "power",
  "soft",
  "dance",
];

const FILTER_LABELS: Record<ProgramCategory | "all", string> = {
  all: "Все",
  ...CATEGORY_LABELS,
};

const INTENSITY_COLOR: Record<string, string> = {
  "низкая": "text-green-400",
  "средняя": "text-yellow-400",
  "высокая": "text-red-400",
};

/* ---------- Variants ---------- */
const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.3 },
  },
};

export default function Programs() {
  const [active, setActive] = useState<ProgramCategory | "all">("all");

  const filtered =
    active === "all"
      ? PROGRAMS
      : PROGRAMS.filter((p) => p.category === active);

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold">
          Направления{" "}
          <span className="text-accent">тренировок</span>
        </h2>
        <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
          Более 20 групповых программ для любого уровня подготовки
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              active === cat
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-transparent border border-dark-500 text-gray-400 hover:border-accent/50 hover:text-white"
            }`}
          >
            {FILTER_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((program, i) => (
            <motion.div
              key={program.slug}
              variants={cardVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
            >
              <Link
                href={`/programs/${program.slug}`}
                className="group block bg-dark-700 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-accent/10"
              >
                {/* Image / Video */}
                <div className="relative aspect-video overflow-hidden">
                  {program.slug === "lady-style" ? (
                    <video
                      src="/videos/lady-style.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110`}
                      aria-label={`Групповое занятие ${program.name} в фитнес-студии Арктика, Видное`}
                    />
                  ) : program.slug === "fitball" ? (
                    <video
                      src="/videos/fitball.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110`}
                      style={{ objectPosition: "center 40%" }}
                      aria-label={`Групповое занятие ${program.name} в фитнес-студии Арктика, Видное`}
                    />
                  ) : (
                    <Image
                      src={`/images/programs/${program.slug}.jpg`}
                      alt={`Групповое занятие ${program.name} в фитнес-студии Арктика, Видное`}
                      fill
                      className={`object-cover transition-all duration-500 group-hover:scale-110`}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-700 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg">
                      Подробнее
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                      {CATEGORY_LABELS[program.category]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {program.duration}
                    </span>
                    <span
                      className={`text-xs ml-auto ${INTENSITY_COLOR[program.intensity]}`}
                    >
                      {program.intensity}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-1 group-hover:text-accent transition-colors">
                    {program.name}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
                    {program.shortDescription}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* CTA */}
      <div className="text-center mt-12">
        <Link
          href="/programs"
          className="inline-flex items-center gap-2 text-accent hover:text-accent-light font-medium transition-colors"
        >
          Все направления
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
  );
}

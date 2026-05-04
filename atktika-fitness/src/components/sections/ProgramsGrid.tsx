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
  низкая: "text-green-400",
  средняя: "text-yellow-400",
  высокая: "text-red-400",
};

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.25 } },
};

export default function ProgramsGrid() {
  const [active, setActive] = useState<ProgramCategory | "all">("all");

  const filtered =
    active === "all"
      ? PROGRAMS
      : PROGRAMS.filter((p) => p.category === active);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${
              active === cat
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-transparent border border-dark-500 text-gray-400 hover:border-accent/50 hover:text-white"
            }`}
          >
            {FILTER_LABELS[cat]}
            <span className="ml-1.5 text-xs opacity-60">
              {cat === "all"
                ? PROGRAMS.length
                : PROGRAMS.filter((p) => p.category === cat).length}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={container}
        initial="hidden"
        animate="visible"
        key={active}
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((program, i) => (
            <motion.div key={program.slug} variants={card} layout>
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
                      aria-label={`${program.name} — занятие в фитнес-студии Арктика, Видное`}
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
                      aria-label={`${program.name} — занятие в фитнес-студии Арктика, Видное`}
                    />
                  ) : (
                    <Image
                      src={`/images/programs/${program.slug}.jpg`}
                      alt={`${program.name} — групповое занятие в фитнес-студии Арктика, Видное`}
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
                  <h2 className="font-heading text-lg font-semibold mb-1 group-hover:text-accent transition-colors">
                    {program.name}
                  </h2>
                  <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
                    {program.shortDescription}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Count */}
      <p className="text-center text-gray-500 text-sm mt-8">
        Показано {filtered.length} из {PROGRAMS.length} направлений
      </p>
    </>
  );
}

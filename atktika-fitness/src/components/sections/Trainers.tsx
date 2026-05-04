"use client";

import { useRef } from "react";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { TRAINERS } from "@/lib/constants";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Trainers() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        className="flex items-end justify-between mb-10"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold">
            Наши <span className="text-accent">тренеры</span>
          </h2>
          <p className="mt-3 text-gray-400 text-lg max-w-xl">
            9 сертифицированных специалистов
          </p>
        </div>
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-11 h-11 rounded-full border border-dark-500 hover:border-accent hover:text-accent flex items-center justify-center text-gray-400 transition-colors"
            aria-label="Назад"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-11 h-11 rounded-full border border-dark-500 hover:border-accent hover:text-accent flex items-center justify-center text-gray-400 transition-colors"
            aria-label="Вперёд"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </motion.div>

      <motion.div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {TRAINERS.map((trainer) => (
          <Link
            key={trainer.slug}
            href={`/trainers/${trainer.slug}`}
            className="group block flex-shrink-0 w-[260px] sm:w-[280px] snap-start"
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-dark-700">
              <Image
                src={`/images/trainers/${trainer.slug}.jpg`}
                alt={`Тренер ${trainer.name} — ${trainer.role}, фитнес-студия Арктика`}
                fill
                className="object-cover object-top transition-all duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 260px, 280px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-heading text-lg font-semibold">
                  {trainer.name}
                </h3>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                  {trainer.role}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </motion.div>
    </section>
  );
}

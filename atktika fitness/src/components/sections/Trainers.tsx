"use client";

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { TRAINERS } from "@/lib/constants";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Trainers() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        className="text-center mb-14"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h2 className="font-heading text-3xl sm:text-4xl font-bold">
          Наши <span className="text-accent">тренеры</span>
        </h2>
        <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
          9 сертифицированных специалистов с индивидуальным подходом
        </p>
      </motion.div>

      <motion.div
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {TRAINERS.map((trainer) => (
          <Link
            key={trainer.slug}
            href={`/trainers/${trainer.slug}`}
            className="group block flex-shrink-0 w-[280px] sm:w-[300px] snap-start"
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-dark-700">
              <Image
                src={`/images/trainers/${trainer.slug}.jpg`}
                alt={`Тренер ${trainer.name} — ${trainer.role}, фитнес-студия Арктика`}
                fill
                className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                sizes="(max-width: 640px) 280px, 300px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-heading text-xl font-semibold">
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

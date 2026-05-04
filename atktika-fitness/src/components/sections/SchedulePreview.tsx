"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";

interface ScheduleItem {
  time: string;
  name: string;
  trainer: string;
  hall: string;
}

const FALLBACK: ScheduleItem[] = [
  { time: "09:00", name: "Сила+", trainer: "Екатерина Лазарева", hall: "Средний зал" },
  { time: "10:00", name: "Здоровая спина", trainer: "Екатерина Лазарева", hall: "Средний зал" },
  { time: "19:00", name: "Сила+", trainer: "Екатерина Лазарева", hall: "Средний зал" },
  { time: "20:00", name: "Функциональная тренировка", trainer: "Елена Сергеева", hall: "Средний зал" },
  { time: "20:00", name: "Здоровая спина", trainer: "Екатерина Лазарева", hall: "Большой зал" },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const row: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export default function SchedulePreview() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schedule")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data.slice(0, 5));
        } else {
          setItems(FALLBACK);
        }
      })
      .catch(() => setItems(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-20 sm:py-28 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold">
            Расписание <span className="text-accent">занятий</span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            Ближайшие групповые тренировки
          </p>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-dark-700 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <motion.div
            className="space-y-3"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {items.map((item, i) => (
              <motion.div
                key={i}
                variants={row}
                className="flex items-center gap-4 sm:gap-6 bg-dark-700 rounded-xl px-5 py-4 transition-colors hover:bg-dark-600"
              >
                <span className="text-accent font-heading font-bold text-lg min-w-[60px]">
                  {item.time}
                </span>
                <span className="font-semibold flex-1 truncate">
                  {item.name}
                </span>
                <span className="hidden sm:block text-gray-400 text-sm truncate max-w-[180px]">
                  {item.trainer}
                </span>
                <span className="hidden md:block text-gray-500 text-sm min-w-[120px] text-right">
                  {item.hall}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          className="text-center mt-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Link
            href="/schedule"
            className="inline-flex items-center gap-2 text-accent hover:text-accent-light font-semibold text-lg transition-colors"
          >
            Полное расписание
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

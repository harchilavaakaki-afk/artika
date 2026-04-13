"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_LABELS, TRAINERS, type ProgramCategory } from "@/lib/constants";
import type { ScheduleEntry } from "@/app/api/schedule/route";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const HALLS = ["Все залы", "Средний зал", "Большой зал", "Вело-зал"];
const CATEGORIES: (ProgramCategory | "all")[] = ["all", "power", "soft", "dance"];
const CATEGORY_FILTER_LABELS: Record<ProgramCategory | "all", string> = {
  all: "Все",
  ...CATEGORY_LABELS,
};

function SkeletonCard() {
  return (
    <div className="bg-dark-700 rounded-2xl p-4 animate-pulse">
      <div className="h-4 bg-dark-600 rounded w-3/4 mb-2" />
      <div className="h-3 bg-dark-600 rounded w-1/2 mb-2" />
      <div className="h-3 bg-dark-600 rounded w-2/3" />
    </div>
  );
}

export default function ScheduleView() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1; // 0=Пн
  });
  const [category, setCategory] = useState<ProgramCategory | "all">("all");
  const [hall, setHall] = useState("Все залы");
  const [trainer, setTrainer] = useState("Все тренеры");

  useEffect(() => {
    fetch("/api/schedule")
      .then((r) => r.json())
      .then((data: ScheduleEntry[]) => setSchedule(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const uniqueTrainers = [
    "Все тренеры",
    ...Array.from(new Set(schedule.map((s) => s.trainer))).sort(),
  ];

  const filtered = schedule.filter((s) => {
    if (s.dayOfWeek !== activeDay) return false;
    if (category !== "all" && s.category !== category) return false;
    if (hall !== "Все залы" && s.hall !== hall) return false;
    if (trainer !== "Все тренеры" && s.trainer !== trainer) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div>
      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1 scrollbar-hide">
        {DAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => setActiveDay(i)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
              activeDay === i
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mb-8">
        {/* Category */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                category === cat
                  ? "bg-accent/20 text-accent border border-accent/40"
                  : "bg-dark-700 text-gray-500 border border-dark-500 hover:border-accent/30 hover:text-gray-300"
              }`}
            >
              {CATEGORY_FILTER_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Hall */}
        <select
          value={hall}
          onChange={(e) => setHall(e.target.value)}
          className="bg-dark-700 border border-dark-500 text-gray-300 text-sm rounded-full px-4 py-2 focus:border-accent focus:outline-none cursor-pointer"
        >
          {HALLS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        {/* Trainer */}
        <select
          value={trainer}
          onChange={(e) => setTrainer(e.target.value)}
          className="bg-dark-700 border border-dark-500 text-gray-300 text-sm rounded-full px-4 py-2 focus:border-accent focus:outline-none cursor-pointer"
        >
          {uniqueTrainers.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Schedule cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            Нет занятий по выбранным фильтрам
          </p>
          <button
            onClick={() => {
              setCategory("all");
              setHall("Все залы");
              setTrainer("Все тренеры");
            }}
            className="mt-4 text-accent hover:text-accent-light text-sm cursor-pointer"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table view */}
          <div className="hidden lg:block">
            <div className="bg-dark-700 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-500">
                    <th className="text-left text-sm font-medium text-gray-500 px-6 py-4 w-24">
                      Время
                    </th>
                    <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                      Занятие
                    </th>
                    <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                      Тренер
                    </th>
                    <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                      Зал
                    </th>
                    <th className="text-right text-sm font-medium text-gray-500 px-6 py-4 w-40">
                      &nbsp;
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {sorted.map((entry) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="border-b border-dark-600 last:border-b-0 hover:bg-dark-600/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">
                            {entry.time}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.duration}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">
                            {entry.name}
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                              entry.category === "power"
                                ? "bg-red-500/10 text-red-400"
                                : entry.category === "dance"
                                  ? "bg-purple-500/10 text-purple-400"
                                  : "bg-green-500/10 text-green-400"
                            }`}
                          >
                            {CATEGORY_LABELS[entry.category]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {entry.trainer}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {entry.hall}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href="https://t.me/arcfit"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-accent hover:text-accent-light text-sm font-medium transition-colors"
                          >
                            Записаться
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                          </a>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card view */}
          <div className="lg:hidden space-y-3">
            <AnimatePresence mode="popLayout">
              {sorted.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="bg-dark-700 rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-accent font-medium text-lg">
                        {entry.time}
                      </span>
                      <span className="text-gray-500 text-sm ml-2">
                        {entry.duration}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        entry.category === "power"
                          ? "bg-red-500/10 text-red-400"
                          : entry.category === "dance"
                            ? "bg-purple-500/10 text-purple-400"
                            : "bg-green-500/10 text-green-400"
                      }`}
                    >
                      {CATEGORY_LABELS[entry.category]}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {entry.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-1">
                    {entry.trainer}
                  </p>
                  <p className="text-gray-500 text-sm mb-3">{entry.hall}</p>
                  <a
                    href="https://t.me/arcfit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white text-sm font-medium px-5 py-2 rounded-full transition-colors"
                  >
                    Записаться
                  </a>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Total count */}
      {!loading && sorted.length > 0 && (
        <p className="text-center text-gray-500 text-sm mt-6">
          {sorted.length}{" "}
          {sorted.length === 1
            ? "занятие"
            : sorted.length < 5
              ? "занятия"
              : "занятий"}{" "}
          на {DAYS[activeDay]}
        </p>
      )}
    </div>
  );
}

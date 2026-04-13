"use client";

import { useRef } from "react";
import { motion, type Variants } from "framer-motion";

const REVIEWS = [
  {
    text: "Прекрасная студия! Хожу на йогу к Наталии — после занятий чувствую себя заново рождённой. Очень уютная атмосфера, небольшие группы.",
    name: "Анна М.",
    since: "клиент с 2024 г.",
  },
  {
    text: "Отличный тренажёрный зал и грамотные тренеры. Александр составил программу, за 3 месяца результат превзошёл ожидания.",
    name: "Дмитрий К.",
    since: "клиент с 2023 г.",
  },
  {
    text: "Хожу на функциональные тренировки и стретчинг. Нравится, что можно привести ребёнка на секцию, а самой позаниматься. Удобно!",
    name: "Елена С.",
    since: "клиент с 2024 г.",
  },
  {
    text: "Лучший фитнес в Видном! Пробовала другие клубы — здесь совсем другой уровень внимания к каждому. Рекомендую всем.",
    name: "Мария В.",
    since: "клиент с 2023 г.",
  },
  {
    text: "Занимаюсь кроссфитом и силовыми. Оборудование новое, тренеры следят за техникой. Парковка бесплатная — огромный плюс.",
    name: "Игорь Л.",
    since: "клиент с 2024 г.",
  },
  {
    text: "Начала с пилатеса, потом подключила интервальные. За полгода ушло 8 кг. Спасибо Екатерине Лазаревой за мотивацию!",
    name: "Ольга Т.",
    since: "клиент с 2024 г.",
  },
];

function Stars() {
  return (
    <div className="flex gap-1 text-accent mb-4">
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Reviews() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
  };

  return (
    <section className="py-20 sm:py-28 overflow-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <motion.div
          className="flex items-end justify-between"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold">
            Отзывы наших <span className="text-accent">клиентов</span>
          </h2>
          <button
            onClick={scroll}
            className="hidden sm:flex w-11 h-11 rounded-full border border-dark-500 hover:border-accent hover:text-accent items-center justify-center text-gray-400 transition-colors flex-shrink-0"
            aria-label="Следующий отзыв"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </motion.div>
      </div>

      {/* Horizontal scroll row */}
      <motion.div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 px-4 sm:px-6 lg:px-8 scrollbar-hide"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {REVIEWS.map((review, i) => (
          <div
            key={i}
            className="bg-dark-700 rounded-2xl p-8 flex flex-col flex-shrink-0 w-[300px] sm:w-[340px] snap-start"
          >
            <Stars />
            <p className="text-gray-300 leading-relaxed flex-1">
              &ldquo;{review.text}&rdquo;
            </p>
            <div className="mt-6 pt-4 border-t border-dark-500">
              <div className="font-semibold">{review.name}</div>
              <div className="text-gray-500 text-sm">{review.since}</div>
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

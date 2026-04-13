"use client";

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

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Reviews() {
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
          Отзывы наших <span className="text-accent">клиентов</span>
        </h2>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {REVIEWS.map((review, i) => (
          <motion.div
            key={i}
            variants={card}
            className="bg-dark-700 rounded-2xl p-8 flex flex-col"
          >
            <Stars />
            <p className="text-gray-300 leading-relaxed flex-1">
              &ldquo;{review.text}&rdquo;
            </p>
            <div className="mt-6 pt-4 border-t border-dark-500">
              <div className="font-semibold">{review.name}</div>
              <div className="text-gray-500 text-sm">{review.since}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

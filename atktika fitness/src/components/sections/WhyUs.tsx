"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";

/* ---------- CountUp ---------- */
function CountUp({ end, suffix = "" }: { end: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1400;
          const start = performance.now();
          const step = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.round(eased * end));
            if (t < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

/* ---------- Variants ---------- */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ---------- Component ---------- */
export default function WhyUs() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

      {/* Section header — left-aligned, more impactful */}
      <motion.div
        className="mb-12"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.p
          variants={fadeUp}
          className="text-accent text-sm font-semibold uppercase tracking-widest mb-3"
        >
          Почему выбирают Арктику
        </motion.p>
        <motion.h2
          variants={fadeUp}
          className="font-heading text-4xl sm:text-5xl font-extrabold leading-tight max-w-2xl"
        >
          500 человек уже&nbsp;
          <span className="text-accent">получили результат.</span>
          <br />
          <span className="text-gray-400 font-bold text-3xl sm:text-4xl">
            Вы — следующий?
          </span>
        </motion.h2>
      </motion.div>

      {/* Bento grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >

        {/* LARGE CARD — photo background, main USP */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl min-h-[380px] md:col-span-2 lg:col-span-2 lg:row-span-2 group cursor-default"
        >
          <Image
            src="/images/gallery/group-class-squats.jpg"
            alt="Групповое занятие в фитнес-студии Арктика, Видное"
            fill
            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 66vw"
          />
          {/* Dark gradient — covers full card for centered text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25" />

          {/* Accent top-left bar */}
          <div className="absolute top-0 left-0 w-1 h-full bg-accent" />

          {/* Content — vertically centered */}
          <div className="absolute inset-0 flex flex-col justify-center p-8 sm:p-10">
            <div className="inline-block text-accent text-xs font-bold uppercase tracking-widest border border-accent/40 px-3 py-1 rounded-full mb-4">
              Главное отличие
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 leading-tight max-w-md">
              Тренер помнит<br />твоё имя
            </h3>
            <p className="text-gray-300 text-sm sm:text-base max-w-sm leading-relaxed">
              У нас нет 300 человек в зале и&nbsp;очереди за&nbsp;гантелями. Маленькие группы&nbsp;— это не маркетинг. Это то, что ты почувствуешь уже на&nbsp;первом занятии.
            </p>
          </div>
        </motion.div>

        {/* STAT CARD 1 — clients */}
        <motion.div
          variants={fadeUp}
          className="bg-dark-700 rounded-3xl p-7 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300"
        >
          <div className="text-6xl sm:text-7xl font-heading font-extrabold text-accent leading-none">
            <CountUp end={500} suffix="+" />
          </div>
          <div>
            <div className="font-heading font-bold text-xl text-white mt-4">
              клиентов с нами
            </div>
            <div className="text-gray-400 text-sm mt-1 leading-relaxed">
              Уходят&nbsp;— и&nbsp;возвращаются. Потому что работает.
            </div>
          </div>
        </motion.div>

        {/* STAT CARD 2 — directions */}
        <motion.div
          variants={fadeUp}
          className="bg-dark-700 rounded-3xl p-7 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300"
        >
          <div className="text-6xl sm:text-7xl font-heading font-extrabold text-accent leading-none">
            <CountUp end={20} suffix="+" />
          </div>
          <div>
            <div className="font-heading font-bold text-xl text-white mt-4">
              направлений
            </div>
            <div className="text-gray-400 text-sm mt-1 leading-relaxed">
              Йога, кроссфит, танцы, пилатес&nbsp;— найдёшь то, от&nbsp;чего не&nbsp;захочешь останавливаться.
            </div>
          </div>
        </motion.div>

        {/* CARD: first result */}
        <motion.div
          variants={fadeUp}
          className="bg-dark-700 rounded-3xl p-7 hover:-translate-y-1 transition-transform duration-300"
        >
          <div className="text-accent text-4xl font-heading font-extrabold mb-4 leading-none">
            3&nbsp;нед.
          </div>
          <h3 className="font-heading text-lg font-bold text-white mb-2">
            Первый результат&nbsp;—<br />через три недели
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Не&nbsp;«займёт время», а&nbsp;конкретный план с&nbsp;понятными целями на&nbsp;каждой тренировке.
          </p>
        </motion.div>

        {/* CARD: family */}
        <motion.div
          variants={fadeUp}
          className="bg-dark-700 rounded-3xl p-7 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-accent/10 rounded-full pointer-events-none" />
          <h3 className="font-heading text-lg font-bold text-white mb-2 relative z-10">
            Привезите детей&nbsp;—<br />потренируйтесь сами
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed relative z-10">
            Детские секции в&nbsp;том же комплексе. Никаких «жду в&nbsp;машине».
          </p>
          <div className="mt-4 text-xs text-accent font-semibold uppercase tracking-wide relative z-10">
            Бесплатная парковка у входа
          </div>
        </motion.div>

        {/* CTA CARD */}
        <motion.div
          variants={fadeUp}
          className="bg-accent rounded-3xl p-7 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 md:col-span-2 lg:col-span-1"
        >
          <div>
            <div className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-3">
              Специально для вас
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white leading-snug">
              Скидки до 50%&nbsp;—<br />новый сезон
            </h3>
            <p className="text-white/70 text-sm mt-3 leading-relaxed">
              Годовая карта включает&nbsp;2 тренировки по&nbsp;единоборствам в&nbsp;подарок. Спецпредложения для семей.
            </p>
          </div>
          <Link
            href="/#signup"
            className="mt-6 inline-block text-center bg-white text-accent font-bold px-6 py-3.5 rounded-full transition-colors hover:bg-gray-50 text-sm shadow-lg"
          >
            Узнать стоимость
          </Link>
        </motion.div>

      </motion.div>
    </section>
  );
}

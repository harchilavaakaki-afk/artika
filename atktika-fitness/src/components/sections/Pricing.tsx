"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { SITE } from "@/lib/constants";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

const plans = [
  {
    name: "Безлимитная карта",
    time: "Посещение клуба в любой день с\u00A07:00 до\u00A022:00",
    popular: true,
    options: ["Карта на\u00A0год", "Карта на\u00A06 месяцев", "Карта на\u00A0месяц"],
  },
  {
    name: "Дневная карта",
    time: "Посещение клуба в любой день с\u00A07:00 до\u00A017:00",
    popular: false,
    options: ["Карта на\u00A0год", "Карта на\u00A06 месяцев"],
  },
];

export default function Pricing() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-14"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold">
            Клубные карты и&nbsp;<span className="text-accent">абонементы</span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
            Все карты включают тренажёрный зал, кардиозону и&nbsp;групповые занятия
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "bg-gradient-to-br from-accent/20 to-accent-dark/10 ring-1 ring-accent/30"
                  : "bg-dark-700"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-6 bg-accent text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Популярная
                </span>
              )}

              <h3 className="font-heading text-xl font-bold text-white mb-1">
                {plan.name}
              </h3>
              <p className="text-gray-400 text-sm mb-6">{plan.time}</p>

              <div className="space-y-3">
                {plan.options.map((opt) => (
                  <div
                    key={opt}
                    className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3"
                  >
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6" />
                    </svg>
                    <span className="text-gray-200 text-sm">{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <a
            href={`tel:${SITE.phoneSales.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-semibold px-10 py-4 rounded-full text-lg transition-colors shadow-lg shadow-accent/20"
          >
            Узнать цену
          </a>
          <div className="mt-4">
            <Link href="/pricing" className="text-gray-400 hover:text-accent text-sm transition-colors">
              Подробнее об абонементах →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Фитнес Видное — цены и абонементы",
  description:
    "Цены и абонементы фитнес-клуба Арктика в Видном (Зелёный пер., 10): дневные и безлимитные карты, разовое посещение. Тренажёрный зал и 20+ групповых занятий включены.",
  alternates: { canonical: `${SITE.url}/pricing` },
  openGraph: {
    title: "Цены и абонементы — Фитнес-клуб Арктика, Видное",
    description:
      "Цены на абонементы в фитнес-клуб Арктика в Видном. Дневные и безлимитные карты, тренажёрный зал и групповые занятия.",
    url: `${SITE.url}/pricing`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE.name,
  },
};

const plans = [
  {
    name: "Дневная карта",
    time: "7:00–17:00",
    popular: false,
    options: [
      { period: "Год", price: "Уточнить" },
      { period: "6 месяцев", price: "Уточнить" },
    ],
  },
  {
    name: "Безлимитная карта",
    time: "7:00–22:00",
    popular: true,
    options: [
      { period: "Год", price: "Уточнить" },
      { period: "6 месяцев", price: "Уточнить" },
      { period: "Месяц", price: "Уточнить" },
    ],
  },
  {
    name: "Разовое посещение",
    time: "В часы работы клуба",
    popular: false,
    options: [{ period: "1 визит", price: "Уточнить" }],
  },
];

const faq = [
  {
    q: "Можно ли заморозить абонемент?",
    a: "Да, абонемент можно заморозить на срок до 30 дней. Обратитесь на ресепшен или позвоните нам.",
  },
  {
    q: "Есть ли пробное занятие?",
    a: "Да! Вы можете прийти на пробное групповое занятие или на бесплатную вводную тренировку в тренажёрном зале. Оставьте заявку или позвоните для записи.",
  },
  {
    q: "Что входит в абонемент?",
    a: "Все абонементы включают доступ к тренажёрному залу, кардиозоне и групповым занятиям по расписанию.",
  },
  {
    q: "Есть ли скидки для студентов и пенсионеров?",
    a: "Да, у нас действуют специальные условия. Уточните подробности по телефону или на ресепшене.",
  },
  {
    q: "Как оплатить абонемент?",
    a: "Оплата наличными или картой на ресепшене фитнес-студии Арктика.",
  },
];

export default function PricingPage() {
  const offerSchema = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: SITE.name,
    url: SITE.url,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Зелёный переулок, 10",
      addressLocality: "Видное",
      addressRegion: "Московская область",
      addressCountry: "RU",
    },
    telephone: SITE.phone,
    makesOffer: plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      description: `${plan.name} (${plan.time})`,
      availability: "https://schema.org/InStock",
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <Breadcrumbs items={[{ name: "Цены", href: "/pricing" }]} />

        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4 mb-4">
          Абонементы и цены
        </h1>
        <p className="text-gray-400 text-lg mb-12 max-w-2xl">
          Выберите подходящий абонемент в фитнес-студию Арктика в Видном.
          Все карты включают тренажёрный зал и групповые занятия.
        </p>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-dark-700 rounded-2xl p-6 sm:p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                plan.popular
                  ? "ring-2 ring-accent hover:shadow-accent/20"
                  : "hover:shadow-white/5"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Популярная
                </span>
              )}

              <h2 className="font-heading text-xl font-bold text-white mb-1">
                {plan.name}
              </h2>
              <p className="text-gray-500 text-sm mb-6">{plan.time}</p>

              <div className="space-y-4 flex-1">
                {plan.options.map((opt) => (
                  <div
                    key={opt.period}
                    className="flex items-center justify-between border-b border-dark-500 pb-3"
                  >
                    <span className="text-gray-300">{opt.period}</span>
                    <span className="text-white font-semibold">
                      {opt.price === "Уточнить" ? "—" : opt.price}
                    </span>
                  </div>
                ))}
              </div>

              <a
                href={`tel:${SITE.phoneSales.replace(/\s/g, "")}`}
                className={`mt-6 text-center py-3 rounded-xl font-semibold transition-colors ${
                  plan.popular
                    ? "bg-accent hover:bg-accent-light text-white"
                    : "bg-dark-600 hover:bg-dark-500 text-white"
                }`}
              >
                Уточнить цену
              </a>
            </div>
          ))}
        </div>

        {/* What's included */}
        <section className="bg-dark-700 rounded-2xl p-8 sm:p-12 mb-16">
          <h2 className="font-heading text-2xl font-bold text-white mb-6">
            Что входит в абонемент
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Тренажёрный зал",
              "Кардиозона",
              "Все групповые занятия",
              "Раздевалки с душем",
              "Бесплатная вводная тренировка в тренажёрном зале",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-gray-300">
                <svg
                  className="w-5 h-5 text-accent shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="font-heading text-2xl font-bold text-white mb-8">
            Часто задаваемые вопросы
          </h2>
          <div className="space-y-4">
            {faq.map((item) => (
              <details
                key={item.q}
                className="group bg-dark-700 rounded-2xl overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer p-6 text-white font-medium hover:text-accent transition-colors list-none">
                  {item.q}
                  <svg
                    className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform shrink-0 ml-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <p className="px-6 pb-6 text-gray-400 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-accent/10 to-accent-dark/10 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-4">
            Записаться на пробное занятие
          </h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Приходите в Арктику и попробуйте любое групповое занятие
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`tel:${SITE.phoneSales.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-medium px-8 py-3 rounded-full transition-colors"
            >
              Позвонить
            </a>
            <a
              href={SITE.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-accent text-accent hover:bg-accent hover:text-white font-medium px-8 py-3 rounded-full transition-colors"
            >
              Написать в Telegram
            </a>
          </div>
        </section>

        {/* Links */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-gray-400">
          <Link
            href="/programs"
            className="hover:text-accent transition-colors"
          >
            Направления
          </Link>
          <Link
            href="/schedule"
            className="hover:text-accent transition-colors"
          >
            Расписание
          </Link>
          <Link
            href="/contacts"
            className="hover:text-accent transition-colors"
          >
            Контакты
          </Link>
        </div>
      </div>
    </>
  );
}

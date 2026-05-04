import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description:
    "Политика конфиденциальности фитнес-студии Арктика. Обработка персональных данных.",
  alternates: { canonical: `${SITE.url}/privacy` },
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <Breadcrumbs
        items={[{ name: "Политика конфиденциальности", href: "/privacy" }]}
      />

      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white mt-4 mb-8">
        Политика конфиденциальности
      </h1>

      <div className="prose prose-invert prose-gray max-w-none space-y-6 text-gray-300 leading-relaxed">
        <p>
          Настоящая Политика конфиденциальности определяет порядок обработки
          и&nbsp;защиты персональных данных пользователей сайта{" "}
          <strong>arcfit.ru</strong> (далее — Сайт), принадлежащего{" "}
          {SITE.name} (далее — Оператор).
        </p>

        <h2 className="font-heading text-xl font-semibold text-white">
          1. Какие данные мы собираем
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Имя</li>
          <li>Номер телефона</li>
          <li>Данные об использовании сайта (cookies, Яндекс.Метрика)</li>
        </ul>

        <h2 className="font-heading text-xl font-semibold text-white">
          2. Цели обработки
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Обратная связь и запись на занятия</li>
          <li>Улучшение качества сервиса</li>
          <li>Аналитика посещаемости сайта</li>
        </ul>

        <h2 className="font-heading text-xl font-semibold text-white">
          3. Защита данных
        </h2>
        <p>
          Оператор принимает необходимые организационные и&nbsp;технические меры
          для защиты персональных данных от неправомерного доступа, изменения,
          раскрытия или уничтожения.
        </p>

        <h2 className="font-heading text-xl font-semibold text-white">
          4. Передача третьим лицам
        </h2>
        <p>
          Персональные данные не&nbsp;передаются третьим лицам, за исключением
          случаев, предусмотренных законодательством РФ.
        </p>

        <h2 className="font-heading text-xl font-semibold text-white">
          5. Cookies и&nbsp;аналитика
        </h2>
        <p>
          Сайт использует файлы cookies и&nbsp;сервис Яндекс.Метрика для сбора
          статистики. Вы можете отключить cookies в&nbsp;настройках браузера.
        </p>

        <h2 className="font-heading text-xl font-semibold text-white">
          6. Права пользователя
        </h2>
        <p>
          Вы вправе запросить удаление своих персональных данных, обратившись
          по&nbsp;телефону{" "}
          <a
            href={`tel:${SITE.phone.replace(/\s/g, "")}`}
            className="text-accent hover:text-accent-light"
          >
            {SITE.phone}
          </a>{" "}
          или через форму обратной связи.
        </p>

        <h2 className="font-heading text-xl font-semibold text-white">
          7. Контакты
        </h2>
        <p>
          {SITE.name}
          <br />
          {SITE.address}
          <br />
          Телефон:{" "}
          <a
            href={`tel:${SITE.phone.replace(/\s/g, "")}`}
            className="text-accent hover:text-accent-light"
          >
            {SITE.phone}
          </a>
        </p>
      </div>
    </div>
  );
}

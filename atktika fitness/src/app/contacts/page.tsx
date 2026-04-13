"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { SITE } from "@/lib/constants";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 1) return "+7";
  const parts = ["+7"];
  if (digits.length > 1) parts.push(` (${digits.slice(1, 4)}`);
  if (digits.length >= 4) parts[1] += ")";
  if (digits.length > 4) parts.push(` ${digits.slice(4, 7)}`);
  if (digits.length > 7) parts.push(`-${digits.slice(7, 9)}`);
  if (digits.length > 9) parts.push(`-${digits.slice(9, 11)}`);
  return parts.join("");
}

export default function ContactsPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [shake, setShake] = useState(false);

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (!name.trim() || digits.length < 11) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: `+${digits}` }),
      });
      if (res.ok) {
        setStatus("success");
        setName("");
        setPhone("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const { lat, lng } = SITE.geo;
  const mapSrc = `https://yandex.ru/map-widget/v1/?ll=${lng},${lat}&z=16&pt=${lng},${lat},pm2rdm&lang=ru_RU`;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: SITE.name,
    url: SITE.url,
    telephone: SITE.phone,
    email: undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Зелёный переулок, 10",
      addressLocality: "Видное",
      addressRegion: "Московская область",
      postalCode: "142703",
      addressCountry: "RU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "07:00",
      closes: "22:00",
    },
    image: `${SITE.url}/og-image.png`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <Breadcrumbs items={[{ name: "Контакты", href: "/contacts" }]} />

        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4 mb-12">
          Контакты
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Map */}
          <div className="rounded-2xl overflow-hidden h-[400px] lg:h-full min-h-[400px]">
            <iframe
              src={mapSrc}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              title="Фитнес-студия Арктика на карте — г. Видное, Зелёный пер., 10"
              className="w-full h-full"
            />
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-dark-700 rounded-2xl p-6">
              <h2 className="font-heading text-lg font-semibold text-white mb-4">
                Адрес
              </h2>
              <p className="text-gray-300 text-lg">{SITE.address}</p>
              <p className="text-gray-500 text-sm mt-1">
                Спортивный комплекс Арктика
              </p>
            </div>

            <div className="bg-dark-700 rounded-2xl p-6">
              <h2 className="font-heading text-lg font-semibold text-white mb-4">
                Телефоны
              </h2>
              <div className="space-y-2">
                <a
                  href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                  className="block text-accent hover:text-accent-light text-lg transition-colors"
                >
                  {SITE.phone}
                </a>
                <a
                  href={`tel:${SITE.phoneSales.replace(/\s/g, "")}`}
                  className="block text-accent hover:text-accent-light text-lg transition-colors"
                >
                  {SITE.phoneSales}{" "}
                  <span className="text-gray-500 text-sm">
                    (отдел продаж)
                  </span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-dark-700 rounded-2xl p-6">
                <h2 className="font-heading text-lg font-semibold text-white mb-2">
                  Telegram
                </h2>
                <a
                  href={SITE.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-light transition-colors"
                >
                  @arcfit
                </a>
              </div>

              <div className="bg-dark-700 rounded-2xl p-6">
                <h2 className="font-heading text-lg font-semibold text-white mb-2">
                  Время работы
                </h2>
                <p className="text-gray-300">
                  Ежедневно {SITE.hours}
                </p>
              </div>
            </div>

            <div className="bg-dark-700 rounded-2xl p-6">
              <h2 className="font-heading text-lg font-semibold text-white mb-3">
                Как добраться
              </h2>
              <div className="space-y-2 text-gray-300">
                <p className="flex items-start gap-2">
                  <span className="shrink-0">🚆</span>
                  <span>
                    МЦД-2 станция Расторгуево — 10 минут пешком по
                    ул. Советская в сторону Зелёного переулка
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="shrink-0">🚗</span>
                  <span>
                    На машине — бесплатная парковка у комплекса. Въезд с
                    Зелёного переулка
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <section className="bg-dark-700 rounded-2xl p-8 sm:p-12 mb-12">
          <h2 className="font-heading text-2xl font-bold text-white mb-2 text-center">
            Напишите нам
          </h2>
          <p className="text-gray-400 text-center mb-8">
            Оставьте заявку — мы перезвоним в течение 15 минут
          </p>

          <form
            onSubmit={handleSubmit}
            className={`max-w-lg mx-auto space-y-4 ${shake ? "animate-shake" : ""}`}
          >
            <input
              type="text"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 bg-dark-600 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-accent/50 transition-shadow"
            />
            <input
              type="tel"
              placeholder="+7 (___) ___-__-__"
              value={phone}
              onChange={handlePhoneChange}
              className="w-full px-5 py-4 bg-dark-600 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-accent/50 transition-shadow"
            />
            <textarea
              placeholder="Сообщение (необязательно)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-5 py-4 bg-dark-600 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-accent/50 transition-shadow resize-none"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-accent hover:bg-accent-light disabled:opacity-60 text-white font-semibold py-4 rounded-xl text-lg transition-colors shadow-lg shadow-accent/20"
            >
              {status === "sending" ? "Отправка..." : "Отправить"}
            </button>

            {status === "success" && (
              <div className="flex items-center justify-center gap-3 text-green-400 bg-green-400/10 rounded-xl py-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Заявка отправлена! Перезвоним в течение 15 минут.
              </div>
            )}

            {status === "error" && (
              <div className="text-red-400 bg-red-400/10 rounded-xl py-4 text-center">
                Ошибка отправки. Позвоните нам: {SITE.phone}
              </div>
            )}
          </form>
        </section>

        {/* Quick links */}
        <div className="flex flex-wrap justify-center gap-6 text-gray-400">
          <Link
            href="/pricing"
            className="hover:text-accent transition-colors"
          >
            Цены
          </Link>
          <Link
            href="/schedule"
            className="hover:text-accent transition-colors"
          >
            Расписание
          </Link>
          <Link
            href="/programs"
            className="hover:text-accent transition-colors"
          >
            Направления
          </Link>
        </div>
      </div>
    </>
  );
}

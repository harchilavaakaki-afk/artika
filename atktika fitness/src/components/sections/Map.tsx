"use client";

import { motion, type Variants } from "framer-motion";
import { SITE } from "@/lib/constants";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Map() {
  const mapSrc = `https://yandex.ru/map-widget/v1/?ll=37.712605,55.561548&z=16&pt=37.712605,55.561548,pm2rdm&lang=ru_RU`;

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
            Как нас <span className="text-accent">найти</span>
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Map embed */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden h-[400px]">
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

          {/* Info */}
          <div className="flex flex-col justify-center gap-6">
            <div>
              <h3 className="font-heading text-lg font-semibold mb-2">Адрес</h3>
              <p className="text-gray-400">{SITE.address}</p>
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold mb-2">Телефон</h3>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="text-accent hover:text-accent-light transition-colors">
                {SITE.phone}
              </a>
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold mb-2">Время работы</h3>
              <p className="text-gray-400">{SITE.hours}</p>
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold mb-2">Как добраться</h3>
              <ul className="text-gray-400 space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H8L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                  </span>
                  На машине — бесплатная парковка
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                  </span>
                  МЦД Расторгуево → 10 мин пешком
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion, type Variants } from "framer-motion";
import { SITE } from "@/lib/constants";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Map() {
  const { lat, lng } = SITE.geo;
  const mapSrc = `https://yandex.ru/map-widget/v1/?ll=${lng},${lat}&z=16&pt=${lng},${lat},pm2rdm&lang=ru_RU`;

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
              <ul className="text-gray-400 space-y-1 text-sm">
                <li>🚗 На машине — бесплатная парковка</li>
                <li>🚆 МЦД Расторгуево → 10 мин пешком</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

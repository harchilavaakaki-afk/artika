"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { FACILITIES } from "@/lib/constants";

export default function Facilities() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="py-20 sm:py-28 overflow-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold">
            Зоны <span className="text-accent">клуба</span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-xl">
            Современные залы для любого вида тренировки
          </p>
        </motion.div>
      </div>

      {/* Desktop: Swiper horizontal scroll */}
      <motion.div
        className="hidden sm:block"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <Swiper
          modules={[FreeMode, Mousewheel]}
          slidesPerView={2.5}
          spaceBetween={24}
          freeMode={{ enabled: true, sticky: false }}
          mousewheel={{ forceToAxis: true }}
          slidesOffsetBefore={16}
          slidesOffsetAfter={48}
          breakpoints={{
            640: { slidesPerView: 1.8, spaceBetween: 16 },
            768: { slidesPerView: 2.2, spaceBetween: 20 },
            1024: { slidesPerView: 2.5, spaceBetween: 24 },
            1280: { slidesPerView: 3, spaceBetween: 24 },
          }}
        >
          {FACILITIES.map((facility, i) => (
            <SwiperSlide key={facility.slug}>
              <FacilityCard facility={facility} index={i} />
            </SwiperSlide>
          ))}
        </Swiper>
      </motion.div>

      {/* Mobile: vertical list */}
      <div className="sm:hidden px-4 space-y-6">
        {FACILITIES.map((facility, i) => (
          <motion.div
            key={facility.slug}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 * i }}
          >
            <FacilityCard facility={facility} index={i} />
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <Link
          href="/facilities"
          className="inline-flex items-center gap-2 text-accent hover:text-accent-light font-medium transition-colors"
        >
          Все зоны клуба
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

/* ---------- Card ---------- */
function FacilityCard({
  facility,
  index: _index,
}: {
  facility: (typeof FACILITIES)[number];
  index: number;
}) {
  return (
    <Link
      href={`/facilities/${facility.slug}`}
      className="group block"
    >
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4">
        <Image
          src={`/images/facilities/${facility.slug}.jpg`}
          alt={`${facility.name} фитнес-студии Арктика в Видном — ${facility.features.slice(0, 2).join(", ")}`}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Features overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
          {facility.features.slice(0, 3).map((f) => (
            <span
              key={f}
              className="text-xs bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-full"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <h3 className="font-heading text-xl sm:text-2xl font-semibold group-hover:text-accent transition-colors">
        {facility.name}
      </h3>
      <p className="mt-2 text-sm text-gray-400 leading-relaxed line-clamp-2">
        {facility.description}
      </p>
    </Link>
  );
}

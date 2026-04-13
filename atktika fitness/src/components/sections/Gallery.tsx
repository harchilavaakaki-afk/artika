"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";

const PHOTOS = [
  { src: "/images/gallery/group-class-trainer.jpg", alt: "Групповое занятие — тренер Арктика Фитнес" },
  { src: "/images/gallery/gym-training-1.jpg", alt: "Тренировка в тренажёрном зале Арктика" },
  { src: "/images/gallery/group-class-squats.jpg", alt: "Групповое занятие — приседания, Арктика" },
  { src: "/images/gallery/gym-dumbbells.jpg", alt: "Гантельный ряд — тренажёрный зал Арктика" },
  { src: "/images/gallery/group-class-stretch.jpg", alt: "Стретчинг — групповое занятие Арктика" },
  { src: "/images/gallery/gym-training-2.jpg", alt: "Тренировка на тренажёре, Арктика Видное" },
  { src: "/images/gallery/personal-training.jpg", alt: "Персональная тренировка — тренер и клиент" },
  { src: "/images/gallery/cardio-zone.jpg", alt: "Кардио зона — беговые дорожки Арктика" },
  { src: "/images/gallery/yoga-class.jpg", alt: "Йога — занятие в Арктика Фитнес, Видное" },
  { src: "/images/gallery/gym-training-3.jpg", alt: "Силовая тренировка — Арктика Фитнес" },
  { src: "/images/gallery/kids-class.jpg", alt: "Детская секция — занятие в Арктика Фитнес" },
  { src: "/images/gallery/gym-training-4.jpg", alt: "Тренировка в зале Арктика, Видное" },
];

export default function Gallery() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        className="mb-10"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-3">
          Атмосфера
        </p>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold">
          Жизнь <span className="text-accent">в клубе</span>
        </h2>
      </motion.div>

      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
        {PHOTOS.map((photo, i) => (
          <motion.div
            key={photo.src}
            className="break-inside-avoid rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="relative w-full aspect-square group">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

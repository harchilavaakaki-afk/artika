"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

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
          const duration = 1600;
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

const STATS = [
  { end: 20, suffix: "+", label: "направлений" },
  { end: 9, suffix: "", label: "тренеров" },
  { end: 500, suffix: "+", label: "клиентов" },
];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();

  // Absolute px values: BG moves slower than scroll (parallax depth)
  const bgY = useTransform(scrollY, [0, 700], ["0px", "100px"]);
  // Right photo panel counter-moves for extra depth
  const photoY = useTransform(scrollY, [0, 700], ["0px", "-50px"]);

  return (
    <section
      ref={ref}
      className="relative lg:h-[100svh] lg:min-h-[600px] flex flex-col pt-24 pb-16 lg:pb-0 lg:flex-row lg:items-center lg:pt-0"
    >
      {/* Video background — clipped to section bounds */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          className="absolute -inset-[100px] hidden lg:block"
          style={{ y: bgY }}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/images/hero/hero-bg.mp4" type="video/mp4" />
          </video>
        </motion.div>
        <div className="absolute inset-0 lg:hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/images/hero/hero-bg.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/90 via-black/65 to-black/30" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-dark-800 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:block lg:my-auto">
        <div className="relative flex flex-col gap-6 lg:gap-0 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">

          {/* Left: text */}
          <div className="relative z-10 max-w-[90%] sm:max-w-[80%] lg:max-w-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-accent/15 border border-accent/30 text-accent text-sm font-medium px-4 py-1.5 rounded-full mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Видное · Ежедневно 7:00–22:00
            </motion.div>

            <motion.h1
              className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Новый сезон&nbsp;—<br />
              <span className="text-accent">скидки до 50%</span>
            </motion.h1>

            <motion.p
              className="mt-6 sm:mt-5 text-lg sm:text-xl text-gray-300 max-w-md leading-relaxed"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Фитнес-студия в&nbsp;Видном: 20&nbsp;направлений, небольшие группы даже в&nbsp;часы пик, тренеры которые помнят ваше имя.
            </motion.p>

            <motion.div
              className="mt-5 flex flex-col sm:flex-row gap-3 w-fit"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <a
                href="/#signup"
                className="bg-accent hover:bg-accent-light text-white font-semibold px-6 py-3 sm:px-8 sm:py-4 rounded-full text-base sm:text-lg transition-colors shadow-lg shadow-accent/30 text-center"
              >
                Узнать стоимость
              </a>
              <a
                href="/schedule"
                className="border border-white/25 hover:border-accent/60 text-white font-medium px-6 py-3 sm:px-8 sm:py-4 rounded-full text-base sm:text-lg transition-colors text-center"
              >
                Расписание
              </a>
            </motion.div>
          </div>

          {/* Mobile-only video — centered between buttons and stats */}
          <motion.div
            className="lg:hidden mx-auto w-full max-w-[280px] aspect-square rounded-[1.5rem] overflow-hidden relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <video
              src="/videos/hero-girl.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
              aria-label="Тренировка в фитнес-студии Арктика"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 75% 85% at 50% 50%, transparent 35%, #111111 100%)",
              }}
            />
          </motion.div>

          {/* Stats — mobile */}
          <motion.div
            className="relative z-10 lg:hidden flex gap-8 sm:gap-10 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-heading font-bold">
                  <CountUp end={s.end} suffix={s.suffix} />
                </div>
                <div className="text-sm text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Stats — desktop (inside grid) */}
          <motion.div
            className="hidden lg:flex mt-8 gap-10 col-start-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-heading font-bold">
                  <CountUp end={s.end} suffix={s.suffix} />
                </div>
                <div className="text-sm text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Right: girl video — desktop only */}
          <motion.div
            className="hidden lg:flex relative h-[80vh] max-h-[700px] items-end justify-center row-span-2 col-start-2 row-start-1"
            style={{ y: photoY }}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Soft accent glow behind */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Video — rounded corners, vignette on all sides */}
            <div className="relative z-[1] h-full w-full overflow-hidden rounded-[2.5rem]">
              <video
                src="/videos/hero-girl.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="h-full w-full object-cover object-bottom"
                aria-label="Тренировка в фитнес-студии Арктика"
              />
              {/* Vignette darkening on all edges → seamless blend with dark-800 */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 65% 80% at 50% 55%, transparent 25%, #111111 95%)",
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator — desktop only */}
      <motion.div
        className="hidden lg:block absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-400"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </motion.div>
    </section>
  );
}

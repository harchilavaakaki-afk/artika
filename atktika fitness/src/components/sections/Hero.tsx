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
      className="relative h-screen min-h-[600px] flex items-start pt-20 lg:items-center lg:pt-0 overflow-hidden"
    >
      {/* Parallax background — oversized wrapper so moving bg never shows gap */}
      <div className="absolute -inset-[100px] z-0">
        <motion.div className="absolute inset-0 hidden lg:block" style={{ y: bgY }}>
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
        {/* Mobile: static image fallback (no transform = plays reliably) */}
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
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative lg:grid lg:grid-cols-2 lg:gap-12 items-center">

          {/* Girl overlay — responsive across all widths up to lg */}
          <motion.div
            className="lg:hidden absolute right-0 pointer-events-none
              top-[55%] bottom-[70px] w-[45%]
              sm:top-[30%] sm:bottom-[50px] sm:w-[38%]
              md:top-[15%] md:bottom-[40px] md:w-[36%]"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Image
              src="/images/hero/hero-girl.png"
              alt="Девушка с гантелями"
              width={400}
              height={700}
              className="h-full w-auto object-contain object-bottom ml-auto"
              priority
            />
          </motion.div>

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
              className="mt-14 sm:mt-5 text-lg sm:text-xl text-gray-300 max-w-md leading-relaxed"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Фитнес-студия в&nbsp;Видном: 20&nbsp;направлений, небольшие группы даже в&nbsp;часы пик, тренеры которые помнят ваше имя.
            </motion.p>

            <motion.div
              className="mt-5 flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <a
                href="/#signup"
                className="bg-accent hover:bg-accent-light text-white font-semibold px-6 py-3 sm:px-8 sm:py-4 rounded-full text-base sm:text-lg transition-colors shadow-lg shadow-accent/30"
              >
                Узнать стоимость
              </a>
              <a
                href="/schedule"
                className="border border-white/25 hover:border-accent/60 text-white font-medium px-6 py-3 sm:px-8 sm:py-4 rounded-full text-base sm:text-lg transition-colors"
              >
                Расписание
              </a>
            </motion.div>

            <motion.div
              className="mt-24 sm:mt-8 flex gap-10"
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
          </div>

          {/* Right: girl video — organic, no background */}
          <motion.div
            className="hidden lg:flex relative h-[540px] items-end justify-center"
            style={{ y: photoY }}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Ambient glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent/15 rounded-full blur-[80px] pointer-events-none" />

            {/* Girl photo */}
            <Image
              src="/images/hero/hero-girl.png"
              alt="Девушка с гантелями — фитнес-студия Арктика"
              width={400}
              height={600}
              className="relative z-[1] h-full w-auto object-contain object-bottom drop-shadow-2xl"
              priority
            />

            {/* Bottom fade — blends feet into section */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-dark-800 via-dark-800/60 to-transparent z-[2] pointer-events-none" />

          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
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

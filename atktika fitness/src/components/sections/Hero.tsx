"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollY } = useScroll();

  // Boomerang: play forward → reverse → forward → ...
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.volume = 0;

    let animFrame: number;
    let reversing = false;
    const STEP = 1 / 30; // 30fps backward step

    const reversePlay = () => {
      if (!video || !reversing) return;
      video.currentTime = Math.max(0, video.currentTime - STEP);
      if (video.currentTime <= 0) {
        reversing = false;
        video.play().catch(() => {});
        return;
      }
      animFrame = requestAnimationFrame(reversePlay);
    };

    const handleEnded = () => {
      reversing = true;
      reversePlay();
    };

    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("ended", handleEnded);
      cancelAnimationFrame(animFrame);
    };
  }, []);
  // Absolute px values: BG moves slower than scroll (parallax depth)
  const bgY = useTransform(scrollY, [0, 700], ["0px", "100px"]);
  // Right photo panel counter-moves for extra depth
  const photoY = useTransform(scrollY, [0, 700], ["0px", "-50px"]);

  return (
    <section
      ref={ref}
      className="relative h-screen min-h-[600px] flex items-center overflow-hidden"
    >
      {/* Parallax background — oversized wrapper so moving bg never shows gap */}
      <div className="absolute -inset-[100px] z-0">
        <motion.div className="absolute inset-0 hidden lg:block" style={{ y: bgY }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            poster="/images/hero/hero-main.jpg"
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
            playsInline
            loop
            poster="/images/hero/hero-main.jpg"
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
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="relative lg:grid lg:grid-cols-2 lg:gap-12 items-center">

          {/* Mobile girl — absolute right overlay */}
          <motion.div
            className="lg:hidden absolute right-0 top-0 bottom-0 w-[48%] flex items-end justify-end pointer-events-none"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-auto object-contain object-bottom"
            >
              <source src="/images/hero/hero-girl-alpha.webm" type="video/webm" />
              <source src="/images/hero/hero-girl.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-dark-800 via-dark-800/50 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-dark-800/60 to-transparent pointer-events-none" />
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
              className="font-heading text-3xl sm:text-4xl lg:text-6xl font-extrabold leading-tight"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Новый сезон&nbsp;—<br />
              <span className="text-accent">скидки до 50%</span>
            </motion.h1>

            <motion.p
              className="mt-5 text-lg sm:text-xl text-gray-300 max-w-md leading-relaxed"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Фитнес-студия в&nbsp;Видном: 20&nbsp;направлений, небольшие группы даже в&nbsp;часы пик, тренеры которые помнят ваше имя.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <a
                href="/#signup"
                className="bg-accent hover:bg-accent-light text-white font-semibold px-8 py-4 rounded-full text-lg transition-colors shadow-lg shadow-accent/30"
              >
                Узнать стоимость
              </a>
              <a
                href="/schedule"
                className="border border-white/25 hover:border-accent/60 text-white font-medium px-8 py-4 rounded-full text-lg transition-colors"
              >
                Расписание
              </a>
            </motion.div>

            <motion.div
              className="mt-12 flex gap-10"
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

            {/* Girl video — proportional, anchored to bottom */}
            <video
              autoPlay
              muted
              loop
              playsInline
              className="relative z-[1] h-full w-auto object-contain object-bottom drop-shadow-2xl"
            >
              <source src="/images/hero/hero-girl-alpha.webm" type="video/webm" />
              <source src="/images/hero/hero-girl.mp4" type="video/mp4" />
            </video>

            {/* Bottom fade — blends feet into section */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-dark-800 via-dark-800/60 to-transparent z-[2] pointer-events-none" />
            {/* Left fade */}
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/30 to-transparent z-[2] pointer-events-none" />

            {/* Floating badge: discount */}
            <motion.div
              className="absolute bottom-32 -left-4 z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-2xl px-5 py-3 shadow-2xl"
              >
                <div className="text-xs text-gray-400 mb-0.5">Скидки сезона</div>
                <div className="font-heading font-bold text-white text-lg">до 50%</div>
              </motion.div>
            </motion.div>

            {/* Floating badge: members count */}
            <motion.div
              className="absolute top-16 right-0 z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
                className="bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-2xl px-4 py-3 shadow-2xl"
              >
                <div className="text-xs text-gray-400 mb-0.5">Уже с нами</div>
                <div className="font-heading font-bold text-white">500+ клиентов</div>
              </motion.div>
            </motion.div>

            {/* Decorative dots */}
            <div className="absolute top-16 left-6 w-3 h-3 rounded-full bg-accent pointer-events-none z-[3]" />
            <div className="absolute top-24 left-2 w-2 h-2 rounded-full bg-accent/50 pointer-events-none z-[3]" />
            <div className="absolute bottom-36 right-4 w-2.5 h-2.5 rounded-full bg-accent pointer-events-none z-[3]" />
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

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Desktop: floating pill button */}
      <div
        className={`hidden md:block fixed bottom-6 right-6 z-40 transition-all duration-300 ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <Link
          href="/#signup"
          className="group relative bg-accent hover:bg-accent-light text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm shadow-lg shadow-accent/25"
        >
          <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-20 group-hover:opacity-0" />
          <span className="relative">Записаться</span>
        </Link>
      </div>

      {/* Mobile: bottom bar */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-800/95 backdrop-blur-md border-t border-dark-600/30 px-4 py-3 transition-all duration-300 ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-full pointer-events-none"
        }`}
      >
        <Link
          href="/#signup"
          className="block w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 rounded-full transition-colors text-center text-sm"
        >
          Записаться на пробное
        </Link>
      </div>
    </>
  );
}

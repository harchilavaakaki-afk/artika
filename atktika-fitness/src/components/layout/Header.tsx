"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/programs", label: "Направления" },
  { href: "/schedule", label: "Расписание" },
  { href: "/trainers", label: "Тренеры" },
  { href: "/pricing", label: "Цены" },
  { href: "/facilities", label: "Зоны клуба" },
  { href: "/blog", label: "Блог" },
  { href: "/contacts", label: "Контакты" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
    {/* Mobile fullscreen menu — OUTSIDE header to avoid backdrop-filter containing block */}
    <div
      className={`fixed inset-0 z-40 bg-dark-900 transition-opacity duration-300 lg:hidden ${
        menuOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <nav className="flex h-full flex-col items-center justify-center gap-4 px-8 pt-24 pb-10 overflow-y-auto">
        {NAV_LINKS.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMenuOpen(false)}
            className={`text-2xl font-heading font-bold ${
              pathname === link.href
                ? "text-accent"
                : "text-white hover:text-accent"
            }`}
            style={{
              transform: menuOpen ? "translateY(0)" : "translateY(20px)",
              opacity: menuOpen ? 1 : 0,
              transition: `transform 0.3s ease ${menuOpen ? i * 50 : 0}ms, opacity 0.3s ease ${menuOpen ? i * 50 : 0}ms, color 0.2s ease`,
            }}
          >
            {link.label}
          </Link>
        ))}

        <div
          className="mt-6 flex flex-col items-center gap-4 w-full max-w-xs"
          style={{
            transform: menuOpen ? "translateY(0)" : "translateY(20px)",
            opacity: menuOpen ? 1 : 0,
            transition: `transform 0.3s ease ${menuOpen ? NAV_LINKS.length * 50 : 0}ms, opacity 0.3s ease ${menuOpen ? NAV_LINKS.length * 50 : 0}ms`,
          }}
        >
          <a
            href={`tel:${SITE.phoneSales.replace(/\s/g, "")}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
              />
            </svg>
            {SITE.phoneSales}
          </a>
          <Link
            href="/#signup"
            onClick={() => setMenuOpen(false)}
            className="w-full text-center bg-accent hover:bg-accent-light text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-lg"
          >
            Записаться
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Ежедневно {SITE.hours}
          </div>
        </div>
      </nav>
    </div>

    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? "bg-dark-800/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 relative z-50">
            <Image
              src="/icons/logo.svg"
              alt={SITE.name}
              width={160}
              height={32}
              priority
              className="h-7 w-auto md:h-8"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/5 ${
                  pathname === link.href
                    ? "text-accent"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href={`tel:${SITE.phoneSales.replace(/\s/g, "")}`}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
              {SITE.phoneSales}
            </a>
            <Link
              href="/#signup"
              className="bg-accent hover:bg-accent-light text-white font-semibold px-6 py-2.5 rounded-full transition-colors text-sm"
            >
              Записаться
            </Link>
          </div>

          {/* Mobile: phone + hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <a
              href={`tel:${SITE.phoneSales.replace(/\s/g, "")}`}
              className="relative z-50 flex h-10 w-10 items-center justify-center text-gray-400 hover:text-white transition-colors"
              aria-label="Позвонить"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
            </a>
            <button
              type="button"
              className="relative z-50 flex h-10 w-10 items-center justify-center"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={menuOpen}
            >
              <div className="flex flex-col items-center justify-center gap-1.5">
                <span
                  className={`block h-0.5 w-6 bg-white transition-all duration-300 ${
                    menuOpen ? "translate-y-2 rotate-45" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-6 bg-white transition-all duration-300 ${
                    menuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-6 bg-white transition-all duration-300 ${
                    menuOpen ? "-translate-y-2 -rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

    </header>
    </>
  );
}

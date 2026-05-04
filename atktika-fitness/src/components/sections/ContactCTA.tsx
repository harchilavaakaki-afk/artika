"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { motion, type Variants } from "framer-motion";
import { reachGoal } from "@/lib/metrika";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 1) return `+7`;
  const parts = ["+7"];
  if (digits.length > 1) parts.push(` (${digits.slice(1, 4)}`);
  if (digits.length >= 4) parts[1] += ")";
  if (digits.length > 4) parts.push(` ${digits.slice(4, 7)}`);
  if (digits.length > 7) parts.push(`-${digits.slice(7, 9)}`);
  if (digits.length > 9) parts.push(`-${digits.slice(9, 11)}`);
  return parts.join("");
}

export default function ContactCTA() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
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
        reachGoal("form_send", { source: "ContactCTA" });
        setName("");
        setPhone("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="signup" className="relative py-20 sm:py-28 overflow-hidden">
      {/* Background gradient glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-800 to-dark-700" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold">
            Скидки до 50%&nbsp;—{" "}
            <span className="text-accent">только сейчас</span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            Оставьте номер&nbsp;— расскажем об&nbsp;актуальных акциях и&nbsp;подберём удобное время
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className={`mt-10 space-y-4 ${shake ? "animate-shake" : ""}`}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
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
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full bg-accent hover:bg-accent-light disabled:opacity-60 text-white font-semibold py-4 rounded-xl text-lg transition-colors shadow-lg shadow-accent/20"
          >
            {status === "sending" ? "Отправка..." : "Хочу узнать стоимость"}
          </button>

          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 text-green-400 bg-green-400/10 rounded-xl py-4"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Заявка принята! Перезвоним в течение 15 минут.
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 bg-red-400/10 rounded-xl py-4"
            >
              Ошибка отправки. Позвоните нам: +7 925 088 9196
            </motion.div>
          )}
        </motion.form>
      </div>
    </section>
  );
}

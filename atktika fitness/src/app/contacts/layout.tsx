import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Контакты и как добраться — Фитнес-студия Арктика, Видное",
  description:
    "Адрес, телефон, карта проезда фитнес-студии Арктика в Видном. Зелёный пер., 10. Запишитесь на пробное занятие.",
  alternates: { canonical: `${SITE.url}/contacts` },
  openGraph: {
    title: "Контакты и как добраться — Фитнес-студия Арктика, Видное",
    description:
      "г. Видное, Зелёный пер., 10. Телефон, Telegram, карта проезда.",
    url: `${SITE.url}/contacts`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE.name,
  },
};

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

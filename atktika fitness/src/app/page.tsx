import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import WhyUs from "@/components/sections/WhyUs";
import Programs from "@/components/sections/Programs";
import Trainers from "@/components/sections/Trainers";
import Facilities from "@/components/sections/Facilities";
import SchedulePreview from "@/components/sections/SchedulePreview";
import Reviews from "@/components/sections/Reviews";
import Gallery from "@/components/sections/Gallery";
import ContactCTA from "@/components/sections/ContactCTA";
import Map from "@/components/sections/Map";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Фитнес-студия Арктика в Видном — тренажерный зал, групповые занятия",
  description:
    "Фитнес-студия Арктика в г. Видное: тренажерный зал, йога, пилатес, стретчинг, 20+ направлений. Запишитесь на пробное занятие.",
  alternates: { canonical: SITE.url },
  openGraph: {
    title: "Фитнес-студия Арктика в Видном",
    description:
      "20+ направлений групповых занятий. Запишитесь на пробное.",
    url: "https://arcfit.ru",
    images: ["/images/hero/hero-main.jpg"],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: SITE.name,
  url: SITE.url,
  telephone: SITE.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Зелёный переулок, 10",
    addressLocality: "Видное",
    addressRegion: "Московская область",
    postalCode: "142703",
    addressCountry: "RU",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: SITE.geo.lat,
    longitude: SITE.geo.lng,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "07:00",
    closes: "22:00",
  },
  image: `${SITE.url}/images/hero/hero-main.jpg`,
  description: SITE.description,
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Hero />
      <WhyUs />
      <Programs />
      <Trainers />
      <Facilities />
      <SchedulePreview />
      <Reviews />
      <Gallery />
      <ContactCTA />
      <Map />
    </>
  );
}

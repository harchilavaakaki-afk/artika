import type { Metadata } from "next";
import { SITE } from "./constants";

export function createMetadata({
  title,
  description,
  path = "",
  image = "/images/hero/hero-bg.jpg",
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
}): Metadata {
  const url = `${SITE.url}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website",
      locale: "ru_RU",
      siteName: SITE.name,
    },
  };
}

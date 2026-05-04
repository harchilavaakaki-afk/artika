import { SITE } from "@/lib/constants";

interface BreadcrumbItem {
  name: string;
  href: string;
}

export default function BreadcrumbSchema({
  items,
}: {
  items: BreadcrumbItem[];
}) {
  const list = [{ name: "Главная", href: "/" }, ...items];
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.href === "/" ? "" : item.href}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

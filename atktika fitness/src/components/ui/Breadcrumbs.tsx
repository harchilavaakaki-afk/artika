import Link from "next/link";

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const allItems = [{ name: "Главная", href: "/" }, ...items];

  const schemaLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `https://arcfit.ru${item.href}`,
    })),
  };

  return (
    <nav aria-label="Хлебные крошки" className="py-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
        {allItems.map((item, i) => (
          <li key={item.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            )}
            {i === allItems.length - 1 ? (
              <span className="text-white font-medium">{item.name}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaLd) }}
      />
    </nav>
  );
}

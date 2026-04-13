import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { SITE, TRAINERS } from "@/lib/constants";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Блог о фитнесе — Фитнес-студия Арктика, Видное",
  description:
    "Полезные статьи о тренировках, питании и здоровом образе жизни от тренеров фитнес-студии Арктика в Видном.",
  alternates: { canonical: `${SITE.url}/blog` },
  openGraph: {
    title: "Блог о фитнесе — Фитнес-студия Арктика, Видное",
    description:
      "Статьи о тренировках, питании и ЗОЖ от профессиональных тренеров.",
    url: `${SITE.url}/blog`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE.name,
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  geo: "Гео",
  directions: "Направления",
  beginners: "Новичкам",
  weight: "Похудение",
  nutrition: "Питание",
  training: "Тренировки",
};

export default function BlogPage() {
  const posts = getAllPosts();
  const categories = [...new Set(posts.map((p) => p.category))];

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Блог о фитнесе — Арктика Фитнес",
    url: `${SITE.url}/blog`,
    description: "Полезные статьи о тренировках, питании и ЗОЖ от тренеров фитнес-студии Арктика в Видном.",
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE.url}/blog/${p.slug}`,
        name: p.title,
      })),
    },
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
    />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <Breadcrumbs items={[{ name: "Блог", href: "/blog" }]} />

      <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4 mb-4">
        Блог о фитнесе
      </h1>
      <p className="text-gray-400 text-lg mb-10 max-w-2xl">
        Полезные статьи от тренеров фитнес-студии Арктика в Видном: тренировки,
        питание, здоровый образ жизни.
      </p>

      {/* Categories */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <span
              key={cat}
              className="text-sm px-3 py-1.5 rounded-full bg-dark-700 text-gray-400"
            >
              {CATEGORY_LABELS[cat] || cat}
            </span>
          ))}
        </div>
      )}

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => {
          const trainer = TRAINERS.find((t) => t.slug === post.author);
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-dark-700 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/10"
            >
              <div className="relative aspect-video bg-dark-600 overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                    {CATEGORY_LABELS[post.category] || post.category}
                  </span>
                  <time className="text-xs text-gray-500">{post.date}</time>
                </div>
                <h2 className="font-heading text-lg font-semibold text-white group-hover:text-accent transition-colors leading-snug mb-2">
                  {post.title}
                </h2>
                <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                  {post.description}
                </p>
                {trainer && (
                  <p className="text-xs text-gray-500">
                    {trainer.name}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Статьи скоро появятся</p>
        </div>
      )}
    </div>
    </>
  );
}

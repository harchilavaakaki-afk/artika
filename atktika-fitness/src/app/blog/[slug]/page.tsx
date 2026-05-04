import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { SITE, TRAINERS } from "@/lib/constants";
import { getPostBySlug, getPostSlugs } from "@/lib/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.meta.title,
    description: post.meta.description,
    alternates: { canonical: `${SITE.url}/blog/${slug}` },
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      url: `${SITE.url}/blog/${slug}`,
      type: "article",
      locale: "ru_RU",
      siteName: SITE.name,
      publishedTime: post.meta.date,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const trainer = TRAINERS.find((t) => t.slug === post.meta.author);

  const { content } = await compileMDX({
    source: post.source,
    options: {
      parseFrontmatter: false,
      mdxOptions: { remarkPlugins: [remarkGfm] },
    },
  });

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.meta.title,
    description: post.meta.description,
    datePublished: post.meta.date,
    dateModified: post.meta.updatedDate || post.meta.date,
    image: post.meta.image
      ? post.meta.image.startsWith("http")
        ? post.meta.image
        : `${SITE.url}${post.meta.image}`
      : `${SITE.url}/images/hero/hero-main.jpg`,
    author: trainer
      ? {
          "@type": "Person",
          name: trainer.name,
          url: `${SITE.url}/trainers/${trainer.slug}`,
        }
      : { "@type": "Organization", name: SITE.name },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: {
        "@type": "ImageObject",
        url: `${SITE.url}/icons/logo.svg`,
      },
    },
    mainEntityOfPage: `${SITE.url}/blog/${slug}`,
    isAccessibleForFree: true,
    inLanguage: "ru-RU",
  };

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Блог", href: "/blog" },
          { name: post.meta.title, href: `/blog/${slug}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <Breadcrumbs
          items={[
            { name: "Блог", href: "/blog" },
            { name: post.meta.title, href: `/blog/${slug}` },
          ]}
        />

        <header className="mt-4 mb-10">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
            {post.meta.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <time>{post.meta.date}</time>
            {trainer && (
              <Link
                href={`/trainers/${trainer.slug}`}
                className="text-accent hover:text-accent-light transition-colors"
              >
                {trainer.name}
              </Link>
            )}
          </div>
        </header>

        {/* MDX Content */}
        <div className="prose prose-invert prose-lg max-w-none prose-headings:font-heading prose-headings:text-white prose-p:text-gray-300 prose-a:text-accent prose-a:no-underline hover:prose-a:text-accent-light prose-strong:text-white prose-li:text-gray-300 prose-th:text-white prose-td:text-gray-300">
          {content}
        </div>

        {/* CTA */}
        <section className="mt-16 bg-gradient-to-r from-accent/10 to-accent-dark/10 rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="font-heading text-2xl font-bold text-white mb-3">
            Записаться на пробное занятие в Арктике
          </h2>
          <p className="text-gray-400 mb-6">
            Попробуйте любое групповое занятие в фитнес-студии Арктика, Видное
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`tel:${SITE.phoneSales.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-medium px-8 py-3 rounded-full transition-colors"
            >
              Позвонить
            </a>
            <a
              href={SITE.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-accent text-accent hover:bg-accent hover:text-white font-medium px-8 py-3 rounded-full transition-colors"
            >
              Telegram
            </a>
          </div>
        </section>

        {/* Back */}
        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Все статьи
          </Link>
        </div>
      </article>
    </>
  );
}

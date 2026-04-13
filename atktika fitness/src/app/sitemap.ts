import type { MetadataRoute } from "next";
import { PROGRAMS, TRAINERS, FACILITIES } from "@/lib/constants";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://arcfit.ru";
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/programs`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/schedule`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/trainers`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/facilities`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/contacts`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const programPages = PROGRAMS.map((p) => ({
    url: `${base}/programs/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const trainerPages = TRAINERS.map((t) => ({
    url: `${base}/trainers/${t.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const facilityPages = FACILITIES.map((f) => ({
    url: `${base}/facilities/${f.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const blogPages = getAllPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...programPages,
    ...trainerPages,
    ...facilityPages,
    ...blogPages,
  ];
}

import fs from "fs";
import path from "path";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  updatedDate?: string;
  author: string;
  category: string;
  image: string;
}

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

function parseFrontmatter(content: string): {
  data: Record<string, string>;
  content: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, content };
  const data: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      data[key] = val;
    }
  }
  return { data, content: match[2] };
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));
  const posts = files
    .map((file) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
      const { data } = parseFrontmatter(raw);
      return {
        slug: data.slug || file.replace(/\.mdx$/, ""),
        title: data.title || "",
        description: data.description || "",
        date: data.date || "",
        updatedDate: data.updatedDate,
        author: data.author || "",
        category: data.category || "",
        image: data.image || "/images/blog/default.jpg",
      };
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));
  return posts;
}

export function getPostBySlug(slug: string): {
  meta: BlogPost;
  source: string;
} | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = parseFrontmatter(raw);
  return {
    meta: {
      slug: data.slug || slug,
      title: data.title || "",
      description: data.description || "",
      date: data.date || "",
      updatedDate: data.updatedDate,
      author: data.author || "",
      category: data.category || "",
      image: data.image || "/images/blog/default.jpg",
    },
    source: content,
  };
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

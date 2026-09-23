import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ARTICLES_DIR = path.resolve(process.cwd(), 'datasources/articles');

export interface ArticleMetadata {
  file: string;
  slug: string;
  title: string;
  date?: string;
  tags?: string[];
  categories?: string[];
  excerpt?: string;
  lang?: string;
}

export function listArticles(tag?: string, limit?: number): ArticleMetadata[] {
  if (!fs.existsSync(ARTICLES_DIR)) {
    return [];
  }

  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md') && f !== 'README.md');
  const articles: ArticleMetadata[] = [];

  for (const file of files) {
    const fullPath = path.join(ARTICLES_DIR, file);
    try {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContent);

      const parsedTags = Array.isArray(data.tags)
        ? data.tags
        : typeof data.tags === 'string'
        ? data.tags.split(',').map((t: string) => t.trim())
        : [];

      const parsedCategories = Array.isArray(data.categories)
        ? data.categories
        : typeof data.categories === 'string'
        ? data.categories.split(',').map((c: string) => c.trim())
        : [];

      const articleMeta: ArticleMetadata = {
        file,
        slug: file.replace(/\.md$/, ''),
        title: data.title || file.replace(/\.md$/, ''),
        date: data.date ? String(data.date).split('T')[0] : undefined,
        tags: parsedTags,
        categories: parsedCategories,
        excerpt: data.excerpt,
        lang: data.lang || 'fr',
      };

      if (tag) {
        const normalizedTag = tag.toLowerCase().trim();
        const hasTag =
          parsedTags.some((t: string) => t.toLowerCase().includes(normalizedTag)) ||
          parsedCategories.some((c: string) => c.toLowerCase().includes(normalizedTag));
        if (!hasTag) continue;
      }

      articles.push(articleMeta);
    } catch {
      // Ignore unparseable files
    }
  }

  articles.sort((a, b) => (b.date || b.file).localeCompare(a.date || a.file));
  return limit && limit > 0 ? articles.slice(0, limit) : articles;
}

export function readArticle(slugOrFile: string): { metadata: ArticleMetadata; content: string } {
  if (!fs.existsSync(ARTICLES_DIR)) {
    throw new Error(`Le dossier des articles n'existe pas : ${ARTICLES_DIR}`);
  }

  const cleanSlug = slugOrFile.replace(/\.md$/, '');
  const files = fs.readdirSync(ARTICLES_DIR);
  const matchedFile = files.find((f) => f === `${cleanSlug}.md` || f.includes(cleanSlug));

  if (!matchedFile) {
    throw new Error(`Article introuvable pour "${slugOrFile}"`);
  }

  const fullPath = path.join(ARTICLES_DIR, matchedFile);
  const fileContent = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContent);

  return {
    metadata: {
      file: matchedFile,
      slug: matchedFile.replace(/\.md$/, ''),
      title: data.title || matchedFile,
      date: data.date ? String(data.date).split('T')[0] : undefined,
      tags: Array.isArray(data.tags) ? data.tags : [],
      categories: Array.isArray(data.categories) ? data.categories : [],
      excerpt: data.excerpt,
      lang: data.lang || 'fr',
    },
    content: content.trim(),
  };
}

export function searchArticles(query: string): Array<ArticleMetadata & { snippet: string }> {
  if (!query || !fs.existsSync(ARTICLES_DIR)) return [];

  const q = query.toLowerCase();
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md') && f !== 'README.md');
  const results: Array<ArticleMetadata & { snippet: string }> = [];

  for (const file of files) {
    const fullPath = path.join(ARTICLES_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const { data, content: body } = matter(content);

    const title = (data.title || file).toLowerCase();
    const tags = Array.isArray(data.tags) ? data.tags.join(' ').toLowerCase() : String(data.tags || '').toLowerCase();
    const bodyLower = body.toLowerCase();

    if (title.includes(q) || tags.includes(q) || bodyLower.includes(q)) {
      const idx = bodyLower.indexOf(q);
      let snippet = '';
      if (idx !== -1) {
        const start = Math.max(0, idx - 60);
        const end = Math.min(body.length, idx + q.length + 60);
        snippet = `...${body.slice(start, end).replace(/\n+/g, ' ')}...`;
      } else {
        snippet = data.excerpt || body.slice(0, 120).replace(/\n+/g, ' ');
      }

      results.push({
        file,
        slug: file.replace(/\.md$/, ''),
        title: data.title || file,
        date: data.date ? String(data.date).split('T')[0] : undefined,
        tags: Array.isArray(data.tags) ? data.tags : [],
        categories: Array.isArray(data.categories) ? data.categories : [],
        excerpt: data.excerpt,
        lang: data.lang || 'fr',
        snippet,
      });
    }
  }

  return results;
}

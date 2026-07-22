import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Articles de blog markdown locaux (datasources/articles/*.md) — complètent le
// flux Medium (src/lib/medium.js) : écrits ici d'abord, migrés manuellement vers
// Medium ensuite. Convention de nommage : YYYY-MM-DD-slug.md (la date du nom de
// fichier sert de fallback si le front matter n'en donne pas).
//
// Front matter (tout est optionnel) :
//   title, date, categories: [..], excerpt, thumbnail, medium: <url si migré>

const ARTICLES_DIR = path.join(process.cwd(), 'datasources', 'articles');
const FILE_RE = /^(?:(\d{4}-\d{2}-\d{2})-)?(.+)\.md$/;

function toExcerpt(markdown = '', max = 180) {
  const clean = markdown
    .replace(/^#.+$/gm, ' ') // titres
    .replace(/```[\s\S]*?```/g, ' ') // blocs de code
    .replace(/[*_`>#|[\]()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}

function firstHeading(markdown = '') {
  const m = markdown.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function parseFile(filename) {
  const m = filename.match(FILE_RE);
  if (!m) return null;
  const [, dateFromName, slug] = m;

  const raw = fs.readFileSync(path.join(ARTICLES_DIR, filename), 'utf8');
  const { data, content: rawContent } = matter(raw);
  // Le titre est rendu par la page ([slug]/page.js) : on retire le 1er H1 du
  // markdown pour éviter le doublon à l'affichage.
  const content = rawContent.replace(/^\s*#\s+.+\n/, '');

  return {
    slug,
    source: 'local',
    title: data.title || firstHeading(rawContent) || slug.replace(/-/g, ' '),
    // Lien relatif — préfixé par la locale au rendu (ArticleCard / page blog).
    link: `/blog/${slug}`,
    date: data.date ? new Date(data.date).toISOString() : dateFromName ? `${dateFromName}T00:00:00.000Z` : null,
    categories: (data.categories || []).slice(0, 4),
    excerpt: data.excerpt || toExcerpt(content),
    thumbnail: data.thumbnail || null,
    mediumUrl: data.medium || null, // renseigné après migration manuelle vers Medium
    content,
  };
}

/** Liste les articles locaux (métadonnées seules), triés du plus récent au plus ancien. */
export function getLocalArticles({ limit } = {}) {
  try {
    if (!fs.existsSync(ARTICLES_DIR)) return [];
    const items = fs
      .readdirSync(ARTICLES_DIR)
      .filter(f => f.endsWith('.md'))
      .map(parseFile)
      .filter(Boolean)
      // eslint-disable-next-line no-unused-vars
      .map(({ content, ...meta }) => meta)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return typeof limit === 'number' ? items.slice(0, limit) : items;
  } catch (err) {
    console.error('[localArticles] lecture impossible:', err?.message || err);
    return [];
  }
}

/** Un article complet (avec son markdown) par slug — null si absent. */
export function getLocalArticle(slug) {
  try {
    const files = fs.existsSync(ARTICLES_DIR) ? fs.readdirSync(ARTICLES_DIR) : [];
    const file = files.find(f => {
      const m = f.match(FILE_RE);
      return m && m[2] === slug;
    });
    return file ? parseFile(file) : null;
  } catch {
    return null;
  }
}

/** Fusion articles locaux + Medium, tri par date décroissante. */
export function mergeArticles(local, medium) {
  return [...local, ...medium].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

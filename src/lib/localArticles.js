import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Articles de blog markdown locaux (datasources/articles/*.md) — complètent le
// flux Medium (src/lib/medium.js) : écrits ici d'abord, migrés manuellement vers
// Medium ensuite. Convention de nommage : YYYY-MM-DD-slug.md (la date du nom de
// fichier sert de fallback si le front matter n'en donne pas).
//
// Front matter (tout est optionnel) :
//   id, status ('published' | 'unlisted' | 'hidden' | 'draft'),
//   title, date, categories: [..], excerpt, thumbnail, medium: <url si migré>, author

const ARTICLES_DIR = path.join(process.cwd(), 'datasources', 'articles');
// Le préfixe de date est obligatoire : il délimite ce qui est un article de ce qui
// est de la documentation déposée dans le même dossier (README.md, notes de
// rédaction…), qui serait sinon publiée comme un article à part entière.
const FILE_RE = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/;

/**
 * Enum des statuts possibles d'un article de blog.
 * @readonly
 * @enum {'published' | 'unlisted' | 'hidden' | 'draft' | 'archived'}
 */
export const ArticleStatus = Object.freeze({
  /** Affiché dans la liste (/blog, Jamila, MCP) et accessible par URL (/blog/[slug]) */
  PUBLISHED: 'published',
  /** Masqué de la liste (/blog), mais accessible par URL directe (noindex) */
  UNLISTED: 'unlisted',
  /** Masqué de la liste ET inaccessible par URL (404) */
  HIDDEN: 'hidden',
  /** Brouillon : masqué de la liste ET inaccessible par URL (404) */
  DRAFT: 'draft',
  /** Archivé : masqué de la liste ET inaccessible par URL (404) */
  ARCHIVED: 'archived',
});

/**
 * @typedef {typeof ArticleStatus[keyof typeof ArticleStatus]} ArticleStatusValue
 */
export const ARTICLE_STATUS_VALUES = Object.freeze(Object.values(ArticleStatus));

/**
 * Détermine la visibilité d'un article à partir de son attribut `status` :
 * - ArticleStatus.PUBLISHED (défaut) -> affiché dans la liste (/blog) ET accessible par URL (/blog/[slug])
 * - ArticleStatus.UNLISTED           -> masqué de la liste (/blog), MAIS accessible par URL directe
 * - ArticleStatus.HIDDEN | DRAFT | ARCHIVED -> masqué de la liste ET inaccessible (404)
 * @param {Record<string, unknown>} [data]
 * @returns {{ status: ArticleStatusValue, visible: boolean, listed: boolean }}
 */
export function resolveArticleVisibility(data = {}) {
  const rawStatus = String(data.status || ArticleStatus.PUBLISHED)
    .trim()
    .toLowerCase();
  const status = ARTICLE_STATUS_VALUES.includes(rawStatus) ? /** @type {ArticleStatusValue} */ (rawStatus) : ArticleStatus.PUBLISHED;

  const visible = status === ArticleStatus.PUBLISHED || status === ArticleStatus.UNLISTED;
  const listed = status === ArticleStatus.PUBLISHED;

  return { status, visible, listed };
}

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

  const { status, visible, listed } = resolveArticleVisibility(data);

  return {
    id: String(data.id || slug).trim(),
    slug,
    status,
    visible,
    listed,
    source: 'local',
    title: data.title || firstHeading(rawContent) || slug.replace(/-/g, ' '),
    // Lien relatif — préfixé par la locale au rendu (ArticleCard / page blog).
    link: `/blog/${slug}`,
    date: data.date ? new Date(data.date).toISOString() : `${dateFromName}T00:00:00.000Z`,
    categories: (data.categories || []).slice(0, 4),
    excerpt: data.excerpt || toExcerpt(content),
    thumbnail: data.thumbnail || null,
    mediumUrl: data.medium || null, // renseigné après migration manuelle vers Medium
    author: data.author || 'CODEUR SENIOR',
    content,
  };
}

/**
 * Liste les articles locaux (métadonnées seules), triés du plus récent au plus ancien.
 * Par défaut, renvoie uniquement les articles `listed: true` et `visible: true`.
 * Passer `includeUnlisted: true` (ex: pour generateStaticParams) inclut aussi les articles `unlisted`.
 */
export function getLocalArticles({ limit, includeUnlisted = false } = {}) {
  try {
    if (!fs.existsSync(ARTICLES_DIR)) return [];
    const items = fs
      .readdirSync(ARTICLES_DIR)
      .filter(f => f.endsWith('.md'))
      .map(parseFile)
      .filter(a => a && a.visible && (includeUnlisted || a.listed))
      // eslint-disable-next-line no-unused-vars
      .map(({ content, ...meta }) => meta)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return typeof limit === 'number' ? items.slice(0, limit) : items;
  } catch (err) {
    console.error('[localArticles] lecture impossible:', err?.message || err);
    return [];
  }
}

/** Un article complet (avec son markdown) par slug — null si absent ou non visible (draft/private). */
export function getLocalArticle(slug) {
  try {
    const files = fs.existsSync(ARTICLES_DIR) ? fs.readdirSync(ARTICLES_DIR) : [];
    const file = files.find(f => {
      const m = f.match(FILE_RE);
      return m && m[2] === slug;
    });
    if (!file) return null;
    const article = parseFile(file);
    return article && article.visible ? article : null;
  } catch {
    return null;
  }
}

/** Fusion articles locaux + Medium, tri par date décroissante. */
export function mergeArticles(local, medium) {
  return [...local, ...medium].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

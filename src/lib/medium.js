import Parser from 'rss-parser';

// Flux RSS Medium (Medium n'a pas d'API publique pour lister les articles).
const MEDIUM_USER = process.env.NEXT_PUBLIC_MEDIUM_USERNAME || '@nkaurelien';
const FEED_URL = `https://medium.com/feed/${MEDIUM_USER}`;
export const MEDIUM_PROFILE_URL = `https://medium.com/${MEDIUM_USER}`;

const parser = new Parser({
  customFields: { item: [['content:encoded', 'contentEncoded']] },
});

function extractThumbnail(html = '') {
  const m = html.match(/<img[^>]+src="([^">]+)"/i);
  return m ? m[1] : null;
}

function toExcerpt(text = '', max = 180) {
  const clean = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}

/**
 * Récupère les articles Medium (les ~10 derniers, limite du flux RSS).
 * Fetch mis en cache (ISR 6h) — les articles changent rarement.
 * Ne jette jamais : renvoie [] en cas d'erreur pour ne pas casser le rendu.
 */
export async function getMediumArticles({ limit } = {}) {
  try {
    const res = await fetch(FEED_URL, {
      next: { revalidate: 21600 }, // 6 h
      headers: { 'User-Agent': 'Mozilla/5.0 (nkaurelien-portfolio RSS)' },
    });
    if (!res.ok) {
      console.error('[medium] flux RSS non disponible:', res.status);
      return [];
    }
    const xml = await res.text();
    const feed = await parser.parseString(xml);

    const items = (feed.items || []).map(it => {
      const html = it.contentEncoded || it.content || '';
      return {
        title: it.title || '',
        link: (it.link || '').split('?')[0],
        date: it.isoDate || it.pubDate || null,
        categories: (it.categories || []).slice(0, 4),
        excerpt: toExcerpt(it.contentSnippet || html),
        thumbnail: extractThumbnail(html),
      };
    });

    return typeof limit === 'number' ? items.slice(0, limit) : items;
  } catch (err) {
    console.error('[medium] échec de récupération du flux:', err?.message || err);
    return [];
  }
}

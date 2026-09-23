import { z } from 'genkit';
import { ai } from './ai';
import { listArticles, readArticle, searchArticles } from '../../scripts/mcp/tools/articles';

// Outils du blog pour "Jamila", appelés en direct (mêmes fonctions que le serveur
// MCP /api/mcp, sans passer par HTTP). Volontairement en lecture seule :
// send_contact_message n'est PAS exposé à un chat public (spam / prompt injection).

// Borne la taille renvoyée au modèle (un article complet peut dépasser 30 ko).
const MAX_ARTICLE_CHARS = 12000;

// URL publique : slug web = nom de fichier sans le préfixe de date ; le middleware ajoute la locale.
const articleUrl = slug => `/blog/${slug.replace(/^\d{4}-\d{2}-\d{2}-/, '')}/`;
const withUrl = article => ({ ...article, url: articleUrl(article.slug) });

export const searchArticlesTool = ai.defineTool(
  {
    name: 'search_articles',
    description:
      "Recherche dans les articles techniques du blog d'Aurélien (titres, tags, contenu). Renvoie titre, slug, date, tags et un extrait. À utiliser quand le visiteur pose une question technique ou demande si Aurélien a écrit sur un sujet.",
    inputSchema: z.object({
      query: z.string().min(1).describe('UN seul mot-clé court (recherche de sous-chaîne, pas de phrase) — ex: "Kubernetes", "Cosign", "RAG"'),
    }),
  },
  async ({ query }) => searchArticles(query).slice(0, 8).map(withUrl)
);

export const listArticlesTool = ai.defineTool(
  {
    name: 'list_articles',
    description: "Liste les articles du blog d'Aurélien, du plus récent au plus ancien, avec titre, slug, date, tags et résumé. Filtrable par tag.",
    inputSchema: z.object({
      tag: z.string().optional().describe('Filtrer par tag (ex: "devops", "security", "docker")'),
      limit: z.number().int().positive().max(20).optional().describe("Nombre maximum d'articles (défaut 10)"),
    }),
  },
  async ({ tag, limit }) => listArticles(tag, limit ?? 10).map(withUrl)
);

export const readArticleTool = ai.defineTool(
  {
    name: 'read_article',
    description:
      "Lit le contenu d'un article du blog à partir de son slug (obtenu via search_articles ou list_articles), pour répondre précisément ou le résumer.",
    inputSchema: z.object({
      slug: z.string().min(1).describe("Slug exact de l'article"),
    }),
  },
  async ({ slug }) => {
    const { metadata, content } = readArticle(slug);
    const truncated = content.length > MAX_ARTICLE_CHARS;
    return {
      metadata,
      url: articleUrl(metadata.slug),
      content: truncated ? `${content.slice(0, MAX_ARTICLE_CHARS)}\n\n[… article tronqué]` : content,
    };
  }
);

export const JAMILA_TOOLS = [searchArticlesTool, listArticlesTool, readArticleTool];

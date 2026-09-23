import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import {
  listArticles,
  readArticle,
  searchArticles,
} from './tools/articles';
import {
  getProfileContext,
  searchProfileAndExperience,
} from './tools/profile';
import { sendContactMessage } from './tools/notify';

export const SERVER_INFO = {
  name: 'nk-portfolio-assistant-mcp',
  version: '1.0.0',
};

// Enveloppe commune : résultat texte + gestion d'erreur uniforme
async function run(toolName: string, fn: () => unknown | Promise<unknown>): Promise<CallToolResult> {
  try {
    const data = await fn();
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return { content: [{ type: 'text', text }] };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      isError: true,
      content: [{ type: 'text', text: `Erreur ${toolName}: ${error.message}` }],
    };
  }
}

// Construit le serveur MCP du Portfolio d'Aurélien Nkumbe (partagé par stdio et /api/mcp)
export function createPortfolioMcpServer(): McpServer {
  const server = new McpServer(SERVER_INFO);

  // ==========================================
  // 1. OUTILS PROFIL & PARCOURS D'AURÉLIEN
  // ==========================================
  server.tool(
    'get_profile_overview',
    'Récupère la biographie, compétences, parcours professionnel, réseaux sociaux et résumé d\'Aurélien Nkumbe',
    {},
    async () => run('get_profile_overview', () => getProfileContext())
  );

  server.tool(
    'search_experience',
    'Recherche des informations spécifiques sur les compétences, technologies et missions passées d\'Aurélien',
    {
      query: z.string().describe('Technologie, rôle ou entreprise recherchée (ex: "Kubernetes", "FHIR", "React", "DATA2INNOV")'),
    },
    async ({ query }) => run('search_experience', () => searchProfileAndExperience(query))
  );

  // ==========================================
  // 2. OUTILS ARTICLES & RETOURS D'EXPÉRIENCE
  // ==========================================
  server.tool(
    'list_articles',
    'Liste les articles et publications techniques d\'Aurélien avec titre, date, tags et résumés',
    {
      tag: z.string().optional().describe('Filtrer par tag (ex: "devops", "security", "rag", "docker")'),
      limit: z.number().int().positive().optional().describe('Nombre maximum d\'articles à lister'),
    },
    async ({ tag, limit }) => run('list_articles', () => listArticles(tag, limit))
  );

  server.tool(
    'read_article',
    'Lit l\'intégralité d\'un article technique du blog selon son slug',
    {
      slug: z.string().min(1).describe('Slug ou titre du fichier markdown de l\'article'),
    },
    async ({ slug }) => run('read_article', () => readArticle(slug))
  );

  server.tool(
    'search_articles',
    'Recherche des articles par mots-clés dans le contenu, les titres et les tags',
    {
      query: z.string().describe('Terme technique ou concept recherché'),
    },
    async ({ query }) => run('search_articles', () => searchArticles(query))
  );

  // ==========================================
  // 3. OUTIL CONTACT (« ME CONTACTER »)
  // ==========================================
  server.tool(
    'send_contact_message',
    'Transmet un message de contact à Aurélien Nkumbe via notification push instantanée (Ntfy)',
    {
      senderName: z.string().min(1).describe('Nom complet de l\'expéditeur'),
      senderEmail: z.string().email().describe('Adresse e-mail pour recontacter l\'expéditeur'),
      subject: z.string().optional().describe('Objet du message'),
      message: z.string().min(1).describe('Message ou proposition de collaboration à transmettre'),
    },
    async (params) => run('send_contact_message', async () => (await sendContactMessage(params)).message)
  );

  return server;
}

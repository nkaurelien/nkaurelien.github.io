#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
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

// Initialisation du serveur MCP pour le Portfolio d'Aurélien Nkumbe
const server = new McpServer({
  name: 'nk-portfolio-assistant-mcp',
  version: '1.0.0',
});

// ==========================================
// 1. OUTILS PROFIL & PARCOURS D'AURÉLIEN
// ==========================================
server.tool(
  'get_profile_overview',
  'Récupère la biographie, compétences, parcours professionnel, réseaux sociaux et résumé d\'Aurélien Nkumbe',
  {},
  async () => {
    try {
      const data = getProfileContext();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        isError: true,
        content: [{ type: 'text', text: `Erreur get_profile_overview: ${error.message}` }],
      };
    }
  }
);

server.tool(
  'search_experience',
  'Recherche des informations spécifiques sur les compétences, technologies et missions passées d\'Aurélien',
  {
    query: z.string().describe('Technologie, rôle ou entreprise recherchée (ex: "Kubernetes", "FHIR", "React", "DATA2INNOV")'),
  },
  async ({ query }) => {
    try {
      const results = searchProfileAndExperience(query);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        isError: true,
        content: [{ type: 'text', text: `Erreur search_experience: ${error.message}` }],
      };
    }
  }
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
  async ({ tag, limit }) => {
    try {
      const articles = listArticles(tag, limit);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(articles, null, 2),
          },
        ],
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        isError: true,
        content: [{ type: 'text', text: `Erreur list_articles: ${error.message}` }],
      };
    }
  }
);

server.tool(
  'read_article',
  'Lit l\'intégralité d\'un article technique du blog selon son slug',
  {
    slug: z.string().describe('Slug ou titre du fichier markdown de l\'article'),
  },
  async ({ slug }) => {
    try {
      const article = readArticle(slug);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(article, null, 2),
          },
        ],
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        isError: true,
        content: [{ type: 'text', text: `Erreur read_article: ${error.message}` }],
      };
    }
  }
);

server.tool(
  'search_articles',
  'Recherche des articles par mots-clés dans le contenu, les titres et les tags',
  {
    query: z.string().describe('Terme technique ou concept recherché'),
  },
  async ({ query }) => {
    try {
      const results = searchArticles(query);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        isError: true,
        content: [{ type: 'text', text: `Erreur search_articles: ${error.message}` }],
      };
    }
  }
);

// ==========================================
// 3. OUTIL CONTACT (« ME CONTACTER »)
// ==========================================
server.tool(
  'send_contact_message',
  'Transmet un message de contact à Aurélien Nkumbe via notification push instantanée (Ntfy)',
  {
    senderName: z.string().describe('Nom complet de l\'expéditeur'),
    senderEmail: z.string().describe('Adresse e-mail pour recontacter l\'expéditeur'),
    subject: z.string().optional().describe('Objet du message'),
    message: z.string().describe('Message ou proposition de collaboration à transmettre'),
  },
  async (params) => {
    try {
      const result = await sendContactMessage(params);
      return {
        content: [
          {
            type: 'text',
            text: result.message,
          },
        ],
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        isError: true,
        content: [{ type: 'text', text: `Erreur send_contact_message: ${error.message}` }],
      };
    }
  }
);

// Démarrage stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 nk-portfolio-assistant-mcp démarré avec succès sur stdio.');
}

main().catch((error) => {
  console.error('Erreur au démarrage du serveur MCP:', error);
  process.exit(1);
});

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { listArticles, readArticle, searchArticles } from '../../../../scripts/mcp/tools/articles';
import { getProfileContext, searchProfileAndExperience } from '../../../../scripts/mcp/tools/profile';
import { sendContactMessage } from '../../../../scripts/mcp/tools/notify';

export const runtime = 'nodejs';

// 1. Initialisation du serveur MCP officiel
function buildMcpServer() {
  const server = new McpServer({
    name: 'nk-portfolio-assistant-mcp',
    version: '1.0.0',
  });

  // Outil 1 : Vue d'ensemble du profil
  server.tool(
    'get_profile_overview',
    'Récupère la biographie, compétences, parcours professionnel, réseaux sociaux et résumé d\'Aurélien Nkumbe',
    {},
    async () => {
      const data = getProfileContext();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // Outil 2 : Recherche expérience & compétences
  server.tool(
    'search_experience',
    'Recherche des informations spécifiques sur les compétences, technologies et missions passées d\'Aurélien',
    {
      query: z.string().describe('Technologie, rôle ou entreprise recherchée (ex: "Kubernetes", "FHIR", "React", "DATA2INNOV")'),
    },
    async ({ query }) => {
      const results = searchProfileAndExperience(query);
      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // Outil 3 : Liste des articles
  server.tool(
    'list_articles',
    'Liste les articles et publications techniques d\'Aurélien avec titre, date, tags et résumés',
    {
      tag: z.string().optional().describe('Filtrer par tag (ex: "devops", "security", "rag", "docker")'),
      limit: z.number().int().positive().optional().describe('Nombre maximum d\'articles à lister'),
    },
    async ({ tag, limit }) => {
      const articles = listArticles(tag, limit);
      return {
        content: [{ type: 'text', text: JSON.stringify(articles, null, 2) }],
      };
    }
  );

  // Outil 4 : Lecture d'article
  server.tool(
    'read_article',
    'Lit l\'intégralité d\'un article technique du blog selon son slug ou nom de fichier',
    {
      slug: z.string().describe('Slug ou titre du fichier markdown de l\'article'),
    },
    async ({ slug }) => {
      const article = readArticle(slug);
      return {
        content: [{ type: 'text', text: JSON.stringify(article, null, 2) }],
      };
    }
  );

  // Outil 5 : Recherche plein texte dans les articles
  server.tool(
    'search_articles',
    'Recherche des articles par mots-clés dans le contenu, les titres et les tags',
    {
      query: z.string().describe('Terme technique ou concept recherché'),
    },
    async ({ query }) => {
      const results = searchArticles(query);
      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // Outil 6 : Envoi de message de contact
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
      const result = await sendContactMessage(params);
      return {
        content: [{ type: 'text', text: result.message }],
      };
    }
  );

  return server;
}

// 2. Vérification d'authentification optionnelle
function checkAuth(req) {
  const apiKey = process.env.MCP_API_KEY;
  if (!apiKey) return true;

  const authHeader = req.headers.get('authorization') || '';
  const xApiKey = req.headers.get('x-api-key') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  return bearerToken === apiKey || xApiKey === apiKey;
}

// 3. GET : Informations et métadonnées MCP
export async function GET() {
  return Response.json({
    status: 'ok',
    sdk: '@modelcontextprotocol/sdk',
    name: 'nk-portfolio-assistant-mcp',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    transport: 'HTTP JSON-RPC 2.0',
    tools: [
      'get_profile_overview',
      'search_experience',
      'list_articles',
      'read_article',
      'search_articles',
      'send_contact_message',
    ],
  });
}

// 4. POST : Gestion des requêtes JSON-RPC
export async function POST(req) {
  if (!checkAuth(req)) {
    return Response.json(
      {
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Non autorisé : Clé API MCP invalide ou absente.' },
        id: null,
      },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      {
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error : corps JSON invalide.' },
        id: null,
      },
      { status: 400 }
    );
  }

  const { jsonrpc = '2.0', method, params, id } = body;
  const mcp = buildMcpServer();

  try {
    if (method === 'initialize') {
      return Response.json({
        jsonrpc,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'nk-portfolio-assistant-mcp', version: '1.0.0' },
        },
        id,
      });
    }

    if (method === 'notifications/initialized' || method === 'ping') {
      return Response.json({ jsonrpc, result: {}, id });
    }

    if (method === 'tools/list') {
      // Extraction des métadonnées déclarées dans le McpServer
      const toolsList = Object.entries(mcp._registeredTools || {}).map(([name, tool]) => ({
        name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      return Response.json({ jsonrpc, result: { tools: toolsList }, id });
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const registeredTool = mcp._registeredTools?.[toolName];

      if (!registeredTool) {
        return Response.json({
          jsonrpc,
          error: { code: -32601, message: `Outil inconnu : "${toolName}"` },
          id,
        });
      }

      // Exécution avec validation zod
      const callResult = await registeredTool.handler(toolArgs);
      return Response.json({ jsonrpc, result: callResult, id });
    }

    return Response.json({
      jsonrpc,
      error: { code: -32601, message: `Méthode non supportée : "${method}"` },
      id,
    });
  } catch (err) {
    return Response.json({
      jsonrpc,
      result: {
        isError: true,
        content: [{ type: 'text', text: `Erreur d'exécution : ${err.message}` }],
      },
      id,
    });
  }
}

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

import { createPortfolioMcpServer, SERVER_INFO } from '../../../../scripts/mcp/server';

export const runtime = 'nodejs';

// 1. Vérification d'authentification optionnelle
function checkAuth(req) {
  const apiKey = process.env.MCP_API_KEY;
  if (!apiKey) return true;

  const authHeader = req.headers.get('authorization') || '';
  const xApiKey = req.headers.get('x-api-key') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  return bearerToken === apiKey || xApiKey === apiKey;
}

// 2. GET : Informations et métadonnées MCP
export async function GET(req) {
  // Mode sans état : pas de flux SSE côté serveur
  if ((req.headers.get('accept') || '').includes('text/event-stream')) {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  }

  return Response.json({
    status: 'ok',
    sdk: '@modelcontextprotocol/sdk',
    ...SERVER_INFO,
    transport: 'Streamable HTTP (stateless, JSON)',
    tools: ['get_profile_overview', 'search_experience', 'list_articles', 'read_article', 'search_articles', 'send_contact_message'],
  });
}

// 3. POST : Requêtes JSON-RPC traitées par le transport officiel du SDK
// (validation zod des arguments et JSON Schema des outils gérés par McpServer)
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

  const server = createPortfolioMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } finally {
    await server.close();
  }
}

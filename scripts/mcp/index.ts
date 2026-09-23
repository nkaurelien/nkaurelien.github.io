#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { createPortfolioMcpServer } from './server';

// Démarrage stdio
async function main() {
  const server = createPortfolioMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 nk-portfolio-assistant-mcp démarré avec succès sur stdio.');
}

main().catch((error) => {
  console.error('Erreur au démarrage du serveur MCP:', error);
  process.exit(1);
});

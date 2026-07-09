/**
 * Envoyer des requêtes SQL à Supabase via Prisma (usage LOCAL / shell).
 *
 *   node scripts/db-query.js "SELECT count(*) FROM vector_embeddings"
 *   yarn db:query "SELECT slug FROM content_entries LIMIT 5"
 *
 * Utilise le driver adapter Prisma 7 (@prisma/adapter-pg) sur la connexion
 * DIRECTE (5432). Retourne les lignes en JSON lisible.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../src/generated/prisma');

// BigInt (ex. count(*)) n'est pas sérialisable en JSON par défaut.
const jsonSafe = (_key, value) => (typeof value === 'bigint' ? Number(value) : value);

async function main() {
  const sql = process.argv.slice(2).join(' ').trim();
  if (!sql) {
    console.error('Usage: node scripts/db-query.js "SELECT ..."');
    process.exit(1);
  }

  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Erreur: DIRECT_URL ou DATABASE_URL doit être défini (.env / .env.local).');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const rows = await prisma.$queryRawUnsafe(sql);
    console.log(JSON.stringify(rows, jsonSafe, 2));
    if (Array.isArray(rows)) console.error(`\n(${rows.length} ligne(s))`);
  } catch (err) {
    console.error('Erreur SQL:', err.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

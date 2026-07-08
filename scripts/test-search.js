require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Client } = require('pg');
const { HuggingFaceTransformersEmbeddings } = require('@langchain/community/embeddings/huggingface_transformers');

let connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (connectionString && (connectionString.includes('pgbouncer=true') || connectionString.includes(':6543/'))) {
  connectionString = connectionString.replace(':6543/', ':5432/').replace('pgbouncer=true', '');
}

async function run() {
  const dbClient = new Client({ connectionString });
  await dbClient.connect();

  try {
    // 1. Initialize LangChain Embeddings provider
    console.log('Loading LangChain HuggingFaceTransformersEmbeddings...');
    const embeddings = new HuggingFaceTransformersEmbeddings({
      model: 'Xenova/all-MiniLM-L6-v2',
    });

    // 2. Test query
    const searchQuery = 'Fintech payment cards and mobile scan ticket OCR';
    console.log(`\nGenerating embedding for search query: "${searchQuery}"`);
    const embedding = await embeddings.embedQuery(searchQuery);
    const vectorString = `[${embedding.join(',')}]`;

    // 3. Query PostgreSQL similarity function
    console.log('Querying match_embeddings function in Supabase...');
    const query = `
      SELECT 
        e.slug,
        e.raw_markdown,
        m.similarity,
        m.text_chunk
      FROM match_embeddings($1::vector, 0.1, 3) m
      JOIN public.content_entries e ON e.id = m.content_entry_id
      ORDER BY m.similarity DESC;
    `;

    const res = await dbClient.query(query, [vectorString]);
    
    console.log('\n--- SEMANTIC SEARCH RESULTS ---');
    if (res.rows.length === 0) {
      console.log('No matches found above threshold.');
    } else {
      res.rows.forEach((row, i) => {
        const titleLine = row.raw_markdown.split('\n').find(l => l.startsWith('title:')) || '';
        const title = titleLine.replace('title:', '').trim();
        console.log(`${i + 1}. Project: ${title} (${row.slug})`);
        console.log(`   Similarity Score: ${(row.similarity * 100).toFixed(2)}%`);
        console.log(`   Matching Chunk: ${row.text_chunk.substring(0, 120)}...\n`);
      });
    }

  } catch (error) {
    console.error('Error testing semantic search:', error);
  } finally {
    await dbClient.end();
  }
}

run();

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { Client } = require('pg');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { HuggingFaceTransformersEmbeddings } = require('@langchain/community/embeddings/huggingface_transformers');

// Configure Database Connection
let connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Error: DATABASE_URL or DIRECT_URL must be defined in your environment.');
  process.exit(1);
}

// Clean transaction pooler parameters if present
if (connectionString.includes('pgbouncer=true') || connectionString.includes(':6543/')) {
  console.log('Detected transaction pooler connection. Switching to direct session port...');
  connectionString = connectionString
    .replace(':6543/', ':5432/')
    .replace('pgbouncer=true', '')
    .replace('&&', '&')
    .replace('?&', '?');
}

// Initialize LangChain Hugging Face Embeddings provider
console.log('Initializing LangChain HuggingFaceTransformersEmbeddings (all-MiniLM-L6-v2)...');
const embeddings = new HuggingFaceTransformersEmbeddings({
  model: 'Xenova/all-MiniLM-L6-v2',
});

function stripHtml(str = '') {
  return str.replace(/<[^>]+>/g, '');
}

function getFilesRecursively(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFilesRecursively(name, fileList);
    } else {
      fileList.push(name);
    }
  }
  return fileList;
}

async function run() {
  const dbClient = new Client({ connectionString });
  
  // Initialize LangChain Text Splitter
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 600,
    chunkOverlap: 120,
  });

  console.log('Connecting to Supabase PostgreSQL database...');
  await dbClient.connect();
  console.log('Connected successfully!');

  try {
    // 1. Ensure content section exists
    console.log('Verifying content section for projects...');
    const secRes = await dbClient.query(`
      INSERT INTO public.content_sections (title, category, description)
      VALUES ('Projets de Portfolio', 'PROJECT', 'Portfolio projects with semantic vector embeddings')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

    let sectionId;
    if (secRes.rows.length > 0) {
      sectionId = secRes.rows[0].id;
    } else {
      const getSec = await dbClient.query("SELECT id FROM public.content_sections WHERE category = 'PROJECT' LIMIT 1");
      if (getSec.rows.length > 0) {
        sectionId = getSec.rows[0].id;
      } else {
        throw new Error('Could not resolve or create ContentSection.');
      }
    }
    console.log(`Content Section ID: ${sectionId}`);

    // 2. Parse projects from locale directories
    const locales = ['fr', 'en'];
    const parsedProjects = {};

    locales.forEach(loc => {
      const dir = path.join(process.cwd(), 'public', 'projects', loc);
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
      files.forEach(file => {
        const slug = file.replace(/\.md$/, '');
        const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
        const { data, content } = matter(raw);

        if (!parsedProjects[slug]) {
          parsedProjects[slug] = {
            slug,
            title: data.title || slug,
            image: data.image || '',
            category: data.category || '',
            year: '',
            tech: '',
            descriptions: {},
            markdowns: {},
            details: {},
            tags: [],
          };
        }

        parsedProjects[slug].year = data.year || parsedProjects[slug].year;

        // Parse tech stack
        const stackItem = data.details?.items?.find(item => item.label === 'Stack');
        if (stackItem) {
          parsedProjects[slug].tech = stackItem.value;
          parsedProjects[slug].tags = stackItem.value.split(',').map(t => t.trim());
        }

        // Capture the structured details (Période, Statut, Rôle, Stack…) — c'est là
        // que vit l'essentiel du contenu projet (le corps markdown est souvent vide).
        const detailsItems = data.details?.items || [];
        parsedProjects[slug].details[loc] = detailsItems.map(it => `${it.label}: ${it.value}`).join('. ');

        parsedProjects[slug].descriptions[loc] = stripHtml(data.description?.content || '');
        parsedProjects[slug].markdowns[loc] = content;
      });
    });

    const projectsList = Object.values(parsedProjects);
    console.log(`Found ${projectsList.length} unique local projects to import.`);

    for (const proj of projectsList) {
      console.log(`\n--- Importing Project: ${proj.title} (slug: ${proj.slug}) ---`);

      // Construct a unified raw markdown text that aggregates both languages
      const combinedMarkdown = `---
title: ${proj.title}
category: ${proj.category}
tech: ${proj.tech}
image: ${proj.image}
---
# French Description
${proj.descriptions.fr || ''}
${proj.markdowns.fr || ''}

# English Description
${proj.descriptions.en || ''}
${proj.markdowns.en || ''}`;

      // Check if entry and vector embedding already exist to maintain idempotency
      const checkEntry = await dbClient.query('SELECT id FROM public.content_entries WHERE slug = $1', [proj.slug]);
      let entryId = null;
      let hasEmbedding = false;

      if (checkEntry.rows.length > 0) {
        entryId = checkEntry.rows[0].id;
        const checkEmbed = await dbClient.query('SELECT id FROM public.vector_embeddings WHERE content_entry_id = $1', [entryId]);
        if (checkEmbed.rows.length > 0) {
          hasEmbedding = true;
        }
      }

      if (hasEmbedding && process.env.REEMBED !== '1') {
        console.log(`Skipping project: ${proj.title} (Already embedded. Run with REEMBED=1 to force recalculation).`);
        continue;
      }

      // Insert or Update the ContentEntry
      const entryRes = await dbClient.query(`
        INSERT INTO public.content_entries (slug, raw_markdown, section_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (slug) 
        DO UPDATE SET raw_markdown = EXCLUDED.raw_markdown, section_id = EXCLUDED.section_id
        RETURNING id
      `, [proj.slug, combinedMarkdown, sectionId]);

      entryId = entryRes.rows[0].id;
      console.log(`ContentEntry ID: ${entryId}`);

      // Generate embedding vectors using LangChain RecursiveCharacterTextSplitter
      // Include Title, Category, Tech Stack in every chunk prefix to preserve context for similarity search queries
      const metaPrefix = `Title: ${proj.title}. Category: ${proj.category}. Technologies: ${proj.tech}.`;
      // Embed the FULL project content — descriptions + structured details (Période,
      // Statut, Rôle, Stack…) + markdown bodies. L'essentiel vit dans le frontmatter
      // (`details`), le corps markdown étant souvent vide.
      const mainBody = [
        proj.year && `Année: ${proj.year}`,
        proj.descriptions.fr && `Description (FR): ${proj.descriptions.fr}`,
        proj.details.fr && `Détails (FR): ${proj.details.fr}`,
        proj.descriptions.en && `Description (EN): ${proj.descriptions.en}`,
        proj.details.en && `Détails (EN): ${proj.details.en}`,
        stripHtml(proj.markdowns.fr || ''),
        stripHtml(proj.markdowns.en || ''),
      ]
        .filter(Boolean)
        .join('\n\n')
        .trim();

      console.log(`Splitting project text body into chunks using LangChain...`);
      const bodyChunks = await splitter.splitText(mainBody);
      console.log(`Split into ${bodyChunks.length} chunks.`);

      // Delete any previous vector embeddings for this entry first to avoid duplicate mappings
      await dbClient.query('DELETE FROM public.vector_embeddings WHERE content_entry_id = $1', [entryId]);

      for (let i = 0; i < bodyChunks.length; i++) {
        const chunkText = `${metaPrefix} ${bodyChunks[i]}`;
        console.log(`Generating embedding for chunk ${i + 1}/${bodyChunks.length} (${chunkText.length} chars)...`);
        const embedding = await embeddings.embedQuery(chunkText);
        const vectorString = `[${embedding.join(',')}]`;
        
        await dbClient.query(`
          INSERT INTO public.vector_embeddings (text_chunk, embedding_vector, content_entry_id)
          VALUES ($1, $2, $3)
        `, [chunkText, vectorString, entryId]);
      }
      console.log('All embeddings inserted successfully!');

      // Insert Tags and create associations
      if (proj.tags.length > 0) {
        console.log(`Associating ${proj.tags.length} tags...`);
        for (const tagName of proj.tags) {
          // Insert Tag
          const tagRes = await dbClient.query(`
            INSERT INTO public.tags (name)
            VALUES ($1)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
          `, [tagName]);
          const tagId = tagRes.rows[0].id;

          // Insert ContentTag relation
          await dbClient.query(`
            INSERT INTO public.content_tags (content_entry_id, tag_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [entryId, tagId]);
        }
      }
    }

    // ----------------------------------------------------
    // Seed Additional Profile Documents (story.md and llms.txt)
    // ----------------------------------------------------
    console.log('\n--- Processing Profile Documents ---');
    
    // Check or create the content section for profile (ABOUT category)
    let profileSectionId;
    const profileSecRes = await dbClient.query(`
      INSERT INTO public.content_sections (title, category, description)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, ['Profil et Histoire', 'ABOUT', 'Profil, histoire et informations d\'Aurélien NKUMBE']);

    if (profileSecRes.rows.length > 0) {
      profileSectionId = profileSecRes.rows[0].id;
    } else {
      const getProfileSec = await dbClient.query("SELECT id FROM public.content_sections WHERE category = 'ABOUT' LIMIT 1");
      if (getProfileSec.rows.length > 0) {
        profileSectionId = getProfileSec.rows[0].id;
      } else {
        throw new Error('Could not resolve or create Profile ContentSection.');
      }
    }

    const datasourcesDir = path.join(process.cwd(), 'datasources');
    const docFiles = getFilesRecursively(datasourcesDir).filter(f => f.endsWith('.md') || f.endsWith('.txt'));

    for (const filePath of docFiles) {
      const relativePath = path.relative(datasourcesDir, filePath);
      // Generate slug based on relative path
      const slug = relativePath
        .replace(/\.[^/.]+$/, "") // strip extension
        .replace(/[^a-zA-Z0-9-_]/g, "-") // sanitize characters
        .toLowerCase();

      const rawContent = fs.readFileSync(filePath, 'utf-8');

      // Resolve document title from first header or filename
      let docTitle = path.basename(filePath);
      const firstLine = rawContent.split('\n').find(line => line.trim().startsWith('# ')) || '';
      if (firstLine) {
        docTitle = firstLine.replace('# ', '').trim();
      }

      console.log(`\n--- Importing Document: ${docTitle} (slug: ${slug}) ---`);

      // Idempotency check
      const checkDocEntry = await dbClient.query('SELECT id FROM public.content_entries WHERE slug = $1', [slug]);
      let docEntryId = null;
      let docHasEmbedding = false;

      if (checkDocEntry.rows.length > 0) {
        docEntryId = checkDocEntry.rows[0].id;
        const checkDocEmbed = await dbClient.query('SELECT id FROM public.vector_embeddings WHERE content_entry_id = $1', [docEntryId]);
        if (checkDocEmbed.rows.length > 0) {
          docHasEmbedding = true;
        }
      }

      if (docHasEmbedding && process.env.REEMBED !== '1') {
        console.log(`Skipping document: ${docTitle} (Already embedded. Run with REEMBED=1 to force recalculation).`);
        continue;
      }

      // Insert or Update ContentEntry
      const docEntryRes = await dbClient.query(`
        INSERT INTO public.content_entries (slug, raw_markdown, section_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (slug)
        DO UPDATE SET raw_markdown = EXCLUDED.raw_markdown, section_id = EXCLUDED.section_id
        RETURNING id
      `, [slug, rawContent, profileSectionId]);

      docEntryId = docEntryRes.rows[0].id;
      console.log(`ContentEntry ID: ${docEntryId}`);

      console.log(`Splitting document text body into chunks using LangChain...`);
      const docChunks = await splitter.splitText(rawContent);
      console.log(`Split into ${docChunks.length} chunks.`);

      // Delete any previous vector embeddings for this entry first to avoid duplicate mappings
      await dbClient.query('DELETE FROM public.vector_embeddings WHERE content_entry_id = $1', [docEntryId]);

      const metaPrefix = `Source: ${relativePath}. Title: ${docTitle}. Section: Profile.`;

      for (let i = 0; i < docChunks.length; i++) {
        const chunkText = `${metaPrefix} ${docChunks[i]}`;
        console.log(`Generating embedding for chunk ${i + 1}/${docChunks.length} (${chunkText.length} chars)...`);
        const embedding = await embeddings.embedQuery(chunkText);
        const vectorString = `[${embedding.join(',')}]`;

        await dbClient.query(`
          INSERT INTO public.vector_embeddings (text_chunk, embedding_vector, content_entry_id)
          VALUES ($1, $2, $3)
        `, [chunkText, vectorString, docEntryId]);
      }
      console.log('All embeddings inserted successfully!');
    }

    console.log('\nAll projects, documents, and embeddings have been successfully seeded to Supabase!');

  } catch (error) {
    console.error('Seeding process encountered an error:', error);
  } finally {
    await dbClient.end();
    console.log('Database connection closed.');
  }
}

run();

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';

// 1. Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Initialize Gemini provider
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const google = createGoogleGenerativeAI({ apiKey });

// 3. Initialize LangChain Embeddings provider (matching our database vector size 384)
const embeddings = new HuggingFaceTransformersEmbeddings({
  model: 'Xenova/all-MiniLM-L6-v2',
});

export const runtime = 'nodejs'; // Use nodejs environment to allow ONNX runtime execution

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content || '';

    let context = '';

    if (latestMessage.trim().length > 0) {
      console.log(`Calculating query embedding for: "${latestMessage}"`);
      // Compute 384-dim embedding for user query
      const queryVector = await embeddings.embedQuery(latestMessage);

      console.log('Querying matching embeddings in Supabase...');
      // Run similarity match on pgvector
      const { data: documents, error } = await supabase.rpc('match_embeddings', {
        query_embedding: `[${queryVector.join(',')}]`,
        match_threshold: 0.15,
        match_count: 5,
      });

      if (error) {
        console.error('Supabase RPC match_embeddings error:', error);
      } else if (documents && documents.length > 0) {
        console.log(`Found ${documents.length} matching content chunks.`);
        context = documents.map(doc => `- Context (from ${doc.slug || 'profile'}): ${doc.text_chunk}`).join('\n\n');
      } else {
        console.log('No matching context chunks found.');
      }
    }

    // 4. Call Gemini and stream response
    const systemPrompt = `Tu es "Astrid-Aurélien NKUMBE ENONGENE" (Aurélien), un Développeur'Ops fullstack polyvalent avec plus de 7 ans d'expérience dans le DevSecOps, SysOps, la Data et l'IA.
Tu réponds aux questions des visiteurs (recruteurs, confrères, clients) de ton site portfolio de manière professionnelle, chaleureuse, humble mais confiante.
Réponds de préférence dans la même langue que la question de l'utilisateur (français ou anglais).

Utilise UNIQUEMENT les informations de contexte fournies ci-dessous pour étayer tes réponses. Si le contexte ne contient pas l'information demandée, réponds poliment que tu ne disposes pas de cette information précise mais propose de parler de ton parcours général ou redirige-les vers ta page contact.

Voici les informations sur toi (contexte récupéré de tes projets et de ton histoire) :
==================================
${context || 'Aucune information contextuelle spécifique trouvée en base de données. Réponds de façon générale sur ton profil de développeur.'}
==================================`;

    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error('Error in /api/chat route:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@supabase/supabase-js';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';

// 1. Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Initialize Genkit with Google GenAI plugin
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const ai = genkit({
  plugins: [googleAI({ apiKey })],
});

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
      console.log(`[Genkit BFF] Calculating query embedding for: "${latestMessage}"`);
      // Compute 384-dim embedding for user query
      const queryVector = await embeddings.embedQuery(latestMessage);

      console.log('[Genkit BFF] Querying matching embeddings in Supabase...');
      // Run similarity match on pgvector
      const { data: documents, error } = await supabase.rpc('match_embeddings', {
        query_embedding: `[${queryVector.join(',')}]`,
        match_threshold: 0.15,
        match_count: 5,
      });

      if (error) {
        console.error('[Genkit BFF] Supabase RPC error:', error);
      } else if (documents && documents.length > 0) {
        console.log(`[Genkit BFF] Found ${documents.length} matching content chunks.`);
        context = documents.map(doc => `- Context (from ${doc.slug || 'profile'}): ${doc.text_chunk}`).join('\n\n');
      } else {
        console.log('[Genkit BFF] No matching context chunks found.');
      }
    }

    // 4. Construct System Prompt
    const systemPrompt = `Tu es "Astrid-Aurélien NKUMBE ENONGENE" (Aurélien), un Développeur'Ops fullstack polyvalent avec plus de 7 ans d'expérience dans le DevSecOps, SysOps, la Data et l'IA.
Tu réponds aux questions des visiteurs (recruteurs, confrères, clients) de ton site portfolio de manière professionnelle, chaleureuse, humble mais confiante.
Réponds de préférence dans la même langue que la question de l'utilisateur (français ou anglais).

Utilise UNIQUEMENT les informations de contexte fournies ci-dessous pour étayer tes réponses. Si le contexte ne contient pas l'information demandée, réponds poliment que tu ne disposes pas de cette information précise mais propose de parler de ton parcours général ou redirige-les vers ta page contact.

Voici les informations sur toi (contexte récupéré de tes projets et de ton histoire) :
==================================
${context || 'Aucune information contextuelle spécifique trouvée en base de données. Réponds de façon générale sur ton profil de développeur.'}
==================================`;

    // 5. Convert messages to Genkit format
    const genkitMessages = messages.map(m => {
      let role = 'user';
      if (m.role === 'assistant') role = 'model';
      if (m.role === 'system') role = 'system';
      return {
        role,
        content: [{ text: m.content }],
      };
    });

    console.log('[Genkit BFF] Starting Genkit stream execution...');
    const responseStream = await ai.generateStream({
      model: googleAI.model('gemini-flash-latest'),
      system: systemPrompt,
      messages: genkitMessages,
    });

    // 6. Custom Stream formatting Genkit chunks into Vercel AI SDK Stream protocol
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream.stream) {
            if (chunk.text) {
              // Vercel AI SDK Data Stream protocol format for text chunks: 0:JSON_string\n
              const formattedChunk = `0:${JSON.stringify(chunk.text)}\n`;
              controller.enqueue(formattedChunk);
            }
          }
        } catch (streamError) {
          console.error('[Genkit BFF] Streaming error:', streamError);
          // Send error chunk format (3:error_message\n)
          controller.enqueue(`3:${JSON.stringify(streamError.message)}\n`);
        } finally {
          controller.close();
        }
      },
    });

    // Return the response with Vercel AI SDK headers
    return new Response(stream.pipeThrough(new TextEncoderStream()), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (err) {
    console.error('Error in /api/chat route:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

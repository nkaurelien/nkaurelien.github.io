# Alternative : Intégration des Embeddings Google Gemini

Ce document explique comment migrer du modèle local gratuit `@xenova/transformers` (dimensions 384) vers le SDK officiel **Google Gen AI** en utilisant le modèle d'embeddings haut de gamme de Google (**`text-embedding-004`**, dimensions 768).

---

## Comparatif Technique

| Caractéristique | Modèle Actuel (Xenova Local) | Modèle Google Gemini |
| :--- | :--- | :--- |
| **Nom du modèle** | `Xenova/all-MiniLM-L6-v2` | `text-embedding-004` |
| **Dimensions du vecteur** | 384 | 768 |
| **Coût** | Gratuit (100% Local) | Gratuit (dans les limites du plan gratuit) / Payant au-delà |
| **Connexion internet** | Non requise | Requise (Appel API Google Cloud) |
| **Configuration requise** | Aucune clé API | Requiert une `GEMINI_API_KEY` |

---

## Guide de Migration Pas-à-Pas

### Étape 1 : Modifier le schéma de la base de données (Supabase)
Le modèle de Google produit des vecteurs de **768 dimensions** (au lieu de 384). Vous devez mettre à jour la taille de la colonne dans Supabase.

Exécutez ce script SQL dans l'éditeur SQL de votre console Supabase (ou via `make db-schema` après modification de [create_embeddings_schema.sql](file:///Volumes/X9%20Pro/Workspaces/nkaurelien/nkaurelien.github.io/supabase/create_embeddings_schema.sql)) :

```sql
-- 1. Supprimer la fonction de recherche existante car elle dépend de l'ancienne taille de vecteur
drop function if exists match_embeddings;

-- 2. Supprimer et recréer la table ou modifier le type de colonne
alter table public.vector_embeddings alter column embedding_vector type vector(768);

-- 3. Recréer la fonction match_embeddings avec le type vector(768)
create or replace function match_embeddings(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content_entry_id uuid,
  text_chunk text,
  similarity float
)
language sql stable
as $$
  select
    vector_embeddings.id,
    vector_embeddings.content_entry_id,
    vector_embeddings.text_chunk,
    1 - (vector_embeddings.embedding_vector <=> query_embedding) as similarity
  from vector_embeddings
  where 1 - (vector_embeddings.embedding_vector <=> query_embedding) > match_threshold
  order by vector_embeddings.embedding_vector <=> query_embedding
  limit match_count;
$$;
```

### Étape 2 : Installer le SDK Google Gen AI
Installez le package officiel de Google pour Node.js :
```bash
yarn add @google/genai
```

### Étape 3 : Configurer votre Clé API Gemini
1. Obtenez une clé API Gemini gratuite sur [Google AI Studio](https://aistudio.google.com/).
2. Ajoutez la clé dans votre fichier `.env.local` :
```env
GEMINI_API_KEY="VOTRE_CLE_API_GEMINI_ICI"
```

### Étape 4 : Mettre à jour le script d'importation
Modifiez le fichier **[import-projects-supabase.js](file:///Volumes/X9%20Pro/Workspaces/nkaurelien/nkaurelien.github.io/scripts/import-projects-supabase.js)** pour importer le SDK et remplacer la fonction `generateEmbedding` :

```javascript
// A. Remplacer l'import Xenova par le SDK Google au début du fichier :
// const { pipeline } = require('@xenova/transformers'); (À enlever)
const { GoogleGenAI } = require('@google/genai');

// B. Initialiser le client Google Gen AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// C. Remplacer la fonction generateEmbedding :
async function generateEmbedding(text) {
  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });
    // Retourne le tableau de 768 floats
    return response.embedding.values;
  } catch (error) {
    console.error('Erreur lors de la génération d\'embedding Gemini :', error);
    throw error;
  }
}
```

### Étape 5 : Ré-exécuter le Seed
Videz d'abord la table locale des vecteurs en base de données si vous souhaitez forcer la regénération, puis lancez la commande :
```bash
make db-seed
```
 Le script calculera de nouveaux embeddings haute définition de 768 dimensions et les sauvegardera sur votre instance Supabase.

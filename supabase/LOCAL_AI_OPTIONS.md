# Options IA locales & Cloud : Ollama (M4 Local), Firebase Genkit & Gemini API

Votre **Mac mini M4** est un outil extrêmement puissant doté de moteurs neuronaux accélérés (NPU) et d'un GPU unifié très rapide. Vous pouvez en tirer parti pour faire tourner des modèles d'IA en local à pleine vitesse.

---

## 1. Option Ollama (100% Local & Accéléré sur M4)
Ollama s'exécute localement sur votre Mac et utilise l'accélération matérielle Apple Silicon (Metal) pour générer des embeddings quasi-instantanément et gratuitement.

### Étape 1 : Installer le modèle d'embeddings dans Ollama
Ouvrez votre terminal et téléchargez un modèle d'embeddings haute performance (ex: `nomic-embed-text` avec 768 dimensions) :
```bash
ollama pull nomic-embed-text
```

### Étape 2 : Code d'intégration dans Node.js
Ollama expose une API locale sur le port `11434`. Vous pouvez générer les embeddings en envoyant une requête HTTP `POST` sans installer de dépendances complexes :

```javascript
async function generateOllamaEmbedding(text) {
  const response = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: text
    })
  });
  
  const data = await response.json();
  return data.embedding; // Tableau de 768 dimensions
}
```
*Note : Dans Supabase, configurez la taille du vecteur à `vector(768)` pour correspondre à `nomic-embed-text`.*

---

## 2. Est-ce que Firebase Genkit est utile ?
**Oui, absolument.** **Firebase Genkit** est le framework open source de Google pour concevoir des applications d'IA générative. 

### À quoi sert-il ?
* **Abstraction unifiée** : Genkit fournit une interface commune pour connecter Gemini, Ollama, ou OpenAI. Vous pouvez changer de modèle en modifiant une ligne de code sans réécrire vos pipelines d'IA.
* **Genkit Developer UI** : Il fournit une console locale de débogage extraordinaire (`npx genkit start`) pour tester vos invites (prompts), inspecter les traces de calcul sémantique et déboguer vos flux.
* **Intégration Firebase native** : Si vous développez des Firebase Cloud Functions, Genkit s'intègre nativement pour déployer vos fonctionnalités d'IA avec authentification automatique.

### Quand l'utiliser ?
* **Non requis pour un simple script d'importation** (cela alourdirait le script avec des configurations de plugins).
* **Très recommandé** si vous décidez d'ajouter un **Chatbot intelligent** sur votre portfolio pour répondre aux recruteurs, ou pour structurer des flux complexes de résumé d'articles de blog.

---

## 3. Utilisation directe de la clé API Gemini (Zéro dépendance)
Puisque vous possédez une clé API Gemini, vous pouvez également générer des embeddings de 768 dimensions avec le modèle de Google (`text-embedding-004`) en envoyant une simple requête REST sans installer de SDK :

### Configuration dans `.env.local`
```env
GEMINI_API_KEY="your-gemini-api-key"
```

### Code d'intégration Node.js (Sans installer `@google/genai`)
```javascript
async function generateGeminiEmbeddingDirect(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: {
        parts: [{ text: text }]
      }
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${data.error?.message || response.statusText}`);
  }

  return data.embedding.values; // Tableau de 768 dimensions
}
```
*Sécurité : Veillez à ne jamais pousser votre clé API directement sur des dépôts GitHub publics. Ajoutez toujours votre clé dans le fichier `.env.local` (déjà dans votre `.gitignore`).*

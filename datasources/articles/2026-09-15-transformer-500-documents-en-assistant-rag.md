---
tags: ia, rag, langchain, ollama, litellm, python, vector-db, embeddings, advanced-rag, agentic-rag
title: "Comment transformer +500 documents complexes en un Assistant RAG fiable avec LangChain et Ollama"
date: 2026-09-15
categories: [IA & Data, RAG, Python, Architecture]
excerpt: "Les coulisses d'un pipeline ETL documentaire RAG : découpage en chunks, indexation vectorielle, souveraineté des données et la feuille de route vers le RAG 2.0 (Agentic RAG, GraphRAG & Reranking)."
lang: fr
---

# Comment transformer +500 documents complexes en un Assistant RAG fiable avec LangChain et Ollama

*L'intégration des modèles de langage (LLMs) dans les processus d'entreprise se heurte souvent à deux obstacles majeurs : l'hallucination des modèles sur des domaines réglementaires complexes et la confidentialité des données métier. Voici le retour d'expérience d'une architecture RAG (Retrieval-Augmented Generation) souveraine et performante, suivie de la feuille de route pour passer au RAG 2.0 (Agentic RAG).*

---

## Le Problème : La complexité documentaire RH & Paie

Dans des domaines fortement réglementés (droit du travail, paie, conventions collectives), les documents métier s'accumulent sous des formats hétérogènes (PDF, Word, Markdown, JSON). Les LLMs généralistes échouent souvent pour deux raisons majeures :

1. **L'hallucination et le manque d'actualisation** : Ils ignorent souvent les spécificités ou la dernière version d'une convention collective.
2. **Le risque juridique et RGPD** : Il est crucial de distinguer la **Base de connaissances** (les lois et conventions de l'Open Data *SocialGouv/kali-data*, qui sont publiques) des **Données Utilisateur**. Si la loi est publique, les questions des gestionnaires RH (pouvant contenir des noms ou salaires d'employés) ou les contrats uploadés ne doivent **jamais** fuiter vers des APIs d'IA publiques qui s'entraînent sur ces données.

La réponse architecturale à ce double défi (Fiabilité + Sécurité des données) est la méthode **RAG (Retrieval-Augmented Generation)**, couplée à des environnements d'IA d'entreprise (Azure OpenAI, dont les contrats interdisent l'entraînement sur les données clients) ou des LLMs locaux.

---

## L'Architecture du Pipeline RAG Next.js & Supabase

```
┌─────────────────────────┐
│ Open Data KALI & Scrape │
│ (SocialGouv kali-data)  │
└────────────┬────────────┘
             │
             ▼  1. Pipeline ETL & Chunking (LangChain)
┌─────────────────────────┐
│ RecursiveCharacterSplit │ (Markdown, Chunk size: 1000, Overlap: 200)
└────────────┬────────────┘
             │
             ▼  2. Vector Embeddings
┌─────────────────────────┐
│ Azure OpenAI Embeddings │ ──► Stockage Vectoriel : Supabase pgvector (vector(1536))
└────────────┬────────────┘
             │
             ▼  3. Recherche Sémantique & Inférence Edge
┌─────────────────────────┐
│ Requête Utilisateur     │ ──► RPC `match_collective_conventions` ──► LLM (Azure GPT-4o-mini / Perplexity)
└────────────┬────────────┘
```

---

## 1. La clé du succès : Le découpage intelligent et la Traçabilité (UUIDv5)

Découper un texte de loi au kilomètre est dangereux. Pour garantir l'intégrité, le pipeline télécharge les conventions intégrales au format Markdown directement depuis **SocialGouv/kali-data**.

Stratégie adoptée avec **LangChain** (`RecursiveCharacterTextSplitter`) :
```javascript
const splitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
    chunkSize: 1000,
    chunkOverlap: 200
})
```
- **Découpage structurel** : Respecte les titres et paragraphes Markdown.
- **Zéro Hallucination via UUIDv5** : Chaque fragment généré reçoit un `uuidv5` unique, généré déterministement à partir de l'ID KALI du texte et des numéros de lignes (`from` à `to`). Si la loi ne change pas, le hash reste identique.

---

## 2. Inférence Haute Performance : LCEL & Edge Streaming

Au lieu d'un backend lourd, le moteur de chat tourne sur le **Edge Runtime** de Vercel/Next.js en utilisant le **LangChain Expression Language (LCEL)** :

1. **Reformulation Contextuelle** : Une chaîne `condenseQuestionPrompt` reformule la question de l'utilisateur en fonction de l'historique du chat pour créer une requête autonome.
2. **Recherche Vectorielle (Supabase)** : La requête interroge Supabase via une fonction PL/pgSQL (`match_collective_conventions_integrals`) qui filtre les embeddings par similarité cosinus.
3. **Multi-LLM & Streaming** : Le contexte est injecté dans des modèles distants (Azure OpenAI, ou **Perplexity AI `llama-3.1-sonar`**) via le Vercel AI SDK.
4. **Citation des sources en temps réel** : Les métadonnées des documents sources (Numéro d'article, IDCC) sont sérialisées et injectées directement dans les en-têtes HTTP de la réponse streamée (`x-sources`).

---

## 3. Résultats & Enseignements

1. **Zéro hallucination réglementaire** : En forçant le LLM à s'appuyer uniquement sur le chunk traçable et en affichant la source (headers `x-sources`), l'utilisateur valide instantanément l'article du Code du Travail.
2. **Architecture Serverless Réactive** : L'utilisation de Next.js Edge Functions garantit une latence minime et une scalabilité instantanée.
3. **Maintien à jour Open Data** : La synchronisation via l'API GitHub de SocialGouv assure d'interroger le droit positif applicable du jour.

---

## 🚀 La Feuille de Route RAG 2.0 : Comment aller plus loin ?

Pour faire passer un moteur RAG d'un prototype interne à un système de niveau industriel (*RegTech grade*), voici les 7 améliorations architecturales clés :

### 1. 🔍 Recherche Hybride (Dense + Sparse Retrieval avec BM25)
La recherche vectorielle pure (denses embeddings) comprend le sens général mais peine sur les requêtes exactes (ex: numéros d'articles de loi `"Art. L1237-13"`, taux de cotisations `"0,45%"` ou acronymes `"URSSAF"`). La solution consiste à combiner **Vector Search (Dense)** + **BM25 Keyword Search (Sparse)** via l'algorithme **Reciprocal Rank Fusion (RRF)**.

### 2. 🎯 Ré-ordonnancement par Cross-Encoder (Reranking)
Passer les 20 meilleurs chunks trouvés dans un **Cross-Encoder Reranker (ex: BGE-Reranker ou Cohere Rerank)**. Le Cross-Encoder réévalue la pertinence exacte entre la question et chaque chunk pour ne transmettre au LLM que les 3 à 4 chunks les plus pertinents à 99%.

### 3. 🕸️ GraphRAG : Graphe de Connaissances Juridique
Créer un **Graphe de Connaissances (Neo4j)** reliant les entités réglementaires (Lois, Décrets, Conventions collectives). Le système peut ainsi naviguer dans la **hiérarchie des normes** pour vérifier si un accord d'entreprise déroge ou prime sur une convention collective.

### 4. ⏳ Time-Aware RAG : Versioning Réglementaire & Temporalité
En droit du travail et paie, les taux et décrets changent constamment. L'ajout de métadonnées temporelles strictes (`valid_from`, `valid_until`) dans chaque chunk permet d'interroger le bot selon la période ciblée (ex: *"Quel était le taux de cotisation en décembre 2023 vs aujourd'hui ?"*).

### 5. 🔄 Agentic RAG & Auto-Correction (Self-RAG avec LangGraph)
Orchestrer une boucle de validation agentique avec **LangGraph** :
- **Agent Évaluateur** : Valide si les chunks extraits répondent réellement à la demande.
- **Agent Reformulateur** : Si la recherche échoue, il reformule automatiquement la requête sous un autre angle juridique.
- **Agent Anti-Hallucination** : Vérifie la concordance stricte entre le contexte et la réponse avant de l'afficher.

### 6. 📊 Évaluation Continue & Garde-Fous (Framework RAGAS)
Mettre en place un benchmark automatisé avec **RAGAS** pour mesurer 4 métriques en continu lors de chaque mise à jour : *Faithfulness* (absence d'hallucination), *Answer Relevance*, *Context Recall* et *Context Precision*.

### 7. 📄 Parsing Multimodal des Tableaux Complexe (LlamaParse)
Les grilles salariales et barèmes sous forme de tableaux fusionnés dans les PDFs sont mal extraits par les outils texte classiques. L'utilisation d'outils comme **LlamaParse** ou **Unstructured** convertit les tableaux en structures Markdown/HTML matricielles fidèles.

---

## Conclusion

Le RAG n'est pas un simple "plugin" que l'on ajoute sur une application. C'est un **processus d'ingénierie de données minutieux**. En combinant l'ingestion souveraine initiale avec les briques du RAG 2.0 (Recherche Hybride, Reranking, GraphRAG et Agentic RAG), on transforme un assistant documentaire en une véritable plateforme d'intelligence juridique d'entreprise.

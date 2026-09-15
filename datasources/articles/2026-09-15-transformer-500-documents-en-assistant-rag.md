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

Dans des domaines fortement réglementés (droit du travail, paie, conventions collectives), les documents métier s'accumulent sous des formats hétérogènes (PDF, Word, Markdown, JSON). Les LLMs généralistes échouent souvent car :
1. Ils manquent de contexte métier spécifique et d'actualisation réglementaire.
2. Envoyer des documents confidentiels RH sur des APIs cloud publiques pose un risque juridique de fuite de données.

La réponse architecturale à ce problème est la méthode **RAG (Retrieval-Augmented Generation)**.

---

## L'Architecture du Pipeline RAG Souverain

```
┌─────────────────────────┐
│ Documents Métier        │
│ (PDF, Word, Markdown)   │
└────────────┬────────────┘
             │
             ▼  1. Pipeline ETL & Chunking
┌─────────────────────────┐
│ RecursiveCharacterSplit │ (Taille de chunk: 800, Overlap: 150)
└────────────┬────────────┘
             │
             ▼  2. Vector Embeddings
┌─────────────────────────┐
│ BGE-Large / FastEmbed   │ ──► Stockage dans Base Vectorielle (PostgreSQL pgvector / Supabase)
└────────────┬────────────┘
             │
             ▼  3. Recherche Sémantique & Inférence
┌─────────────────────────┐
│ Requête Utilisateur     │ ──► Cosine Similarity Search ──► Injection de Contexte ──► LLM Local (Ollama/LiteLLM)
└────────────┬────────────┘
```

---

## 1. La clé du succès : Le découpage intelligent (Chunking)

Découper un document de 200 pages n'est pas trivial. Un découpage naïf au kilomètre peut couper un article de loi ou une formule de calcul au milieu d'une phrase essentielle.

Stratégie adoptée avec **LangChain** :
```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=150,
    separators=["\n\n", "\n", " ", ""]
)
chunks = text_splitter.split_documents(documents)
```
- **Overlap de 150 caractères** : Garantit qu'aucune continuité de sens ne soit perdue entre deux blocs consécutifs.
- **Métadonnées associées** : Chaque chunk conserve son numéro de page, le nom du document source et sa catégorie réglementaire.

---

## 2. Inférence Souveraine avec Ollama et LiteLLM

Pour garantir qu'aucune donnée RH confidentielle ne quitte le réseau de l'entreprise :
- **Ollama** héberge le modèle LLM localement (ex: Llama3 ou Mistral).
- **LiteLLM** fait office de passerelle unifiée, permettant d'interchanger dynamiquement les modèles selon la complexité de la question sans modifier le code applicatif.

Exemple d'interrogation du modèle avec contexte injecté :
```python
system_prompt = f"""
Tu es un assistant expert en droit du travail et gestion de paie.
Réponds à la question de l'utilisateur uniquement en t'appuyant sur le contexte fourni ci-dessous.
Si le contexte ne permet pas de répondre, indique-le clairement sans inventer.

CONTEXTE FOURNI :
{context_retrieved}
"""
```

---

## 3. Résultats & Enseignements

1. **Zéro hallucination réglementaire** : En forçant le modèle à citer le document source et l'article exact, l'utilisateur valide instantanément la réponse.
2. **Gain de temps de recherche** : Réduction de 80 % du temps de recherche documentaire pour les gestionnaires.
3. **Confidentialité absolue** : L'intégralité du traitement vectoriel et de l'inférence reste sur l'infrastructure contrôlée par l'entreprise.

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

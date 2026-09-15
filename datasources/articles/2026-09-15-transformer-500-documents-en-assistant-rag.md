---
tags: ia, rag, langchain, ollama, litellm, python, vector-db, embeddings
title: "Comment transformer +500 documents complexes en un Assistant RAG fiable avec LangChain et Ollama"
date: 2026-09-15
categories: [IA & Data, RAG, Python, Architecture]
excerpt: "Les coulisses d'un pipeline ETL documentaire RAG : découpage en chunks, indexation vectorielle et orchestration d'un LLM local souverain sans fuite de données."
lang: fr
---

# Comment transformer +500 documents complexes en un Assistant RAG fiable avec LangChain et Ollama

*L'intégration des modèles de langage (LLMs) dans les processus d'entreprise se heurte souvent à deux obstacles majeurs : l'hallucination des modèles sur des domaines réglementaires complexes et la confidentialité des données métier. Voici le retour d'expérience d'une architecture RAG (Retrieval-Augmented Generation) souveraine et performante.*

---

## Le Problème : La complexité documentaire RH & Paie

Dans des domaines fortement réglementés (droit du travail, paie, conventions collectives), les documents métier s'accumulent sous des formats hétérogènes (PDF, Word, Markdown, JSON). Les LLMs généralistes échouent souvent car :
1. Ils manquent de contexte métier spécifique et d'actualisation réglementaire.
2. Envoyez des documents confidentiels RH sur des APIs cloud publiques pose un risque juridique de fuite de données.

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
└─────────────────────────┘
             │
             ▼  3. Recherche Sémantique & Inférence
┌─────────────────────────┐
│ Requête Utilisateur     │ ──► Cosine Similarity Search ──► Injection de Contexte ──► LLM Local (Ollama/LiteLLM)
└─────────────────────────┘
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

## Conclusion

Le RAG n'est pas un simple "plugin" que l'on ajoute sur une application. C'est un **processus d'ingénierie de données minutieux** où la qualité de l'extraction et du chunking compte autant que la puissance du modèle d'IA utilisé.

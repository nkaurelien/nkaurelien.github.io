---
tags: umami, analytics, rgpd, privacy, docker, ntfy, automation, devops
title: "Analytics RGPD & Privacy-First avec Umami : Mesurer l'audience et automatiser les rapports Push"
date: 2026-09-16
categories: [DevOps, Analytics, Self-hosted, RGPD]
excerpt: "Comment déployer Umami Analytics en auto-hébergement pour une mesure d'audience respectueuse de la vie privée sans bandeau de cookies, et automatiser les bilans quotidiens sur mobile via l'API REST et Ntfy."
lang: fr
---

# Analytics RGPD & Privacy-First avec Umami : Mesurer l'audience et automatiser les rapports Push

*Face aux restrictions du RGPD et à la lourdeur des scripts de suivi traditionnels (Google Analytics), Umami s'impose comme la solution d'analyse d'audience web auto-hébergée idéale : privacy-first, sans cookies, ultra-rapide et totalement automatisable via son API REST.*

---

## Pourquoi Réinventer l'Analyse d'Audience Web ?

Les outils d'analytique classiques posent trois problèmes majeurs aux développeurs et éditeurs de sites web modernes :
1. **La lourdeur du consentement (Bandeaux Cookies)** : Le dépôt de cookies de suivi nécessite un bandeau de consentement explicite, dégradant l'expérience utilisateur et provoquant un taux d'abandon élevé.
2. **L'empreinte sur les performances (Web Vitals)** : Les scripts tiers volumineux dégradent les indicateurs Core Web Vitals (notamment le LCP et le INP).
3. **La souveraineté des données** : Exporter les données de navigation de ses utilisateurs vers des serveurs tiers contrevient aux principes de sobriété et de respect de la vie privée.

**Umami** résout l'ensemble de ces contraintes :
- **Sans cookies** : Anonymisation des visiteurs basée sur un hachage combinant l'adresse IP et le User-Agent avec un sel (salt) tournant toutes les 24 heures.
- **Ultra-léger** : Un script JS de moins de 2 KB chargé de manière asynchrone sans bloquer le rendu.
- **Conforme RGPD / CNIL de manière native** : Aucune donnée personnelle n'est stockée en clair.

---

## 1. Déploiement Docker & Reverse Proxy Traefik

Umami s'appuie sur une stack très sobre composée d'une application Node.js et d'une base de données PostgreSQL.

### Fichier `docker-compose.yml`

```yaml
services:
  umami-db:
    image: postgres:17-alpine
    container_name: umami-db
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: ${UMAMI_DB_PASSWORD}
    volumes:
      - umami-db-data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - internal-net

  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    container_name: umami
    environment:
      DATABASE_URL: postgresql://umami:${UMAMI_DB_PASSWORD}@umami-db:5432/umami
      DATABASE_TYPE: postgresql
      APP_SECRET: ${UMAMI_APP_SECRET}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.umami.rule=Host(`analytics.yourdomain.tld`)"
      - "traefik.http.routers.umami.entrypoints=websecure"
      - "traefik.http.routers.umami.tls.certresolver=letsencrypt"
      - "traefik.http.services.umami.loadbalancer.server.port=3000"
    restart: unless-stopped
    depends_on:
      - umami-db
    networks:
      - internal-net
      - proxy-net

networks:
  proxy-net:
    external: true
  internal-net:
    internal: true

volumes:
  umami-db-data:
```

---

## 2. Intégration dans Next.js / HTML

L'intégration d'Umami dans un site Next.js (App Router) se fait très simplement avec le composant `<Script>` de Next.js :

```jsx
// src/app/[locale]/layout.js
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <Script
          src="https://analytics.yourdomain.tld/script.js"
          data-website-id="c6b12a34-5678-90ab-cdef-1234567890ab"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 3. Automation : Génération et Envoi de Rapports Quotidiens (Node.js + Ntfy)

L'un des plus grands avantages d'Umami par rapport à des solutions fermées est son **API REST v2**. Il est très simple d'écrire un petit script Node.js qui s'authentifie, extrait les statistiques des dernières 24 heures et envoie un rapport formaté sur mobile via **Ntfy**.

### Le Script de Rapport Automatisé (`umami-ntfy-report.js`)

```javascript
/**
 * Script d'automatisation des rapports Umami vers ntfy.
 * Supporte la collecte Daily (24h) et Weekly (7d).
 */

const UMAMI_URL = (process.env.UMAMI_URL || 'https://analytics.yourdomain.tld').replace(/\/$/, '');
const USERNAME = process.env.UMAMI_USER || process.env.UMAMI_USERNAME || 'admin';
const PASSWORD = process.env.UMAMI_PASSWORD;
const NTFY_TOPIC_URL = process.env.NTFY_TOPIC_URL;

// Support dynamique des modes daily (24h) ou weekly (7d)
const args = process.argv.slice(2);
const isDaily = args.includes('--daily') || args.includes('daily') || process.env.PERIOD === 'daily' || process.env.PERIOD === '24h';
const days = isDaily ? 1 : 7;
const periodLabel = days === 1 ? 'dernières 24h' : `${days} derniers jours`;

async function getAuthToken() {
  const res = await fetch(`${UMAMI_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD })
  });
  if (!res.ok) throw new Error(`Échec connexion Umami API: ${res.status}`);
  const data = await res.json();
  return data.token;
}

async function getWebsites(token) {
  const res = await fetch(`${UMAMI_URL}/api/websites`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return Array.isArray(data) ? data : (data.data || []);
}

async function fetchStats(token, websiteId, startAt, endAt) {
  const res = await fetch(`${UMAMI_URL}/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

async function run() {
  try {
    const token = await getAuthToken();
    const websites = await getWebsites(token);

    const endAt = Date.now();
    const startAt = endAt - days * 24 * 60 * 60 * 1000;

    let reportLines = [`📊 Rapport Audience Umami (${periodLabel})`, `───────────────────────────`];

    for (const site of websites) {
      const stats = await fetchStats(token, site.id, startAt, endAt);
      reportLines.push(
        `\n🌐 Site : ${site.name} (${site.domain})`,
        `👥 Visiteurs uniques : ${stats.visitors?.value || 0}`,
        `📄 Vues de pages    : ${stats.pageviews?.value || 0}`,
        `⏱️ Sessions        : ${stats.visits?.value || 0}`,
        `🚪 Taux de rebond   : ${stats.bounces?.value || 0}`
      );
    }

    await fetch(NTFY_TOPIC_URL, {
      method: 'POST',
      headers: {
        'Title': `📈 Audience Portfolio (${periodLabel})`,
        'Tags': 'bar_chart,rocket'
      },
      body: reportLines.join('\n')
    });

    console.log(`✅ Rapport Umami (${periodLabel}) envoyé avec succès.`);
  } catch (err) {
    console.error('❌ Erreur lors du rapport Umami:', err);
  }
}

run();
```

---

## 4. Orchestration avec Ofelia Scheduler

Pour exécuter ce script tous les matins à 08h00 sans cron système, nous ajoutons une tâche déclarative dans **Ofelia** :

```ini
[job-run "umami-daily-report"]
schedule = 0 0 8 * * *
image = node:20-alpine
command = node /scripts/umami-ntfy-report.js
volume = /opt/scripts:/scripts
environment = UMAMI_URL=https://analytics.yourdomain.tld,NTFY_TOPIC_URL=https://ntfy.yourdomain.tld/secret-topic
```

---

## Synthèse & Avantages

| Critère | Google Analytics 4 | Matomo | Umami Analytics |
|---|---|---|---|
| **Bandeau Cookies obligatoire** | Oui | Dépend du réglage | **Non** (100% exempté) |
| **Poids du script** | ~45 KB | ~22 KB | **< 2 KB** |
| **Souveraineté des données** | Serveurs US | Auto-hébergé | **Auto-hébergé** |
| **API REST native** | Complexe / Quotas | Complexe | **Simple & Rapide** |
| **Ressources mémoire** | Cloud SaaS | Élevées (PHP/MySQL) | **Très faibles (Node/Go)** |

Grâce à ce pipeline, les métriques d'audience restent entièrement sous notre contrôle, légères à charger et directement consultables chaque matin sur smartphone.

---
tags: docker, traefik, ofelia, umami, ntfy, self-hosted, devops, homelab, automation
title: "Architecture Homelab Docker : Reverse Proxy Traefik v3, Planificateur Ofelia, Analytics Umami & Push Ntfy"
date: 2026-09-16
categories: [DevOps, Self-hosted, Architecture, Homelab]
excerpt: "Comment orchestrer un environnement auto-hébergé résilient et automatisé : routage TLS automatique avec Traefik v3, tâches planifiées avec Ofelia, mesure d'audience Umami et notifications Push temps réel via Ntfy."
lang: fr
---

# Architecture Homelab Docker : Reverse Proxy Traefik v3, Planificateur Ofelia, Analytics Umami & Push Ntfy

*La gestion d'une infrastructure auto-hébergée (Homelab ou micro-cloud souverain) exige le même niveau de rigueur qu'une plateforme de production entreprise : sécurité TLS automatisée, orchestration déclarative, surveillance proactive et automatisation des tâches de maintenance.*

> 💻 **Code source** : l'implémentation de cette stack (Compose et rôles Ansible pour Traefik, Ofelia, Umami et Ntfy, dont le script `umami-ntfy-report.js`) est disponible dans le dépôt [nkaurelien/docker-examples](https://github.com/nkaurelien/docker-examples).
>
> ```bash
> git clone https://github.com/nkaurelien/docker-examples.git
> cd docker-examples
> ```

---

## Le Défi de l'Auto-hébergement Moderne

Maintenir une dizaine ou une centaine de services conteneurisés en auto-hébergement implique rapidement plusieurs défis majeurs :
1. **La gestion des certificats et des domaines** : générer et renouveler les certificats SSL/TLS automatiquement sans interruption de service.
2. **L'isolation et la sécurité du réseau** : restreindre l'exposition des ports et empêcher qu'un conteneur compromis n'accède au reste du réseau local.
3. **L'automation des tâches répétitives** : backups de bases de données, rapports d'audience analytique (Umami), audits de vulnérabilités, sans dépendre du `cron` système de la machine hôte.
4. **Le suivi en temps réel** : recevoir des notifications immédiates sur mobile/desktop en cas d'incident, de déploiement ou de rapport quotidien.

Pour répondre à ces enjeux, nous avons conçu et déployé une architecture modulaire basée sur 4 composants clés open-source : **Traefik v3**, **Ofelia**, **Umami Analytics** et **Ntfy**.

---

## Les 4 Piliers de la Stack

### 1. Traefik v3 : Reverse Proxy & Edge Router Déclaratif
Contrairement aux proxys traditionnels nécessitant des rechargements de configuration manuels (`nginx -s reload`), Traefik écoute la socket Docker `/var/run/docker.sock` en lecture seule et découvre dynamiquement les services grâce aux **Docker Labels**.

Points forts :
- **Renouvellement ACME / Let's Encrypt automatique** via le challenge TLS-ALPN-01 ou HTTP-01.
- **Routage fin par sous-domaine et SNI** (`Host(...)`).
- **Support natif de HTTP/3, WebSockets et gRPC**.

### 2. Ofelia : Le Planificateur de Tâches pour Docker
Plutôt que de polluer le `crontab` de l'hôte avec des dépendances Python ou Node.js, **Ofelia** est un job scheduler léger écrit en Go qui s'exécute lui-même dans Docker.

Il permet de déclarer des jobs directement dans la configuration d'un conteneur ou dans un fichier `config.ini` :
- `job-exec` : exécute une commande à l'intérieur d'un conteneur déjà en cours d'exécution.
- `job-run` : démarre un conteneur éphémère pour exécuter un script puis le détruit.
- **Notifications intégrées** en cas de succès ou d'échec du job.

### 3. Umami : Analytics Privacy-First & Sovereign Data
Pour suivre le trafic et l'engagement des utilisateurs sans compromettre la confidentialité ni utiliser de cookies de suivi, **Umami Analytics** offre un panneau d'analyse temps réel ultra-léger (< 2 KB de JS), conforme au RGPD sans besoin de bandeau de consentement.

- Hachage anonymisé des adresses IP avec sel quotidien tournant.
- API REST v2 complète pour l'extraction de métriques et l'intégration dans des scripts automatiques.
- Base de données PostgreSQL dédiée.

### 4. Ntfy : Bus de Notifications Push Simple et Décentralisé
**Ntfy** (prononcé *notify*) est un service de notifications HTTP basé sur un modèle souscription/publication. Il permet d'envoyer des alertes Push sur téléphone Android/iOS ou navigateur via une simple requête `curl` ou un appel d'API.

- **Zero lock-in** : format de message standard (JSON / Markdown).
- **Consommation de ressources minimale**.
- **Canal secret de topics** pour garantir qu'aucun message sensible ne soit lisible sans autorisation.

---

## Vue d'Ensemble de l'Architecture

```
                           ┌────────────────────────┐
                           │   Internet / clients   │
                           └───────────┬────────────┘
                                       │ HTTPS (443)
                                       ▼
                         ┌────────────────────────────┐
                         │   Traefik v3 Edge Router   │
                         │ (Certificats ACME / TLS)   │
                         └──────┬──────────────┬──────┘
                                │              │
            ┌───────────────────┘              └────────────────────┐
            ▼                                                       ▼
┌────────────────────────┐                             ┌────────────────────────┐
│  Umami (Analytics)     │                             │  Ntfy (Push Service)   │
│  PostgreSQL 17 Backend │                             │  Alertes & Workflows   │
└────────────────────────┘                             └───────────▲────────────┘
                                                                   │
                                                       Rapports &  │ Push HTTP
                                                       Alertes     │
                                                        ┌──────────┴─────────────┐
                                                        │     Ofelia Scheduler   │
                                                        │  Scripts Umami & Backup│
                                                        └────────────────────────┘
```

---

## Exemples de Configurations Déclaratives

### Traefik v3 (`docker-compose.yml`)

```yaml
services:
  traefik:
    image: traefik:v3.2
    container_name: traefik
    restart: unless-stopped
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entryPoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "443:443"
    volumes:
      - "./letsencrypt:/letsencrypt"
      # Recommandation DevSecOps : privilégier l'utilisation d'un Docker Socket Proxy (ex. tecnativa/docker-socket-proxy) 
      # pour isoler la socket daemon de Docker et restreindre les endpoints d'API accessibles
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
    networks:
      - proxy-net

networks:
  proxy-net:
    external: true
```

### Ofelia Job Scheduler (`config.ini`)

```ini
[job-exec "umami-daily-report"]
schedule = 0 0 8 * * *
container = node-runner
command = node /scripts/umami-ntfy-report.js
on_failure = mail, ntfy

[job-run "postgres-backup"]
schedule = 0 3 * * *
image = postgres:17-alpine
command = pg_dump -h postgres -U umami umami_db
```

### Script d'Alerte Ntfy (`umami-ntfy-report.js`)

```javascript
/**
 * Script d'automatisation des rapports Umami vers ntfy.
 * S'authentifie sur l'API Umami v2, récupère les statistiques (vues, visiteurs, sessions, rebonds),
 * et transmet la synthèse via notification push ntfy.
 * 
 * Support des modes :
 *   - Daily  (24h) : node umami-ntfy-report.js --daily  (ou PERIOD=daily)
 *   - Weekly (7d)  : node umami-ntfy-report.js --weekly (ou PERIOD=weekly)
 */

const UMAMI_URL = (process.env.UMAMI_URL || 'https://analytics.yourdomain.tld').replace(/\/$/, '');
const UMAMI_USERNAME = process.env.UMAMI_USERNAME || 'admin';
const UMAMI_PASSWORD = process.env.UMAMI_PASSWORD;
const NTFY_TOPIC_URL = process.env.NTFY_TOPIC_URL;

const args = process.argv.slice(2);
const isDaily = args.includes('--daily') || args.includes('daily') || process.env.PERIOD === 'daily' || process.env.PERIOD === '24h';
const days = isDaily ? 1 : 7;
const periodLabel = days === 1 ? 'dernières 24h' : `${days} derniers jours`;

async function loginUmami() {
  const res = await fetch(`${UMAMI_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: UMAMI_USERNAME, password: UMAMI_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Échec connexion Umami API: ${res.status}`);
  const data = await res.json();
  return data.token;
}

async function getWebsites(token) {
  const res = await fetch(`${UMAMI_URL}/api/websites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return Array.isArray(data) ? data : (data.data || []);
}

async function getStats(token, websiteId, startAt, endAt) {
  const res = await fetch(`${UMAMI_URL}/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function run() {
  try {
    const token = await loginUmami();
    const websites = await getWebsites(token);
    const endAt = Date.now();
    const startAt = endAt - days * 24 * 60 * 60 * 1000;

    let reportLines = [`📈 Bilan des ${periodLabel} :`];

    for (const site of websites) {
      const stats = await getStats(token, site.id, startAt, endAt);
      reportLines.push(
        `\n🌐 Site: ${site.name} (${site.domain})`,
        `• Pages vues : ${stats.pageviews?.value || 0}`,
        `• Visiteurs uniques : ${stats.visitors?.value || 0}`,
        `• Sessions : ${stats.visits?.value || 0}`
      );
    }

    await fetch(NTFY_TOPIC_URL, {
      method: 'POST',
      headers: {
        Title: `Rapport Analytics Umami (${periodLabel})`,
        Priority: 'default',
        Tags: 'bar_chart,chart_with_upwards_trend'
      },
      body: reportLines.join('\n')
    });
  } catch (err) {
    console.error('Erreur rapport Umami:', err);
  }
}

run();
```

---

## Sécurité & Bonnes Pratiques DevSecOps

1. **Principe du Moindre Privilège & Docker Socket Proxy** : Monter la socket Docker en lecture seule (`:ro`) est la première étape. Pour une sécurité optimale, il est fortement recommandé d'utiliser un **Docker Socket Proxy** (ex. `tecnativa/docker-socket-proxy`) afin de filtrer strictement les appels d'API Docker autorisés (ex: `CONTAINERS=1`, `EVENTS=1`) et bloquer tout accès direct au socket hôte.
2. **Isolation Réseau** : Les bases de données (PostgreSQL) et les bus de messages internes restent cloisonnés dans des réseaux Docker privés non exposés sur l'hôte.
3. **Secret Management avec Passbolt** : Les jetons d'accès, mots de passe de bases de données et topics secrets Ntfy sont stockés de manière centralisée dans un gestionnaire de secrets (Passbolt) et injectés via variables d'environnement au déploiement.
4. **Analyse Continue de Sécurité (Snyk)** : Tous les fichiers Compose et les images de base sont scannés par **Snyk** pour détecter d'éventuelles vulnérabilités de dépendances ou failles IaC (Infrastructure as Code).

---

## Bilan

Cette architecture offre un équilibre parfait entre **autonomie**, **sécurité** et **faible empreinte mémoire**. Elle permet de faire tourner une infrastructure complète de services métiers, d'automatisation et de monitoring sur des ressources modestes tout en maintenant une réactivité maximale via notifications Push.

### Code source
- [Traefik (Compose)](https://github.com/nkaurelien/docker-examples/tree/main/compose/01-infrastructure/traefik)
- [Ofelia (Compose)](https://github.com/nkaurelien/docker-examples/tree/main/compose/01-infrastructure/ofelia)
- [Umami (Compose)](https://github.com/nkaurelien/docker-examples/tree/main/compose/05-monitoring-reporting/umami)
- [Ntfy (Compose)](https://github.com/nkaurelien/docker-examples/tree/main/compose/18-communication/notification/ntfy)
- [Rôles Ansible (traefik, ofelia, umami, ntfy)](https://github.com/nkaurelien/docker-examples/tree/main/ansible/roles)

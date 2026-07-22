---
title: "Du tunnel SSH au mesh VPN : n'exposer aucun service interne, sans sacrifier l'accès ops"
date: 2026-07-22
categories: [DevOps, Sécurité, WireGuard, Self-hosted]
excerpt: "Comment une stack auto-hébergée peut rester joignable pour l'équipe avec une surface d'attaque quasi nulle — et quand Tailscale ou Headscale deviennent le bon investissement."
# medium: <url après migration manuelle>
---

# Du tunnel SSH au mesh VPN : n'exposer aucun service interne, sans sacrifier l'accès ops

*Comment une stack auto-hébergée (MinIO, Grafana, Consul, bases de données…) peut rester joignable pour l'équipe tout en présentant une surface d'attaque quasi nulle — et à quel moment Tailscale ou Headscale deviennent le bon investissement.*

---

## Le problème

Toute plateforme finit par accumuler des services « internes » : un stockage objet S3 pour les archives, un Grafana pour les dashboards, un Portainer, une console d'admin de base de données… Aucun n'a vocation à être public, mais l'équipe doit pouvoir y accéder — pour déboguer, administrer, vérifier un déploiement.

La solution paresseuse — binder ces services sur `0.0.0.0` et compter sur un mot de passe — transforme chaque service en cible : scans permanents, CVE sur la console d'admin, credentials rejoués. Pour des plateformes soumises à des exigences réglementaires (données de santé, données financières), c'est simplement inacceptable.

## Le pattern : loopback-first

La règle que nous appliquons est simple :

> **Un service interne n'écoute que sur `127.0.0.1`. Ce qui doit être public passe par le reverse proxy TLS. Tout le reste s'atteint par un canal authentifié.**

Concrètement, dans un `docker-compose` :

```yaml
services:
  minio:
    image: minio/minio:latest
    ports:
      - "127.0.0.1:9100:9000"   # API S3 — loopback uniquement
      - "127.0.0.1:9101:9001"   # console web — loopback uniquement
    networks:
      - internal-network
```

Trois chemins d'accès, trois usages :

| Chemin | Usage | Exemple |
|---|---|---|
| **Réseau docker interne** | Flux applicatifs entre conteneurs du même hôte | le backend parle à `http://minio:9000` — jamais de tunnel, jamais de loopback |
| **Reverse proxy TLS (nginx)** | Ce qui est réellement public | les portails utilisateurs, l'IdP |
| **Tunnel SSH** | L'accès humain/ops aux services loopback | la console MinIO, Grafana |

Ce découpage a une vertu sous-estimée : il **documente l'intention**. Un port en loopback dit « interne » ; un vhost nginx dit « public assumé ». Plus d'ambiguïté.

## Les tunnels SSH, industrialisés

Un tunnel SSH ad hoc, c'est bien ; le même tunnel encodé dans le Makefile, c'est mieux — reproductible, documenté, découvrable :

```makefile
# L'API du service est en loopback sur la cible : le tunnel expose localement
# 9100 (API S3) et 9101 (console web). Ctrl+C pour fermer.
storage-tunnel: ## Tunnel SSH vers le stockage objet (9100 API + 9101 console)
	@echo "🔒 Tunnel — API http://127.0.0.1:9100 · console http://127.0.0.1:9101"
	ssh -N -L 9100:127.0.0.1:9100 -L 9101:127.0.0.1:9101 ops@203.0.113.10
```

Le développeur qui veut tester le job d'archivage S3 depuis son poste ouvre le tunnel et pointe sa config :

```bash
make storage-tunnel &
export ARCHIVE_S3_ENDPOINT_URL=http://127.0.0.1:9100
```

Petits raffinements qui changent la vie :

- **une cible par service et par environnement** (`storage-tunnel-staging`, `storage-tunnel-prod`) — le port local est stable, la config aussi ;
- l'`@echo` qui affiche les URLs prêtes à copier ;
- le commentaire qui rappelle le chemin *applicatif* (`http://minio:9000` via le réseau docker) pour éviter que quelqu'un ne fasse transiter un flux de prod par un tunnel.

## Où le modèle craque

Ce système est honnête et robuste, mais il a quatre limites structurelles :

1. **C'est manuel.** Un tunnel par service, des ports locaux à ne pas faire collisionner, des sessions à ouvrir/fermer.
2. **Le LAN est une frontière.** Notre machine de test physique n'est joignable que depuis le réseau local — en déplacement, c'est mort.
3. **Le port 22 reste public.** Tout le modèle repose sur SSH… donc sshd est exposé à Internet, avec son lot de brute-force et l'hypothèque d'un 0-day.
4. **Les ACLs sont grossières.** Une clé SSH donne accès à la machine, pas à *un service pour une personne*. Révoquer l'accès d'un poste compromis = rotation de clés.

## Le cran d'après : mesh VPN (Tailscale / Headscale)

Un mesh WireGuard répond exactement à ces quatre points :

| Besoin | Tunnels SSH | Mesh VPN |
|---|---|---|
| Services loopback | 1 tunnel/service, manuel | Accès direct par nom (`http://testbox:9100` via MagicDNS) |
| Machine hors LAN | ❌ | ✅ P2P WireGuard, de partout |
| SSH public | Port 22 exposé | **Fermable publiquement** — SSH uniquement via le tailnet |
| Accès par personne | Clés partagées | ACLs par utilisateur/machine, révocation instantanée |
| Trafic inter-sites | TLS public | WireGuard bout-en-bout, IPs stables |

Deux choses que le mesh **ne remplace pas** — et c'est important de le dire :

- les flux applicatifs intra-hôte : le réseau docker reste le bon canal, un VPN n'a rien à y faire ;
- le reverse proxy TLS pour les services réellement publics.

### La question de conformité (le vrai point de décision)

Avec Tailscale (SaaS), le plan de **données** est chiffré de pair à pair — votre trafic ne transite pas chez l'éditeur (les relais DERP de secours ne voient que du chiffré). Mais le plan de **contrôle** — coordination, identités, distribution des clés — est un service américain. Aucune donnée métier n'y circule, et c'est défendable dans la plupart des contextes.

Si votre posture de souveraineté l'exclut (hébergement de données de santé, secteur public…), l'alternative existe : **Headscale**, implémentation open-source du serveur de coordination, auto-hébergée, compatible avec les clients Tailscale officiels. Vous la déployez comme n'importe quel service central — chez nous, ce serait un rôle Ansible de plus sur le pattern existant.

### Trajectoire recommandée

1. **Ne rien changer tant que les tunnels suffisent.** Le make-tunnel industrialisé couvre 90 % des besoins d'une petite équipe.
2. **POC minimal** quand un déclencheur apparaît (besoin d'accès distant à une machine du LAN, volonté de fermer SSH public) : un tailnet gratuit, la machine de test + deux postes, valider MagicDNS et une ACL.
3. **Trancher SaaS vs Headscale** sur le seul critère qui compte : la souveraineté du plan de contrôle.
4. **Étendre à la prod** en dernier, et fermer le port 22 public — c'est là que le gain sécurité devient tangible.

## En résumé

- **Loopback-first** : un service interne n'écoute jamais sur une interface publique.
- **Trois canaux, trois usages** : réseau docker (applicatif), reverse proxy TLS (public), tunnel authentifié (ops).
- **Industrialisez les tunnels** dans le Makefile avant de rêver plus grand.
- **Le mesh VPN n'est pas un gadget** : il ferme SSH public et apporte des ACLs par personne — mais c'est un investissement à déclencher sur un besoin réel, pas par mode.
- **Souveraineté** : Tailscale si le plan de contrôle SaaS passe votre grille de conformité, Headscale sinon.

---

*Écrit à partir d'un cas réel : la mise en place d'un stockage objet MinIO auto-hébergé pour l'archivage réglementaire (rétention longue durée, scellement HMAC) d'une plateforme de santé, où chaque choix d'exposition réseau se lit à travers la grille HDS/RGPD.*

---
tags: nginx, openresty, docker, systemd, crowdsec, reverse-proxy, devsecops, ubuntu
title: "Passer de nginx à OpenResty en conteneur sans réécrire ses vhosts"
date: 2026-10-14
categories: [Infrastructure, DevSecOps, Self-hosted]
excerpt: "Le nginx d'Ubuntu 22.04 n'a pas de Lua, et le bouncer CrowdSec en a besoin. Retour d'expérience sur une bascule vers OpenResty en conteneur qui relit la configuration existante telle quelle, garde `systemctl reload nginx` fonctionnel… et sur le piège systemd qui m'a fait comparer le même serveur avant et après."
lang: fr
---

# Passer de nginx à OpenResty en conteneur sans réécrire ses vhosts

*Ajouter un WAF devant une plateforme de santé, c'est d'abord une question de frontal : celui en place ne sait pas exécuter le code du WAF. Remplacer le frontal sans toucher à cinquante vhosts, sans casser les outils qui l'appellent, et en sachant revenir en arrière en une commande : c'était le cahier des charges.*

---

## 🩺 Le contexte

Une plateforme de santé (données sensibles, hébergement HDS) tourne sur deux serveurs Ubuntu 22.04 et un serveur de recette. Devant les applications, un nginx installé par paquet termine le TLS et fait du `proxy_pass` vers des conteneurs publiés sur `127.0.0.1`.

L'objectif : poser **CrowdSec** devant, avec un blocage **requête par requête** (bannissement d'IP et WAF AppSec). Pour ça, CrowdSec fournit un *bouncer* écrit en Lua, qui s'exécute dans le frontal. Problème : le nginx 1.18 d'Ubuntu 22.04 **n'a pas de module Lua**.

| Option | Ce qu'elle implique |
|---|---|
| Recompiler nginx avec `lua-nginx-module` | Maintenir un build maison, suivre les CVE à la main |
| Traefik + plugin CrowdSec | **Tout réécrire** : vhosts, certificats, en-têtes, règles particulières |
| WAF Cloudflare | Le CDN **déchiffre le trafic** : des données de santé en clair chez un tiers. Écarté |
| **OpenResty** | Un nginx avec LuaJIT intégré, qui **relit la configuration nginx telle quelle** |

OpenResty s'est imposé : même syntaxe, mêmes directives, mêmes fichiers.

---

## 📦 Paquet ou conteneur ?

J'ai d'abord testé le **paquet officiel** d'openresty.org. Il fonctionne, mais il n'est publié que pour certaines versions d'Ubuntu (jammy, noble) et **pas pour Ubuntu 26.04**, déjà présente sur le serveur de recette. Lier le frontal à la version de l'OS, c'est se condamner à attendre l'éditeur à chaque montée de version.

Le choix final : **OpenResty en conteneur**, indépendant de la version d'OS, avec l'image comme seule chose à mettre à jour.

---

## 🛠️ Le conteneur : ne rien changer aux vhosts

```yaml
# /opt/openresty/compose.yml
services:
  openresty:
    image: registry.example.com/infra/openresty:1.27-bookworm
    container_name: openresty
    network_mode: host          # les proxy_pass 127.0.0.1:port restent valides
    restart: unless-stopped
    stop_signal: SIGQUIT        # arrêt gracieux (voir plus bas)
    volumes:
      - /etc/nginx:/etc/nginx:ro
      - /etc/ssl:/etc/ssl:ro
      - /var/log/nginx:/var/log/nginx
      - /etc/localtime:/etc/localtime:ro   # sinon les logs sont en UTC
    command: ["openresty", "-g", "daemon off;", "-c", "/etc/nginx/nginx.conf"]
```

Quatre décisions :

- **`network_mode: host`** : aucun vhost ne change. Un `proxy_pass http://127.0.0.1:8081` pointe toujours au même endroit, et l'IP client réelle arrive sans bricolage.
- **`/etc/nginx` en lecture seule** : la configuration reste gérée par Ansible sur l'hôte, comme avant. Le conteneur ne peut pas la modifier.
- **`/etc/localtime`** : oublié la première fois, résultat des journaux décalés de deux heures par rapport au reste du système.
- **`/var/log/nginx`** monté : fail2ban, CrowdSec et les scripts d'analyse lisent les mêmes fichiers qu'avant.

Seule retouche de configuration : `listen 443 ssl http2;` est **déprécié depuis nginx 1.25**, et OpenResty récent le signale à chaque test. La forme actuelle :

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name app.example.com;
    # ...
}
```

---

## 🔌 Garder `systemctl reload nginx` et `nginx -t`

Le vrai sujet n'est pas le conteneur, c'est **tout ce qui appelle nginx** : le renouvellement des certificats, les playbooks Ansible (`notify: reload nginx`), les habitudes de l'équipe. L'idée : leur présenter exactement la même interface.

### Une unité systemd qui pilote le conteneur

Une unité placée dans `/etc/systemd/system/` est **prioritaire** sur celle du paquet (`/lib/systemd/system/`). On garde donc le nom `nginx.service` :

```ini
# /etc/systemd/system/nginx.service
[Unit]
Description=OpenResty (conteneur) en lieu et place de nginx
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/openresty
ExecStartPre=/usr/bin/docker compose run --rm openresty openresty -t -c /etc/nginx/nginx.conf
ExecStart=/usr/bin/docker compose up -d
ExecReload=/usr/bin/docker exec openresty openresty -t -c /etc/nginx/nginx.conf
ExecReload=/usr/bin/docker exec openresty openresty -s reload
ExecStop=/usr/local/sbin/openresty-stop

[Install]
WantedBy=multi-user.target
```

`ExecReload` teste d'abord la configuration : un vhost cassé fait échouer le `reload` au lieu de couper le service.

### Un faux binaire `nginx`

```bash
#!/bin/sh
# /usr/local/sbin/nginx — délègue au conteneur
if docker ps --format '{{.Names}}' | grep -qx openresty; then
  exec docker exec openresty openresty -c /etc/nginx/nginx.conf "$@"
else
  cd /opt/openresty && exec docker compose run --rm --no-deps openresty \
    openresty -c /etc/nginx/nginx.conf "$@"
fi
```

`/usr/local/sbin` passe avant `/usr/sbin` dans le `PATH` : `nginx -t` teste la configuration **dans le conteneur**, même s'il est arrêté. Le hook de renouvellement de certificats et les handlers Ansible fonctionnent sans modification.

---

## 🪤 Piège 1 : systemd a adopté l'ancien nginx

Première version : une unité `openresty.service` avec `Alias=nginx.service`, et le paquet nginx simplement arrêté… en théorie.

`systemctl is-active nginx` répondait `active`, la recette avant/après était **identique**, tout semblait parfait. Sauf que le processus nginx d'Ubuntu n'avait jamais été arrêté : même `PIDFile` (`/run/nginx.pid`), systemd l'a **adopté** comme le processus principal de l'unité. OpenResty, lui, ne démarrait pas (port 443 occupé) et l'unité affichait quand même « active ». **Ma recette comparait l'ancien serveur avec lui-même.**

La leçon : ne jamais demander à systemd qui sert le trafic. Demander au noyau.

```bash
# Qui écoute réellement sur 443 ?
ss -ltnp 'sport = :443'
# LISTEN 0 511 0.0.0.0:443 ... users:(("nginx",pid=21544,fd=7))
# (le processus s'appelle « nginx » dans les deux cas : insuffisant)

# Quel binaire ?
readlink /proc/21544/exe
# /usr/local/openresty/nginx/sbin/nginx

# Dans quel cgroup ? (un conteneur Docker apparaît en docker-<id>.scope)
cat /proc/21544/cgroup
```

Depuis, la bascule suit un ordre strict : `systemctl stop nginx` **avec l'unité du paquet**, vérification que plus rien n'écoute sur 80/443, installation de l'unité de remplacement, `systemctl daemon-reload`, démarrage, puis ces trois vérifications.

---

## 🪤 Piège 2 : l'arrêt gracieux qui dure 40 secondes

`SIGQUIT` demande à nginx un arrêt gracieux : il **ferme immédiatement les ports d'écoute**, puis attend la fin des connexions en cours. Avec des WebSocket ouverts (visio, capteurs), « la fin des connexions » n'arrive jamais vraiment : environ **40 secondes** pendant lesquelles plus rien n'accepte de nouvelles connexions, et le redémarrage attend.

La solution : une escalade bornée.

```bash
#!/bin/sh
# /usr/local/sbin/openresty-stop
docker kill --signal=QUIT openresty 2>/dev/null || exit 0
for sig in TERM KILL; do
  for i in 1 2 3 4 5; do
    docker ps -q -f name=^openresty$ | grep -q . || exit 0
    sleep 1
  done
  docker kill --signal=$sig openresty 2>/dev/null
done
docker rm -f openresty >/dev/null 2>&1 || true
```

QUIT, puis TERM après 5 s, puis KILL après 5 s : au pire 10 secondes, et les clients WebSocket se reconnectent d'eux-mêmes. Pour un simple changement de vhost, on n'arrête de toute façon jamais : `reload` suffit.

---

## 🔍 Choisir l'image : mesurer avant de choisir

Les images officielles OpenResty existent en plusieurs variantes. Scan Trivy de chacune :

| Variante | Taille | Critiques | Élevées | Moyennes | Remarque |
|---|---|---|---|---|---|
| noble (Ubuntu 24.04) | 288 Mo | 5 | 144 | 3 431 | |
| **bookworm (Debian 12)** | **38 Mo** | **4** | **54** | **109** | |
| alpine | 64 Mo | 0 | 2 | 6 | pas d'utilisateur `www-data` |
| alpine-apk | — | — | — | — | basée sur Alpine 3.18, en fin de vie |

Alpine gagne sur le papier, mais la configuration existante tourne sous `user www-data;` et les fichiers de logs appartiennent à l'uid **33**. Sur Alpine, cet utilisateur n'existe pas (et l'uid 33 n'y désigne pas la même chose) : il faudrait toucher la configuration et les permissions, précisément ce qu'on voulait éviter. **Bookworm** est le compromis : petite, peu de vulnérabilités, `www-data` en uid 33.

Dernier détail d'exploitation : les téléchargements anonymes depuis Docker Hub sont limités, et un `docker compose pull` sur plusieurs serveurs a fini en **429 Too Many Requests**. L'image est désormais **recopiée dans notre propre registre** (`registry.example.com/infra/openresty`) à une version figée, et c'est cette copie que les serveurs tirent.

---

## ✅ La recette : un diff vide

Pour comparer avant/après sans dépendre du DNS, un script interroge **chaque `server_name`** de la configuration directement sur le serveur, avec `curl --resolve` :

```bash
#!/bin/sh
# snapshot.sh <fichier_sortie>
grep -rhoP '^\s*server_name\s+\K[^;]+' /etc/nginx/sites-enabled \
  | tr ' ' '\n' | grep -v '^_$' | sort -u | while read -r host; do
    h=$(curl -sk -o /dev/null -D - --max-time 10 \
          --resolve "$host:443:127.0.0.1" "https://$host/")
    code=$(printf '%s' "$h" | awk 'NR==1{print $2}')
    pp=$(printf '%s' "$h" | grep -i '^permissions-policy:' | tr -d '\r')
    xfo=$(printf '%s' "$h" | grep -iE '^(x-frame-options|content-security-policy):' | sort | tr -d '\r')
    printf '%s\t%s\t%s\t%s\n' "$host" "$code" "$pp" "$xfo"
done > "$1"
```

```bash
./snapshot.sh /tmp/avant.tsv
# bascule : arrêt du paquet, installation de l'unité, daemon-reload, start
./snapshot.sh /tmp/apres.tsv
diff /tmp/avant.tsv /tmp/apres.tsv && echo "identique"
```

Codes HTTP et en-têtes de sécurité (Permissions-Policy, X-Frame-Options, CSP) : **diff vide** sur les trois serveurs, soit 17, 54 et 56 noms. À condition, bien sûr, d'avoir vérifié **qui** répondait (piège 1).

Le retour arrière tient en une commande, qui supprime l'unité de remplacement et relance le paquet toujours installé :

```bash
systemctl stop nginx && rm /etc/systemd/system/nginx.service /usr/local/sbin/nginx \
  && systemctl daemon-reload && systemctl start nginx
```

---

## 🎓 Leçons

1. **Changer de moteur, pas de configuration** : OpenResty relit les vhosts nginx tels quels. C'est ce qui rend la bascule réversible.
2. **Préserver l'interface** (`nginx.service`, `nginx -t`, `reload`) plutôt que de corriger chaque outil qui l'appelle.
3. **Demander au noyau, pas à systemd** : `ss -ltnp`, `/proc/<pid>/exe` et le cgroup disent qui sert vraiment. Un `active` ne prouve rien.
4. **Un arrêt gracieux doit être borné** dès qu'il y a des connexions longues.
5. **Mesurer les images** avant de choisir, et vérifier les uid que la configuration suppose.
6. **Une recette avant/après automatisée** sur tous les `server_name` vaut mieux que trois pages testées à la main.

La suite — CrowdSec, le WAF AppSec et ce qu'ils bloquent réellement — fait l'objet d'un [article dédié](/blog/crowdsec-appsec-openresty-retour-experience).

---
tags: systemd, linux, devsecops, security, sysadmin, hardening, authelia, devops
title: "Démystifier et Sécuriser les Systemd Unit Files : Le Guide DevSecOps du Service Hardening"
date: 2026-09-16
categories: [DevSecOps, Linux, Sécurité, Système]
excerpt: "Explication ligne par ligne de l'Unit File Authelia : comprendre le cycle de vie des services Linux (WantedBy, UMask), et maîtriser les directives d'isolation (NoNewPrivileges, SystemCallFilter, ProtectHome, PrivateUsers)."
lang: fr
---

# Démystifier et Sécuriser les Systemd Unit Files : Le Guide DevSecOps du Service Hardening

*Sur les systèmes Linux modernes, `systemd` n'est pas seulement un gestionnaire d'initialisation de processus (`PID 1`) : c'est un bac à sable (sandbox) de sécurité native. Analyser et comprendre les directives d'un Unit File de production permet de sécuriser n'importe quel service Linux contre les vulnérabilités et l'escalade de privilèges.*

---

## L'Unit File de Production Authelia

Voici l'exemple réel et complet d'un Unit File pour le serveur d'authentification et d'autorisation **Authelia** :

```ini
# SPDX-FileCopyrightText: 2026 Authelia
#
# SPDX-License-Identifier: Apache-2.0

[Unit]
Description=Authelia authentication and authorization server
Documentation=https://www.authelia.com
After=multi-user.target

[Service]
User=authelia
Group=authelia
UMask=027
Environment=AUTHELIA_SERVER_DISABLE_HEALTHCHECK=true
ExecStart=/usr/bin/authelia --config /etc/authelia/configuration.yml
SyslogIdentifier=authelia
CapabilityBoundingSet=
NoNewPrivileges=yes
RestrictNamespaces=yes
ProtectHome=true
PrivateDevices=yes
PrivateUsers=yes
ProtectControlGroups=yes
ProtectKernelModules=yes
ProtectKernelTunables=yes
SystemCallArchitectures=native
SystemCallFilter=@system-service
SystemCallErrorNumber=EPERM

[Install]
WantedBy=multi-user.target
```

---

## Explication Ligne par Ligne de l'Unit File

### 1. En-tête & Métadonnées (`[Unit]`)

- **`# SPDX-FileCopyrightText: 2026 Authelia` / `# SPDX-License-Identifier: Apache-2.0`** : Commentaires de conformité standardisés SPDX indiquant le droit d'auteur et la licence Open Source (Apache 2.0).
- **`[Unit]`** : Section définissant les informations générales et l'ordonnancement du service.
- **`Description=Authelia authentication and authorization server`** : Nom lisible affiché dans les commandes `systemctl status` et les logs système.
- **`Documentation=https://www.authelia.com`** : Lien vers la documentation officielle, accessible directement via `systemctl help authelia`.
- **`After=multi-user.target`** : Indique à systemd de n'exécuter ce service qu'**après** l'initialisation complète de la cible multi-utilisateur (réseau et services de base prêts).

---

### 2. Exécution & Environnement Applicatif (`[Service]`)

- **`User=authelia` / `Group=authelia`** : Exécute le processus avec un compte et un groupe système dédiés non-root, limitant les droits d'accès au strict minimum.
- **`UMask=027`** : Définit le masque de permission de création de fichiers. Tout fichier créé par le service aura les permissions `0750` (`rwxr-x---` pour les dossiers) ou `0640` (`rw-r-----` pour les fichiers). Les utilisateurs non membres du groupe `authelia` ne pourront ni lire ni écrire ces fichiers.
- **`Environment=AUTHELIA_SERVER_DISABLE_HEALTHCHECK=true`** : Injecte la variable d'environnement désactivant le check de santé interne (utile lorsque la santé est gérée par un orchestrateur externe).
- **`ExecStart=/usr/bin/authelia --config /etc/authelia/configuration.yml`** : Commande exacte exécutée pour démarrer l'application avec son fichier de configuration.
- **`SyslogIdentifier=authelia`** : Définit l'étiquette (tag) utilisée dans `journalctl` et Syslog pour filtrer facilement les logs (`journalctl -u authelia` ou `journalctl -t authelia`).

---

### 3. Isolation & Hardening de Sécurité (Sandbox Systemd)

- **`CapabilityBoundingSet=`** (vide) : Supprime l'intégralité des privilèges d'administration Linux (*Linux Capabilities* comme `CAP_SYS_ADMIN`, `CAP_NET_ADMIN` ou `CAP_SETUID`). Même si le binaire essayait d'effectuer des opérations privilégiées, le noyau les lui refuserait.
- **`NoNewPrivileges=yes`** : Empêche le processus et tous ses enfants d'obtenir de nouveaux privilèges via les bits `setuid` / `setgid` (par exemple via `sudo` ou `su`).
- **`RestrictNamespaces=yes`** : Interdit la création de nouveaux namespaces Linux (IPC, net, mount, pid, user, uts), empêchant le service de créer ses propres conteneurs ou environnements chrootés.
- **`ProtectHome=true`** : Rend les répertoires `/home`, `/root` et `/run/user` totalement inaccessibles et invisibles (masqués comme répertoires vides) pour Authelia.
- **`PrivateDevices=yes`** : Isole le système de fichiers `/dev`. Le service ne voit qu'un ensemble minimal de pseudo-périphériques virtuels (`/dev/null`, `/dev/zero`, `/dev/urandom`), mais aucun disque dur physique (`/dev/sda`) ou périphérique d'entrée/sortie.
- **`PrivateUsers=yes`** : Active l'isolation des espaces de noms d'utilisateurs. Le processus est exécuté dans son propre espace d'identifiants (UID/GID), empêchant tout chevauchement avec les utilisateurs réels de l'hôte.
- **`ProtectControlGroups=yes`** : Monte l'arborescence `/sys/fs/cgroup` en lecture seule pour empêcher le service de modifier les limites de ressources du système.
- **`ProtectKernelModules=yes`** : Empêche le chargement ou le déchargement dynamique de modules du noyau Linux (`modprobe`).
- **`ProtectKernelTunables=yes`** : Rend les variables du noyau dans `/proc/sys`, `/sys` et `/proc/sysrq-trigger` en lecture seule.
- **`SystemCallArchitectures=native`** : Autorise uniquement les appels système (*syscalls*) correspondant à l'architecture native du processeur (ex: x86_64), bloquant ainsi les vecteurs d'attaque basés sur la compatibilité 32-bit.
- **`SystemCallFilter=@system-service`** : Applique un filtre strict de syscalls en n'autorisant que le sous-ensemble sécurisé prédéfini pour les services système normaux.
- **`SystemCallErrorNumber=EPERM`** : Si Authelia tente d'exécuter un syscall bloqué par le filtre, le noyau renvoie une erreur `EPERM` (Permission Denied) plutôt que de tuer brutalement le processus avec un signal `SIGSYS`.

---

### 4. Activation au Démarrage (`[Install]`)

- **`[Install]`** : Section lue par `systemctl enable` et `systemctl disable`.
- **`WantedBy=multi-user.target`** : Crée un lien symbolique dans `/etc/systemd/system/multi-user.target.wants/authelia.service`. Au démarrage du serveur, dès que le système atteint le niveau de fonctionnement multi-utilisateur (`multi-user.target`), Authelia est automatiquement démarré.

---

## Approfondissement : Les Notions Sous-Jacentes Essentielles

### 1. Qu'est-ce qu'un `cgroup` (Control Group) ?

Les **`cgroups`** (Control Groups) sont une fonctionnalité clé du noyau Linux (implémentée par Google puis intégrée au noyau Linux 2.6.24 en 2008). 

Leur rôle est d'organiser les processus en groupes hiérarchiques afin d'appliquer des **limites**, du **comptage** et de la **priorisation** sur les ressources matérielles du serveur.

#### Tableau des Contrôleurs (Subsystems) cgroup & Directives Systemd

| Contrôleur / Subsystem | Ressources gérées & Paramètres cgroup v2 | Directive Systemd équivalente |
|---|---|---|
| **`memory`** | Limite et mesure l'utilisation de la RAM et du Swap (`memory.max`, `memory.high`, `memory.swap.max`). | `MemoryMax=`, `MemoryHigh=`, `MemorySwapMax=` |
| **`cpu`** | Alloue les quotas de temps processeur (`cpu.max`, `cpu.weight`). Ex: `200000 100000` = 2 coeurs CPU max. | `CPUQuota=`, `CPUWeight=` |
| **`cpuset`** | Restreint l'exécution aux seuls coeurs physiques spécifiés (`cpuset.cpus` ex: `0-3`) et noeuds NUMA. | `AllowedCPUs=` |
| **`io` / `blkio`** | Limite les débits de lecture/écriture disque en octets/s ou IOPS (`io.max`, `io.weight`). | `IOReadBandwidthMax=`, `IOWriteBandwidthMax=` |
| **`pids`** | Plafonne le nombre maximal de processus/threads autorisés (`pids.max`), empêchant les *fork bombs*. | `TasksMax=` |
| **`devices`** | Contrôle l'accès aux cartes et périphériques `/dev` (via filtres eBPF en cgroup v2). | `DeviceAllow=`, `PrivateDevices=yes` |
| **`freezer`** | Permet de geler (`cgroup.freeze=1`) ou dégeler instantanément un groupe de processus. | `systemctl freeze <service>` |

> **Différence Majeure : cgroup v1 vs cgroup v2 (Unified Hierarchy)**  
> En **cgroup v1**, chaque contrôleur avait son propre arbre séparé dans `/sys/fs/cgroup/cpu`, `/sys/fs/cgroup/memory`. En **cgroup v2** (le standard moderne utilisé par Docker 20.10+ et les distributions récentes), il n'existe qu'une **seule hiérarchie unifiée** sous `/sys/fs/cgroup/`. Cela permet la gestion globale des OOM-Killers au niveau de l'ensemble d'un groupe et simplifie l'intégration avec systemd et eBPF.

> **Pourquoi `ProtectControlGroups=yes` dans Systemd ?**  
> L'interface de gestion des cgroups est exposée sous forme de système de fichiers virtuel dans `/sys/fs/cgroup`. Si un service compromis pouvait modifier son propre cgroup dans `/sys/fs/cgroup`, il pourrait lever ses propres limites mémoire/CPU ou altérer les limites des autres services hôtes. La directive `ProtectControlGroups=yes` monte `/sys/fs/cgroup` en **lecture seule** pour le service.

---

### 2. Dépendances Systemd : `Wants` vs `WantedBy`, `Requires` vs `RequiredBy`

L'une des plus grandes confusions dans systemd réside dans la gestion des dépendances entre services.

#### A. `Wants=` vs `WantedBy=`
- **`Wants=` (Dépendance Souhaitée - Sens Direct)** : Placée dans la section `[Unit]` d'un service A.
  - Exemple dans A : `Wants=B.service`.
  - Signification : *"Quand je démarre A, essaie aussi de démarrer B. Mais si B échoue ou est introuvable, A continue de démarrer normalement."* (Dépendance **faible**).
- **`WantedBy=` (Dépendance Inversée au Boot)** : Placée dans la section `[Install]` d'un service B.
  - Exemple dans B : `WantedBy=multi-user.target`.
  - Signification : *"Quand l'administrateur exécute `systemctl enable B`, crée un lien symbolique dans `/etc/systemd/system/multi-user.target.wants/B.service` pour que la target `multi-user.target` m'inclue dans ses `Wants` au démarrage du système."*

#### B. `Requires=` vs `RequiredBy=`
- **`Requires=` (Dépendance Stricte - Sens Direct)** : Placée dans la section `[Unit]` d'un service A.
  - Exemple dans A : `Requires=postgresql.service`.
  - Signification : *"A a absolument besoin de PostgreSQL. Si PostgreSQL échoue ou s'arrête, A refuse de démarrer ou s'arrête immédiatement."* (Dépendance **forte**).
- **`RequiredBy=` (Dépendance Stricte Inversée)** : Placée dans la section `[Install]` d'un service B.
  - Exemple dans B : `RequiredBy=web-app.service`.
  - Signification : *"Quand on active B via `systemctl enable`, enregistre-moi comme dépendance vitale indispensable pour `web-app`."*

#### C. Résumé Comparatif

| Directive | Section | Type d'exigence | Effet en cas d'échec de la dépendance |
|---|---|---|---|
| **`Wants=B`** | `[Unit]` | Souhaitée (Soft direct) | Le service principal **démarre quand même** |
| **`Requires=B`** | `[Unit]` | Stricte (Hard direct) | Le service principal **échoue et s'arrête** |
| **`WantedBy=T`** | `[Install]` | Activation au boot (Soft inverse) | Crée un symlink dans `T.wants/` lors de `systemctl enable` |
| **`RequiredBy=T`** | `[Install]` | Dépendance requise au boot (Hard inverse) | Crée un symlink dans `T.requires/` lors de `systemctl enable` |

> **Note importante (`After=` vs `Wants=`)** :  
> `Wants=` et `Requires=` gèrent **la dépendance d'activation** (qui doit démarrer avec qui).  
#### D. Les Différentes Valeurs de `WantedBy=` (Targets Systemd)

| Valeur `WantedBy=` | Ancien Runlevel | Usage & Description | Exemple d'Unité |
|---|---|---|---|
| **`multi-user.target`** *(Standard Serveur)* | **Runlevel 3** | Mode multi-utilisateur en ligne de commande (sans GUI). C'est la valeur standard pour 95% des démons, serveurs web, bases de données et conteneurs Docker. | `sshd.service`, `nginx.service`, `authelia.service` |
| **`graphical.target`** | **Runlevel 5** | Mode multi-utilisateur avec interface graphique (GUI). Inclut `multi-user.target` + le serveur X11/Wayland et le Display Manager. | `gdm.service`, `kiosk.service` |
| **`default.target`** | Alias dynamique | Lien symbolique pointant vers la cible par défaut du système (`multi-user.target` sur serveur, `graphical.target` sur PC). | Démons applicatifs génériques |
| **`basic.target`** | Runlevel 1/2 | État système de base disponible très tôt (après montage des disques de base et sockets système). | Service de détection matérielle (`udev`), logging |
| **`sysinit.target`** | Early init | Initialisation système ultra-précoce (montage `/proc`, `/sys`, chiffrement LUKS, swap). | Services de clés de chiffrement |
| **`timers.target`** | Event Timer | Cible regroupant toutes les tâches planifiées (`.timer`). | `certbot.timer`, `backup.timer`, `apt-daily.timer` |
| **`sockets.target`** | Socket Activation | Cible regroupant les activations par socket réseau/IPC (`.socket`). | `docker.socket`, `sshd.socket` |
| **`network-online.target`** | Réseau actif | Garantit que la pile réseau est chargée ET qu'une adresse IP valide est obtenue. | Clients VPN, démons NTP/Chrony |
| **`sleep.target`** | Énergie | Déclenché avant la mise en veille ou l'hibernation du système. | Scripts de verrouillage d'écran, mise en pause de conteneurs |

---

## Audit DevSecOps : Mesurer la Sécurité avec `systemd-analyze security`

L'un des outils les plus puissants (et sous-estimés) intégrés nativement dans systemd est le sous-système **`systemd-analyze security`**. 

Il agit comme un **scanner de sécurité IaC (Infrastructure as Code) automatisé et immédiat**, analysant plus de 40 directives de bac à sable pour attribuer à chaque service une note globale d'exposition (**Overall Exposure Level**).

---

### 1. Auditer l'Ensemble des Services du Serveur

Pour obtenir une vue d'ensemble du niveau d'exposition de tous les services actifs sur votre machine Linux :

```bash
systemd-analyze security
```

#### Exemple de Résultat Globale :

```
UNIT                        ATTESTATION  EXPOSURE   PREDICATE
authelia.service                 ✓         1.2 OK   OK (LOW)
traefik.service                  ✓         1.8 OK   OK (LOW)
nginx.service                    ✗         6.5      MEDIUM
unsecured-app.service            ✗         9.2      UNSAFE
```

---

### 2. Auditer un Service Spécifique en Détail

Pour inspecter précisément un service (par exemple `authelia.service`) et comprendre chaque point de contrôle :

```bash
systemd-analyze security authelia.service
```

#### Exemple de Rapport Détaillé :

```
  NAME                             DESCRIPTION                                        EXPOSURE
✔ CapabilityBoundingSet=           Service has no special capabilities                0.0
✔ DeviceAllow=                     Service has no device access                       0.0
✔ NoNewPrivileges=                 Service process cannot gain new privileges         0.0
✔ PrivateDevices=                  Service has no access to physical devices          0.0
✔ PrivateNetwork=                  Service has no network access                      0.0
✔ PrivateTmp=                      Service has private /tmp                           0.0
✔ PrivateUsers=                    Service user namespaces isolated                   0.0
✔ ProtectControlGroups=            Service cannot write to cgroups                    0.0
✔ ProtectHome=                     Service home directories are hidden                0.0
✔ ProtectKernelModules=            Service cannot load kernel modules                 0.0
✔ ProtectKernelTunables=           Service cannot write to /proc/sys                  0.0
✔ SystemCallFilter=                Service system calls are restricted                0.0

→ Overall exposure level value: 1.2 OK (EXPOSURE: LOW)
```

---

### 3. Comprendre l'Échelle de Notation Systemd

| Score d'Exposition | Niveau de Risque | Signification DevSecOps | Action Recommandée |
|---|---|---|---|
| **0.0 - 2.5** | 🟢 **OK (LOW)** | Service parfaitement isolé et restreint (Sandbox optimal). | Prêt pour la production. |
| **2.6 - 5.0** | 🟡 **MEDIUM** | Bonnes pratiques partielles, mais quelques accès sensibles restent ouverts. | Recommandé d'ajouter `ProtectHome=` et `NoNewPrivileges=`. |
| **5.1 - 7.5** | 🟠 **EXPOSED** | Service peu isolé, pouvant accéder au système de fichiers ou au noyau. | Audit urgent requis. |
| **7.6 - 10.0** | 🔴 **UNSAFE** | Aucune restriction de sécurité. En cas de faille, compromission totale. | À corriger immédiatement avec les directives de hardening. |

---

> 💡 **Le conseil DevSecOps** : Intégrez `systemd-analyze security <service>` dans vos pipelines CI/CD ou scripts d'audit Ansible pour bloquer tout déploiement d'un Unit File dont le score d'exposition dépasse 2.5.


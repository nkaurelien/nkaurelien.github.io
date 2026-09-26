---
tags: kubernetes, kustomize, devops, gitops, ci-cd, multi-environment, architecture
title: "Gérer ses Environnements Kubernetes sans Duplication : Le Pattern Kustomize Base & Overlays"
date: 2026-09-20
categories: [Kubernetes, DevOps, GitOps, Kustomize, Architecture]
excerpt: "Comment déployer une application sur Dev, Staging et Production avec zéro duplication de manifestes en exploitant Kustomize nativement intégré à kubectl."
lang: fr
---

# Gérer ses Environnements Kubernetes sans Duplication : Le Pattern Kustomize Base & Overlays

*Comment décliner une même application sur plusieurs environnements (Dev, Staging, Production) sans jamais copier-coller des dizaines de fichiers YAML ? Analyse du pattern Base & Overlays avec Kustomize, l'outil déclaratif intégré nativement dans `kubectl`.*

> 💻 **Code source** : l'application `fastapi-boilerplate` avec sa `base/` et ses overlays `dev`, `staging` et `prod` est disponible dans le dépôt [nkaurelien/docker-examples](https://github.com/nkaurelien/docker-examples/tree/main/kubernetes/apps/fastapi-boilerplate).
>
> ```bash
> git clone https://github.com/nkaurelien/docker-examples.git
> cd docker-examples/kubernetes/apps/fastapi-boilerplate
> ```

---

## 🛑 Le Piège Classique : La Duplication des Manifestes

Lorsqu'on débute sur Kubernetes, le premier réflexe consiste souvent à dupliquer les dossiers :
```text
kubernetes/
├── dev/     (deployment.yaml, service.yaml, ingress.yaml)
├── staging/ (deployment.yaml, service.yaml, ingress.yaml)
└── prod/    (deployment.yaml, service.yaml, ingress.yaml)
```

### Pourquoi cette approche échoue rapidement ?
1. **La dérive de configuration (Configuration Drift)** : Une modification apportée aux sondes de santé (`livenessProbe`) ou aux ressources CPU en Dev est oubliée lors du passage en Prod.
2. **Maintenance fastidieuse** : Modifier un port ou une variable d'environnement impose d'éditer 3 à 5 fichiers identiques.
3. **Complexité inutile de Helm** : Pour de simples microservices internes, écrire des templates Helm complets (`_helpers.tpl`, `values.yaml`) est souvent trop verbeux et difficile à relire.

---

## 🧱 La Solution Kustomize : Base & Overlays

Intégré directement dans le client officiel (`kubectl -k`), **Kustomize** fonctionne par **héritage et surcharge déclarative** :

```text
fastapi-boilerplate/
├── base/                     # Le socle commun (partagé, neutre et immuable)
│   ├── deployment.yaml       # Template de pod, sondes de santé, ports
│   ├── service.yaml          # Service ClusterIP
│   ├── ingress.yaml          # Template Ingress Traefik + TLS
│   └── kustomization.yaml    # Déclaration du socle
│
└── overlays/                 # Les déclinaisons par environnement
    ├── dev/
    │   └── kustomization.yaml  # Namespace dev, 1 réplique, DEBUG=true, api-dev.domaine
    ├── staging/
    │   └── kustomization.yaml  # Namespace staging, 1 réplique, api-stage.domaine
    └── prod/
        └── kustomization.yaml  # Namespace prod, 2 répliques HA, DEBUG=false, api.domaine
```

---

## 🔍 Comment ça fonctionne en pratique ?

### 1. Le Socle Commun (`base/deployment.yaml`)
Il définit la structure générique sans spécifier de domaine ni de nombre de répliques final :
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fastapi-api
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: api
          image: ghcr.io/kamitbrains/fastapi-api:latest
          ports:
            - containerPort: 8000
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8000
```

> L'image est ici celle construite par notre propre `Dockerfile` (Uvicorn direct, un
> worker par pod). On évite délibérément `tiangolo/uvicorn-gunicorn-fastapi` : Gunicorn
> y lance un worker par cœur CPU à l'intérieur du pod et entre en conflit avec le
> scaling horizontal du HPA — c'est le sujet d'un [article dédié](/fr/blog/fastapi-kubernetes-anti-pattern-gunicorn-uv/).

### 2. La Surcharge pour la Production (`overlays/prod/kustomization.yaml`)
Kustomize hérite du dossier `base/` et applique uniquement les deltas nécessaires :

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: prod

resources:
  - ../../base

# Surcharge du nombre de répliques pour la Haute Disponibilité (HA)
replicas:
  - name: fastapi-api
    count: 2

# Injection déclarative des variables spécifiques à la production
configMapGenerator:
  - name: api-config
    literals:
      - ENVIRONMENT=production
      - DEBUG=false

# Patch ciblé du domaine de l'Ingress
patches:
  - target:
      kind: Ingress
      name: fastapi-api
    patch: |-
      - op: replace
        path: /spec/rules/0/host
        value: api.kamitbrains-minipc-k1.lab
```

> ⚠️ **Le piège `behavior: merge`.** On lit souvent `behavior: merge` sur le
> `configMapGenerator` d'un overlay. Ce mode suppose qu'un ConfigMap du même nom existe
> **déjà dans la base**. Ici la base n'en génère aucun, et Kustomize s'arrête net :
> ```
> error: merging from generator ...: ConfigMap "api-config" does not exist;
> cannot merge or replace
> ```
> Sans `behavior`, l'overlay crée le ConfigMap — c'est bien ce qu'on veut. Réservez
> `merge` aux cas où la base fournit réellement des valeurs communes à compléter.

---

## ⚡ Déploiement en Une Seule Commande

Grâce à l'intégration native du drapeau `-k`, aucun outil supplémentaire n'est requis :

```bash
# Déployer uniquement le Dev :
kubectl apply -k overlays/dev

# Déployer uniquement la Production :
kubectl apply -k overlays/prod

# Visualiser le YAML final généré sans l'appliquer (Dry-Run / Debug) :
kubectl kustomize overlays/prod
```

---

## ⚖️ Tableau Récapitulatif : Kustomize vs Helm

| Critère | Kustomize | Helm |
| :--- | :--- | :--- |
| **Philosophie** | **Patching déclaratif (Overlay)** | **Moteur de template (Go templating)** |
| **Complexité syntaxique** | **100% YAML standard valide** | Fichiers `.tpl` avec logique conditionnelle (`if/else`) |
| **Installation requise** | **Zéro** (intégré dans `kubectl`) | Binaire client `helm` + chart repositories |
| **Gestion des releases** | GitOps natif (ArgoCD / Flux) | Gestionnaire de versions et rollback (`helm history`) |
| **Idéal pour** | Vos **propres microservices internes** et variations d'environnements | Déployer des **logiciels tiers communautaires complexes** (Rancher, Prometheus Stack, cert-manager) |

L'adoption de Kustomize offre l'équilibre parfait entre sobriété, lisibilité GitOps et zéro duplication.

### Code source
- [fastapi-boilerplate (base + overlays)](https://github.com/nkaurelien/docker-examples/tree/main/kubernetes/apps/fastapi-boilerplate)

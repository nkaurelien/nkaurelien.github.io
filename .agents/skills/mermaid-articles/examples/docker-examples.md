# Mermaid Diagram Examples for Docker & Kubernetes Architectures

This reference guide provides copy-paste ready Mermaid flowchart templates for Docker, Kubernetes, and CI/CD articles.

---

## 1. Homelab Reverse Proxy Architecture (Docker Compose + Traefik)

```mermaid
flowchart TD
    Client["Client / Navigateur"] -->|"HTTPS :443"| Traefik["Traefik Reverse Proxy<br/>(Traefik v3)"]
    Traefik -.->|"HTTP :3000"| Umami["Umami Analytics<br/>(Node.js / Privacy)"]
    Traefik -.->|"HTTP :80"| Ofelia["Ofelia Scheduler<br/>(Cron Job Container)"]
    Umami -->|"TCP :5432"| Postgres[("PostgreSQL 16<br/>Database")]
```

---

## 2. Docker Rootless Image Build (Kaniko + Kubernetes Job)

```mermaid
flowchart TD
    Git["Dépôt Git / Code Source"] -->|"Contexte & Dockerfile"| KanikoPod["Kubernetes Job : Kaniko Executor<br/>(gcr.io/kaniko-project/executor)"]
    Secret["Secret K8s (config.json)<br/>Auth Registry"] -.->|"Identifiants"| KanikoPod
    Cache["Volume Cache / Registre"] <-->|"Layers pré-compilés"| KanikoPod
    KanikoPod -->|"Push de l'image construite"| Registry["Container Registry<br/>(GHCR, Docker Hub, Harbor)"]
```

---

## 3. Fast Tag Promotion Pipeline (Crane)

```mermaid
flowchart LR
    Kaniko["Kaniko Build"] -->|"1. Push initial (staging)"| GHCR["Registre Staging<br/>:staging-commit-abc"]
    Crane["Crane CLI"] -->|"2. Tag instantané (200 ms)"| GHCR
    GHCR -->|"3. Nouveau pointeur :v1.0.0"| Prod["Déploiement Production"]
```

---

## 4. Kubernetes Service FQDN Resolution

```mermaid
flowchart LR
    Pod["Pod Application<br/>(Namespace: frontend)"] -->|"DNS Lookup<br/>redis.databases.svc.cluster.local"| CoreDNS["CoreDNS<br/>Cluster DNS"]
    CoreDNS -->|"ClusterIP VIP"| Service["Service K8s<br/>(redis.databases)"]
    Service -->|"TargetPort :6379"| RedisPod["Redis Pod<br/>(Namespace: databases)"]
```

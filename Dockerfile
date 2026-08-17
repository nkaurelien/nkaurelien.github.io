# ==========================================
# Multi-stage Dockerfile pour Next.js + PDF Generator (Pandoc & Weasyprint)
# ==========================================

# ------------------------------------------
# Stage 1 : Installe les dépendances Node.js
# ------------------------------------------
FROM node:22-slim AS deps
WORKDIR /app

# Installe les dépendances système nécessaires à Prisma et aux modules natifs
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock ./
COPY prisma ./prisma

RUN yarn install --frozen-lockfile

# ------------------------------------------
# Stage 2 : Build Next.js & génération de cv.pdf
# ------------------------------------------
FROM node:22-slim AS builder
WORKDIR /app

# Installe pandoc et weasyprint pour la génération du CV au build
RUN apt-get update && apt-get install -y --no-install-recommends \
    pandoc \
    weasyprint \
    fonts-liberation \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Génération du client Prisma
RUN npx prisma generate

# Génération automatique du CV PDF (cv.md -> public/cv.pdf)
RUN node scripts/build-pdf.js

# Compilation de l'application Next.js
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn build

# ------------------------------------------
# Stage 3 : Container d'exécution Production
# ------------------------------------------
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Installe pandoc, weasyprint et dépendances système en prod (si génération dynamique)
RUN apt-get update && apt-get install -y --no-install-recommends \
    pandoc \
    weasyprint \
    fonts-liberation \
    ca-certificates \
    openssl \
 && rm -rf /var/lib/apt/lists/*

# Création d'un utilisateur non-root sécurisé
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/datasources ./datasources
COPY --from=builder /app/cv.md ./cv.md
COPY --from=builder /app/cv.json ./cv.json
COPY --from=builder /app/cv.pdf ./cv.pdf

# Copie des artéfacts Next.js et node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Ajustement des permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["yarn", "start"]

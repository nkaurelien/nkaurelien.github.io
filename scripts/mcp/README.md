# 🤖 Guide Complet d'Intégration du Serveur MCP (Claude & Antigravity)

Ce serveur MCP permet à vos assistants IA (**Claude Desktop**, **Claude Code CLI** et **Antigravity**) d'interagir directement avec votre portfolio :
* 👤 **Profil & Expérience** : Biographie, compétences, expériences et parcours (`get_profile_overview`, `search_experience`).
* 📚 **Articles & Blog** : Recherche et lecture complète de vos 23 articles techniques (`list_articles`, `read_article`, `search_articles`).
* 📬 **Messagerie Push** : Envoi de messages de contact instantanés sur votre téléphone/desktop via Ntfy (`send_contact_message`).

---

## 🖥️ 1. Intégration Claude Desktop (macOS)

### A. Localisation du fichier de configuration
Sur macOS, ouvrez ou éditez le fichier :
```bash
~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### B. Configuration en Mode Local (Stdio)
*Idéal pour le développement sur votre machine :*

```json
{
  "mcpServers": {
    "nk-portfolio": {
      "command": "npx",
      "args": [
        "tsx",
        "/Volumes/X9 Pro/Workspaces/nkaurelien/nkaurelien.github.io/scripts/mcp/index.ts"
      ],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

### C. Configuration en Mode Remote Sécurisé (Vercel / Production)
*Utilise le bridge `mcp-remote` avec interpolation de la clé secrète `${AUTH_TOKEN}` :*

```json
{
  "mcpServers": {
    "nk-portfolio-remote": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://nkaurelien.kamitbrains.fr/api/mcp",
        "--header",
        "Authorization: Bearer ${AUTH_TOKEN}"
      ],
      "env": {
        "AUTH_TOKEN": "votre_cle_secrete_ici"
      }
    }
  }
}
```

### D. Activation dans Claude Desktop
1. Quittez complètement **Claude Desktop** (`Cmd + Q`).
2. Relancez Claude Desktop.
3. L'icône 🔨 (marteau/outils) apparaîtra en bas à droite du chat avec les 6 outils disponibles.

---

## 💻 2. Intégration Claude Code (CLI)

### Mode Local :
```bash
claude mcp add nk-portfolio -- npx tsx "/Volumes/X9 Pro/Workspaces/nkaurelien/nkaurelien.github.io/scripts/mcp/index.ts"
```

### Mode Remote avec variable d'authentification :
```bash
claude mcp add nk-portfolio-remote \
  -e AUTH_TOKEN="votre_cle_secrete_ici" \
  -- npx -y mcp-remote "https://nkaurelien.kamitbrains.fr/api/mcp" --header "Authorization: Bearer \${AUTH_TOKEN}"
```

### Vérifier les serveurs installés :
```bash
claude mcp list
```

---

## 🪐 3. Intégration Antigravity

Fichier de configuration globale :
```bash
/Volumes/X9 Pro/Users/nkaurelien/.gemini/config/mcp_config.json
```

Ajoutez sous `"mcpServers"` :

### Mode Local :
```json
"nk-portfolio": {
  "command": "npx",
  "args": [
    "tsx",
    "/Volumes/X9 Pro/Workspaces/nkaurelien/nkaurelien.github.io/scripts/mcp/index.ts"
  ],
  "env": {
    "NODE_ENV": "development"
  }
}
```

### Mode Remote :
```json
"nk-portfolio-remote": {
  "command": "npx",
  "args": [
    "-y",
    "mcp-remote",
    "https://nkaurelien.kamitbrains.fr/api/mcp",
    "--header",
    "Authorization: Bearer ${AUTH_TOKEN}"
  ],
  "env": {
    "AUTH_TOKEN": "votre_cle_secrete_ici"
  }
}
```

---

## 💬 4. Exemples de Prompts à tester

Une fois connecté dans Claude ou Antigravity :

* **Explorer le profil** :
  > *"Peux-tu me résumer le profil d'Aurélien et ses principales compétences en DevSecOps ?"*

* **Recherche d'expérience** :
  > *"Quelles sont les expériences d'Aurélien sur Kubernetes et le standard FHIR ?"*

* **Explorer les articles** :
  > *"Liste-moi les derniers articles rédigés sur le homelab et Docker."*
  > *"Résume l'article qui parle de sécuriser le socket Docker."*

* **Envoyer un message de contact** :
  > *"Envoie un message de contact à Aurélien de la part de Jean Dupont (jean.dupont@example.com) pour lui proposer un poste de Lead Tech."*

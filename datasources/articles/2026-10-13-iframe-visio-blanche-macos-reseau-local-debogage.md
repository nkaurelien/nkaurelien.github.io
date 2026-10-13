---
tags: debugging, webrtc, iframe, macos, playwright, jitsi, nextjs, reseau
title: "Iframe de visio blanche : chercher le bug dans le code… alors qu'il était dans macOS"
date: 2026-10-13
categories: [Debugging, Frontend, Réseau]
excerpt: "Une visio intégrée qui reste blanche dans le navigateur d'un développeur, et seulement le sien. Cinq hypothèses côté code éliminées une à une, puis la vraie cause : la permission « Réseau local » de macOS, qui bloquait aussi le Python du backend. Méthode, outils et checklist."
lang: fr
---

# Iframe de visio blanche : chercher le bug dans le code… alors qu'il était dans macOS

*Le symptôme le plus frustrant en frontend : une zone blanche, pas d'erreur claire, et un collègue pour qui « ça marche ». Retour sur une journée de débogage d'une visioconférence Jitsi intégrée en iframe dans une application Next.js.*

---

## 🧪 Le symptôme

Une page `/teleconsultation/<id>` affiche une iframe Jitsi. Dans le navigateur du développeur : **une page blanche**. Les jetons semblent bons, l'API répond. Rien d'évident dans la console.

La tentation : « c'est les permissions de l'iframe » (caméra, micro, `allow=`). C'était faux — mais il a fallu le prouver.

---

## 🔍 Cinq vraies causes de page blanche… qui n'étaient pas celle-ci

Chacune existait réellement dans le code et a été corrigée en chemin :

| # | Cause | Pourquoi blanc | Correctif |
|---|---|---|---|
| 1 | **Jeton expiré** (créneau passé) | Jitsi refuse sans message lisible dans l'iframe | Le backend répond **410** → message « visio terminée » |
| 2 | **Jeton pas encore valable** (`nbf` dans le futur) | Idem | **409** + salle d'attente avec décompte |
| 3 | **Statut HTTP perdu** par une *server action* Next.js | `error.status` ne traverse pas la frontière serveur → client : écran d'erreur générique | Retourner `{ error: { status, message } }` au lieu de lever |
| 4 | **Effet React relancé** après le démarrage de la consultation | `user` change de référence → nouvelle demande de jeton sans le mode « ouverture anticipée » → 409 → iframe démontée | Garde `useRef` : connexion initiale une seule fois par salle |
| 5 | **`config.js` en 403** sur le serveur | Dossier non traversable par le nginx du conteneur | `chmod 0755` |

Toutes réelles, toutes corrigées… et la page restait blanche **dans ce navigateur-là**.

---

## 🎭 Isoler : reproduire hors de la machine suspecte

Le réflexe qui a tout débloqué : **sortir du navigateur de l'utilisateur**. Avec Playwright, même page, même compte, mêmes rendez-vous :

```js
const browser = await firefox.launch({
  firefoxUserPrefs: {
    'media.navigator.streams.fake': true,          // caméra/micro factices
    'media.navigator.permission.disabled': true,
  },
});
page.on('console', m => m.type() === 'error' && logs.push(m.text()));
page.on('requestfailed', r => logs.push(`${r.url()} ${r.failure()?.errorText}`));
```

Résultat : **Firefox (profil neuf) affiche la visio. Chrome renvoie `ERR_CONNECTION_RESET` avant même de charger la page.** Même machine, même serveur, deux comportements : le problème n'est ni dans le code ni sur le serveur.

Puis un indice inattendu : un script Python du backend, lancé depuis le terminal, échouait lui aussi :

```text
Python 3.10 → 192.168.x.x:443   [Errno 65] No route to host
Python 3.14 → 192.168.x.x:443   OK
curl        → 192.168.x.x:443   OK
Python 3.10 → www.google.com    200
```

**Internet OK, réseau local KO, et seulement pour certains exécutables.** Cette signature a un nom.

---

## 🍏 La cause : la permission « Réseau local » de macOS

Depuis les dernières versions de macOS, chaque application doit être **autorisée à accéder au réseau local** (Réglages Système → Confidentialité et sécurité → Réseau local). Un refus — ou une autorisation réinitialisée par une mise à jour — se manifeste par :

- `No route to host` / `Broken pipe` pour les programmes en ligne de commande ;
- `ERR_CONNECTION_RESET` dans un navigateur ;
- une **iframe blanche** quand c'est une ressource du LAN qui est intégrée.

Le serveur de visio de recette était sur le réseau local (homelab). Le navigateur principal n'avait plus le droit d'y accéder ; un autre navigateur, autorisé, affichait tout parfaitement.

Facteur aggravant : un **antivirus qui intercepte le HTTPS** (le certificat présenté au client était signé par l'autorité de l'antivirus). Il peut lui aussi casser iframes et WebSockets sur certains domaines.

---

## 🧰 Les outils qui ont servi

- **Playwright avec des médias factices** : reproduire sans caméra ni permission, sur plusieurs moteurs.
- **`requestfailed` + console** : distinguer une erreur réseau d'une erreur applicative.
- **`curl -v`** : voir **l'émetteur du certificat** (`issuer:`) révèle immédiatement une interception TLS.
- **Comparer plusieurs clients sur la même cible** (curl, deux Python, deux navigateurs) : quand seuls certains échouent, cherchez du côté de la machine.
- **Une page HTML minimale** servie sur `localhost` puis sur `127.0.0.1` pour tester `frame-ancestors` : origine autorisée → visio ; origine refusée → iframe vide et violation CSP dans la console.

---

## ✅ Checklist « iframe de visio blanche »

1. Le jeton est-il valable **maintenant** (`nbf` / `exp`) ? Afficher une salle d'attente plutôt qu'une iframe vouée à l'échec.
2. Le statut HTTP arrive-t-il **jusqu'au composant** (server actions, wrappers fetch) ?
3. L'iframe est-elle **démontée/remontée** par un effet qui se relance ?
4. La page de visio s'ouvre-t-elle **seule, dans un onglet** ? Sinon : serveur ou réseau, pas l'intégration.
5. `Content-Security-Policy: frame-ancestors` inclut-il l'origine de l'application ?
6. **Un autre navigateur, un profil neuf, Playwright** : si ça marche ailleurs, c'est la machine.
7. macOS : **Réseau local** autorisé pour ce navigateur (et pour vos outils CLI) ?
8. Antivirus / proxy d'entreprise : `curl -v` → qui a émis le certificat ?

---

## 🎓 Leçons

1. **Corriger les vrais bugs trouvés en route** : les cinq causes du tableau auraient frappé des utilisateurs, même si aucune n'était *la* cause.
2. **Reproduire hors de la machine du rapporteur** tôt : Playwright coûte cinq minutes et élimine des heures d'hypothèses.
3. **Un même échec sur des outils sans rapport** (un navigateur et un interpréteur Python) pointe vers l'environnement.
4. **Documenter le piège** : la permission « Réseau local » se réinitialise, elle reviendra.

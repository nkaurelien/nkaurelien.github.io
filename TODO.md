# TODO - Intégration Firebase & Améliorations Espace Admin

Ce fichier récapitule les tâches accomplies concernant l'intégration de Firebase, ainsi que les pistes de développement futur pour l'espace d'administration.

---

## 🛠️ Tâches Accomplies

- [x] **Configuration & Initialisation**
  - [x] Ajout des variables d'environnement Firebase dans `.env.local`
  - [x] Création du script d'initialisation compatible SSR (`src/lib/firebase.js`)
  - [x] Création des helpers de stockage pour Firebase Storage (`src/lib/storage.js`)

- [x] **Gestion de l'État & Authentification**
  - [x] Création du context React `AuthContext.js` pour centraliser les méthodes de connexion/déconnexion
  - [x] Intégration globale du provider d'authentification dans le layout de l'application (`layout.js`)

- [x] **Interfaces de Démonstration & Administration**
  - [x] Création d'une page de démo publique `/firebase-demo` pour tester l'authentification et les uploads
  - [x] Création d'un espace d'administration sécurisé `/admin` protégé par e-mail admin
  - [x] Onglets de l'admin configurés : Statistiques, Formulaire de Projets, et Gestionnaire de Documents (CVs/CV PDF)

---

## 🚀 Fonctionnalités Administrateur Futures (À implémenter)

Voici les options d'extensions pour l'espace d'administration :

### 📂 Option A : Gestion des Projets en Base de Données (Firestore)
- [ ] Configurer Firebase Firestore pour stocker la liste des projets.
- [ ] Connecter le formulaire de création de projets dans `/admin` pour enregistrer les données en temps réel.
- [ ] Mettre à jour la grille de projets publique pour récupérer les données de Firestore.

### ✉️ Option B : Centre de Messages (Formulaire de Contact)
- [ ] Connecter le formulaire de contact public à Firebase Firestore.
- [ ] Créer un onglet "Messages" dans l'espace `/admin` permettant de lister, lire, marquer comme lu et supprimer les messages des visiteurs.

### ✍️ Option C : Éditeur de Profil Dynamique
- [ ] Développer un formulaire dans `/admin` pour éditer vos données de profil (bio, liens sociaux, photo).
- [ ] Charger les infos dynamiquement sur le portfolio à la place des fichiers JSON statiques.

### 📊 Option D : Statistiques Avancées & Téléchargements
- [ ] Connecter les événements (ex: téléchargement de CV, clic sur projet) avec Firebase Analytics.
- [ ] Afficher des graphiques de statistiques simplifiés dans l'onglet "Vue d'ensemble" de l'admin.

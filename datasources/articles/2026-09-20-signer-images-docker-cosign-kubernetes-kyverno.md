---
tags: cosign, sigstore, supply-chain, kubernetes, kyverno, docker, oci, devsecops, ecdsa
title: "Signer ses Images avec Cosign : la Même Crypto que SSH, un Problème Complètement Différent"
date: 2026-09-20
categories: [DevSecOps, Kubernetes, Sécurité, Supply Chain]
excerpt: "Scanner une image prouve qu'elle était saine au moment du build. Rien ne prouve que celle que le kubelet télécharge trois semaines plus tard est la même. Cosign comble ce trou — mais pas là où on le croit, et sa version 3 a changé un défaut qui compte pour les registres privés."
lang: fr
---

# Signer ses Images avec Cosign : la Même Crypto que SSH, un Problème Complètement Différent

*Une chaîne de build qui scanne correctement répond à la question « cette image contenait-elle une vulnérabilité connue à l'instant T ? ». Elle ne répond pas à « l'image que mon cluster exécute aujourd'hui est-elle celle que j'ai construite ? ». Ces deux questions sont indépendantes, et la seconde ne se traite pas avec un scanner.*

---

## 🕳️ Le Trou que le Scan ne Ferme Pas

Mettons qu'un pipeline fasse tout correctement : build en quarantaine, scan avant promotion, blocage sur CVE critique, promotion par digest — la séquence décrite dans [l'article sur le scan de chaîne de build](/fr/blog/scanner-chaine-build-trivy-trufflehog-promotion-crane/). L'image validée arrive dans le registre.

Elle y reste. Des semaines, parfois des mois. Pendant ce temps :

- des identifiants de registre circulent dans plusieurs pipelines et sur plusieurs postes ;
- un compte de service avec droits de push existe forcément quelque part ;
- le registre lui-même est un logiciel, avec ses propres vulnérabilités ;
- et sur un tag mutable, **écraser une image ne laisse aucune trace visible côté consommateur**.

Le jour où un pod redémarre et tire `registry.exemple.fr/api:v2.3.0`, rien dans la chaîne ne vérifie que ce qui descend correspond à ce qui est monté. Le scan est passé trois semaines plus tôt, sur un contenu qui n'est peut-être plus celui-là.

### « Mais j'ai du TLS sur mon registre »

C'est la confusion la plus fréquente, et elle mérite d'être traitée frontalement.

TLS authentifie le **serveur** et chiffre le **transport**. Il garantit que vous parlez bien à `registry.exemple.fr` et que personne n'écoute entre les deux. Il ne dit **rien** sur ce que ce serveur vous envoie.

Si quelqu'un a poussé une image altérée sur ce registre, TLS vous la livrera : chiffrée, authentifiée, avec un cadenas vert et une intégrité de transport parfaite. Le canal est irréprochable, le contenu est vérolé. TLS protège le tuyau, pas le colis.

C'est précisément ce déplacement — du tuyau vers le colis — que la signature d'artefact opère.

---

## 🔑 « On a Toujours une Clé Privée et une Clé Publique, Non ? »

Oui. Et c'est important de le dire, parce que Sigstore est souvent présenté avec un vocabulaire qui laisse croire à une rupture technologique. Il n'y en a pas au niveau cryptographique.

Une clé cosign générée par défaut est une **ECDSA P-256**. Exactement la même chose qu'une clé SSH ECDSA, ou qu'une clé produite par `openssl ecparam -name prime256v1`. La preuve tient en une commande :

```bash
$ openssl pkey -pubin -in cosign.pub -text -noout
Public-Key: (256 bit)
ASN1 OID: prime256v1
NIST CURVE: P-256
```

`openssl` lit la clé publique cosign sans difficulté : c'est un `SubjectPublicKeyInfo` standard. Mieux, une clé publique générée par `openssl` et une clé publique cosign partagent le même préfixe base64 `MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE…` — l'en-tête ASN.1 de P-256.

La seule différence de forme se voit sur la clé privée :

```
-----BEGIN ENCRYPTED SIGSTORE PRIVATE KEY-----
```

Ce n'est pas du PKCS#8. C'est un conteneur propre à Sigstore (chiffrement scrypt + NaCl secretbox), et `openssl pkey` refuse de le lire : `unsupported`. **Le secret mathématique est standard ; son emballage ne l'est pas.** Ce détail a une conséquence pratique : on ne peut pas réutiliser directement une clé cosign avec l'outillage OpenSSL habituel, ni l'inverse sans conversion.

Donc si la crypto est identique à SSH, qu'est-ce qui change réellement ?

### Authentifier une présence vs attester un artefact

C'est là qu'est la vraie distinction, et elle n'est pas mathématique.

**SSH et TLS authentifient une présence.** Le mécanisme est un défi-réponse en temps réel : le serveur envoie un aléa, vous le signez, il vérifie. La signature prouve « je détiens la clé, **maintenant** », puis elle est jetée. Personne ne l'archive, personne ne la relira.

**Cosign atteste un artefact.** La signature porte sur un contenu immuable — le digest SHA-256 d'une image — et elle **survit** à l'acte de signature. Elle reste vérifiable six mois plus tard, hors ligne, par un vérificateur qui n'était pas là et qui ne dialoguera jamais avec le signataire.

| | SSH | TLS / mkcert | Cosign |
| :--- | :--- | :--- | :--- |
| **Ce qui est signé** | Un défi aléatoire | Un défi de handshake | Un digest d'artefact |
| **Ce que ça affirme** | « Je détiens la clé » | « Je suis ce nom de domaine » | « Cet artefact vient de moi, intact » |
| **Durée de vie** | Jetée après la session | Jetée après le handshake | Archivée avec l'artefact |
| **Vérifiable hors ligne** | Non | Non | **Oui** |
| **Modèle de confiance** | Liste plate (`known_hosts`) | PKI hiérarchique (CA) | Liste plate, ou PKI éphémère |

Le mode `--key` de cosign est, conceptuellement, **le plus proche de SSH** : une liste plate de clés publiques que l'on distribue. Pas de CA, pas de chaîne, pas d'expiration.

---

## 📦 Le Vrai Apport : Où Vit la Signature

Signer avec `openssl dgst -sign` est trivial. Le problème n'a jamais été de produire la signature : **il a toujours été de l'acheminer.** Un fichier `.sig` à côté de l'image, c'est un second artefact à publier, à versionner, à retrouver et à corréler. En pratique, personne ne le fait.

Docker Content Trust (Notary v1) avait répondu à ça par un serveur de clés dédié — une base de données de plus à héberger, sauvegarder, sécuriser et faire vivre. Le coût opérationnel a largement dépassé le bénéfice perçu, et l'adoption est restée confidentielle.

L'idée de cosign est presque ennuyeuse tant elle est simple : **pousser la signature dans le registre OCI lui-même**, comme un artefact adressé par le digest de l'image.

```
registry.exemple.fr/api:v2.3.0                    ← l'image  (digest sha256:abc123…)
registry.exemple.fr/api:sha256-abc123….sig        ← sa signature
```

Pas de base de données, pas de serveur supplémentaire, pas de sauvegarde spécifique. Le registre que vous exploitez déjà transporte la signature avec l'image, et vos sauvegardes de registre la couvrent automatiquement. L'innovation est logistique, pas cryptographique — c'est ce qui explique l'écart d'adoption avec Notary.

```mermaid
flowchart LR
    CI["Pipeline CI<br/>(build Kaniko)"] -->|"1. push image"| REG["Registre OCI"]
    CI -->|"2. cosign sign (digest)"| REG
    REG -->|"3. pull image + .sig"| ADM["Admission controller<br/>(Kyverno)"]
    ADM -->|"signature valide"| POD["Pod demarre"]
    ADM -->|"signature absente ou invalide"| REJ["Admission refusee"]
```

---

## 🎯 Signer le Digest, Jamais le Tag

Point technique aux conséquences directes : une signature cosign porte sur le **digest**, pas sur le nom.

Un tag est une étiquette mutable — `v2.3.0` peut désigner un contenu aujourd'hui et un autre demain. Un digest est le SHA-256 du manifeste : il *est* le contenu. Signer `api:v2.3.0` n'a de sens que parce que cosign résout d'abord le tag en digest et signe celui-ci.

Cela produit une propriété très utile en pipeline de promotion. Si la stratégie consiste à promouvoir par re-tag — `crane tag candidate-abc123 validated-abc123`, comme décrit dans [l'article sur les builds Kaniko en cluster](/fr/blog/build-images-kubernetes-kaniko-crane/) — alors **le digest ne change pas**, et la signature reste valide sans aucune re-signature. Un seul `cosign sign` au moment du build couvre toutes les promotions ultérieures.

Corollaire, moins agréable : les signatures s'accumulent comme des tags `sha256-*.sig` dans le registre. Une politique de nettoyage agressive par expression régulière peut les supprimer et rendre des images vivantes non vérifiables — panne de déploiement garantie, sur un mécanisme dont personne ne se souvient. À vérifier **avant** d'activer la vérification bloquante.

---

## ⚠️ Keyless : la Fonctionnalité Vedette, et son Prix

Le mode keyless est ce qui est mis en avant partout, et l'idée est élégante : plus de clé privée longue durée à protéger. Le pipeline présente un jeton OIDC (GitHub Actions, GitLab, Google), **Fulcio** émet un certificat valable une dizaine de minutes, la signature est produite, le certificat expire. Il n'y a plus de secret à voler, puisqu'il n'y a plus de secret.

Le mécanisme repose sur un second composant : **Rekor**, un journal de transparence public et immuable, où est déposée la preuve que cette signature a bien existé à ce moment-là.

C'est exactement là qu'il faut s'arrêter avant de choisir.

**Un log de transparence public est public.** Y sont déposés : le digest de l'image, le nom du dépôt, et l'identité OIDC du signataire — typiquement l'URL du projet et la référence de branche. Pour un projet open source, c'est une fonctionnalité : n'importe qui peut auditer. Pour une plateforme privée, c'est la publication permanente de la topologie interne — noms de services, cadence de release, structure des environnements. Et **le log est immuable** : il n'y a pas de bouton de suppression.

Pour un registre privé, en santé, en finance ou sous contrainte réglementaire, le mode `--key` classique reste le choix raisonnable — **à condition de désactiver explicitement le journal, ce qui n'est pas le comportement par défaut** (voir ci-dessous). Le keyless retrouve tout son intérêt avec une instance Rekor privée, au prix de l'infrastructure correspondante.

### Le piège : le mode clé ne vous sort pas du journal public

Contre-intuitif, et c'est le point le plus important de cette section : **choisir `--key` ne suffit pas à rester hors de Rekor.** La documentation de la commande `sign` est sans ambiguïté, et ce depuis la v2 :

```
--tlog-upload    whether or not to upload to the tlog (default true)
```

Autrement dit, un `cosign sign --key ma-cle.key` sur un registre strictement privé **publie par défaut** le digest et le nom de l'image dans le journal de transparence public. Il faut le désactiver explicitement :

```yaml
variables:
  COSIGN_TLOG_UPLOAD: "false"   # registre privé : rien ne part dans Rekor
```

Beaucoup d'équipes qui ont écarté le keyless « pour rester privées » ont ce comportement actif sans le savoir.

### Ce que la v3 change

Le défaut n'a pas bougé — c'est **la difficulté d'y échapper** qui a changé. Constat empirique en installant cosign 3.1.3 :

```bash
# Désactiver l'upload n'est plus un simple drapeau
$ COSIGN_TLOG_UPLOAD=false cosign sign-blob --key cosign.key --bundle b.json blob.txt
Error: --tlog-upload=false is not supported with --signing-config.
Provide a signing config without a transparency log service...

# Et la vérification consulte Rekor spontanément, même en mode clé
$ cosign verify-blob --key cosign.pub --signature blob.sig blob.txt
Error: searching log query: ... (*models.Error) is not supported
```

La vérification hors ligne exige désormais `--insecure-ignore-tlog=true`, et signer sans tlog demande de fabriquer un `signing-config` expurgé de `rekorTlogUrls`.

Conséquence pratique : **épingler la version de cosign dans la CI n'est pas cosmétique, c'est structurant.** Un `cosign:latest` qui glisse de v2 à v3 transforme une configuration qui fonctionnait en erreur de pipeline — ou pire, en pipeline qu'on « répare » en retirant l'option.

```yaml
image:
  name: alpine:3.20   # + binaire cosign v2.4.1 épinglé et vérifié par checksum
```

Sur l'image à utiliser, une remarque de terrain : l'image officielle `ghcr.io/sigstore/cosign/cosign` est **distroless** — son entrypoint est `/ko-app/cosign` et elle n'embarque pas de shell. Elle est donc inutilisable telle quelle dans un `script:` GitLab CI, qui enveloppe toujours les commandes dans un shell. Installer le binaire depuis les releases GitHub, avec vérification du SHA-256, reste le plus simple — et a le mérite d'appliquer au vérificateur la rigueur qu'on attend de lui.

---

## 🚫 Kubernetes ne Vérifie Rien Tout Seul

Autre formulation trompeuse, très répandue : « avec Cosign, Kubernetes refuse d'exécuter les images non signées ».

Kubernetes, seul, ne vérifie **aucune** signature. Le kubelet tire l'image et la démarre. Il n'existe aucun réglage natif pour exiger une signature.

Ce qui bloque, c'est un **admission controller** que l'on installe en plus — Kyverno, ou le Policy Controller de Sigstore. Signer sans installer ce maillon produit une signature que personne ne lit : un badge de conformité, pas un contrôle.

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-image-signature
spec:
  validationFailureAction: Enforce
  rules:
    - name: verify-signature
      match:
        resources:
          kinds: [Pod]
      verifyImages:
        - imageReferences:
            - "registry.exemple.fr/*"
          attestors:
            - entries:
                - keys:
                    publicKeys: |-
                      -----BEGIN PUBLIC KEY-----
                      MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
                      -----END PUBLIC KEY-----
```

Deux précautions de déploiement, apprises à la dure par beaucoup :

1. **Démarrer en `Audit`, pas en `Enforce`.** Une politique bloquante activée d'emblée sur un cluster existant refuse tout ce qui tourne déjà — y compris les images tierces non signées (ingress, monitoring, CSI). On observe d'abord les refus qu'on *aurait* provoqués, on ajuste le périmètre, on bascule ensuite.
2. **Restreindre `imageReferences` à son propre registre.** Exiger une signature de `docker.io/*` bloque instantanément la moitié de l'écosystème.

### Et sans Kubernetes ?

Le raisonnement est identique, seul le point d'application change. En Docker Compose déployé par Ansible, l'équivalent de l'admission controller est une tâche de vérification **avant** le démarrage des conteneurs :

```yaml
- name: Vérifier la signature des images avant déploiement
  ansible.builtin.command:
    cmd: >
      docker run --rm -v {{ release_dir }}/cosign.pub:/cosign.pub:ro
      ghcr.io/sigstore/cosign/cosign:v2.4.1
      verify --key /cosign.pub {{ item }}
  loop: "{{ images_a_deployer }}"
  changed_when: false
```

Le serveur ne détient que la clé **publique** et refuse de démarrer ce qu'il ne peut pas vérifier. La propriété qui compte n'est pas « on utilise Kubernetes », c'est **« le contrôle est situé après le registre »** — au plus près de l'exécution, là où l'altération aurait eu lieu.

---

## 🧯 Ce que la Signature ne Protège Pas

Une signature prouve une **origine**, pas une **innocuité**. La distinction est fondamentale et régulièrement perdue de vue.

Une image vérolée construite par votre propre CI sera signée sans le moindre avertissement. Si la chaîne de build est compromise, la signature certifie fidèlement que l'artefact malveillant vient bien de chez vous. C'est même pire qu'inutile : elle lui donne l'apparence de la légitimité.

Cosign couvre un segment précis : **entre la fin du build et le démarrage du conteneur.** Altération dans le registre, compromission d'identifiants de push, substitution en transit. Rien d'autre.

| Menace | Cosign aide ? |
| :--- | :--- |
| Image altérée dans le registre | ✅ Détectée à la vérification |
| Identifiants de push volés | ✅ L'attaquant ne peut pas signer |
| Substitution d'image en transit | ✅ Digest non conforme |
| Dépendance vulnérable dans l'image | ❌ C'est le rôle du scan |
| Secret en clair dans une couche | ❌ C'est le rôle du scan de secrets |
| Runner de CI compromis | ❌ La signature sera valide |
| Développeur malveillant | ❌ Relève de la revue de code |

Cosign se place donc **après** un durcissement du runner, une gestion correcte des secrets et un scan de chaîne de build. Il ferme un trou qui exige d'abord une compromission du registre ; les autres ferment des trous exploitables aujourd'hui.

---

## 🎯 Synthèse

| Pratique | Effet réel |
| :--- | :--- |
| Signer sans admission controller ni vérification au déploiement | **Aucun contrôle** — une décoration |
| Faire confiance à TLS pour l'intégrité du contenu | Le tuyau est sûr, le colis n'est pas vérifié |
| Signer un tag en croyant signer un nom | La signature porte sur le digest — le re-tag la préserve |
| Keyless sur un registre privé | Digests, noms d'images et identité publiés **définitivement** dans Rekor |
| Mode `--key` supposé hors Rekor | `--tlog-upload` vaut **`true` par défaut dès la v2** — à désactiver explicitement |
| `cosign:latest` dans la CI | Le passage v2 → v3 rend la sortie du journal public bien plus difficile |
| Image officielle cosign dans un `script:` | Distroless, **aucun shell** — le job échoue au démarrage |
| `Enforce` dès le premier jour | Le cluster refuse ses propres composants tiers |
| Nettoyage du registre par regex | Suppression possible des `.sig` → déploiements bloqués |
| Signature considérée comme un scan | Une image vérolée signée reste vérolée |

La question utile n'est pas « est-ce qu'on signe nos images ? », mais : **« existe-t-il un point, après le registre et avant l'exécution, où une image non vérifiée est refusée ? »** Tant que la réponse est non, la clé privée ne sert à rien d'autre qu'à cocher une case d'audit.

---
tags: openldap, docker-compose, securite, docker-secrets, traefik, ppolicy, memberof, identity-management
title: "Déploiement Sécurisé d'OpenLDAP avec Docker Compose : Secrets, Init Containers et Traefik"
date: 2026-09-26
categories: [DevSecOps, Docker, Sécurité, Identity Management]
excerpt: "Comment déployer OpenLDAP et phpLDAPadmin de manière sécurisée avec Docker Compose : secrets Docker, init container idempotent, overlay memberOf, politique de mots de passe (ppolicy) et Traefik pour le TLS."
lang: fr
---

# Déploiement Sécurisé d'OpenLDAP avec Docker Compose : Secrets, Init Containers et Traefik

*Lorsqu'on héberge de multiples applications internes (Nextcloud, Wiki, outils de CI/CD), la gestion des identités devient rapidement un cauchemar. La solution standard est de centraliser l'authentification avec un annuaire LDAP. Mais comment le déployer de manière moderne, automatisée et sécurisée ?*

Dans cet article, nous allons explorer la mise en place d'une stack OpenLDAP et phpLDAPadmin avec Docker Compose, en mettant un accent particulier sur la sécurité : gestion des mots de passe avec Docker Secrets, hachage SSHA, groupes cohérents grâce à l'overlay `memberof`, politiques de mots de passe (`ppolicy`), et exposition web avec Traefik. Au passage, nous verrons trois pièges d'`osixia/openldap` qui font échouer ces configurations sans bruit.

> 💻 **Code source complet** : l'implémentation décrite ici (`docker-compose.yml`, `scripts/init.sh`, exemples de secrets) est disponible dans le dépôt [nkaurelien/docker-examples](https://github.com/nkaurelien/docker-examples/tree/main/compose/11-security-identity/identity-providers/openldap).
>
> ```bash
> git clone https://github.com/nkaurelien/docker-examples.git
> cd docker-examples/compose/11-security-identity/identity-providers/openldap
> ```

---

## 1. L'Architecture de Base

L'image de référence pour OpenLDAP sous Docker est `osixia/openldap`. Elle offre beaucoup de flexibilité via des variables d'environnement, mais la configuration avancée (comme les Access Control Lists ou les overlays) requiert souvent des scripts d'initialisation.

L'architecture s'appuie sur trois composants :
1. **OpenLDAP** : Le serveur d'annuaire (écoute sur les ports 389 et 636).
2. **phpLDAPadmin** : Une interface web pour administrer l'annuaire facilement.
3. **Init Container** : Un conteneur éphémère lancé une fois OpenLDAP `healthy` (`depends_on: condition: service_healthy`), qui exécute un script (`init.sh`) pour peupler et configurer l'annuaire de manière idempotente.

## 2. Finis les Mots de Passe en Clair : Docker Secrets

La pire pratique en matière de conteneurisation est de passer des mots de passe d'administration en clair dans les variables d'environnement (ex: `LDAP_ADMIN_PASSWORD=MonMotDePasse`) : ils apparaissent dans `docker inspect` et dans les logs de nombreux outils.

Pour éviter cela, nous utilisons les **Secrets Docker Compose**. Hors Swarm, Compose les monte simplement en lecture seule dans `/run/secrets/` : ils ne sont pas chiffrés, mais ils n'apparaissent plus dans l'environnement du conteneur.

### Séparation des privilèges (Dual-Secret)

Nous séparons deux rôles critiques :
- L'administrateur de l'annuaire (`cn=admin,dc=kamitbrains,dc=local`) gère les utilisateurs et les groupes.
- L'administrateur de configuration (`cn=admin,cn=config`) gère la configuration interne du serveur LDAP (nécessaire pour activer des modules ou des overlays).

Configuration du `docker-compose.yml` :

```yaml
secrets:
  ldap_admin_password:
    file: ./.secrets/ldap_admin_password.txt
  ldap_config_password:
    file: ./.secrets/ldap_config_password.txt

services:
  openldap:
    image: osixia/openldap:1.5.0
    environment:
      LDAP_ADMIN_PASSWORD_FILE: /run/secrets/ldap_admin_password
      LDAP_CONFIG_PASSWORD_FILE: /run/secrets/ldap_config_password
    secrets:
      - ldap_admin_password
      - ldap_config_password
```

Les fichiers de mots de passe sont stockés dans un dossier `.secrets/` ignoré par Git (`**/.secrets/*` dans le `.gitignore`). Un dossier `.secrets.example/` versionné fournit des valeurs par défaut à copier puis à remplacer.

## 3. L'Init Container : Hachage, Validation et Idempotence

Au lieu de créer les utilisateurs manuellement via l'interface web, nous utilisons un script `init.sh` exécuté par un conteneur dédié une fois la base de données prête.

Ce script :
1. Lit les mots de passe depuis `/run/secrets/` et **s'arrête immédiatement si un secret est absent ou vide**.
2. **Hache les mots de passe** en SSHA avec `slappasswd` (les mots de passe ne doivent *jamais* être stockés en clair dans l'annuaire LDAP).
3. Injecte les entrées avec `ldapadd` / `ldapmodify` via des LDIF générés à la volée (heredocs).

### Valider les secrets

Un secret vide ne provoque aucune erreur visible : `slappasswd -s ""` hache une chaîne vide et `ldapadd -w ""` échoue à se connecter. On vérifie donc chaque secret à la lecture :

```bash
read_secret() {
  local value
  value=$(cat "/run/secrets/$1" 2>/dev/null)
  if [ -z "$value" ]; then
    echo "ERROR: secret '$1' is missing or empty" >&2
    exit 1
  fi
  printf '%s' "$value"
}
ADMIN_PASSWORD=$(read_secret ldap_admin_password) || exit 1
AURELIEN_RAW=$(read_secret user_aurelien_password) || exit 1
```

### Créer un utilisateur avec un mot de passe haché

```bash
AURELIEN_HASH=$(slappasswd -s "$AURELIEN_RAW")

ldap ldapadd -c -x -H ldap://openldap -w "$ADMIN_PASSWORD" -D "cn=admin,dc=kamitbrains,dc=local" << EOF
dn: cn=aurelien,ou=devops,dc=kamitbrains,dc=local
objectClass: inetOrgPerson
cn: aurelien
sn: Nkumbe
uid: nkaurelien
userPassword: $AURELIEN_HASH
EOF
```

`{SSHA}` (SHA-1 salé) convient pour un lab. C'est cependant un hachage rapide : en production, préférez un hachage lent comme Argon2 (module `pw-argon2`).

### Rendre le script réellement idempotent

Un `init.sh` naïf n'est pas idempotent : à la relance, `ldapadd` renvoie l'erreur 68 (*Already exists*) et **s'arrête au premier objet existant**, sans traiter les suivants. Deux mesures règlent le problème :

- l'option `-c` (*continue*) pour que `ldapadd` traite toutes les entrées d'un même LDIF ;
- un petit wrapper qui considère les codes « existe déjà » comme des succès, et fait échouer le script sur toute autre erreur :

```bash
# 68 = entry already exists, 20 = attribute/value already exists
FAILED=0
ldap() {
  "$@"
  local rc=$?
  case $rc in
    0|20|68) ;;
    *) FAILED=1 ;;
  esac
}

# ... toutes les opérations passent par : ldap ldapadd -c ... / ldap ldapmodify -c ...

if [ "$FAILED" -ne 0 ]; then
  echo "Initialization finished with errors; check the output above." >&2
  exit 1
fi
echo "Initialization complete!"
```

Le conteneur peut ainsi être relancé à volonté (`docker compose up -d --force-recreate init-ldap`), et son code de sortie reflète enfin la réalité.

## 4. Groupes et `memberOf` : le piège de l'overlay

Les applications clientes (Keycloak, Nextcloud, Grafana…) filtrent souvent sur l'attribut `memberOf` des utilisateurs. Il est tentant de l'écrire à la main après avoir créé les groupes. **C'est une erreur** : les valeurs divergent vite des `member` des groupes, et aucun ajout ou retrait ultérieur n'est répercuté.

`memberOf` doit être calculé par l'overlay **`memberof`**, déjà activé par `osixia/openldap`. Mais attention : l'image le configure par défaut pour `groupOfUniqueNames` / `uniqueMember`. Avec des `groupOfNames` / `member`, l'overlay ne fait rien, sans aucune erreur.

Il faut donc le reconfigurer **avant** de créer les groupes :

```bash
ldap ldapmodify -c -x -H ldap://openldap -w "$CONFIG_PASSWORD" -D "cn=admin,cn=config" << EOF
dn: olcOverlay={0}memberof,olcDatabase={1}mdb,cn=config
changetype: modify
replace: olcMemberOfGroupOC
olcMemberOfGroupOC: groupOfNames
-
replace: olcMemberOfMemberAD
olcMemberOfMemberAD: member
EOF
```

Il suffit ensuite de créer les groupes avec leurs `member` : OpenLDAP renseigne `memberOf` tout seul. Vérification :

```bash
ldapsearch -x -LLL -D "cn=admin,dc=kamitbrains,dc=local" -w "$ADMIN_PASSWORD" \
  -b "dc=kamitbrains,dc=local" "(objectClass=inetOrgPerson)" memberOf
```

## 5. Durcissement : l'overlay ppolicy

Par défaut, OpenLDAP ne bloque pas un compte après plusieurs tentatives de connexion échouées (bruteforce) et n'impose pas de longueur minimale. Pour remédier à cela, nous activons l'overlay **ppolicy** (Password Policy).

L'activation se fait via l'arbre de configuration (`cn=config`). C'est ici que notre secret de configuration entre en jeu : l'init container s'y connecte en réseau avec `cn=admin,cn=config`.

```bash
# Chargement du module ppolicy
ldap ldapmodify -c -x -H ldap://openldap -w "$CONFIG_PASSWORD" -D "cn=admin,cn=config" << EOF
dn: cn=module{0},cn=config
changetype: modify
add: olcModuleLoad
olcModuleLoad: ppolicy
EOF
```

L'overlay est ensuite attaché à la base `mdb`. Attention, ajouter un overlay déjà présent renvoie l'erreur **80** (*overlay already in list*), pas 68 : on teste donc sa présence avant de l'ajouter.

```bash
if ldapsearch -x -LLL -H ldap://openldap -w "$CONFIG_PASSWORD" -D "cn=admin,cn=config" \
    -b "olcDatabase={1}mdb,cn=config" -s one "(objectClass=olcPPolicyConfig)" dn | grep -q '^dn:'; then
  echo "ppolicy overlay already attached, skipping."
else
  # ldapadd de olcOverlay=ppolicy,olcDatabase={1}mdb,cn=config ...
fi
```

Nous créons enfin une politique par défaut (`cn=default,ou=policies,dc=kamitbrains,dc=local`) :

```ldif
pwdAttribute: userPassword
pwdCheckQuality: 1
pwdMinLength: 8
pwdMaxFailure: 5
pwdLockout: TRUE
pwdLockoutDuration: 900
pwdFailureCountInterval: 900
```

Elle :
- exige un minimum de 8 caractères ;
- verrouille le compte après 5 échecs de connexion ;
- maintient le verrouillage pendant 15 minutes.

Le piège ici : **sans `pwdCheckQuality: 1`, `pwdMinLength` est tout simplement ignoré**. Test rapide, qui doit être refusé :

```bash
ldappasswd -x -D "cn=michel,ou=appdev,dc=kamitbrains,dc=local" -w "$MICHEL_PASSWORD" -s abc
# Result: Constraint violation (19)
# Additional info: Password fails quality checking policy
```

À noter : la politique ne s'applique pas au root DN (`cn=admin,...`), qui contourne ppolicy.

## 6. Exposition via Traefik

phpLDAPadmin est une application web PHP, exposée sur le port 80 à l'intérieur du conteneur. Pour un accès chiffré (HTTPS), nous la connectons au réseau de notre reverse proxy Traefik, avec les labels adéquats.

```yaml
services:
  phpldapadmin:
    image: osixia/phpldapadmin:latest
    networks:
      - ldap-network
      - traefik-public
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=traefik-public"
      - "traefik.http.routers.phpldapadmin.rule=Host(`ldap.kamitbrains.local`)"
      - "traefik.http.routers.phpldapadmin.entrypoints=websecure"
      - "traefik.http.routers.phpldapadmin.tls.certresolver=letsencrypt"
      - "traefik.http.services.phpldapadmin.loadbalancer.server.port=80"

networks:
  traefik-public:
    external: true
```

Deux points d'attention :

- **`traefik.docker.network`** : le conteneur est sur deux réseaux, donc il a deux IP. Sans ce label, Traefik peut choisir celle de `ldap-network`, qu'il ne peut pas joindre, et renvoyer une **502 Bad Gateway** de façon intermittente.
- **Réseau externe** : `traefik-public` doit exister avant `docker compose up` (`docker network create traefik-public`, une seule fois), sinon la stack refuse de démarrer.

Côté certificat, Let's Encrypt ne peut pas délivrer de certificat pour un nom en `.local`. En lab, Traefik servira son certificat auto-signé par défaut ; pour un certificat valide, utilisez un vrai domaine (avec un challenge DNS pour un hôte interne). Pour limiter la surface d'exposition, on peut aussi retirer le mapping de port direct (`8088:80`) une fois Traefik en place.

## Conclusion

En combinant les Docker Secrets, un init container validé et réellement idempotent, les overlays `memberof` et `ppolicy` correctement configurés, et Traefik, on obtient un serveur OpenLDAP reproductible, documenté en tant que code, et une base solide pour centraliser l'identité d'un système d'information.

Avant la production, il reste quelques étapes : remplacer tous les secrets par défaut, passer à un hachage lent (Argon2), forcer LDAPS/StartTLS avec un vrai certificat, et épingler les versions d'images.

### Références utiles :
- [Implémentation complète : docker-examples/openldap sur GitHub](https://github.com/nkaurelien/docker-examples/tree/main/compose/11-security-identity/identity-providers/openldap)
- [Image osixia/openldap sur GitHub](https://github.com/osixia/container-openldap)
- [Documentation de l'overlay ppolicy (slapo-ppolicy)](https://www.openldap.org/software/man.cgi?query=slapo-ppolicy)
- [Documentation de l'overlay memberof (slapo-memberof)](https://www.openldap.org/software/man.cgi?query=slapo-memberof)
- [Tutoriel Medium : Setting up OpenLDAP server with Docker](https://medium.com/@amrutha_20595/setting-up-openldap-server-with-docker-d38781c259b2)

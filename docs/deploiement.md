# Déploiement

## Vercel

- Le push sur la branche `main` (repo GitHub `benjsant/astro-portfolio`)
  déclenche un déploiement Vercel automatique, en parallèle de la CI GitHub
  Actions.
- Domaine : `benjamin-santrisse.vercel.app`.
- Sur Vercel, la variable `DEPLOY_TARGET=vercel` fait utiliser l'adaptateur
  Vercel (voir [architecture.md](architecture.md)).

## Ce qui est déployé (et ce qui ne l'est pas)

Seul le code suivi par git part sur GitHub puis Vercel. Restent **hors ligne**,
sur la machine locale uniquement, les dossiers gitignorés :

| Dossier | Contenu |
|---|---|
| `docs-privee/` | Notes privées (valeurs d'env, procédures perso) |
| `lettres-motivation/` | Lettres au format .docx |
| `salon-emploi/` | Fiche pitch |
| `linkedin/` | Bannière |

Un article de blog en `draft: true` non commité n'est pas déployé non plus.

## En-têtes de sécurité

Définis dans [vercel.json](../vercel.json), appliqués à toutes les routes :

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- (et les autres en-têtes listés dans le fichier)

`vercel.json` gère aussi des **redirections** (anciennes URLs d'articles vers les
nouvelles, `/sitemap.xml` vers `/sitemap-index.xml`).

## Sécurité, rappel

- Contrôle d'origine activé côté Astro (`security.checkOrigin: true`).
- `gitleaks` scanne les secrets à chaque push (workflow CI).
- La clé DeepSeek reste côté serveur, jamais renvoyée au client.
- Le `robots.txt` bloque une liste de crawlers d'entrainement d'IA tout en
  laissant passer les moteurs de recherche.

## Après un déploiement

- Si tu partages le site, passe l'URL dans le **LinkedIn Post Inspector** pour
  forcer le rafraichissement de l'image OG.
- Pour régénérer un PDF de CV définitif, imprime depuis l'URL de production
  (pas le localhost).

## Générer un CV en PDF (rappel)

Ouvre `/cv` ou `/cv-design`, clique sur un des boutons d'export (1 page ou 2
pages), puis enregistre en PDF depuis la boite d'impression du navigateur. Voir
[cv.md](cv.md).

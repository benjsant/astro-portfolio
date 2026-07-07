# Contenu (blog, projets, stack)

Tout le contenu éditable vit dans `src/content/`, réparti en collections. Chaque
collection a un **schéma Zod** défini dans
[src/content.config.ts](../src/content.config.ts) : si une frontmatter ne
respecte pas le schéma, le build échoue (garde-fou utile).

## Les collections

| Collection | Dossier | Format | Rôle |
|---|---|---|---|
| `blog` | `content/blog/` | .md / .mdx | Articles |
| `projects` | `content/projects/` | .md / .mdx | Fiches projets |
| `stack` | `content/stack/` | .md / .mdx | Fiches techno |
| `authors` | `content/authors/` | .json | Auteur(s) |
| `faqs` | `content/faqs/` | .json | Questions/réponses (schema FAQ) |
| `pages` | `content/pages/` | .md / .mdx | Pages de contenu |

## Ajouter un article de blog

Crée `src/content/blog/fr/mon-article.mdx` avec cette frontmatter :

```yaml
---
title: "Titre de l'article"          # 100 caractères max
description: "Résumé court"           # 200 caractères max (sinon le build casse)
publishedAt: 2026-07-07
updatedAt: 2026-07-08                 # optionnel
author: "Benjamin Santrisse"
tags: ["IA", "Data"]
image: ./mon-image.png               # optionnel (chemin relatif, traité par Sharp)
imageAlt: "Description de l'image"    # optionnel
draft: false                         # true = totalement caché
featured: false
locale: "fr"                         # 'fr' | 'en' | 'es'
toc: true                            # optionnel, override du sommaire pour ce post
comments: false                      # optionnel, override des commentaires
---

Le corps de l'article en markdown / MDX.
```

### Deux pièges à retenir

- **`description` doit faire 200 caractères maximum.** Au-delà, le build échoue
  (`Too big: expected string to have <=200 characters`), même pour un brouillon.
- **`title` : 100 caractères maximum.**

### Brouillon (draft)

Un article en `draft: true` est **totalement invisible** : pas listé, pas de
page générée, pas d'URL accessible, et pas remonté par le chatbot. Pour qu'il
ne soit pas non plus dans le repo public, ne le commite pas (garde-le local).

## Ajouter ou modifier un projet

Crée `src/content/projects/mon-projet.mdx`. Champs du schéma :

```yaml
---
title: "Nom du projet"
description: "Résumé du projet"
url: "https://demo.exemple.app"      # optionnel, URL valide
repo: "https://github.com/benjsant/mon-projet"  # optionnel, URL valide
image: ./capture.png                 # optionnel
imageAlt: "Description"               # optionnel
tags: ["Python", "FastAPI"]
featured: false                      # remonté en avant si true
order: 10                            # ordre d'affichage (défaut 99)
year: 2026                           # optionnel
client: "Nom"                        # optionnel
role: "Développeur"                  # optionnel
services: ["Backend", "MLOps"]       # optionnel
draft: false
---

Description longue du projet en MDX.
```

L'ordre d'affichage suit le champ `order` (le plus petit en premier).

## Ajouter une fiche techno (stack)

Crée `src/content/stack/mon-outil.mdx`. Schéma **strict** (tous requis sauf
`order`) :

```yaml
---
name: "Astro"
description: "Framework de sites orientés contenu"
version: "6"
url: "https://astro.build"
icon: "brand-astro"                  # nom d'icône Iconify
colorOklch: "62.5% 0.22 38"          # paramètres OKLCH (L C H)
order: 0                             # ordre d'affichage
---
```

## Note d'exactitude : la recherche

Le template d'origine mentionne une recherche **Pagefind**. Les dépendances sont
encore dans `package.json`, mais **la recherche n'est pas câblée** dans ce
portfolio (aucun composant ne l'utilise, seul du texte marketing y fait
référence). Ne documente pas une fonctionnalité de recherche active tant qu'elle
n'a pas été réellement branchée.

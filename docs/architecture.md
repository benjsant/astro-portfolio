# Architecture

## Stack réelle

| Couche | Technologie |
|---|---|
| Framework | Astro 6 (`output: static`) |
| Îlots interactifs | React 19 (uniquement le chat) |
| Langage | TypeScript |
| Style | Tailwind CSS v4 (plugin Vite) + thèmes CSS en OKLCH |
| Contenu | MDX + Content Layer API, schémas validés par Zod |
| Chatbot | API DeepSeek (`deepseek-chat`), une route serveur |
| SEO | JSON-LD (schema-dts), sitemap, RSS, robots, manifest PWA |
| Images | Sharp (optimisation au build) |
| Icônes | astro-icon + Iconify (lucide, simple-icons) |
| Polices | Fontsource (Manrope, Outfit, JetBrains Mono) |
| Build local | Docker (node:22-alpine) ou pnpm |
| Déploiement | Vercel |

Le gestionnaire de paquets est **pnpm** (voir `pnpm-lock.yaml`).

## Rendu statique et la seule exception

Le site est **entièrement statique** (`output: 'static'` dans
[astro.config.mjs](../astro.config.mjs)) : chaque page est du HTML pré-généré au
build. La **seule** route serveur est le chat (`/api/chat`), marquée
`export const prerender = false`. C'est la seule chose qui a besoin d'un runtime
Node en production.

## Deux adaptateurs selon la cible

Le build choisit son adaptateur via la variable `DEPLOY_TARGET` :

```js
const isVercel = process.env.DEPLOY_TARGET === 'vercel';
function getAdapter() {
  if (isVercel) return vercel();        // build Vercel (prod)
  return node({ mode: 'standalone' });  // build Node autonome (local, autres hôtes)
}
```

En clair : sur Vercel la variable est posée, on utilise l'adaptateur Vercel.
Partout ailleurs, on retombe sur l'adaptateur Node.

## Arborescence

```
src/
  pages/           Pages et routes
    index.astro        Accueil
    about.astro        À propos
    contact.astro      Contact (pas de formulaire, renvoie vers CV/LinkedIn/GitHub)
    cv.astro           CV version ATS stricte
    cv-design.astro    CV version design (avec photo)
    blog/              Listing + [...slug]
    projects/          Listing + [slug]
    api/chat.ts        Route serveur du chatbot (seule route SSR)
    robots.txt.ts      robots.txt dynamique
    rss.xml.ts         Flux RSS
    manifest.webmanifest.ts  Manifest PWA
    favicon.svg.ts     Favicon généré
  content/         Contenu éditable (collections)
    blog/fr/           Articles .mdx
    projects/          Fiches projets .mdx
    stack/             Fiches techno .mdx
    authors/           Auteur(s) .json
    faqs/              FAQ .json (pour le schema FAQ)
  data/
    cv.ts              TOUT le contenu des deux CV (fichier clé)
  config/
    site.config.ts     Config globale (nom, liens, SEO, features)
    nav.config.ts      Menu de navigation
    consent.config.ts  Bandeau de consentement (optionnel)
  lib/             Utilitaires
    portfolio-data.ts  Données du portfolio + contexte injecté au chat
    schema.ts          JSON-LD (Person, ProfessionalService, etc.)
    cv-utils.ts        Helpers CV (obfuscation email/téléphone)
    cn.ts, utils.ts    Petits helpers (classes, divers)
  components/      Composants par domaine (voir plus bas)
  layouts/         Gabarits de page
  styles/
    themes/            13 thèmes de couleur (.css)
    tokens/            colors, primitives, spacing, typography
  assets/          Images traitées au build (blog, projects)
public/            Fichiers servis tels quels (photo.jpg, og-default.png, favicon)
```

## Composants (par domaine)

Les composants sont rangés par usage dans `src/components/` :

| Dossier | Rôle |
|---|---|
| `layout/` | En-tête, pied de page, structure |
| `landing/` | Sections de la page d'accueil |
| `hero/` | Zones d'accroche |
| `blog/` | Rendu des articles |
| `projects/` | Cartes et pages projets |
| `chat/` | `ChatWidget.tsx` (le seul composant React) |
| `seo/` | Balises meta, JSON-LD |
| `patterns/` | Petites briques réutilisables (dont `CvContactValue`) |
| `ui/` | Composants de base (boutons, inputs, data-display) |
| `effects/` | Effets visuels |

## Flux : de la donnée à la page

- **Une page de contenu** (article, projet) : le fichier `.mdx` dans
  `src/content/...` est chargé par une collection, sa frontmatter est validée
  par Zod, puis `getStaticPaths` génère une page par entrée non-draft.
- **Les CV** : la page lit `src/data/cv.ts` et boucle sur les données. Aucun
  markdown, tout est en TypeScript typé.
- **Le chat** : le front (`ChatWidget.tsx`) appelle `/api/chat`, qui injecte la
  liste des projets et articles dans le prompt système avant d'appeler DeepSeek.

## Origine du code

Démarré depuis le thème [Astro Rocket](https://github.com/hansmartens68/astro-rocket)
(licence MIT), puis fortement personnalisé. Le code mort du template (composants
non importés, recherche Pagefind non câblée, échafaudage de tests Vitest/Playwright)
a été retiré lors d'un ménage : ce qui reste est effectivement utilisé.

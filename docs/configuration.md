# Configuration, SEO, thèmes

## Configuration globale

| Fichier | Ce qu'on y règle |
|---|---|
| [src/config/site.config.ts](../src/config/site.config.ts) | Nom, description, URL, email public, adresse, liens sociaux, image OG, features d'articles (sommaire, commentaires), branding |
| [src/config/nav.config.ts](../src/config/nav.config.ts) | Le menu de navigation |
| [src/config/consent.config.ts](../src/config/consent.config.ts) | Bandeau de consentement (optionnel) |

Valeurs actuelles utiles dans `site.config.ts` :

- **email public du site** : `santrissebenjamin.portfolio@gmail.com` (adresse
  dédiée au portfolio, distincte de celle du CV et du compte principal, par
  cloisonnement volontaire).
- **liens sociaux** : GitHub `benjsant`, LinkedIn `benjamin-santrisse`.
- **sommaire d'articles (TOC)** : activé, layout `auto`, à partir de 3 titres.
- **commentaires (Giscus)** : désactivés (à configurer si besoin un jour).
- **couleurs de marque** : `themeColor` teal `#0ea5c8`.

## SEO et identité

| Fichier | Rôle |
|---|---|
| [src/lib/schema.ts](../src/lib/schema.ts) | Données structurées JSON-LD (Person, ProfessionalService, BlogPosting, FAQ). C'est l'identité que Google lit. |
| `src/components/seo/` | Balises meta par page (title, description, Open Graph, Twitter) |
| `public/og-default.png` | Image de partage (1200x630). Doit rester un PNG/JPG : LinkedIn n'affiche pas les SVG en preview. |
| [src/pages/robots.txt.ts](../src/pages/robots.txt.ts) | robots.txt dynamique : autorise les moteurs, bloque une liste de crawlers d'IA |

Si ton nom, ton métier ou ta localisation changent, mets `schema.ts` à jour
(sinon Google affiche de vieilles infos). La fonction `createPersonSchema`
porte ton identité.

Le sitemap est généré automatiquement au build (`/sitemap-index.xml`), en
excluant les pages de composants.

## Thèmes et couleurs

- Les thèmes de couleur sont dans `src/styles/themes/` (13 fichiers `.css` :
  teal, blue, cyan, indigo, violet, etc.). Le site utilise une teinte teal.
- Les tokens de base sont dans `src/styles/tokens/` : `colors.css`,
  `primitives.css`, `spacing.css`, `typography.css`.
- Les CV ont leur propre indigo défini directement dans leurs pages (voir
  [cv.md](cv.md)).
- Le style est écrit en **OKLCH** (espace colorimétrique perceptuellement
  uniforme), avec des fallbacks HEX en impression car OKLCH est parfois mal
  rendu en print sur Firefox/Chrome.

## Variables d'environnement

Toutes déclarées et typées dans le schéma `env` de
[astro.config.mjs](../astro.config.mjs). Ne mets jamais de valeur secrète dans
le code : renseigne-les dans `.env` (local, gitignoré) et sur Vercel.

| Variable | Contexte | Rôle | Obligatoire |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | serveur (secret) | Chatbot | Oui pour le chat |
| `SITE_URL` | serveur (public) | URL canonique (robots, OG, contrôle d'origine) | Recommandé |
| `GOOGLE_SITE_VERIFICATION` | serveur (public) | Search Console | Optionnel |
| `BING_SITE_VERIFICATION` | serveur (public) | Bing Webmaster | Optionnel |
| `PUBLIC_GA_MEASUREMENT_ID` | client | Google Analytics 4 | Optionnel |
| `PUBLIC_GTM_ID` | client | Google Tag Manager | Optionnel |
| `PUBLIC_GOOGLE_MAPS_API_KEY` | client | Google Maps (composant) | Optionnel |
| `PUBLIC_CONSENT_ENABLED` | client | Active le bandeau de consentement | Optionnel |
| `PUBLIC_PRIVACY_POLICY_URL` | client | Lien politique de confidentialité | Optionnel |

> Les valeurs réelles ne sont pas dans cette doc publique. Elles vivent dans
> `.env` (local) et dans les réglages Vercel.

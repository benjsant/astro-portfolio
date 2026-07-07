# astro-portfolio

Portfolio et blog personnel de **Benjamin Santrisse**, développeur IA et Data Engineering.

Site statique généré avec Astro 6, Tailwind CSS v4 et MDX, développé en Docker et déployé sur Vercel. Inclut un assistant conversationnel embarqué (DeepSeek) qui répond aux questions des visiteurs sur le portfolio.

## Documentation

La documentation technique complète est dans [`docs/`](docs/README.md) : architecture, contenu, CV, chatbot, configuration, développement, déploiement. À lire en premier si tu reprends le projet.

## Stack

| Couche | Stack |
| ------ | ----- |
| Framework | Astro 6, React 19 (chat), TypeScript |
| Styling | Tailwind CSS v4, thèmes OKLCH |
| Contenu | MDX, Content Layer API (schémas Zod) |
| Chatbot | API DeepSeek (`deepseek-chat`), appel unique, rate-limit par IP |
| SEO | JSON-LD (Person, BlogPosting, FAQ), sitemap, OG, RSS, robots |
| Déploiement | Vercel (adaptateur), Node en local |

## Démarrage

```bash
pnpm install
cp .env.example .env       # renseigner DEEPSEEK_API_KEY pour le chat
pnpm dev                   # http://localhost:4321
```

### Avec Docker

```bash
docker compose up
```

## Scripts

| Commande | Action |
| -------- | ------ |
| `pnpm dev` | Serveur de dev sur :4321 |
| `pnpm build` | Build statique dans `dist/` |
| `pnpm preview` | Preview du build |
| `pnpm check` | Type-check Astro + TypeScript |
| `pnpm lint` | ESLint |
| `pnpm validate` | lint + check + build |
| `pnpm test` | Tests Vitest |
| `pnpm test:e2e` | Tests Playwright |

## Architecture

```
src/
  components/    UI réutilisable (cards, badges, hero, chat, etc.)
  content/
    blog/fr/     Articles MDX
    projects/    Projets MDX
    stack/       Fiches techno MDX
  layouts/       Gabarits de page
  pages/
    api/chat.ts  Chatbot DeepSeek (seule route serveur)
    blog/        Listing + [...slug]
    projects/    Listing + [slug]
    cv.astro     CV version ATS stricte
    cv-design.astro  CV version design
    *.astro      accueil, about, contact, 404
  config/        site.config.ts, nav.config.ts, consent.config.ts
  data/          cv.ts (contenu des deux CV)
  lib/           portfolio-data, schema JSON-LD, utils
```

Détails dans [`docs/architecture.md`](docs/architecture.md).

## Choix d'archi notables

- **Chatbot en appel unique.** `/api/chat` ([src/pages/api/chat.ts](src/pages/api/chat.ts)) injecte les projets et articles dans le prompt système puis fait un seul appel DeepSeek. Rate-limit par IP (10 requêtes par heure), contrôle d'origine, prompt cadré au portfolio.
- **Contenu typé.** Collections Zod pour blog, projects, stack, authors, faqs. Toutes les frontmatter MDX sont validées au build.
- **Deux CV.** `/cv` en version ATS stricte (une colonne, sans photo) et `/cv-design` en version mise en page, imprimables en PDF.
- **SEO complet.** JSON-LD Person et ProfessionalService et BlogPosting et FAQ, OG par page, sitemap auto, RSS, robots, manifest PWA.
- **Adaptateur selon la cible.** La variable `DEPLOY_TARGET` bascule l'adaptateur Astro entre Vercel et Node.

## Crédits

Démarré depuis le thème [Astro Rocket](https://github.com/hansmartens68/astro-rocket) (MIT) puis fortement personnalisé : chatbot DeepSeek, contenus, branding, CV, structure des pages.

## Licence

MIT, voir [LICENSE](LICENSE).

# astro-portfolio

Portfolio et blog personnel de **Benjamin Santrisse** — Développeur IA & Data Engineering.

Site statique généré avec Astro 6, Tailwind CSS v4, MDX et déploiement Docker. Inclut un agent conversationnel embarqué (DeepSeek + tool-calling) qui répond aux questions des visiteurs sur le portfolio.

## Stack

| Couche       | Stack                                                    |
| ------------ | -------------------------------------------------------- |
| Framework    | Astro 6 · React 19 · TypeScript                          |
| Styling      | Tailwind CSS v4 · OKLCH theming                          |
| Contenu      | MDX · Content Layer API (Zod schemas)                    |
| Agent IA     | DeepSeek API · tool-calling · rate-limit IP              |
| Formulaires  | Resend · Zod · honeypot anti-spam                        |
| SEO          | JSON-LD (Person, BlogPosting, FAQ) · sitemap · OG · RSS  |
| Recherche    | Pagefind (statique, no JS dependency on the user)        |
| Déploiement  | Docker · Vercel · Netlify · Cloudflare Pages (adapter)   |

## Démarrage

```bash
pnpm install
cp .env.example .env       # renseigner DEEPSEEK_API_KEY, RESEND_API_KEY si besoin
pnpm dev                   # http://localhost:4321
```

### Avec Docker

```bash
docker compose up
```

## Scripts

| Commande            | Action                                       |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | Serveur de dev sur :4321                     |
| `pnpm build`        | Build statique dans `dist/`                  |
| `pnpm preview`      | Preview du build                             |
| `pnpm check`        | Type-check Astro + TypeScript                |
| `pnpm lint`         | ESLint                                       |
| `pnpm validate`     | lint + check + build                         |
| `pnpm test`         | Tests Vitest (validation des schemas API)    |

## Architecture

```
src/
├── components/    # UI réutilisable (cards, badges, hero, etc.)
├── content/
│   ├── blog/fr/   # Articles MDX (FR)
│   ├── projects/  # Projets MDX
│   └── stack/     # Fiches techno MDX
├── layouts/       # BaseLayout, BlogLayout, ProjectLayout
├── pages/
│   ├── api/       # /api/chat (agent DeepSeek), /api/contact (Resend), /api/newsletter
│   ├── blog/      # listing + [...slug]
│   ├── projects/  # listing + [slug]
│   └── *.astro    # accueil, about, contact, 404
├── config/        # site.config.ts, nav.config.ts, consent.config.ts
└── lib/           # portfolio-data, schema JSON-LD, utils
```

## Choix d'archi notables

- **Agent chat embarqué.** `/api/chat` ([src/pages/api/chat.ts](src/pages/api/chat.ts)) — agent DeepSeek tool-calling avec `search_portfolio`, rate-limit IP (10 req/h), origin check, system prompt scope-locked au portfolio.
- **Sécurité API.** `checkOrigin: true`, `envField` typés avec Zod, honeypot anti-bot, rate-limit en mémoire.
- **Contenu typé.** Collections Zod pour blog/projects/stack/authors/faqs — toutes les frontmatter MDX sont validées au build.
- **SEO complet.** JSON-LD Person + ProfessionalService + BlogPosting + FAQ, OG par page, sitemap auto, RSS, robots, manifest PWA.
- **Multi-déploiement.** Variable `DEPLOY_TARGET` qui switch l'adapter Astro (Vercel / Netlify / Node).

## Crédits

Démarré depuis le thème [Astro Rocket](https://github.com/hansmartens68/astro-rocket) (MIT) puis fortement personnalisé : agent DeepSeek, contenus, branding, structure pages.

## Licence

MIT — voir [LICENSE](LICENSE).

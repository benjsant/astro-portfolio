# Développement

## Prérequis

Node 22 et pnpm. Le plus simple reste Docker, qui gère tout pour toi.

## Lancer le projet

### Avec Docker (recommandé)

```bash
docker compose up            # lance le serveur de dev
# site sur http://localhost:4321
docker compose down          # arrête
docker logs astro-portfolio-dev   # voir les logs si ça plante
```

Le service (voir [docker-compose.yml](../docker-compose.yml)) utilise
`node:22-alpine`, conteneur `astro-portfolio-dev`, port `4321`. Au démarrage il
active pnpm via corepack, fait `pnpm install` puis `pnpm dev --host`. Le dossier
courant est monté dans le conteneur (les modifs se rechargent à chaud).

> Le conteneur de dev s'arrête parfois tout seul. Si le site ne répond plus :
> `docker compose up`.

### En local (sans Docker)

```bash
pnpm install
cp .env.example .env         # renseigner DEEPSEEK_API_KEY pour le chat
pnpm dev                     # http://localhost:4321
```

## Commandes

| Commande | Action |
|---|---|
| `pnpm dev` | Serveur de dev, rechargement à chaud, sur :4321 |
| `pnpm build` | Build statique dans `dist/` |
| `pnpm preview` | Prévisualise le build |
| `pnpm check` | Type-check Astro + TypeScript |
| `pnpm lint` | ESLint |
| `pnpm lint:fix` | ESLint avec corrections auto |
| `pnpm format` | Prettier (écriture) |
| `pnpm format:check` | Prettier (vérification seule) |
| `pnpm validate` | lint + check + build (le combo avant de pousser) |

Réflexe minimal avant de pousser : `pnpm build` (sinon le déploiement échoue).
Idéalement `pnpm validate`.

## Tests

Pas de tests automatisés pour l'instant. La validation repose sur `pnpm validate`
(lint + type-check + build) et sur le typage strict des collections de contenu
(schémas Zod) vérifié au build : une frontmatter invalide casse le build. Le combo
`pnpm validate` doit passer avant de pousser.

## Intégration continue

Deux workflows GitHub Actions dans `.github/workflows/` :

| Workflow | Rôle |
|---|---|
| `deploy.yml` | Checkout, setup pnpm + Node 22, `install --frozen-lockfile`, lint, type-check, build |
| `gitleaks.yml` | Scan de secrets à chaque push (empêche de committer une clé) |

## Workflow conseillé

1. `docker compose up` puis tester sur `http://localhost:4321`.
2. Modifier, vérifier à l'écran (rechargement à chaud).
3. `pnpm build` (ou laisser la CI le faire) pour confirmer que ça compile.
4. Commit puis push. Vercel déploie (voir [deploiement.md](deploiement.md)).

> Itère en local et ne pousse que quand c'est validé : ça évite de multiplier
> les déploiements pour rien.

## Pièges connus

- **Une `description` d'article de plus de 200 caractères casse le build.** Si
  la CI ou le conteneur échoue, regarde d'abord de ce côté (voir
  [contenu.md](contenu.md)).
- **Ne commite jamais `.env`** (gitignoré). Aucun secret dans le code.
- Le conteneur de dev peut s'arrêter seul : `docker compose up` le relance.

# Le chatbot

Un assistant conversationnel qui répond aux visiteurs sur le profil, les projets
et les articles. Deux morceaux :

| Partie | Fichier | Rôle |
|---|---|---|
| Front | [src/components/chat/ChatWidget.tsx](../src/components/chat/ChatWidget.tsx) | Interface React (bulle, historique) |
| Back | [src/pages/api/chat.ts](../src/pages/api/chat.ts) | Route serveur, appelle DeepSeek |

## Modèle et principe (appel unique)

Le back appelle l'API DeepSeek avec le modèle **`deepseek-chat`** (DeepSeek V3,
le moins cher). Le portfolio étant petit, le back fait **un seul appel** : il
injecte directement la liste des projets et articles dans le prompt système,
puis pose la question.

> Note d'historique : une version précédente utilisait un agent avec
> **tool-calling** (outil `search_portfolio`, boucle de plusieurs étapes). Ce
> mécanisme a été **retiré** au profit de l'appel unique, plus fiable et moins
> cher. Si tu lis encore "tool-calling" quelque part, c'est une trace périmée.

Le contexte injecté vient de `getPortfolioContext()` dans
[src/lib/portfolio-data.ts](../src/lib/portfolio-data.ts), qui formate projets
et articles en markdown. Il est mémoïsé (calculé une fois puis réutilisé).

## Garde-fous en place

Tous dans [src/pages/api/chat.ts](../src/pages/api/chat.ts) :

- **Rate-limit** : 10 requêtes par heure et par IP (`RATE_LIMIT_MAX = 10`,
  fenêtre d'1 heure), stocké en mémoire.
- **Contrôle d'origine** : `isAllowedOrigin()` rejette les requêtes hors du site.
- **Historique borné et nettoyé** : `sanitizeHistory()` valide et limite le
  contexte envoyé.
- **`max_tokens` plafonné** et température fixée dans `askDeepSeek()`.
- **Prompt cadré** : le `SYSTEM_PROMPT_BASE` fixe la persona, le périmètre
  (répondre seulement sur le portfolio) et une règle anti-invention (rester
  général plutôt que de combler un trou avec un détail inventé).
- **Clé jamais exposée** : la clé DeepSeek reste côté serveur, dans l'en-tête
  Authorization. Elle n'est jamais renvoyée au client ni au modèle.

## Variable d'environnement

| Variable | Rôle | Obligatoire |
|---|---|---|
| `DEEPSEEK_API_KEY` | Authentifie les appels DeepSeek | Oui, sinon le chat ne répond pas |

Déclarée en `secret` dans le schéma d'environnement de
[astro.config.mjs](../astro.config.mjs). Pense à poser un **plafond de dépense**
sur le dashboard DeepSeek au cas où la clé serait sollicitée abusivement.

## Modifier le comportement

- **Changer le ton ou les règles** : édite `SYSTEM_PROMPT_BASE`.
- **Changer ce que le chat connait** : ajuste `getPortfolioContext()` dans
  `portfolio-data.ts` (par défaut il liste projets puis articles).
- **Changer les limites** : `RATE_LIMIT_MAX`, `max_tokens`, température dans
  `chat.ts`.

import type { APIRoute } from 'astro';
import { searchPortfolio } from '@/lib/portfolio-data';

export const prerender = false;

// ── Rate limiting ────────────────────────────────────────────────────────────
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetIn: entry.resetAt - now };
}

// ── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es l'assistant du portfolio de Benjamin Santrisse, développeur IA & Data Engineering. Tu aides les visiteurs à découvrir son profil, ses projets et ses articles — de façon claire, directe et concrète.

## Ton & style
- **Tutoie le visiteur.** Le site est tutoyé partout, garde la même voix.
- Direct et naturel, jamais corporate ou rigide. Pas de "Je serais ravi de...". Va droit au but.
- Réponds en français.
- Utilise du **markdown structuré** :
  - **gras** pour les noms de projets, technos, chiffres clés
  - listes à puces dès que tu cites plusieurs projets, plusieurs technos, ou plusieurs étapes
  - liens markdown **systématiques** pour chaque projet ou article cité : [Titre](url)
- Longueur adaptée :
  - question simple (dispo, contact, profil) → 2-4 phrases
  - question sur un projet ou une techno → réponse structurée avec bullets, sections si besoin (6-12 phrases acceptable)
  - jamais de bloc monolithique : aère avec des sauts de ligne

## Toujours finir par une action
Termine **chaque réponse** par une suggestion concrète et cliquable, choisie selon le contexte :
- question sur un projet → lien direct vers la page projet + 1 article de blog lié si pertinent
- question profil / dispo / recrutement → propose le CV : [version classique](/cv) (sobre, ATS-friendly) ou [version design](/cv-design) (vitrine, plus visuelle) — les deux contiennent email, LinkedIn, GitHub et portfolio
- question exploratoire → propose 2-3 projets ou articles pertinents en bullets

Format de l'action : un mini-paragraphe court qui invite à cliquer. Pas de section "## Actions" formelle — reste naturel.

## Scope
Tu réponds :
- aux questions sur Benjamin (profil, projets, articles, stack, dispo, contact, parcours)
- aux questions techniques **qui peuvent rebondir vers ses projets** (ex: "c'est quoi le RAG ?" → réponse courte + lien vers [son article RAG/pgvector](/blog/rag-pgvector-deepseek))

Pour une question **complètement hors-sujet** (météo, actu, code générique sans lien avec son travail), réponds simplement :
"Je suis dédié au portfolio de Benjamin — pose-moi une question sur ses projets IA/Data, sa stack ou sa dispo. Tu peux aussi le joindre directement : santrissebenjamin.portfolio@gmail.com"

## Profil de Benjamin (résumé)
- **Développeur IA certifié RNCP Niveau 6** (Simplon, 2026)
- **Spécialités** : Python, FastAPI, LLMs (DeepSeek, RAG, agents tool-calling), MLOps (MLflow, XGBoost), Data Engineering (ETL, Prefect, Scrapy), PostgreSQL, Docker
- **Projet phare** : [InfiniDex](/projects/infinidex) — Pokédex IA avec agent à 9 outils, ETL Prefect, 572 Pokémon, 168 000+ fusions
- **Disponibilité** : recherche active (IA / ML Engineering / Data Engineering), démarrage immédiat
- **Localisation** : Marly (Nord), mobilité totale, télétravail OK
- **Contact** : santrissebenjamin.portfolio@gmail.com

## Outils
Utilise \`search_portfolio\` dès qu'une question porte sur un projet, un article, ou une techno spécifique. Cite ensuite **tous les résultats pertinents** trouvés avec leurs liens markdown.`;

// ── DeepSeek tools definition ─────────────────────────────────────────────────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_portfolio',
      description:
        "Cherche dans les projets et articles du portfolio de Benjamin. À utiliser quand la question porte sur un projet précis, une technologie, ou un article.",
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Mots-clés décrivant ce que cherche le visiteur (ex: "RAG pgvector", "Scrapy ETL", "monitoring")',
          },
        },
        required: ['query'],
      },
    },
  },
];

// ── Historique ────────────────────────────────────────────────────────────────
type ChatTurn = { role: 'user' | 'assistant'; content: string };

// Nettoie l'historique reçu du client : ne garde que des tours user/assistant
// valides, borne le nombre de tours et la longueur de chaque message pour
// éviter l'abus de tokens / injections de rôles arbitraires.
function sanitizeHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  const turns: ChatTurn[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue;
    const trimmed = content.trim();
    if (!trimmed) continue;
    turns.push({ role, content: trimmed.slice(0, 1000) });
  }
  // On garde au plus les 8 derniers tours (≈ 4 allers-retours).
  return turns.slice(-8);
}

// ── Agent loop ────────────────────────────────────────────────────────────────
async function runAgent(
  userMessage: string,
  history: ChatTurn[],
  apiKey: string
): Promise<string> {
  const messages: object[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userMessage },
  ];

  for (let i = 0; i < 3; i++) {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        tools: TOOLS,
        tool_choice: 'auto',
        max_tokens: 900,
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`);

    const data = await res.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    if (!message) throw new Error('No message in response');
    messages.push(message);

    // Final answer — no tool call
    if (choice.finish_reason === 'stop') {
      return message.content ?? 'Pas de réponse.';
    }

    // Tool call requested
    if (choice.finish_reason === 'tool_calls' && message.tool_calls?.length) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.function?.name === 'search_portfolio') {
          let args: { query?: string };
          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch {
            args = { query: userMessage };
          }

          const results = searchPortfolio(args.query ?? userMessage);
          const content =
            results.length > 0
              ? JSON.stringify(
                  results.map((r) => ({
                    type: r.type,
                    title: r.title,
                    description: r.description,
                    tags: r.tags,
                    url: r.url,
                  }))
                )
              : JSON.stringify({ message: 'Aucun résultat trouvé.' });

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content,
          });
        }
      }
      continue;
    }

    // Fallback
    return message.content ?? 'Pas de réponse.';
  }

  return "Désolé, je n'ai pas pu générer de réponse.";
}

// ── Origin check ─────────────────────────────────────────────────────────────
function isAllowedOrigin(request: Request): boolean {
  // En dev Astro (import.meta.env.DEV), on bypass pour ne pas bloquer localhost
  if (import.meta.env.DEV) return true;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const siteUrl = (import.meta.env.SITE_URL || '').replace(/\/$/, '');

  if (!siteUrl) return true;

  if (origin) return origin.startsWith(siteUrl);
  if (referer) return referer.startsWith(siteUrl);

  // Pas d'Origin ni de Referer → curl/Postman brut → rejeter
  return false;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  if (!isAllowedOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Accès refusé.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ip = getRateLimitKey(request);
  const { allowed, remaining, resetIn } = checkRateLimit(ip);

  if (!allowed) {
    const minutes = Math.ceil(resetIn / 60000);
    return new Response(
      JSON.stringify({
        error: `Limite atteinte. Réessaie dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(resetIn / 1000)),
        },
      }
    );
  }

  const apiKey = import.meta.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Service indisponible.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { message?: string; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Requête invalide.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userMessage = body.message?.trim();
  if (!userMessage || userMessage.length > 500) {
    return new Response(JSON.stringify({ error: 'Message invalide.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const history = sanitizeHistory(body.history);

  try {
    const reply = await runAgent(userMessage, history, apiKey);
    return new Response(JSON.stringify({ reply, remaining }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(remaining),
      },
    });
  } catch (err) {
    console.error('Agent error:', err);
    return new Response(
      JSON.stringify({ error: 'Erreur lors de la génération de la réponse.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

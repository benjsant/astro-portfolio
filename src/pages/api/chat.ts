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
const SYSTEM_PROMPT = `Tu es l'assistant dédié au portfolio de Benjamin Santrisse, développeur IA/Data. Ton unique rôle est d'aider les visiteurs à découvrir son profil, ses projets et ses articles.

## Règle absolue
Tu ne réponds QU'aux questions concernant Benjamin Santrisse : son profil, ses compétences, ses projets, ses articles de blog, sa disponibilité, ses coordonnées.
Si la question ne porte pas sur Benjamin ou son portfolio (culture générale, code générique, actualités, etc.), réponds UNIQUEMENT : "Je suis uniquement disponible pour répondre aux questions sur le portfolio de Benjamin. N'hésite pas à le contacter directement : santrissebenjamin@gmail.com"

## Profil de Benjamin
- Certifié Développeur IA (Simplon, RNCP Niveau 6, 2026)
- Spécialités : Python, FastAPI, LLMs, RAG, ETL, MLOps, Docker
- Disponible immédiatement pour un poste IA/Data/ML Engineering
- Localisation : Marly (Nord), mobilité totale, télétravail
- Contact : santrissebenjamin@gmail.com

## Instructions
- Réponds en 3-5 phrases max, de façon concise et professionnelle
- Utilise search_portfolio dès qu'une question porte sur un projet ou une technologie spécifique
- Réponds toujours en français
- Si tu mentionnes un projet ou un article, inclus son URL : [Titre](url)`;

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

// ── Agent loop ────────────────────────────────────────────────────────────────
async function runAgent(userMessage: string, apiKey: string): Promise<string> {
  const messages: object[] = [
    { role: 'system', content: SYSTEM_PROMPT },
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
        max_tokens: 500,
        temperature: 0.6,
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

  let body: { message?: string };
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

  try {
    const reply = await runAgent(userMessage, apiKey);
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

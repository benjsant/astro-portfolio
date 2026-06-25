import type { APIRoute } from 'astro';
import { getPortfolioContext } from '@/lib/portfolio-data';

export const prerender = false;

// -- Rate limiting -----------------------------------------------------------
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

// -- System prompt -----------------------------------------------------------
const SYSTEM_PROMPT_BASE = `Tu es l'assistant du portfolio de Benjamin Santrisse, développeur IA & Data Engineering. Tu aides les visiteurs à découvrir son profil, ses projets et ses articles, de façon claire, directe et concrète.

## Ton & style
- **Tutoie le visiteur.** Le site est tutoyé partout, garde la même voix.
- Direct et naturel, jamais corporate ou rigide. Pas de "Je serais ravi de...". Va droit au but.
- Réponds en français.
- Utilise du **markdown structuré** :
  - **gras** pour les noms de projets, technos, chiffres clés
  - listes à puces dès que tu cites plusieurs projets, plusieurs technos, ou plusieurs étapes
  - liens markdown **systématiques** pour chaque projet ou article cité : [Titre](url)
- Longueur adaptée :
  - question simple (dispo, contact, profil) -> 2-4 phrases
  - question sur un projet ou une techno -> réponse structurée avec bullets (6-12 phrases max)
  - jamais de bloc monolithique : aère avec des sauts de ligne
- Ne renvoie JAMAIS de bloc de code brut, de JSON, ni de balises internes : tu écris des réponses en langage naturel pour un visiteur.

## Toujours finir par une action
Termine **chaque réponse** par une suggestion concrète et cliquable :
- question sur un projet -> lien direct vers la page projet + 1 article de blog lié si pertinent
- question profil / dispo / recrutement -> propose le CV : [version classique](/cv) (sobre, ATS-friendly) ou [version design](/cv-design) (vitrine, plus visuelle)
- question exploratoire -> propose 2-3 projets ou articles pertinents en bullets

Reste naturel : un mini-paragraphe court qui invite à cliquer. Pas de section "## Actions" formelle.

## Scope
Tu réponds aux questions sur Benjamin (profil, projets, articles, stack, dispo, contact, parcours) et aux questions techniques qui peuvent rebondir vers ses projets.

Pour une question **complètement hors-sujet** (météo, actu, code générique sans lien avec son travail), réponds simplement :
"Je suis dédié au portfolio de Benjamin : pose-moi une question sur ses projets IA/Data, sa stack ou sa dispo. Tu peux aussi le joindre directement : santrissebenjamin.portfolio@gmail.com"

## Profil de Benjamin (résumé)
- **Développeur IA certifié RNCP Niveau 6** (Simplon, 2026)
- **Spécialités** : Python, FastAPI, LLMs (DeepSeek, RAG, agents tool-calling), MLOps (MLflow, XGBoost), Data Engineering (ETL, Prefect, Scrapy), PostgreSQL, Docker
- **Disponibilité** : recherche active (CDI ou CDD), démarrage immédiat
- **Localisation** : Marly (Nord), mobilité Lille / Valenciennes, télétravail OK
- **Contact** : santrissebenjamin.portfolio@gmail.com

## Règle sur les liens
Ne déduis ou n'invente **jamais** d'URL GitHub. Pour pointer vers un projet ou un article, utilise **uniquement** les liens fournis dans la liste ci-dessous (pages /projects/... et /blog/...). Ne spécule jamais sur le compte ou l'organisation d'hébergement d'un dépôt.

## Exactitude (aucune invention)
N'invente **jamais** d'information. Tu ne cites que ce qui figure dans le profil ci-dessus et dans la liste de projets/articles ci-dessous. Si un détail précis n'est pas fourni (type de base de données, chiffre, date, nom d'outil exact, version), **reste général plutôt que de combler le trou** : écris "une base de données" plutôt que d'inventer "Redis", "plusieurs outils" plutôt qu'un nombre. En cas de doute, renvoie vers la page du projet ou propose à la personne de contacter Benjamin directement. Une réponse prudente vaut mieux qu'une réponse fausse.`;

// La liste complète des projets et articles est injectée une seule fois, mise en
// cache au niveau du module (elle ne change pas entre deux requêtes).
let systemPromptCache: string | null = null;
async function getSystemPrompt(): Promise<string> {
  if (systemPromptCache) return systemPromptCache;
  const context = await getPortfolioContext();
  systemPromptCache = `${SYSTEM_PROMPT_BASE}

## Projets et articles de Benjamin (liste complète, source unique de vérité)
Appuie-toi UNIQUEMENT sur cette liste pour citer ses projets/articles et leurs liens.

${context}`;
  return systemPromptCache;
}

// -- Historique --------------------------------------------------------------
type ChatTurn = { role: 'user' | 'assistant'; content: string };

// Nettoie l'historique reçu du client : ne garde que des tours user/assistant
// valides, borne le nombre de tours et la longueur de chaque message.
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
  // On garde au plus les 8 derniers tours (environ 4 allers-retours).
  return turns.slice(-8);
}

// -- Appel DeepSeek (un seul appel, sans outil ni boucle d'agent) ------------
async function askDeepSeek(
  systemPrompt: string,
  history: ChatTurn[],
  userMessage: string,
  apiKey: string
): Promise<string> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`);

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "Désolé, je n'ai pas pu générer de réponse.";
}

// -- Origin check ------------------------------------------------------------
function isAllowedOrigin(request: Request): boolean {
  // En dev Astro, on bypass pour ne pas bloquer localhost.
  if (import.meta.env.DEV) return true;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const siteUrl = (import.meta.env.SITE_URL || '').replace(/\/$/, '');

  if (!siteUrl) return true;
  if (origin) return origin.startsWith(siteUrl);
  if (referer) return referer.startsWith(siteUrl);
  // Pas d'Origin ni de Referer -> curl/Postman brut -> rejeter
  return false;
}

// -- Route handler -----------------------------------------------------------
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
    const systemPrompt = await getSystemPrompt();
    const reply = await askDeepSeek(systemPrompt, history, userMessage, apiKey);
    return new Response(JSON.stringify({ reply, remaining }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(remaining),
      },
    });
  } catch (err) {
    console.error('Chat error:', err);
    return new Response(
      JSON.stringify({ error: 'Erreur lors de la génération de la réponse.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

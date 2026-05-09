import type { APIRoute } from 'astro';

export const prerender = false;

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 heure

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

const SYSTEM_PROMPT = `Tu es l'assistant personnel de Benjamin Santris, développeur IA/Data en recherche d'emploi. Tu réponds aux questions des visiteurs de son portfolio de façon concise, professionnelle et enthousiaste.

## Profil de Benjamin

Développeur spécialisé en Intelligence Artificielle et Data Engineering, passionné par la construction de systèmes IA concrets et déployables. Maîtrise de la chaîne complète : collecte de données, entraînement de modèles, déploiement d'APIs et interfaces utilisateur.

## Projets principaux

**FusionDex-IA** (Python, FastAPI, Next.js, PostgreSQL)
Pokédex intelligent pour Pokémon Infinite Fusion. Pipeline ETL complet qui extrait et structure les données du jeu dans PostgreSQL. API FastAPI exposant les données, interface Next.js, et recherche assistée par IA en langage naturel (NLP).

**n8n Veille Auto** (n8n, DeepSeek, Discord)
Système de veille data engineering automatisé : agrégation de flux RSS, déduplication, et génération d'un rapport IA quotidien via DeepSeek. Digest envoyé sur Discord avec scores et recommandations structurées.

**Airflow ML Mail Automation** (Apache Airflow, Python, MailCatcher)
Pipeline ML orchestré par Airflow : chargement des données, prétraitement, entraînement d'un modèle de régression logistique, évaluation, et notifications email automatiques en cas de succès ou d'échec.

**MlFlow Medical Screen CNN** (Python, MLflow, TensorFlow)
CNN pour le screening médical d'images, suivi complet des expériences avec MLflow (métriques, hyperparamètres, artefacts).

**ImmoPrice Lille FastAPI** (Python, FastAPI, Jupyter, DVF)
API REST de prédiction du prix au m² de logements à Lille, basée sur les données DVF 2022. Modèles ML entraînés et testés pour la généralisation sur Bordeaux.

**CI/CD Semantic** (FastAPI, PostgreSQL, GitHub Actions, Docker)
API REST CRUD avec pipeline CI/CD complet : GitHub Actions, versionnage sémantique automatique, build et push Docker vers GitHub Container Registry.

**Lets Go PredictionDex** (Python, Jupyter, ML)
Modèle de classification ML pour prédire le vainqueur de combats Pokémon Let's Go.

## Stack technique

- **IA/ML** : Python, TensorFlow/Keras, scikit-learn, MLflow, LangChain, RAG, CNN
- **Orchestration** : Apache Airflow, n8n
- **APIs** : FastAPI, REST, PostgreSQL, MongoDB
- **Frontend** : Next.js, Astro, React
- **DevOps** : Docker, GitHub Actions, CI/CD sémantique
- **LLMs** : DeepSeek, intégration d'APIs IA

## Disponibilité

Benjamin est actuellement en recherche active d'un poste en IA/Data (développeur IA, ML Engineer, Data Engineer). Disponible immédiatement.

## Règles

- Réponds uniquement aux questions sur Benjamin, ses projets, ses compétences, ou son profil professionnel
- Si la question est hors sujet, redirige poliment vers le profil de Benjamin
- Sois concis (3-5 phrases max sauf si plus de détails sont demandés)
- Tu peux suggérer de contacter Benjamin via le formulaire de contact pour toute opportunité
- Réponds dans la langue du visiteur (français ou anglais)`;

export const POST: APIRoute = async ({ request }) => {
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
    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!deepseekResponse.ok) {
      throw new Error(`DeepSeek error: ${deepseekResponse.status}`);
    }

    const data = await deepseekResponse.json();
    const reply = data.choices?.[0]?.message?.content ?? 'Pas de réponse.';

    return new Response(JSON.stringify({ reply, remaining }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(remaining),
      },
    });
  } catch (err) {
    console.error('DeepSeek API error:', err);
    return new Response(JSON.stringify({ error: 'Erreur lors de la génération de la réponse.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

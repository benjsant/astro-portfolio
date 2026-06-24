import type { APIRoute } from 'astro';

/**
 * /robots.txt
 *
 * Politique :
 *   - Autorise les moteurs de recherche classiques (Google, Bing, DuckDuckGo)
 *   - Bloque les crawlers d'entraînement de modèles IA (OpenAI, Anthropic, Google AI,
 *     Common Crawl, Perplexity, Meta AI, Bytedance, Amazon, Apple AI, etc.)
 *   - Bloque /api/ (endpoints serveur)
 *
 * Note légale :
 *   Le `robots.txt` n'est pas juridiquement contraignant en droit français/européen
 *   mais documente clairement le refus de l'auteur - utile en cas de litige.
 *   Les bots qui ignorent ce fichier engagent leur responsabilité civile (CPI L.122-5)
 *   et CCPA/GDPR pour les données personnelles.
 */
export const GET: APIRoute = ({ site }) => {
  const siteUrl = site?.toString() || 'https://benjamin-santrisse.vercel.app';

  // Bots d'entraînement IA à exclure (mise à jour 2026)
  const aiCrawlers = [
    'GPTBot',                 // OpenAI training crawler
    'ChatGPT-User',           // OpenAI on-demand browse
    'OAI-SearchBot',          // OpenAI search
    'ClaudeBot',              // Anthropic training crawler
    'Claude-Web',              // Anthropic on-demand browse
    'anthropic-ai',           // Anthropic legacy
    'Google-Extended',        // Google AI training (Gemini)
    'PerplexityBot',          // Perplexity
    'Perplexity-User',        // Perplexity on-demand
    'CCBot',                  // Common Crawl (alimente nombreux LLMs)
    'cohere-ai',              // Cohere
    'Bytespider',             // Bytedance / TikTok
    'FacebookBot',            // Meta AI
    'meta-externalagent',     // Meta AI nouveau crawler
    'Meta-ExternalAgent',     // Meta AI variant
    'Amazonbot',              // Amazon (Alexa AI)
    'Applebot-Extended',      // Apple Intelligence
    'Diffbot',                // Diffbot scrape commercial
    'omgili',                 // Omgili archives
    'omgilibot',              // Omgili variant
    'YouBot',                 // You.com search/AI
    'AI2Bot',                 // Allen Institute for AI
    'ImagesiftBot',           // ImageSift
    'Timpibot',               // Timpi search/AI
    'Webzio-Extended',        // Webz.io
    'Kangaroo Bot',           // Kangaroo
    'PetalBot',               // Huawei
    'AdsBot-Google',          // Pour éviter le ciblage publicitaire IA
  ];

  const blocks = aiCrawlers
    .map((bot) => `User-agent: ${bot}\nDisallow: /`)
    .join('\n\n');

  const robotsTxt = `
# Moteurs de recherche classiques : OK
User-agent: Googlebot
User-agent: Bingbot
User-agent: DuckDuckBot
User-agent: Slurp
User-agent: Yandex
Allow: /
Disallow: /api/

# Robots IA / scrapers d'entraînement LLM : interdit
${blocks}

# Tous les autres : autorisés, sauf /api/
User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${siteUrl}sitemap-index.xml
`.trim();

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};

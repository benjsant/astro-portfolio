import { getCollection } from 'astro:content';

export interface PortfolioItem {
  type: 'project' | 'article';
  title: string;
  description: string;
  tags: string[];
  url?: string;
}

/**
 * Construit l'index de recherche du chatbot directement depuis les collections
 * de contenu (projets + articles de blog). Source de vérité unique : plus de
 * liste écrite à la main à maintenir en parallèle (qui dérivait).
 *
 * - Projets : tous les non-draft, triés par `order`.
 * - Articles : locale fr, non-draft, triés du plus récent au plus ancien.
 */
async function getPortfolioItems(): Promise<PortfolioItem[]> {
  const [projects, posts] = await Promise.all([
    getCollection('projects', ({ data }) => data.draft !== true),
    getCollection('blog', ({ data }) => data.locale === 'fr' && data.draft !== true),
  ]);

  const projectItems: PortfolioItem[] = projects
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
    .map((p) => ({
      type: 'project',
      title: p.data.title,
      description: p.data.description,
      tags: p.data.tags ?? [],
      url: `/projects/${p.id}`,
    }));

  const articleItems: PortfolioItem[] = posts
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf())
    .map((a) => ({
      type: 'article',
      title: a.data.title,
      description: a.data.description,
      tags: a.data.tags ?? [],
      url: `/blog/${a.id.replace('fr/', '')}`,
    }));

  return [...projectItems, ...articleItems];
}

export async function searchPortfolio(query: string, limit = 4): Promise<PortfolioItem[]> {
  const items = await getPortfolioItems();

  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length === 0) return items.slice(0, limit);

  const scored = items.map((item) => {
    const score = words.reduce((acc, w) => {
      // Titre = poids 3, tags = poids 2, description = poids 1
      const inTitle = item.title.toLowerCase().includes(w) ? 3 : 0;
      const inTags = item.tags.some((t) => t.toLowerCase().includes(w)) ? 2 : 0;
      const inDesc = item.description.toLowerCase().includes(w) ? 1 : 0;
      return acc + inTitle + inTags + inDesc;
    }, 0);
    return { item, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item);
}

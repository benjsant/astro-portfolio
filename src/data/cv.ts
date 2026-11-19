/**
 * CV - données structurées
 *
 * Tout le contenu du CV vit ici. La page `/cv` boucle sur ces données et
 * génère le HTML automatiquement.
 *
 * Pour ajouter / modifier :
 *   - une compétence  → `skills[]`
 *   - un projet       → `projects[]`
 *   - une expérience  → `experiences[]`
 *   - une formation   → `education[]`
 *   - une certification → `certifications[]`
 *   - un centre d'intérêt → `interests[]`
 *   - un canal de contact → `contact[]`
 *
 * L'ordre dans le tableau = l'ordre d'affichage.
 *
 * Photo : pose un fichier dans `public/photo.jpg` (ratio ~3:4, ~432×528 px).
 * La page le détecte automatiquement au build.
 *
 * Téléphone : jamais écrit ici. Voir `privatePhone()` plus bas.
 */
import { CV_PHONE } from 'astro:env/server';

export interface ContactItem {
  label: string;
  value: string;
  href?: string;
}

export interface SkillRow {
  category: string;
  value: string;
}

export interface Project {
  title: string;
  repo: string;
  /** Période courte du projet (ex: "Janvier - mars 2026"). Optionnel. */
  period?: string;
  /** Technos (ligne sous le titre). Optionnel : vide = pas de ligne. */
  stack?: string;
  description: string;
}

export interface Experience {
  org: string;
  role: string;
  date: string;
  tasks: string[];
  /** Environnement technique. Optionnel : vide = pas de ligne / pas de tags. */
  stack?: string;
}

export interface EducationEntry {
  date: string;
  title: string;
  school: string;
}

export interface Certification {
  date: string;
  title: string;
}

export interface Interest {
  title: string;
  description: string;
}

export interface CVData {
  header: {
    name: string;
    role: string;
    summary: string;
  };
  contact: ContactItem[];
  /** Infos complémentaires (permis, mobilité…) - affichées comme les contacts. */
  details: { label: string; value: string }[];
  skills: SkillRow[];
  /**
   * Mots-clés ATS complémentaires (compétences réelles, non détaillées dans
   * `skills`). Rendus sur `/cv` uniquement, en fin de section Compétences.
   * `hidden: true` = texte blanc sur blanc (lisible par les parseurs, invisible
   * à l'œil). `hidden: false` = ligne visible, en petit gris.
   */
  keywords: { hidden: boolean; items: string[] };
  projects: Project[];
  experiences: Experience[];
  education: EducationEntry[];
  certifications: Certification[];
  interests: Interest[];
}

/**
 * Téléphone privé : lu depuis CV_PHONE (fichier .env.local, ignoré par Git).
 *
 * Affiché UNIQUEMENT en `astro dev` (ex. `pnpm cv:private`), jamais dans un
 * build : même si CV_PHONE était défini par erreur sur Vercel, le site publié
 * et le PDF téléchargeable n'en contiendraient rien. Vide ou absent => aucune
 * ligne téléphone (ni libellé, ni séparateur).
 *
 * Double condition : `DEV` seul ne suffit pas, il vaut `true` pendant un
 * `astro build` lancé avec NODE_ENV=development (cas du conteneur de dev).
 * `MODE` reste « production » pour tout build, quel que soit NODE_ENV.
 */
function privatePhone(): ContactItem[] {
  if (!import.meta.env.DEV || import.meta.env.MODE !== 'development') return [];
  const raw = (CV_PHONE ?? '').replace(/[\s.-]/g, '');
  if (!raw) return [];
  const national = raw.replace(/^\+33/, '0');
  if (!/^0\d{9}$/.test(national)) {
    console.warn('[cv] CV_PHONE ignoré : format attendu 06XXXXXXXX ou +336XXXXXXXX.');
    return [];
  }
  return [
    {
      label: 'Téléphone',
      value: national.replace(/(\d{2})(?=\d)/g, '$1 '),
      href: `tel:+33${national.slice(1)}`,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENU DU CV
// ─────────────────────────────────────────────────────────────────────────────
export const cv: CVData = {
  header: {
    name: 'Benjamin Santrisse',
    role: 'Développeur Backend Python (API, IA appliquée)',
    summary:
      "Développeur Python spécialisé en IA et backend, certifié Développeur IA (RNCP niveau 6) à l'issue d'une reconversion. Conçoit des projets concrets et conteneurisés (Docker) : agents LLM, pipelines MLOps, ETL et APIs FastAPI.",
  },

  contact: [
    // Email principal - visible dans le CV PDF téléchargé (destiné aux recruteurs).
    // Sur les pages site, c'est l'email portfolio dédié + obfuscation JS.
    { label: 'Mail', value: 'santrissebenjamin@gmail.com', href: 'mailto:santrissebenjamin@gmail.com' },
    ...privatePhone(),
    { label: 'Portfolio', value: 'benjamin-santrisse.vercel.app', href: 'https://benjamin-santrisse.vercel.app' },
    { label: 'LinkedIn', value: 'linkedin.com/in/benjamin-santrisse', href: 'https://www.linkedin.com/in/benjamin-santrisse/' },
    { label: 'GitHub', value: 'github.com/benjsant', href: 'https://github.com/benjsant' },
  ],

  details: [
    { label: 'Recherche', value: 'CDI ou CDD, disponible immédiatement' },
    { label: 'Permis', value: 'B, véhiculé' },
    { label: 'Mobilité', value: 'Valenciennois et métropole lilloise' },
  ],

  skills: [
    { category: 'IA & Données', value: 'Machine Learning, MLOps, Pandas, NumPy, Scikit-learn, MLflow, XGBoost' },
    { category: 'IA générative', value: 'LLMs, RAG, Agents IA (ReAct, tool-calling), DeepSeek, Prompt engineering' },
    { category: 'Langages', value: 'Python, SQL, TypeScript, JavaScript, PHP, HTML/CSS' },
    { category: 'Frameworks', value: 'FastAPI, Django, Symfony, React, Next.js' },
    { category: 'Bases de données', value: 'MySQL, PostgreSQL, MongoDB, pgvector' },
    { category: 'Dev & DevOps', value: 'Docker, Git, pytest, CI/CD GitHub Actions, Linux, Node.js' },
    { category: 'Langues', value: 'Français (langue maternelle), anglais technique' },
  ],

  // Outils réellement utilisés dans les projets publics, non détaillés dans
  // `skills`. Ligne VISIBLE : du texte caché (blanc sur blanc) ressort en
  // vrac dans l'aperçu texte des logiciels de recrutement et est mal vu.
  keywords: {
    hidden: false,
    items: [
      'API REST', 'Streamlit', 'Apache Airflow', 'Prefect', 'n8n', 'LangGraph', 'MCP',
      'PyTorch (CNN)', 'Jupyter', 'Pydantic', 'Flask', 'Scrapy', 'Prometheus', 'Grafana',
      'Azure', 'Bash', 'Podman', 'Flutter', 'Gemini',
    ],
  },

  projects: [
    {
      title: 'Job Hunter - pipeline de candidature assisté par IA',
      repo: 'https://github.com/benjsant/job_hunter',
      period: 'Juin - août 2026',
      stack: 'Python · n8n · LangGraph · FastAPI · PostgreSQL/pgvector · Docker',
      description:
        "Système de recherche d'emploi exécuté en local (Docker Compose) : collecte multi-API (8 workflows n8n), déduplication sémantique (pgvector), scoring hybride LLM, agent LangGraph appuyé sur le registre INSEE et génération de CV/lettres PDF ciblés par offre. Plus de 110 tests pytest, CI GitHub Actions.",
    },
    {
      title: 'InfiniDex - Pokédex augmenté par IA',
      repo: 'https://github.com/benjsant/InfiniDex',
      period: 'Avril - juillet 2026',
      stack: 'Python · FastAPI · Next.js · PostgreSQL · Prefect · Docker',
      description:
        "Agent LLM multi-provider à 9 outils (DeepSeek/OpenRouter/Ollama, sans LangChain) avec streaming SSE temps réel. Pipeline ETL Prefect (orchestration, détection de changements par SHA, alertes Discord) sur 572 Pokémon et 168 000+ fusions.",
    },
    {
      title: 'PredictionDex - prédiction de combats Pokémon',
      repo: 'https://github.com/benjsant/predictiondex',
      period: 'Janvier - mars 2026',
      stack: 'Python · XGBoost · FastAPI · PostgreSQL · Docker',
      description:
        "Modèle XGBoost entraîné sur un dataset de combats simulés. Pipeline MLOps de bout en bout : suivi des expériences avec MLflow, promotion automatique du meilleur modèle, API FastAPI et interface Streamlit.",
    },
    {
      title: 'Audiomancy - génération de playlists assistée par IA',
      repo: 'https://github.com/ABA-DEV-IA/Audiomancy',
      period: 'Juillet 2025 - mars 2026',
      stack: 'Python · FastAPI · Next.js · MongoDB · Docker',
      description:
        "Projet en équipe. Agent ReAct DeepSeek (boucle Thought/Action/Observation) relié à l'API Jamendo pour générer des playlists musicales. Stack monitoring Prometheus/Grafana, déployé sur Azure pendant le projet.",
    },
  ],

  experiences: [
    {
      org: 'CAF du Nord - Agence de Valenciennes',
      role: 'Développeur web Symfony - stages successifs',
      date: 'Mai 2016 - mai 2019 (24 semaines cumulées)',
      tasks: [
        "Développement et intégration d'interfaces web avec Symfony et Bootstrap dans des applications internes",
        "Participation au développement d'une plateforme de gestion des espaces de travail",
        "Analyse des besoins et mise en œuvre de solutions techniques",
        "Maintenance et évolution des applications existantes",
      ],
      stack: 'PHP · Symfony · Bootstrap · Git · PostgreSQL',
    },
  ],

  education: [
    {
      date: '2025 - 2026',
      title: 'Développeur en intelligence artificielle - certification RNCP niveau 6 (bac+3/4)',
      school: 'Simplon, Lille',
    },
    {
      date: '2018 - 2019',
      title: 'Licence Pro SIO, option Développement',
      school: 'ISTV de Valenciennes (UPHF, ex-UVHC)',
    },
    {
      date: '2015 - 2017',
      title: 'BTS SIO, option SLAM',
      school: 'Lycée Henri Wallon, Valenciennes',
    },
  ],

  certifications: [
    {
      date: '2025',
      title: 'Gérer un projet en mobilisant les méthodes agiles',
    },
  ],

  interests: [
    { title: 'Veille technologique', description: 'IA, open source, tendances dev' },
    { title: 'Trottinette classique', description: 'mobilité douce et loisir' },
  ],
};

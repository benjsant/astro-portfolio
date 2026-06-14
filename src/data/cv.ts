/**
 * CV – données structurées
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
 */

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
  /** Période courte du projet (ex: "Janvier – Mars 2026"). Optionnel. */
  period?: string;
  stack: string;
  description: string;
}

export interface Experience {
  org: string;
  role: string;
  date: string;
  tasks: string[];
  stack: string;
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
  /** Infos complémentaires (permis, mobilité…) – affichées comme les contacts. */
  details: { label: string; value: string }[];
  skills: SkillRow[];
  projects: Project[];
  experiences: Experience[];
  education: EducationEntry[];
  certifications: Certification[];
  interests: Interest[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENU DU CV
// ─────────────────────────────────────────────────────────────────────────────
export const cv: CVData = {
  header: {
    name: 'Benjamin Santrisse',
    role: 'Développeur Backend Python (API, IA appliquée)',
    summary:
      "Développeur Python spécialisé en IA et backend, reconverti vers l'IA via une formation certifiante (RNCP 6). Conçoit des projets concrets et déployés : agents LLM, pipelines MLOps, ETL et APIs FastAPI.",
  },

  contact: [
    // Email principal – visible dans le CV PDF téléchargé (destiné aux recruteurs).
    // Sur les pages site, c'est l'email portfolio dédié + obfuscation JS.
    { label: 'Mail', value: 'santrissebenjamin@gmail.com', href: 'mailto:santrissebenjamin@gmail.com' },
    { label: 'Portfolio', value: 'benjamin-santrisse.vercel.app', href: 'https://benjamin-santrisse.vercel.app' },
    { label: 'LinkedIn', value: 'benjamin-santrisse', href: 'https://www.linkedin.com/in/benjamin-santrisse/' },
    { label: 'GitHub', value: 'github.com/benjsant', href: 'https://github.com/benjsant' },
  ],

  details: [
    { label: 'Recherche', value: 'CDI ou alternance · disponible immédiatement' },
    { label: 'Permis', value: 'B + véhicule' },
    { label: 'Mobilité', value: 'Métropole Valenciennoise + Lilloise' },
  ],

  skills: [
    { category: 'IA & Données', value: 'Machine Learning, MLOps, Pandas, NumPy, Scikit-learn, MLflow, XGBoost' },
    { category: 'IA générative', value: 'LLMs, RAG, Agents IA (ReAct, tool-calling), DeepSeek, Prompt engineering' },
    { category: 'Langages', value: 'Python, JavaScript, PHP, HTML/CSS' },
    { category: 'Frameworks', value: 'FastAPI, Django, Symfony, React, Next.js' },
    { category: 'Bases de données', value: 'MySQL, PostgreSQL, MongoDB, pgvector' },
    { category: 'Dev & DevOps', value: 'Docker, Git, Linux, Node.js, CI/CD GitHub Actions' },
    { category: 'Langues', value: 'Français courant, Anglais technique' },
  ],

  projects: [
    {
      title: 'InfiniDex – Pokédex augmenté par IA',
      repo: 'https://github.com/benjsant/InfiniDex',
      period: 'Avril 2026 – en cours',
      stack: 'Python · FastAPI · Next.js · PostgreSQL · Prefect · Docker',
      description:
        "Agent LLM multi-provider à 9 outils (DeepSeek/OpenRouter/Ollama, sans LangChain) avec streaming SSE temps réel. Pipeline ETL Prefect automatisé (orchestration, détection de changements par SHA, alertes Discord) sur 572 Pokémon et 168 000+ fusions.",
    },
    {
      title: 'PredictionDex – prédiction de combats Pokémon',
      repo: 'https://github.com/benjsant/lets-go-predictiondex',
      period: 'Janvier – Mars 2026',
      stack: 'Python · XGBoost · FastAPI · PostgreSQL · Docker',
      description:
        "Modèle XGBoost entraîné sur un dataset de combats simulés. Pipeline MLOps end-to-end : tracking MLflow, promotion auto en production, API FastAPI + interface Streamlit.",
    },
    {
      title: 'Audiomancy – génération de playlists assistée par IA',
      repo: 'https://github.com/ABA-DEV-IA/Audiomancy',
      period: 'Juillet 2025 – Mars 2026',
      stack: 'Python · FastAPI · Next.js · MongoDB · Docker',
      description:
        "Projet en équipe. Agent ReAct DeepSeek (boucle Thought/Action/Observation) + API Jamendo pour générer des playlists musicales. Stack monitoring Prometheus/Grafana, déploiement Azure (anciennement).",
    },
  ],

  experiences: [
    {
      org: 'CAF du Nord – Agence de Valenciennes',
      role: 'Développeur Web Symfony – Stages successifs',
      date: 'Mai 2016 – Mai 2019 · 6 mois cumulés (24 sem.)',
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
      date: '2025–26',
      title: 'Formation Développeur IA – RNCP niveau 6 (bac+3/4)',
      school: 'Simplon, Lille',
    },
    {
      date: '2018–19',
      title: 'Licence Pro SIO, option Développement',
      school: 'ISTV de Valenciennes (UVHC)',
    },
    {
      date: '2015–17',
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

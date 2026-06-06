export interface PortfolioItem {
  type: 'project' | 'article';
  title: string;
  description: string;
  tags: string[];
  url?: string;
}

export const portfolioItems: PortfolioItem[] = [
  // ── Projects ──────────────────────────────────────────────────────────────
  {
    type: 'project',
    title: "InfiniDex",
    description: "Pokédex pour Pokémon Infinite Fusion — 572 Pokémon, 168 000+ fusions, agent DeepSeek à 9 outils. Stack : FastAPI, Next.js 15, PostgreSQL, ETL Prefect, Docker.",
    tags: ["FastAPI", "Next.js", "PostgreSQL", "DeepSeek", "Prefect", "Docker", "Agent IA"],
    url: "/projects/infinidex",
  },
  {
    type: 'project',
    title: "n8n Veille Auto",
    description: "Système de veille data engineering automatisé : agrégation RSS, déduplication, résumé IA quotidien via DeepSeek envoyé sur Discord.",
    tags: ["n8n", "DeepSeek", "Discord", "RSS", "Automatisation", "No-code"],
    url: "/projects/n8n-veille-auto",
  },
  {
    type: 'project',
    title: "Airflow ML Automation",
    description: "Pipeline ML orchestré par Apache Airflow — entraînement automatisé, évaluation de modèles et notifications email via DAG.",
    tags: ["Apache Airflow", "Python", "ML", "Docker", "MLOps", "CI/CD"],
    url: "/projects/airflow-ml-automation",
  },
  {
    type: 'project',
    title: "PredictionDex",
    description: "Pipeline MLOps complet pour prédire le vainqueur de combats Pokémon : dataset, XGBoost, FastAPI, Streamlit, MLflow, Docker.",
    tags: ["Python", "XGBoost", "FastAPI", "MLflow", "Streamlit", "Docker", "MLOps"],
    url: "/projects/predictiondex",
  },
  {
    type: 'project',
    title: "Audiomancy",
    description: "Plateforme musicale IA : agent ReAct DeepSeek pour générer des tags Jamendo, cache MongoDB, monitoring Prometheus/Grafana, déployée sur Azure.",
    tags: ["FastAPI", "Next.js", "MongoDB", "DeepSeek", "Docker", "Azure", "Prometheus", "ReAct"],
    url: "/projects/audiomancy",
  },
  {
    type: 'project',
    title: "Medical Screen CNN",
    description: "CNN pour screening médical d'images avec suivi complet des expériences via MLflow — métriques, hyperparamètres et artefacts versionnés.",
    tags: ["PyTorch", "CNN", "MLflow", "Computer Vision", "Deep Learning"],
    url: "/projects/mlflow-medical-cnn",
  },
  {
    type: 'project',
    title: "ImmoPrice Lille",
    description: "API REST de prédiction du prix au m² à Lille basée sur les données DVF 2022 — scikit-learn, FastAPI, Jupyter.",
    tags: ["Python", "FastAPI", "scikit-learn", "Machine Learning", "Données ouvertes"],
    url: "/projects/immoprice-lille",
  },
  {
    type: 'project',
    title: "CI/CD Semantic Release",
    description: "API REST CRUD avec pipeline CI/CD complet : GitHub Actions, versionnage sémantique automatique, build Docker vers GitHub Container Registry.",
    tags: ["FastAPI", "PostgreSQL", "GitHub Actions", "Docker", "CI/CD"],
    url: "/projects/cicd-semantic",
  },
  {
    type: 'project',
    title: "DistroScript",
    description: "Scripts Bash pour provisionner des environnements de développement isolés via Distrobox/Podman — détection GPU NVIDIA, logs, vérification post-install.",
    tags: ["Bash", "Linux", "Distrobox", "Podman", "Automatisation", "DevOps"],
    url: "/projects/distroscript",
  },
  {
    type: 'project',
    title: "MintyForge",
    description: "Interface web Flask pour post-installation Linux Mint Cinnamon : profils par catégorie, dry-run, streaming SSE des logs, rollback, gestion thèmes GTK.",
    tags: ["Python", "Flask", "Bash", "Pydantic", "Linux", "Automatisation"],
    url: "/projects/minty-forge",
  },
  // ── Blog articles ─────────────────────────────────────────────────────────
  {
    type: 'article',
    title: "Construire un agent RAG avec pgvector et DeepSeek",
    description: "Implémentation d'un agent RAG complet : embeddings sentence-transformers, stockage pgvector, agent DeepSeek avec 3 outils dans le projet Let's Go Dex.",
    tags: ["RAG", "pgvector", "DeepSeek", "Python", "FastAPI", "IA", "LLM"],
    url: "/blog/rag-pgvector-deepseek",
  },
  {
    type: 'article',
    title: "CI/CD pour un projet MLOps avec GitHub Actions",
    description: "Pipeline CI/CD en 4 étapes : lint Pylint, tests unitaires PostgreSQL service, build Docker matrice, tests d'intégration Docker Compose.",
    tags: ["CI/CD", "GitHub Actions", "MLOps", "Docker", "Python", "Tests"],
    url: "/blog/cicd-github-actions-mlops",
  },
  {
    type: 'article',
    title: "Implémenter un agent ReAct from scratch avec DeepSeek",
    description: "Agent ReAct sans framework : boucle Thought/Action/Observation, outil web_search DuckDuckGo, métriques Prometheus, extraction robuste des tags.",
    tags: ["ReAct", "DeepSeek", "Agent IA", "Python", "FastAPI", "Prometheus"],
    url: "/blog/react-agent-deepseek-audiomancy",
  },
  {
    type: 'article',
    title: "Pipeline ETL multi-sources avec Scrapy et FastAPI",
    description: "ETL en 4 étapes : CSV, enrichissement PokéAPI en parallèle (ThreadPoolExecutor), scraping Pokepédia avec Scrapy, upsert PostgreSQL idempotent.",
    tags: ["Scrapy", "ETL", "FastAPI", "PostgreSQL", "Python", "Data Engineering"],
    url: "/blog/scrapy-fastapi-etl-pokemon",
  },
  {
    type: 'article',
    title: "Monitoring d'une API FastAPI avec Prometheus, Grafana et Loki",
    description: "Instrumentation FastAPI avec prometheus_client, middleware HTTP, métriques LLM/cache, stack Prometheus/Grafana/Loki Docker, alertes Discord.",
    tags: ["Prometheus", "Grafana", "FastAPI", "Monitoring", "Docker", "Python"],
    url: "/blog/monitoring-prometheus-grafana-fastapi",
  },
  {
    type: 'article',
    title: "GitHub CLI : workflow quotidien sans quitter le terminal",
    description: "Commandes gh pour créer des PRs, gérer les issues, consulter les workflows CI/CD et collaborer sans ouvrir le navigateur.",
    tags: ["GitHub", "CLI", "Git", "Terminal", "Productivité"],
    url: "/blog/gh-cli",
  },
  {
    type: 'article',
    title: "Distrobox : des environnements Linux isolés avec Podman",
    description: "Créer des conteneurs de développement partageant le home, le GPU et les apps graphiques — sans Docker root, sans VM.",
    tags: ["Distrobox", "Podman", "Docker", "Linux", "Conteneurs"],
    url: "/blog/distrobox",
  },
  {
    type: 'article',
    title: "XGBoost, MLflow et Streamlit : pipeline ML de bout en bout",
    description: "Pipeline MLOps pour prédire les combats Pokémon : feature engineering scikit-learn, XGBoost avec GridSearchCV, suivi MLflow et promotion automatique en Production à 0.85 d'accuracy.",
    tags: ["XGBoost", "MLflow", "Streamlit", "scikit-learn", "MLOps", "Python", "Machine Learning"],
    url: "/blog/xgboost-mlflow-streamlit-predictiondex",
  },
  {
    type: 'article',
    title: "Orchestration ETL avec Prefect : détection de changements par SHA",
    description: "Deux flows Prefect pour surveiller un Pokédex de 168 000+ fusions : détection par SHA GitHub, retries automatiques, alertes Discord et déploiements cron via prefect.yaml.",
    tags: ["Prefect", "ETL", "Python", "Data Engineering", "Docker", "Automatisation"],
    url: "/blog/prefect-etl-infinidex",
  },
  {
    type: 'article',
    title: "Logs en temps réel avec SSE dans Flask : MintyForge",
    description: "Streaming de logs d'installation via Server-Sent Events dans Flask : queue thread-safe, blueprints, rollback avec state.json et validation Pydantic v2.",
    tags: ["Flask", "SSE", "Python", "Linux", "Pydantic", "Bash", "Automatisation"],
    url: "/blog/flask-sse-logs-mintyforge",
  },
];

export function searchPortfolio(query: string, limit = 4): PortfolioItem[] {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length === 0) return portfolioItems.slice(0, limit);

  const scored = portfolioItems.map((item) => {
    const haystack =
      `${item.title} ${item.description} ${item.tags.join(' ')}`.toLowerCase();
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

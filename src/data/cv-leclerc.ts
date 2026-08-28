/**
 * CV ciblé - poste employé commercial, rayon bazar technique et culturel
 * (Espace culturel E.Leclerc, Bellaing).
 *
 * Données SÉPARÉES du CV technique (src/data/cv.ts), consommées par les deux
 * pages /cv-leclerc (design) et /cv-leclerc-ats (ATS). Le CV technique n'est
 * pas modifié : il reste pour les candidatures en informatique.
 *
 * Enjeu : ne PAS paraître surqualifié. Aucun terme de dev (framework, stack,
 * MLOps, agents...). Tout est en langage courant.
 *
 * À COMPLÉTER par l'utilisateur : le numéro de téléphone (champ `phone`).
 */

export interface LeclercAtout {
  title: string;
  text: string;
}

export interface LeclercExperience {
  org: string;
  role?: string;
  date: string;
  tasks: string[];
}

export interface LeclercEducation {
  title: string;
  detail?: string;
  school: string;
  date: string;
}

export interface LeclercInterest {
  title: string;
  description?: string;
}

export const cvLeclerc = {
  header: {
    name: 'Benjamin Santrisse',
    role: 'Employé commercial, rayon bazar technique et culturel',
    available: 'DISPONIBLE · DÉMARRAGE IMMÉDIAT',
    summary:
      "Passionné d'informatique et de high-tech, je souhaite mettre ma connaissance des produits au service du conseil client à l'espace culturel. Rigoureux, autonome et fiable, je cherche un poste où m'investir durablement.",
  },

  // À COMPLÉTER : le téléphone. Laisse "[Ton numéro]" tant que non renseigné.
  phone: '[Ton numéro]',

  contact: {
    ville: 'Marly (59770), à 15 minutes de Bellaing',
    email: 'santrissebenjamin@gmail.com',
    permis: 'Permis B et véhicule personnel',
    dispo: 'Disponible immédiatement, samedis et horaires variables',
  },

  // Section "Atouts pour le poste" (design) / "Compétences" (ATS).
  // Les mots-clés de l'offre (mise en rayon, balisage, gestion des stocks...)
  // sont incorporés naturellement, notamment dans le bloc "Rigueur".
  atouts: [
    {
      title: 'Connaissance des produits du rayon',
      text: "Informatique, high-tech, multimédia, jeux vidéo. Formation en informatique du BTS au niveau bac+3/4. Je sais orienter un client vers le matériel adapté à son usage et expliquer une différence technique sans jargon.",
    },
    {
      title: 'Rigueur et organisation',
      text: "Parcours en informatique de gestion : contrôle de données, respect des procédures, vérification systématique. Des réflexes directement utiles à la mise en rayon, au balisage, au suivi des prix et à la gestion des stocks.",
    },
    {
      title: 'Autonomie et initiative',
      text: "Projets menés seuls de bout en bout, avec organisation et respect des délais sans supervision quotidienne.",
    },
    {
      title: 'Fiabilité et disponibilité',
      text: "Ponctualité et présence. Domicile à 15 minutes du magasin, véhicule personnel, aucune contrainte de transport ni d'horaire.",
    },
  ] as LeclercAtout[],

  experiences: [
    {
      org: 'CAF du Nord, Agence de Valenciennes',
      role: "Stages en développement d'applications de gestion",
      date: 'Mai 2016 à Mai 2019 · 24 semaines cumulées',
      tasks: [
        'Travail en environnement professionnel structuré au sein d\'un organisme public',
        'Échanges réguliers avec les utilisateurs pour comprendre leurs besoins et y répondre',
        'Respect des délais, des procédures internes et de la confidentialité',
      ],
    },
    {
      org: 'Projets techniques personnels',
      date: '2025 à 2026',
      tasks: [
        'Conception et réalisation d\'applications informatiques menées de bout en bout, seul et en équipe',
        'Organisation sur la durée, documentation, résolution méthodique de problèmes concrets',
      ],
    },
  ] as LeclercExperience[],

  education: [
    {
      title: 'Certification Développeur en intelligence artificielle',
      detail: 'niveau bac+3/4',
      school: 'Simplon, Lille',
      date: '2026',
    },
    {
      title: 'Licence Professionnelle en informatique de gestion',
      school: 'Université de Valenciennes',
      date: '2019',
    },
    {
      title: 'BTS Services Informatiques aux Organisations',
      school: 'Lycée Henri Wallon, Valenciennes',
      date: '2017',
    },
  ] as LeclercEducation[],

  interests: [
    { title: 'Informatique et high-tech', description: 'matériel, configurations, actualité du secteur' },
    { title: 'Jeux vidéo' },
    { title: 'Trottinette', description: 'mobilité douce et loisir' },
  ] as LeclercInterest[],
};

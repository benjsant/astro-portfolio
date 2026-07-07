# Documentation technique du portfolio

Documentation de référence pour comprendre, maintenir et faire évoluer ce site.
Elle est publique (versionnée dans le repo) et volontairement factuelle : elle
décrit ce que le code fait **réellement**, pas ce qu'un template promet.

> Pour les notes privées (valeurs de variables d'environnement, procédures
> perso), voir le dossier `docs-privee/` qui reste sur la machine locale et
> n'est jamais publié.

## Par où commencer

Tu reviens sur le projet apres quelques mois ? Lis dans cet ordre :

1. [Architecture](architecture.md) : la stack réelle, l'arborescence, comment
   une page est rendue, les deux adaptateurs de build.
2. [Développement](developpement.md) : lancer le projet (Docker ou pnpm), les
   commandes, les tests, l'intégration continue.
3. Puis le fichier thématique correspondant à ce que tu veux modifier.

## Les fichiers

| Fichier | Quand le lire |
|---|---|
| [architecture.md](architecture.md) | Comprendre la structure globale et le flux de rendu |
| [contenu.md](contenu.md) | Ajouter ou modifier un article, un projet, une fiche techno |
| [cv.md](cv.md) | Toucher aux deux CV (`/cv` ATS et `/cv-design`) |
| [chat.md](chat.md) | Comprendre ou modifier le chatbot DeepSeek |
| [configuration.md](configuration.md) | Nom, liens, SEO, thèmes, variables d'environnement |
| [developpement.md](developpement.md) | Setup local, commandes, tests, CI |
| [deploiement.md](deploiement.md) | Build, Vercel, en-têtes de sécurité |

## Le projet en une phrase

Un site statique Astro (avec une seule route serveur, le chat) qui présente le
profil, les projets et le blog de Benjamin Santrisse, avec deux CV imprimables
en PDF et un assistant conversationnel basé sur DeepSeek. Déployé sur Vercel,
développé en Docker.

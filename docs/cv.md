# Les deux CV

Le site expose deux CV, tous deux imprimables en PDF depuis le navigateur :

| Page | Fichier | Style | Photo | Usage |
|---|---|---|---|---|
| `/cv` | [src/pages/cv.astro](../src/pages/cv.astro) | ATS strict | Non | Candidatures passant par un filtre ATS |
| `/cv-design` | [src/pages/cv-design.astro](../src/pages/cv-design.astro) | Design riche | Oui | Candidatures où le visuel compte, envoi direct à un humain |

## Les données sont partagées

Les deux pages lisent le **même** fichier : [src/data/cv.ts](../src/data/cv.ts).
Tu modifies les données une fois, les deux CV se mettent à jour.

Sections du fichier : `header` (nom, rôle, résumé), `contact`, `details`
(recherche, permis, mobilité), `skills`, `projects`, `experiences`,
`education`, `certifications`, `interests`. L'ordre dans chaque tableau est
l'ordre d'affichage.

## Le CV ATS (`/cv`)

Objectif : parsing maximal par les robots de tri (ATS). Le rendu est donc :

- une seule colonne, texte à plat, HTML sémantique (`h1`, `h2`, `p`, `ul`) ;
- **aucune photo**, aucune grille, aucun tableau ;
- séparateur de contacts sobre (` | `), dates entre parenthèses.

Un helper `clean()` dans la page neutralise au rendu ce qui gêne un ATS :

```js
const clean = (s) => String(s ?? '')
  .replace(/[—–]/g, '-')        // tirets cadratin/demi-cadratin -> trait d'union
  .replace(/\s*·\s*/g, ', ');   // point médian -> virgule
```

Important : `clean()` agit **au rendu de `/cv` uniquement**. Les données brutes
dans `cv.ts` gardent leurs points médians, ce qui laisse `/cv-design` afficher
son style riche sans être modifié.

### L'email dans le PDF

L'email est obfusqué dans le HTML statique (`[email protégé]`) puis révélé par
un petit script au chargement. Comme le PDF est généré par le navigateur **après**
exécution du JavaScript, l'adresse réelle s'imprime bien. Après une modification,
vérifie tout de même le PDF pour confirmer que l'email apparait en clair.

## Le CV design (`/cv-design`)

Version mise en page : en-tête coloré, photo, pastilles, timeline. La photo est
lue depuis `public/photo.jpg` (ratio ~3:4, idéal ~432x528 px) et intégrée en
data-URI. **Si le fichier est absent, un placeholder s'affiche** (pas de plantage).

## Export PDF

Les deux CV ont deux boutons qui basculent une classe CSS puis lancent
l'impression du navigateur :

- **1 page (compact)** : retire la classe `cv-aere`, rendu dense.
- **2 pages (aéré)** : ajoute `cv-aere`, plus d'espace.

Le CSS `@page { size: A4; margin: 0 }` supprime les en-têtes du navigateur
(URL, date). Le chat et les overlays sont masqués en impression.

## Recettes rapides

| Tâche | Où |
|---|---|
| Changer un texte du CV | `src/data/cv.ts` |
| Changer la photo (design) | remplacer `public/photo.jpg` |
| Changer ce que je cherche (CDI/CDD) | `cv.ts`, tableau `details`, ligne `Recherche` |
| Rendre `/cv` non-ATS ou l'inverse | éditer le HTML/CSS de la page concernée |

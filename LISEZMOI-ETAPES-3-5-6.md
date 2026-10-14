# L'Aventure à Vélo — Étapes 3, 5 et 6 (+ corrections de la carte)

Branche : `option-b-etape2` (même branche que l'étape 2). Les règles du moteur ne changent pas, sauf les corrections de carte demandées (voir plus bas).

## Étape 3 — Caméra et exploration
- **Glisser** à la souris ou au doigt, **pincer** pour zoomer (téléphone, tablette, pavé tactile), **molette** pour zoomer autour du pointeur, légère **inertie** quand on lâche.
- **Limites** : la carte ne quitte jamais l'écran (petit effet élastique au bord).
- **Double-clic** ou **double-tape** : zoom sur le point visé (au zoom maximum, retour à la vue d'ensemble).
- **Glisser ≠ clic** : un glisser ne sélectionne jamais de case ; le second clic d'un double-clic sert au zoom, pas à la sélection.
- Clavier : flèches pour déplacer, `+` / `-` pour zoomer.
- **Bouton ◎** : recentrage animé sur le cycliste actif.
- **Mini-carte** repliable (en bas à gauche) : cadre de la vue, jetons des joueurs ; un clic ou un glisser déplace la vue. Ouverte sur grand écran, repliée sur téléphone.
- **Plateau prioritaire** : bouton **📋 Fiche** dans les outils de la carte. Sur ordinateur, il replie la fiche joueur et le plateau prend toute la largeur. Sur tablette et téléphone, la fiche devient un **tiroir latéral** qui s'ouvre et se ferme.

## Étape 5 — Routes, ferries, décor
- **Routes** dessinées à partir des liaisons existantes entre cases voisines : grandes routes entre villes, petits chemins vers les hameaux (visibles de près). Purement décoratives : elles ne créent aucun chemin, le joueur reste libre case par case.
- **Ferries** en pointillés bleus avec un bateau. Quand le cycliste actif est sur un port, la ligne s'anime, affiche la destination et le prix, et **devient cliquable** : un clic ouvre la fenêtre « Traversée » habituelle.
- **Décor** (rivières, bosquets, petits lacs, hameaux) dans un nouveau fichier `dist/assets/europe/decor-data.js`, séparé de `board-data.js`. Peu contrasté, il apparaît seulement quand on zoome et ne change aucune règle. Il se régénère avec `node tools/decor/make-decor.mjs`.

## Étape 6 — Animations discrètes
- Déplacement du cycliste **case par case** (environ 0,26 s par case), y compris en ferry. L'état du jeu est appliqué tout de suite : l'animation n'est que de l'affichage.
- **Tracé progressif** de l'itinéraire choisi, **halo** léger sur la case sélectionnée, **pulsation lente** de la ville d'arrivée, **glissement de caméra** vers le joueur suivant.
- **Météo légère** : quelques ombres de nuages qui passent lentement.
- Dans **Paramètres → Affichage du plateau** : « Réduire les animations » (tout devient instantané, la météo est masquée) et « Masquer la météo ». Par défaut, le jeu suit le réglage « réduire les animations » de l'appareil.

## Carte reconstruite sur la vraie géographie (carte n° 11)
Le plateau n'est plus corrigé à la main : il est **recalculé** à partir de données réelles, sur la même grille d'hexagones.
- **Côtes** : tracé réel de l'Europe (Natural Earth 1:50m, domaine public), projeté sur la grille.
- **Projection** : cylindrique (méridiens verticaux, parallèles horizontaux), comme les cartes habituelles. Le Portugal est bien au sud de l'Espagne et la côte turque est horizontale. Une « loupe » douce agrandit l'Europe de l'Ouest (cases d'environ 85-95 km) et resserre la Russie et le Grand Nord (100-110 km).
- **Relief** : vraies chaînes de montagnes (Pyrénées entre la France et l'Espagne, Alpes, Apennins, Carpates, Balkans, Alpes dinariques, Alpes scandinaves, Caucase, Pontiques, Taurus, Oural...) et collines (Massif central, Bohême, Meseta...). Pays-Bas, Pologne et Russie sont plats.
- **Villes** à leurs vraies coordonnées. Londres est à l'intérieur des terres. Nouvelles villes : **Lille**, **Marseille**, **Holyhead**.
- **Îles** : la Grande-Bretagne et l'Irlande ne sont reliées que par ferry.
- **Ferries** : Calais–Douvres, **Dublin–Holyhead** (nouveau), Helsingør–Helsingborg, Hirtshals–Kristiansand, Ancona–Split, Thessalonique–Izmir.
- **Danemark** retouché case par case : Jutland, Seeland (Helsingør et Copenhague) relié au Jutland, Øresund en mer face à Helsingborg.
- Noms des mers et grands fleuves placés sur la vraie géographie (fleuves dans le décor, visibles de près).
- `MAP_VERSION` passe à 11. Une partie en cours est convertie à l'ouverture. **Les cartes de l'éditeur sont supprimées** (elles visaient l'ancienne grille) ; une copie de secours reste dans le navigateur (`velo-maps-ancienne-grille`).
- Longueur des voyages, en cases, sans ferry : Paris → Istanbul 40 → 30, Barcelone → Rome 17 → 14, Lyon → Vienne 15 → 13, Amsterdam → Prague 12 → 11, Bordeaux → Zurich 14 → 11, Berlin → Bucarest 21 → 16, Venise → Thessalonique 18 → 12. Copenhague → Cap Nord est maintenant faisable par la terre (36 cases) ou par le ferry Helsingør–Helsingborg.
- Pour régénérer : `cd tools/carte && npm install && npm run carte`, puis `node tools/decor/make-decor.mjs`, puis la peinture dans `tools/peinture` (`python3 glyphs.py`, puis `python3 atlas.py <dossier>`). Les réglages (villes, relief, détroits, retouches) sont dans `tools/carte/geographie.mjs`.

## Fichiers
- Nouveaux : `dist/board-camera.js`, `dist/board-roads.js`, `dist/display-prefs.js`, `dist/assets/europe/decor-data.js`, `tests/plateau-etape3.test.js`, `tools/decor/`, `tools/carte/` (construction de la carte).
- Modifiés : `dist/board-renderer-svg.js`, `dist/app.js` (boutons et préférences d'affichage, ferries, liste des ferries partagée), `dist/europe.js` (`FERRY_ROUTES`, `MAP_VERSION` 10), `dist/assets/europe/board-data.js`, images de `dist/assets/terrain/`, `dist/style.css`, `dist/sw.js`, `dist/index.html`.
- Tests mis à jour pour la nouvelle carte : nouveau ferry dans 2 tests, nombre de cases terrestres calculé, test de caméra adapté à la nouvelle caméra.

## Tests
`npm test` : 122 tests, 99 réussis, 23 échecs. Ces échecs faisaient déjà partie des 24 qui échouaient avant l'étape 1 : aucun nouvel échec, et un ancien test repasse au vert (« les cinq voyages réalisables »).

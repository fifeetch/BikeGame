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

## Corrections de la carte (demandées par Fi)
- **4 zones de mer** : la Manche (l'Angleterre devient une île), le golfe du Lion, la mer Tyrrhénienne et l'Adriatique (28 cases passées en mer).
- **Bord est** redevenu de la terre (Russie, Caucase, Anatolie : 78 cases). Mer de Barents et Méditerranée conservées, mer Noire fermée.
- **Ferries de port à port** : Calais–Douvres, Helsingør–Helsingborg, Hirtshals–Kristiansand, Ancona–Split, Thessalonique–Izmir. Les nouveaux ports sont de **vraies villes** (9 villes ajoutées).
- Les cases « côte » sans mer voisine sont peintes en terre, et non plus en hauts-fonds. Leur type ne change pas dans les règles.
- Noms réparés : « Saint-Pétersbourg » et « Athènes ».
- `MAP_VERSION` passe à 10. Une partie déjà commencée est convertie à l'ouverture, et un cycliste resté sur une case devenue mer est replacé sur la terre la plus proche.
- Script rejouable : `node tools/carte/corrections-carte.mjs`. Peinture : `tools/peinture` (`python3 glyphs.py`, puis `python3 atlas.py <dossier>`).

## Fichiers
- Nouveaux : `dist/board-camera.js`, `dist/board-roads.js`, `dist/display-prefs.js`, `dist/assets/europe/decor-data.js`, `tests/plateau-etape3.test.js`, `tools/decor/`, `tools/carte/`.
- Modifiés : `dist/board-renderer-svg.js`, `dist/app.js` (boutons et préférences d'affichage, ferries, liste des ferries partagée), `dist/europe.js` (`FERRY_ROUTES`, `MAP_VERSION` 10), `dist/assets/europe/board-data.js`, images de `dist/assets/terrain/`, `dist/style.css`, `dist/sw.js`, `dist/index.html`.
- Tests mis à jour pour la nouvelle carte : nouveau ferry dans 2 tests, nombre de cases terrestres calculé, test de caméra adapté à la nouvelle caméra.

## Tests
`npm test` : 122 tests, 98 réussis, et les **mêmes 24 échecs** qu'avant (aucun nouvel échec), plus 5 nouveaux tests verts.

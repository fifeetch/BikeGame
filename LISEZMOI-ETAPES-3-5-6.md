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

## Menus « carte d'aventure » (style C)
Les écrans d'avant partie sont refaits dans le style choisi sur la planche de maquettes :
- **Écran titre vivant** : la carte peinte en plein écran glisse lentement, des nuages passent, un cycliste roule sur l'itinéraire Paris → Istanbul. Les menus sont des panneaux en bois. Tout s'arrête avec l'option « Réduire les animations ».
- **1. Plateau** : la carte d'Europe en grand, « Mes cartes », l'atelier, l'import et le mode tuiles.
- **2. Cyclistes** : un panneau par cycliste avec sa couleur.
- **3. Garage** (pour chaque cycliste) : choix du vélo (Gravel ou Randonnée, effets lus dans les règles) et chargement des sacoches. Chaque objet acheté va dans une vraie sacoche dessinée sur le vélo ; la bourse, les places et une jauge de poids réagissent en direct. Le poids est une ambiance : il ne change pas les règles.
- **4. Voyage** : trois cartes illustrées avec la longueur du voyage en cases.
- Les règles du jeu ne changent pas. Fichier : `dist/menus.js` ; styles en fin de `dist/style.css` (bloc « Menus style C »).

## Nouvelles mécaniques d'aventure (validées par Fi)
- **Lieux remarquables cachés** : 24 jetons « ? » posés au hasard en début de partie (même graine, mêmes jetons), jamais sur une ville ni un col, à 3 cases au moins les uns des autres. Le premier cycliste qui passe dessus gagne des points d'aventure : 1 point (50 % des jetons), 2 points (30 %), 3 points (20 %). Le jeton devient alors une petite étoile.
- **Cols mythiques nommés** : Col du Tourmalet, Col du Galibier, Mont Ventoux, Col du Stelvio, Grossglockner, Transfăgărășan, Trollstigen, Alto de l'Angliru, placés à leur vraie position (`NAMED_COLS` dans `dist/europe.js`, carte n° 12). Passer un col coûte 3 d'énergie et rapporte **2 points d'aventure** (avant : 6). Le premier à franchir un col gagne **+3** (« premier de cordée », son drapeau prend sa couleur). Le titre **Grimpeur** donne **+5** pour 3 cols différents.
- **Fatigue** : jauge de 0 à 3. Chaque journée où l'on roule ajoute +1, et +1 de plus si on a passé un col. Une nuit au camping ou à l'hôtel (ou la carte « Nuit chez l'habitant ») la remet à 0. Le bivouac et les jours sans rouler ne la changent pas. À 3, le cycliste est **fourbu** : son énergie maximale baisse de 2 jusqu'à sa prochaine vraie nuit.
- **Budget du voyage** : l'action « Travailler » est retirée. Chaque cycliste reçoit 5 pièces après l'achat de son matériel, puis 5 pièces tous les 5 tours.
- Tous les chiffres se règlent dans **Règles** (groupes « Budget du voyage », « Lieux cachés et cols », « Fatigue »).
- Tests : `tests/aventure-mecaniques.test.js` (6 tests). `npm test` : 128 tests, 105 réussis, 23 échecs (les mêmes 23 qu'avant, aucun nouvel échec). Les tests qui vérifiaient l'argent ou le bouton « Travailler » ont été mis à jour.

## Départ, Est de l'Europe et jetons (carte n° 13)
- **Départ** : 10 pièces par cycliste, vélo compris (Gravel 5, Randonneuse 3), puis le matériel. Ensuite, +5 pièces de budget et +5 tous les 5 tours. Prix des vélos réglables dans Règles.
- **28 vraies villes ajoutées à l'Est**, en Finlande, au Caucase et en Anatolie : Helsinki, Petrozavodsk, Arkhangelsk, Novgorod, Iaroslavl, Perm, Ekaterinbourg, Nijni Novgorod, Kazan, Oufa, Smolensk, Minsk, Samara, Orenburg, Voronej, Lviv, Kharkiv, Volgograd, Chișinău, Odessa, Rostov-sur-le-Don, Astrakhan, Krasnodar, Constanța, Tbilissi, Trabzon, Ankara, Bakou. La carte est repeinte avec leurs maisons.
- **Jetons « ? »** : ils sont placés à 2 cases au plus du chemin le plus court de chaque voyage, là où les cyclistes passent vraiment.

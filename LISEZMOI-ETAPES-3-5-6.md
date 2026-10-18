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

## En partie, style « carte d'aventure » (maquettes validées)
- **Fenêtres** : panneau sombre à liseré pointillé, titres Fraunces, bouton principal orange, boutons secondaires en contour. « Nouvelle partie ? » montre la partie en cours, un gros bouton « Choisir le plateau », Exporter et Règles côte à côte, et Annuler en lien. Les cartes Événement gardent leurs couleurs.
- **Lieu caché révélé** : une carte illustrée s'ouvre (nom, petite phrase, étoiles, points, découvreur). « Continuer la route » la ferme.
- **Messages de route** : col franchi, premier de cordée, Grimpeur, fatigue et budget s'affichent en haut à droite de la carte, puis s'effacent seuls au bout de 7 secondes.
- **Fiche du cycliste** :
  - en-tête (couleur, nom, vélo, voyage, jour) ;
  - jauges : énergie en cases (les cases perdues quand on est fourbu sont hachurées), fatigue, nourriture, pièces, aventure ;
  - 4 onglets : Journée, Sacoches, Voyage, Cartes. Sur téléphone ils passent en 2 × 2 ;
  - actions en tuiles avec leur prix ou la raison de leur blocage (« en ville seulement », « tente nécessaire »…). Camping et hôtel sont mis en avant quand on est presque fourbu ;
  - le gros bouton « Terminer ma journée » ;
  - en bas, des liens Sauvegarder, Journal de route et Fin de partie.
- **Page de jeu** : en-tête, barre d'actions et planificateur passent en sombre.

## Des routes qui comptent, et un GPS qui sert
- **Routes figées** dans un nouveau fichier `dist/assets/europe/routes-data.js`, séparé de `board-data.js`. Chaque case connaît les côtés (0 à 5) qui portent une route, dans l'ordre des directions de la grille `[[1,0],[1,1],[0,1],[-1,0],[-1,-1],[0,-1]]`. Un pas est « sur la route » quand le côté traversé porte une route des deux côtés (`dist/routes.js`).
- **Contenu** : les grandes routes déjà dessinées entre les villes (436 tronçons) + 10 routes ajoutées, tracées le long des vraies routes par des villes repères : Amsterdam → Berlin → Varsovie (par Osnabrück, Hanovre, Poznań), Paris → Prague → Lviv (Reims, Metz, Nuremberg, Brno, Cracovie), Vienne → Chișinău (Budapest, Debrecen, Cluj, Suceava, Iași), Paris → Bordeaux (Orléans, Tours, Poitiers), Paris → Lyon (Auxerre, Beaune, Mâcon), Milan → Ancona (Parme, Bologne, Rimini), Madrid → Barcelone (Saragosse, Lleida), Oslo → Stockholm (Karlstad, Örebro), Stockholm → Narvik (Gävle, Umeå, Luleå, Kiruna), Cap Nord → Petrozavodsk (Laponie finlandaise, Kuusamo, Carélie).
- Les **petits chemins vers les hameaux** restent un simple décor : ils ne comptent pas comme routes.
- Pour modifier les routes : éditer `tools/routes/construire-routes.mjs`, puis `node tools/routes/construire-routes.mjs` depuis la racine du dépôt.
- **Règle « hors route »** (option A, réglable dans Règles → Hors route) : sur la route, déplacement normal. Hors route avec le GPS, déplacement normal. Hors route sans GPS : dès qu'un pas de la journée quitte la route, toute la journée est limitée à **3 cases (Gravel)** ou **2 cases (Randonneuse)**. Toutes les cases de la journée comptent, y compris celles offertes par une carte. La règle ne concerne que le mode Plateau.
- **Cartes Événement corrigées** : « Covoiturage improvisé » n'avance plus que sur une vraie route ; « Pluie torrentielle » ne touche plus que les cases sans route.
- **Affichage** : routes jouables en trait crème bordé ; planificateur avec « route » ou « hors route » pour chaque case et le message « Hors route sans GPS : 3 cases maximum aujourd'hui » ; fiche Journée « 1 / 3 cases · hors route sans GPS » ; GPS décrit « Quitter la route sans pénalité » au garage et dans les Sacoches.
- Les anciennes sauvegardes retrouvent les routes au chargement.
- Tests : `tests/routes-gps.test.js` (9 tests). Les 23 anciens échecs restent les mêmes, aucun nouveau.

## Lieux cachés loin des routes
- Les 24 jetons « ? » sont maintenant tous placés **à au moins 2 cases de toute route** (jamais sur une route, jamais sur une case qui touche une route), toujours dans la zone des voyages (3 cases autour du chemin le plus court de chaque voyage). Pour les trouver, il faut quitter la route : le GPS devient utile.
- Valeurs (1, 2 ou 3 points, 50/30/20 %) et écart de 3 cases entre jetons inchangés. Les parties déjà commencées gardent leurs jetons.

## Météo annoncée (option de début de partie)
- Sur l'écran des cyclistes, bloc **« Météo de la partie »** : **Cartes météo** (comme avant, par défaut) ou **Météo annoncée**. Avec la météo annoncée, les 10 cartes Événement climatiques sont retirées de la pioche (et le bouton « Intervention météo » disparaît). Le choix est gardé pour toute la partie.
- **5 régions** (`dist/weather.js`) : Ouest, Alpes, Nord, Est, Balkans. Chaque case appartient à la région de la ville repère la plus proche.
- **5 temps** tirés chaque jour à partir de la graine de la partie (le même jour donne toujours le même temps, donc on connaît demain dès ce soir) :
  - Beau temps : aucun effet ;
  - Vent de face : la 1re case de la journée coûte +1 énergie ;
  - Pluie : chaque case hors route coûte +1 énergie ;
  - Orage : 3 cases maximum si la journée commence dans la région ;
  - Neige : montagne et col +1 énergie.
- Chances par région (CLIMATE dans `weather.js`, réglables) : plus de neige au Nord et dans les Alpes, plus d'orages dans les Balkans, pas de neige à l'Ouest.
- **Affichage** : le temps du jour posé sur chaque région de la carte ; dans la fiche Journée, le temps du jour à ta position et un bouton **« Demain → »** qui ouvre le **bulletin du soir** (les 5 régions de demain, ta région en orange, et la météo du jour en dépliant) ; le planificateur rappelle le temps des régions traversées et compte l'énergie en plus.

## Carnet de voyage (5e onglet de la fiche)
- Onglet **Carnet** : le trajet dessiné (départ, position, arrivée, lieux trouvés, cols), 4 chiffres (cases roulées, hors route, cols mythiques, points d'aventure), les **souvenirs datés** (villes traversées, lieux cachés, cols, premier de cordée, titre Grimpeur) et **« Le mot du voyageur »**.
- Les textes sont dans `dist/carnet-data.js` : phrases génériques pour l'instant. Fi peut y écrire ses vraies anecdotes, ville par ville (liste VILLES) et pour « Le mot du voyageur ».
- Chaque case parcourue garde son jour, et les cases hors route sont comptées (anciennes parties : comptage à partir de maintenant).
- Tests : `tests/meteo-carnet.test.js` (7 tests) + un test des jetons loin des routes. 60 parties de robots (30 avec météo annoncée, 30 avec cartes météo) : aucune erreur.

## Fiche « carnet crème » et pions cyclistes
- **Fiche du cycliste** refaite d'après la maquette validée : papier crème et texte foncé (bien plus lisible), textes de 15 px au moins, grands chiffres (énergie, repas, pièces, aventure), onglets avec icônes sur une barre vert foncé.
  - Journée : bandeau météo du jour (avec demain) en tête, « Route du jour » en gros ronds (cases perdues en pointillés, avec la raison : orage, hors route sans GPS, carte), gains en vert, actions impossibles en pointillés avec leur raison, gros bouton « Terminer ma journée ».
  - Sacoches : les places du vélo dessinées, remplies par les objets ; encadré « Ce que ça t'apporte » ; boutique avec description, prix et place.
  - Voyage, Cartes, Carnet : mêmes couleurs papier.
- **Pions** : chaque joueur est un médaillon crème avec un cycliste sur son vélo (maillot, cadre et casque à sa couleur) et son numéro dans une pastille. Le cycliste regarde dans le sens où il roule.

## Rencontres (au choix en début de partie, idéal en solo)
- Sur l'écran des cyclistes, bloc **« Événements de la route »** : **Cartes Événement** (comme avant, par défaut) ou **Rencontres**. Avec les rencontres, plus aucune carte (ni main, ni pioche, ni attaque) : l'onglet Cartes et le bouton « En main » disparaissent.
- **Chaque soir** (après une journée de route, un repos ou un bateau), une rencontre liée à l'endroit s'ouvre : type de case (ville, montagne, côte, plaine), région de la météo, ou partout. On choisit parmi 2 ou 3 réponses ; certaines coûtent des pièces ou un repas. Pas de répétition tant qu'il reste des rencontres possibles à cet endroit.
- **Effets** : énergie (sans dépasser le maximum), repas, pièces, points d'aventure, fatigue, et une case de plus ou de moins **le lendemain**.
- **20 rencontres** dans `dist/encounters.js` (berger de l'alpage, grange ouverte, boulangerie, pêcheurs, cycliste égaré, fête du village, babouchka, vigneron…). Fi peut y écrire ses vraies rencontres en gardant la même forme.
- Chaque rencontre vécue entre dans le **carnet de voyage** avec son jour.
- Sauvegarde possible en pleine rencontre. Tests : 3 tests dans `tests/meteo-carnet.test.js` ; robots : 1 000 rencontres jouées, aucune erreur (`RENCONTRES=1 node tools/simulation/parties-auto.mjs`).
- Correction : la note de la **fenêtre d'intervention** (et les cadres clairs des fenêtres sombres) est maintenant lisible.
- Météo sur la carte : les étiquettes « Région · Temps » cachaient la carte quand on zoomait. Elles sont remplacées par de **petites pastilles rondes** (icône du temps) qui gardent la même petite taille à l'écran et ne bloquent plus les clics. Le détail reste dans la fiche Journée et le bulletin.
- Fenêtre d'intervention : quand la partie n'a pas de cartes climatiques (météo annoncée ou mode Rencontres), elle ne s'ouvre plus ; le parcours part directement.

## Partie en ligne (deux appareils, Firebase)
- Écran titre → **« Jouer en ligne »**.
  - **Créer une partie en ligne** (dès le départ) : ton nom, le nombre de cyclistes, la météo (cartes ou annoncée) et les événements (cartes ou rencontres). Un code s'affiche (ex. VELO-4821) dans la **salle d'attente**, avec « Copier le code » et « Copier le lien ».
  - **Chacun sur son appareil** : tape le code + son nom → « Préparer mon cycliste » → garage (vélo, sacoches) → choix du voyage → « prêt ». Les règles sont celles choisies par l'hôte.
  - Quand tout le monde est prêt, l'hôte clique **« Lancer la partie »** : la partie s'ouvre chez tout le monde, chacun sur son cycliste. Fermer le jeu pendant l'attente n'est pas grave : on revient dans la salle d'attente en rouvrant le jeu.
  - Toujours possible : **« Mettre ma partie en cours en ligne »** (partie déjà préparée sur cet appareil avec tous les cyclistes), puis « Je suis … ».
  - **Rejoindre** : taper le code (ou ouvrir le lien), puis choisir son cycliste.
- En partie : bandeau **« À toi de jouer · VELO-4821 »** ou **« Léa joue… »**. Hors de son tour, on voit la carte bouger en direct, mais les actions sont bloquées et la fiche affiche « En attente » avec ses propres jauges : la main de cartes des autres n'est jamais affichée. Pas de modification de carte ni de règles pendant une partie en ligne.
- On peut fermer le jeu : « Jouer en ligne » → « Reprendre la partie ». « Quitter cette partie en ligne » la laisse en ligne pour les autres.
- Technique : `dist/online.js`. Base Firebase Realtime Database du projet « bikepacking-the-game » (Belgique). Le plateau (≈ 700 Ko) est envoyé une seule fois ; ensuite seul l'état léger (≈ 15 Ko) circule, avec un numéro de version pour éviter que deux coups s'écrasent.
- Test sans Internet : ajouter `?reseau=local` à l'adresse ; deux onglets du même navigateur jouent ensemble. Tests : `tests/en-ligne.test.js`.

## Cartes et points revus avec Fi (15 octobre 2026)
- **Vent dans le dos** : les 2 cases offertes seulement en plaine, sur la côte, en moyenne montagne (ou en ville).
- **Crevaison** et **Casse mécanique** : au début de son tour, le joueur ciblé répare avec son kit de réparation ; sans kit, retour à la dernière ville et journée perdue (Pneus renforcés / Outils multifonctions protègent toujours).
- **Chute à vélo** : −2 énergie, puis au début de son tour il se soigne avec la trousse de secours ; sans trousse, retour à la dernière ville et journée perdue (plus de bonus à défausser).
- **Erreur d'itinéraire** : pas de déplacement au prochain tour (GPS de randonnée protège).
- **Neige au sommet** : jouable sur n'importe quel parcours ; au prochain tour de la cible, montagne et cols interdits.
- **GPS de randonnée** (bonus) : en plus, quitter la route sans pénalité.
- **Points d'aventure** : plus de points par case (plaine, côte, moyenne montagne, montagne, ville = 0) ; plus de « premier de cordée » ni de titre « Grimpeur » ; col mythique +2, et +3 une fois au 3e col franchi. Carnet de voyage ne donne plus de points (nouvel effet à choisir).

## 20 cartes Voyage (15 octobre 2026)
- 12 nouveaux voyages de ville à ville : Lisbonne → Barcelone, Londres → Bordeaux, Dublin → Paris, Amsterdam → Milan, Vienne → Constanța, Venise → Skopje, Sofia → Athènes, Izmir → Trabzon, Bergen → Narvik, Varsovie → Saint-Pétersbourg, Marseille → Venise, Budapest → Odessa.
- Chaque voyage a des objectifs de cases (villes, plaine, côte, montagne, moyenne montagne, cols mythiques, suites de cases).
- **Points du voyage selon sa longueur** (trajet le plus court) : Courte (≤ 8 cases) +6, Moyenne (9–13) +9, Longue (14–20) +12, Très longue (21 et plus) +15. Remplace les +10 fixes.
- Toujours 3 cartes tirées au hasard, on en garde une. Les nouveaux voyages sans illustration montrent une petite carte du trajet.
- Les jetons « ? » restent dans la zone des 8 voyages d'origine, plus la zone des voyages choisis dans la partie.
- Robots : `VOYAGE=<id> JOUEURS=1 node tools/simulation/parties-auto.mjs 3` pour tester un voyage.

## Fin de partie réglable et plusieurs voyages (15 octobre 2026)
- **Fin de partie** choisie avant de jouer (écran des cyclistes, création en ligne, fenêtre Règles) : **Standard = 35 points d'aventure, 3 voyages réussis ou 40 jours** (au bout des jours, le plus de points gagne). Chaque nombre est modifiable ; 0 = condition non utilisée.
- **Voyage réussi → nouveau voyage** : au début de son tour suivant, le cycliste tire 3 cartes et en garde 1 ; il part d'où il est et seules les cases parcourues ensuite comptent.
- **Arrivé sans tous les objectifs** : bouton « 🏁 Terminer le voyage ici » ; le voyage compte, mais rapporte 40 % de points en moins.
- **Cartes revues** : 18 Route barrée = 2 cases de moins au prochain tour (GPS protège) ; 24 Brouillard = −1 énergie et pas de sortie de route pendant ce trajet ; 39 Carnet de voyage = +1 pièce par nouvelle ville.
- Les règles enregistrées sur l'appareil avant ces changements sont mises à jour automatiquement (points et fin de partie).

## Vélos (15 octobre 2026)
- Le vélo s'appelle **Randonneuse** (et non « Randonnée »).
- **Gravel : 5 cases par jour ; Randonneuse : 4 cases par jour** (elle garde ses 8 places de sacoche). Les règles enregistrées sur l'appareil sont mises à jour automatiquement.
- **Cases par jour de chaque vélo réglables** : fenêtre « ⚙️ Règles » → « Vélos et inventaires » → « Cases par jour (1 à 5) » pour le Gravel et la Randonneuse (au lieu de l'ancien « bonus distance »). L'écran des cyclistes affiche « Gravel 5 / Randonneuse 4 cases/jour ».

## Boutons de la journée plus clairs (15 octobre 2026, maquette AideC validée)
- Sous la carte, **un seul gros bouton orange = la prochaine chose à faire** :
  1. rien de tracé : consigne « 👆 Clique sur les cases entourées… » + petits boutons « 🌙 Me reposer aujourd'hui » (ouvre la fiche, rubrique Dormir) et « ⏭ Passer la journée » ;
  2. étape tracée : « 🚴 Rouler N cases · −X ⚡ » + « ✕ Effacer » (la raison s'affiche si le parcours est impossible) ;
  3. après avoir roulé : « ⏭ Finir ma journée » ; s'il reste des cases, une fenêtre demande confirmation.
- Les anciens boutons « Terminer le tour », « Effectuer le parcours » et « Terminer ma journée » (fiche) sont remplacés.

## Règles du jeu (15 octobre 2026, maquette RegleC validée)
- **« Comment on joue »** : résumé en 6 cases affiché une fois au jour 1 de chaque partie (en ligne : sur chaque appareil). Case « Ne plus afficher ce résumé au départ ».
- **Bouton « 📖 Règles »** en haut, à tout moment (même quand ce n'est pas ton tour) : règles détaillées en 6 onglets (Se déplacer, Manger & dormir, Voyages & points, Cartes ou Rencontres, Météo, Fin de partie). Les nombres suivent les réglages de la partie. Fichier `dist/rules-help.js`.
- L'ancien bouton « ⚙️ Règles » (réglage des valeurs) s'appelle maintenant **« ⚙️ Réglages »**.
- Correction : la fiche affiche maintenant la vraie énergie d'un repas (+2 avec les cartes Événement, +3 sinon ; + réchaud).

## Barre de la journée « road-book » (15 octobre 2026, visuel 1 choisi par Fi)
- Bande crème : à gauche les 3 étapes **Tracer → Rouler → Finir** sur un chemin pointillé ; au centre le gros bouton orange arrondi (pastille 🚴 / 🌙, coût ou cases restantes à droite) ou la consigne « Trace ton étape » ; à droite des boutons ronds (Me reposer, Passer, Effacer, Manger, Cartes, Météo).
- Quand la place manque (vue côte à côte), le gros bouton passe sur une 2e ligne.

## Mes parties : plusieurs sauvegardes (15 octobre 2026, maquette PartiesC validée)
- Chaque partie s'enregistre toute seule dans sa propre place (réserve IndexedDB du navigateur, `dist/saves.js`), jusqu'à 20 parties par appareil.
- Écran titre « Reprendre » → **Mes parties** : cartes avec petite carte du trajet, étiquettes (Solo, joueurs, En ligne, Rencontres, Météo annoncée, Terminée), cyclistes et points, jour, date ; Reprendre / Renommer / ⬇️ Fichier / 🗑 ; filtres Toutes, En cours, Terminées ; « Importer une partie ». Avec une seule partie, « Reprendre » la relance directement.
- « Nouveau voyage » ne remplace plus la partie en cours : elle reste dans la liste.
- Les parties en ligne apparaissent aussi et se reprennent avec leur code.

## Bulletin météo avec la carte des zones + correction de la synchro en ligne (15 octobre 2026)
- Bouton « Bulletin » : « Tu es dans la zone X », carte des 5 zones (vraie carte du jeu coloriée) avec le temps de chaque zone et « 📍 toi », onglets Aujourd'hui / Demain, « Aujourd'hui ici » et « Demain ici », villes de la zone. Le bandeau dit « Aujourd'hui · zone Est ».
- Partie en ligne : un appareil n'envoie plus que les actions de son joueur (un simple affichage n'envoie rien) ; en cas de conflit, la partie est rechargée depuis le serveur (jamais d'état plus ancien) ; nouvel essai automatique si la connexion coupe ; bouton « 🔄 Ça semble bloqué ? Recharger la partie » pendant l'attente. (Bug signalé par Fi : chacun voyait l'autre jouer.)
- Test local à deux onglets : la valeur voyage avec le message (plus de lecture d'un ancien état).

## Cartes reçues et voyage rapide (15 octobre 2026, idées de Fi)
- **Cartes négatives reçues** : au début de son tour, une fenêtre montre les cartes jouées contre soi (qui, quel jour, la carte en image) ; pastilles rouges sur la barre tant que la pénalité dure (pas de déplacement, cases en moins, montagne interdite, vent au prochain déplacement). Si le déplacement est interdit, le gros bouton propose « Finir ma journée ».
- **Voyage rapide** : dans la fenêtre « Choisis ton prochain voyage », bouton « 🚆 Train jusqu'à [ville de départ] » : moins de 10 cases 2 pièces, 10 à 19 cases 3, 20 et plus 4. Prend la journée ; les objectifs se comptent depuis la ville de départ.

## En ligne : attente plus claire et petits messages (15 octobre 2026, maquette AttenteChatC validée)
- **Pendant le tour de l'autre** : bandeau orange « C'est à Marion de jouer · jour N · Marion roule… » (+ « 🔄 Recharger ») ; barre du bas « ⏳ Marion roule… » ; **ta fiche complète** reste consultable (tous les onglets, ta main, ton voyage, ta météo), boutons d'action grisés.
- **💬 Messages** (à côté de « À toi de jouer ») : pastille du nombre de messages non lus ; petit tiroir avec les 30 derniers messages, phrases rapides (À toi !, Bien joué 👏, Je reviens dans 5 min, 😅, 🚴💨) et ligne pour écrire (Entrée pour envoyer) ; bandeau de 4 secondes quand un message arrive. Messages rangés dans `/games/CODE/chat` (50 derniers), à part de l'état de la partie.

- Bouton « 💬 Messages » déplacé dans la zone libre du haut, juste après la pioche et la défausse (icône seule sur les écrans étroits).

- Correction (MacBook Air de Marion) : pendant le tour de l’autre, le bandeau orange était inséré juste sous l’en-tête et cassait une règle d’affichage : les anciens blocs du haut réapparaissaient et la carte devenait un petit bandeau. Le bandeau flotte maintenant au-dessus de la carte, et la page peut défiler si tout ne tient pas.

- Mise à jour du jeu : le service worker vérifie toujours la dernière version des fichiers (avant, un fichier comme online.js pouvait rester ancien jusqu’à 10 minutes après une mise en ligne : les messages ne marchaient alors que d’un côté). Si les messages ne peuvent pas démarrer, un message demande de recharger la page.
## Apprendre à jouer — partie guidée (16 octobre 2026)
- Nouveau bouton **🎓 Apprendre à jouer** sur l'écran titre : une vraie petite partie solo, déjà préparée (Gravel avec tente, 5 jours).
- Carte Voyage spéciale **« Premier voyage : vers la mer Égée »**, Budapest → Athènes : 3 villes, 3 cases côtières, 1 case montagne (+9 points). Elle est en dehors des 20 cartes et n'est jamais tirée au hasard.
- **Chemin conseillé** en pointillés orange sur le plateau, et un cercle qui pulse sur la prochaine case à cliquer.
- **20 bulles** (papier crème, flèche vers l'endroit concerné). Le guide attend que le joueur fasse la chose demandée :
  - jour 1 : carte Voyage, énergie, tracer, rouler, manger en ville, finir la journée ;
  - jour 2 : météo annoncée (allumée ce jour-là), repas du matin, jeton « ? » (+2), hors route (3 cases) ;
  - jour 3 : fatigue, Sofia, la montagne, Thessalonique ; le soir, le joueur est fourbu ;
  - jour 4 : camping (la fatigue s'efface) ;
  - jour 5 : carte Événement « Vent dans le dos » offerte, les 3 côtes, l'arrivée, puis « Bravo ! Tu sais jouer. ».
- Pas de pioche de cartes pendant le guide. Météo fixée sur du beau temps pour les Balkans. « Passer le guide » est possible à tout moment.
- À la fin : « Continuer la partie » (nouveau voyage, météo et cartes allumées, comme une partie normale) ou « Retour au menu ».
- Aucune règle du jeu n'est changée. Fichiers : `dist/tutorial.js` (déroulé et bulles), fin de `dist/app.js` (affichage des bulles), `dist/board-renderer-svg.js` (pointillés), `dist/voyages.js` (carte du didacticiel), test `tests/tutoriel.test.js`.

## Mode Immersion (16 octobre 2026, maquettes ImmersionChoixC, ImmersionRouteC, ImmersionSoirC, ImmersionMoteurC, ImmersionImprevuC validées)
- **Choix du mode** sur l'écran « Les cyclistes » et dans la salle d'attente en ligne : **Mode original** (inchangé, conseillé à plusieurs) ou **Mode Immersion** (conseillé en solo). En Immersion : météo annoncée d'office, plus de cartes Événement. Réglage `immersion.enabled` dans `dist/rules.js`.
- **Contenu** dans `dist/immersion.js` : 43 scènes (26 en route, 17 le soir) inspirées de vrais voyages à vélo, sans nom de personne réelle, + les 20 rencontres existantes ; détails tirés au sort selon la zone (qui, où, ce qu'on t'offre) ; 10 imprévus qui durent ; 3 compagnons de route ; chances de « Demander ».
- **En route** : environ un jour sur deux, une scène s'ouvre sur la 1re, 2e ou 3e case de la journée ; la journée continue après le choix. Jamais deux galères de suite ; une scène vue est mise de côté 10 jours ; les scènes « uniques » n'arrivent qu'une fois. Certains choix sont des **paris** (« ça marche 2 sur 3 »).
- **Le soir** : toujours une scène, avec le **carnet du soir** qui raconte la journée (aussi rangé dans l'onglet Carnet). Les rencontres du soir n'arrivent qu'**après une journée de route** (rester sur place ne rapporte pas de points).
- **« Demander l'hospitalité »** (fiche Journée, rubrique Dormir) : une journée de repos et un pari. Grand accueil 1 sur 4 (nuit gratuite, +5 énergie, un repas, fatigue effacée, +2 points), jardin 2 sur 5 (nuit gratuite, +5 énergie, fatigue effacée), refus 1 sur 3 (camping de dernière minute à 2 pièces ; sans pièce : nuit dehors, fatigue +1). Plus de chances en campagne, fourbu, Balkans et Est ; moins en ville et dans les Alpes.
- **Imprévus qui durent** : au plus 2 à la fois, posés sur la route du cycliste (3 à 9 cases devant lui), hachurés sur la carte (orange = galère, vert = bonne nouvelle), annoncés par une scène et listés dans la fiche Journée (« Imprévus en vue »). Côte en août (camping 2 pièces, bivouac interdit, +1 énergie une case sur deux), canicule, feu de forêt (cases interdites), col fermé (cols interdits), travaux (+1 énergie en entrant), coup de vent ; vendanges, fête nationale (scène du soir), voie verte (+2 énergie le soir), fin de saison (camping gratuit).
- **Règles validées par Fi** : guêpe ou repas qui passe mal = jour de repos forcé ; compagnon de route = rouler ensemble trois jours, la fatigue monte moins vite (un jour sur deux, pas de fatigue en plus).
- Règles détaillées : onglet « Immersion » ; résumé de départ adapté ; pioche de cartes masquée en Immersion.
- Tests : `tests/immersion.test.js` (15 tests). Robots : `IMMERSION=1 node tools/simulation/parties-auto.mjs`.
- Nom du cache `dist/sw.js` **non changé** : Fi s'en occupe.

## Page Éditeur et barre d'action compacte (16 octobre 2026, demande de Fi ; maquette A de la planche « Partie action »)
- **Accueil** : un seul bouton **« Éditeur »** remplace « Cartes Événement » et « Créer une carte ». La liste « Mes cartes » et l'import ne sont plus sur l'accueil.
- **Page Éditeur** (`editorHubScreen` dans `dist/menus.js`) : le seul endroit pour créer ou modifier — Atelier de carte, Mes cartes (« Modifier » + import .json), Cartes Événement. Les éditeurs reviennent à cette page (« ← Éditeur »).
- **« Où roulera-t-on ? »** : seulement des choix pour jouer. Tes cartes restent avec « Jouer → » ; plus d'atelier, d'import ni de « Modifier ». « Jouer avec les tuiles » est caché (mode non développé).
- **Barre d'action compacte** : le bandeau « Planifier l'étape » est intégré à la barre (ton étape, chemin, coût en énergie, avertissements hors route / météo / bateau en pastilles) ; le bouton « Rouler → » est sur la même ligne. Sur un écran 1900 × 1056, la carte passe d'environ 510 à 830 pixels de haut. Sur téléphone, la barre s'empile.
- Cache : `aventure-velo-v77-immersion`, `?v=immersion` ; `immersion.js` ajouté aux fichiers gardés hors ligne.

## Mode Immersion : dormir termine la journée (16 octobre 2026, demande de Fi)
- **Un tour = une journée complète.** « Finir ma journée » (et « Dormir ») ouvre **« Où dormir ce soir ? »** ; on ne peut plus se reposer en début de journée pour recharger. Seulement en mode Immersion.
- **Nuits** : bivouac (gratuit, tente) +1 énergie, fatigue inchangée ; camping (1 pièce) +2, fatigue −1 ; hôtel (3 pièces, en ville) +3, fatigue effacée ; « Demander » : grand accueil +3, un repas, fatigue effacée, +1 point · jardin +2, fatigue −1 · refus : camping de dernière minute 2 pièces (+2, fatigue −1) ou nuit dehors (+0, fatigue +1). **Journée sans rouler** : la nuit rend deux fois plus.
- **Chaque nuit est un pari** : nuit tranquille, galère ou belle surprise selon l'endroit (bivouac le plus risqué, surtout sous la pluie ou l'orage ; hôtel le plus sûr). Les chances de nuit calme sont affichées.
- **Scènes du soir** : les 20 rencontres génériques sont retirées du mode Immersion ; les scènes sont liées au lieu de la nuit, et les cadeaux réduits (le plus souvent +1 point au plus). Les choix vérifient les sacoches (chambre à air, kit, réchaud, tente) ; chaque scène garde un choix toujours possible. Scènes en route aussi moins généreuses.
- Réglages : `NIGHT`, `REST_DAY_FACTOR`, `DEMAND_NIGHT` dans `dist/immersion.js`. Essai : avec +1/+2/+3, un cycliste parcourt environ 2,1 cases par jour et prend environ 3 jours de repos sur 30 (avec +2/+3/+4 : 2,4 cases et presque jamais de repos).
- Robots : `robotSleep` choisit où dormir. Tests : 19 tests dans `tests/immersion.test.js`.
- Cache : `aventure-velo-v78-nuit`, `?v=nuit`.

## Mode Immersion — la fatigue (16 octobre 2026)
- Seulement en mode Immersion ; le mode original ne change pas. L'énergie, c'est la journée ; la fatigue, c'est la semaine (manger ne l'efface pas).
- **6 niveaux (0 à 5)** : En forme (énergie max 10), Un peu las (9), Fatigué (8), Épuisé (7 · repas −1 · paris −15 %), À bout (6 · 1 case de moins), Fourbu (5 · repos forcé le lendemain, scène « Fourbu »).
- **Ce qui fatigue** : +1 par journée de route, +1 de plus avec un col ou 5 cases ; nuit dehors et galères de nuit +1 (déjà dans les scènes).
- **Ce qui repose** : bivouac 0, camping −1, hôtel −2 (avant : remise à 0), « Demander » grand accueil −2 / jardin −1 ; journée sans rouler suivie d'une vraie nuit −3, −4 en ville.
- **La fatigue cause les galères** : événement en route 1/3 · 2/5 · 1/2 · 3/5 · 2/3, part de galères 1/5 · 1/3 · 1/2 · 2/3 · 3/4. Reposé : seulement météo et mécanique, jamais deux galères de suite. Dès la fatigue 2 : galères d'inattention (nid-de-poule, mauvaise bifurcation, affaires oubliées, chute à l'arrêt, gravillons).
- Affichage : fiche (cases hachurées, niveau, 5 ronds, « Risque de galère »), barre d'action (avertissement, journée de plus, meilleure nuit), « Où dormir ce soir ? » (fatigue enlevée par chaque nuit).
- Réglages : `FATIGUE`, `FATIGUE_GAIN`, `FATIGUE_REST_DAY` dans `dist/immersion.js` ; `fatigueMax`, `energyCap` dans `dist/rules.js` ; `fatigueInfo` à la fin de `dist/simulator.js`. Tests : 8 tests de plus dans `tests/immersion.test.js`.
- Cache : `aventure-velo-v79-fatigue`, `?v=fatigue`.

## Mode Immersion — fiche compacte (maquette A, 16 octobre 2026)
- Planche « Fiche compacte — mode Immersion » (https://claude.ai/artifact/QZHBiAo7n9Y189dcGGNXjG), choix A.
- Énergie et fatigue sur une seule bande (niveau, 5 ronds, risque de galère), repas/pièces/aventure en ligne, onglets, météo et route du jour resserrés, nuits en tableau (une ligne par nuit, seulement la fatigue vraiment enlevée). Encore plus serré quand la fenêtre fait moins de 950 points de haut (Legion 5, Mac M1).
- Barre d'action : comme avant (effets des cases choisies), sans étiquettes de fatigue ; « clique les cases entourées » retiré en Immersion.
- Code : immGauges, immSleepRows à la fin de `dist/app.js` ; classe `imm-fiche`.
- Cache : `aventure-velo-v81-fiche`, `?v=fiche`.

## Fatigue du mode original, fiche compacte partout, paris en Immersion (16 octobre 2026)
- **Nouvelle règle (Fi), mode original et en ligne** : chaque niveau de fatigue enlève 2 à l'énergie maximale (1 → 8, 2 → 6, 3 fourbu → 4). Camping ou hôtel efface la fatigue, le bivouac non (inchangé). `energyCap` dans `dist/rules.js` (maxEnergyPenalty × fatigue). Didacticiel et règles mis à jour.
- **Fiche compacte (maquette A) dans tous les modes** : mêmes visuels, règles propres à chaque mode (3 ronds en mode original, onglet Cartes gardé). Nuits en tableau (origSleepRows). Barre d'action : « clique les cases entourées » retiré partout.
- **Paris (Immersion seulement)**, planche https://claude.ai/artifact/UsPdo1u9xUyhbcyqGAKisG : chaque pari montre sa chance (jauge), les deux issues et leurs effets, et « Fatigue : −15 % » quand on est épuisé ; le résultat s'affiche dans une fenêtre « Pari réussi ! / Pari raté… » jusqu'à « Continuer » (betChoiceBody, betModal à la fin de `dist/app.js` ; betOdds dans `dist/simulator.js`).
- Cache : `aventure-velo-v82-paris`, `?v=paris`.

## Carte plus vivante : pion « cycliste libre », trace du voyage, nuits, soir (16 octobre 2026)
- Planches « En selle » (https://claude.ai/artifact/8j2PZ9xQDwvi4BxZJFWhGs) et « Le pion du cycliste » (https://claude.ai/artifact/G7DZQGnSvCXDAnHis4Dd1F, choix B). Pas de fenêtre vidéo (demande de Fi).
- **Pion B** : le cycliste chargé (sacoches, tente) posé sur la carte, avec ombre et fanion à la couleur du joueur (numéro dessus). En roulant : roues et pédalier qui tournent, il se tourne dans le sens de la route à chaque case, petit nuage de poussière (riderFree dans `dist/board-renderer-svg.js`).
- **Trace du voyage** : pointillés crème bordés de sombre de case en case (travelHistory), les jours passés plus pâles (drawJourneys).
- **Nuits sur la carte** : `p.nights` (moteur) ; icône par case (tente, camping, lit, maison chez l'habitant, lune pour la nuit dehors), info-bulle « Jour N · … ».
- **Le soir qui tombe** : classe `soir` sur la page pendant « Où dormir ce soir ? » et les scènes du soir (Immersion) : la carte passe à une lumière orangée et sombre, les noms de villes s'allument.
- Cache : `aventure-velo-v83-pion`, `?v=pion`.

## Le pion vivant et le zoom sur le cycliste (16 octobre 2026)
- Planche « Le pion vivant » (https://claude.ai/artifact/H8mqijgMYAkQP2BmwNNGS5) : les quatre animations validées par Fi.
- **Pose au repos** : quand ce n'est pas à lui de jouer, le cycliste est assis à côté de son vélo (avec sa tente s'il a dormi là) ; le soir, le cycliste actif s'assoit et sa tente est montée.
- **Danseuse** : en montée (moyenne montagne, montagne, col), debout sur les pédales et plus lent ; en descente, couché sur le guidon, roue libre, fanion qui claque, plus rapide.
- **Météo sur le pion** : cape jaune et gouttes sous la pluie ou l'orage, fanion qui claque au vent, flocons sous la neige (météo de la zone du cycliste).
- **Fatigue** : tête basse, goutte de sueur, pédalage plus lent ; fourbu : petits nuages de souffle. Immersion : dès « Épuisé » ; mode original : dès 2 de fatigue.
- **Zoom sur le cycliste** : quand il roule, la caméra se rapproche et le suit, puis revient à la vue d'avant ; le soir (« Où dormir ce soir ? » et scènes du soir), zoom sur lui, retour au matin (renderer.spotlight). Rien de tout ça avec « animations réduites ».
- Code : riderFree, riderSitting, idleDraw, flagPath (`dist/board-renderer-svg.js`) ; riderInfo, eveningNow (fin de `dist/app.js`).
- Cache : `aventure-velo-v84-vivant`, `?v=vivant`.

## Pion plus lent, fenêtres qui attendent (16 octobre 2026)
- Demande de Fi : l'animation allait trop vite et était souvent cachée par une fenêtre.
- Le cycliste roule une case toutes les 0,65 s (avant 0,26 s), jusqu'à 7 s pour une étape ; la caméra reste sur lui 1,4 s à l'arrivée avant de revenir (STEP_MS dans `dist/board-renderer-svg.js`).
- Les fenêtres (scènes, cartes, pari…) attendent la fin du trajet puis apparaissent en fondu (renderer.busyFor, classe `hold`, fin de `dist/app.js`).
- Cache : `aventure-velo-v85-lent`, `?v=lent`.

## Carte allégée (16 octobre 2026)
- À la demande de Fi : la trace du voyage et les icônes des nuits ne s'affichent plus sur la carte (trop chargé à plusieurs joueurs). Le code reste (drawJourneys, `p.nights`) : app.js passe `journeys:[]`. Le pion garde sa tente quand il est assis.
- Cache : `aventure-velo-v86-carte`, `?v=carte`.

## Bug du voyage et petites animations (16 octobre 2026)
- **Bug (signalé par Fi, Immersion solo, 2e carte)** : arrivé sur la ville d'arrivée avec tous les objectifs, il a dû ressortir de la ville pour terminer le voyage. Correction : les 3 nouvelles cartes s'affichent dès l'arrivée (plus le lendemain), et filet `arrivalCheck` (simulator.js) : déjà sur la ville d'arrivée avec tout rempli → le voyage se termine (à l'affichage hors ligne et à chaque début de journée).
- **Animations validées par Fi** : col franchi (drapeau planté, « +2 » doré qui s'envole) ; jeton « ? » (carte qui se retourne, étincelles, nom du lieu) ; voyage réussi (confettis, cycliste bras levés) ; ferry (bateau et vague sous le cycliste) ; voyage rapide (petit train) ; scène en route (bulle : clé panne, gouttes météo, cœur belle rencontre, « ! » autre galère) ; manger (le cycliste croque une pomme, les cases d'énergie se remplissent une à une sur la fiche).
- Code : playFx, boatArt, trainArt, bubbleArt, renderer.effect / gesture (`dist/board-renderer-svg.js`) ; détection des événements de l'historique, sceneBubble (fin de `dist/app.js`) ; `cause` ajoutée aux scènes (simulator.js).
- Cache : `aventure-velo-v87-anim`, `?v=anim`.

## Alerte des messages en ligne (16 octobre 2026)
- Signalé par Fi : en partie en ligne, pas d'alerte quand on reçoit un message.
- Causes probables : le bandeau disparaissait au premier rafraîchissement de l'écran (fréquent pendant le tour de l'autre) et était caché sous les fenêtres ; au-delà de 50 messages, les nouveaux n'étaient plus repérés (comptage par nombre).
- Correction : nouveaux messages repérés par leur heure ; bandeau en haut, au-dessus de tout, 9 secondes, qui survit aux rafraîchissements (« Marion t'écrit… · Ouvrir ») ; petit « ding » ; bouton 💬 qui clignote et titre de l'onglet « 💬 (n) » tant qu'il y a du non-lu.
- Cache : `aventure-velo-v88-messages`, `?v=messages`.

## Niveaux de difficulté, mode Immersion solo (16 octobre 2026)
- Planche « Difficulté Immersion » (https://claude.ai/artifact/PDh7fUSUwwd7Hwi3FEZnrz), validée par Fi avec deux ajouts : en Aventure et Expédition, 1 pièce = 1 repas ; en Expédition, un repas rend moitié moins d'énergie.
- Choix du niveau sous « Mode Immersion », en solo (rules.immersion.level ; défaut « voyage » = le jeu d'avant).
- Balade : départ 10 énergie, +3 pièces, 50 jours, galères ×2/3, paris +15 %, refus −10 %, camping −2 et hôtel −3 de fatigue, col et 5 cases sans fatigue en plus, imprévus moitié moins et surtout bons.
- Voyage : inchangé, 40 jours.
- Aventure : 7 énergie, −2 pièces, 35 jours, galères ×1,25, paris −10 %, refus +10 %, imprévus 2 jours sur 5, 1 pièce = 1 repas.
- Expédition : 6 énergie, −3 pièces, 30 jours, galères ×1,5, paris −15 %, refus +20 %, camping de dernière minute 3 pièces, imprévus 1 jour sur 2 (3 à la fois), 1 pièce = 1 repas, repas moitié moins (+2 / +1), journée de repos −2 (−3 en ville), +1 fatigue après un bivouac sous la pluie, chances des paris et des nuits cachées, météo du jour seulement.
- Badge du niveau sur la fiche, médaille (bronze, argent, or, cristal) sur l'écran de fin.
- Code : LEVELS dans `dist/immersion.js` ; immLevel / immLevelId dans `dist/simulator.js` ; levelPicker dans `dist/menus.js` ; badge, météo, chances cachées à la fin de `dist/app.js`. 2 tests de plus.
- Cache : `aventure-velo-v89-niveaux`, `?v=niveaux`.

## 16 octobre — Marché, crevaisons et photo au col
- En arrivant en ville, un marché s'ouvre : 🚲 Magasin de vélo (liste du matériel à acheter ou laisser), 🛒 Supérette (provisions), Restaurant, Hôtel.
- Chambre à air : répare une crevaison une seule fois. Kit de réparation : 2 pièces, se garde (règles version 4). Choix entre les deux s'il y a les deux.
- Crevaison et chute : le cycliste répare ou tombe sur la carte, la fenêtre arrive après l'animation (tous les modes).
- Col franchi : une fenêtre montre le cycliste qui photographie son vélo devant le panneau du col (nom et altitude), le flash, puis la photo « +2 ». Le carnet marque le col d'un 📸.

## 16 octobre (soir) — La nuit en images (mode Immersion)
- « Où dormir ce soir ? » : les nuits deviennent 4 cartes illustrées (bivouac, camping, hôtel, demander), dessin selon la météo du soir.
- Après le choix, une fenêtre montre la scène : bivouac monté (feu, Zzz), arrivée au camping, entrée à l'hôtel, ou « toc toc » chez l'habitant (chambre d'amis, jardin ou refus). Bouton « Passer », fermeture seule à la fin. Aucune règle changée.
- Nouveau fichier : dist/night-scenes.js (dessins seulement).

## 16 octobre (soir) — Scènes animées avec la carte en fond
- Chaque fenêtre de rencontre (en route, le soir, imprévus) montre en haut une petite animation propre à la scène (51 scènes + vendanges et fête nationale ; scène simple pour les autres), jouée une fois puis vivante sur sa dernière image.
- Le fond est la vraie carte du jeu autour de la case du cycliste (village, côte, montagne…), case entourée d'orange ; le soir la carte s'assombrit.
- Nouveau fichier : dist/encounter-scenes.js (dessins seulement). Aucune règle changée.

## 17 octobre — Animations dans le mode original, paysages des lieux cachés
- Mode original : carte Événement reçue (attaque ou événement solo) → la scène animée à côté de la carte, carte du jeu en fond ; carte jouée pour soi (positive ou équipement) → fenêtre avec sa scène ; « Nuit chez l'habitant » → scène « toc toc » ; repos bivouac, camping, hôtel → scène de la nuit.
- Lieux cachés (jetons « ? ») : 15 paysages, un par lieu (belvédère, pont, chapelle, lavoir, moulin, source, village perché, cascade, gorges, château, forêt, panorama, lac, abbaye, grotte), avec petites animations (eau, roue, torche).
- Nouveau fichier : dist/landmark-art.js. Aucune règle changée.

## 17 octobre — Mode original : on roule, puis on dort (règles de Fi)
- **Dormir termine la journée**, comme en Immersion : « Finir ma journée » ouvre « Où dormir ce soir ? » (bivouac, camping, hôtel, Demander l'hospitalité). On peut dormir après avoir roulé.
- **Énergie des nuits = chiffres Immersion** (choix de Fi) : bivouac +1, camping +2, hôtel +3 ; Demander : grand accueil +3, repas et +1 point · jardin +2 · refus → camping de dernière minute 2 pièces (+2) ou nuit dehors (+0). Journée sans rouler : la nuit rend 2 fois plus. Le matelas et duvet ajoute toujours +1.
- **Fatigue du mode original gardée** : camping, hôtel, grand accueil et camping de dernière minute l'effacent ; bivouac ne change rien ; jardin −1 ; nuit dehors +1. Pas de « pari de la nuit » dans le mode original.
- **Solo** : plus de cartes négatives ni climatiques dans la main de départ (elles retournent sous la pioche et sont remplacées).
- Code : `origSleep` / `applyOrigNight` à la fin de `dist/simulator.js` ; `origNightRows` dans `dist/app.js` ; main de départ solo dans `dist/event-card-engine.js` (setup). Cache v94-nuits.

## 17 octobre 2026 — Cartes Voyage illustrées et points selon l'effort (cache v95-cartes)
- **Points selon l'effort** (barème de Fi, 1 point = 2,5 d'effort) : effort = cases + énergie du meilleur trajet qui remplit tous les objectifs. 10 et plus → 4 (Facile) · 20 et plus → 8 (Modéré) · 30 et plus → 12 (Difficile) · 40 et plus → 16 (Très difficile) · 50 et plus → 20 (Épique). Tableau `VOYAGE_EFFORT` dans `dist/voyages.js`.
- **5 cartes durcies** (trop faciles dans leur tranche) : Cap vers le Nord 4 villes (58 → 20 pts) ; Les routes de l'Est 4 montagnes (47 → 16) ; Des îles au continent 3 côtes (17 → 4) ; Vers la mer Égée 2 villes (19 → 4) ; Le fil du Danube 3 côtes (38 → 12). Partie guidée : 8 points.
- **Cartes illustrées** : les 20 illustrations de Fi (`dist/assets/voyages/cartes/<id>.webp`, 800 × 500) ; partie basse générée (`dist/voyage-card.js` : titre, trajet, objectifs avec image de case, environ N cases, niveau et points). Utilisées sur l'écran « Choisis ton voyage », dans la fenêtre « nouveau voyage » et en petit dans l'objectif.
- Correction : le résumé des règles affichait « ${r.fatigue.maxEnergyPenalty} » tel quel.

## 17 octobre 2026 — Arrivée en ville : le carrefour (cache v96-carrefour)
- Planche « Le carrefour de la ville » (https://claude.ai/artifact/6TdAidsaFdFVbyiDikJn5r), validée par Fi.
- En arrivant dans une ville, la fenêtre montre une petite rue au même trait que les scènes du soir, en plein jour : magasin de vélo, supérette, restaurant, hôtel, fontaine, panneau des villes voisines, passants, pigeons, fumée, drapeau.
- Maisons selon la région : pierre et tuiles (Ouest), chalets (Alpes), pignons à gradins (Nord), façades pastel (Est), maisons à encorbellement (Balkans). Couleurs et détails tirés selon la case : une même ville garde toujours le même visage.
- On clique sur une boutique : le cycliste y roule, pose son vélo, frappe, la porte s'allume, il entre. La boutique s'ouvre avec sa scène (commerçant, pièce qui part, objet acheté) et ses achats. « Ressortir sur la place » le ramène au carrefour.
- Règles et prix inchangés (mêmes actions qu'avant). Dessins dans `dist/town-scene.js` ; branchement à la fin de `dist/app.js` ; styles `.tw-*` à la fin de `style.css`.
## 17 octobre 2026 — Cartes Événement au style « carte d'aventure » (cache v97-evenements)
- Les 40 cartes Événement redessinées (planche « Carte Événement n° 1 », validée par Fi) : bandeau de la couleur de la famille (Positive, Négative, Climatique, Bonus) avec le numéro, petite scène animée du jeu sur la carte autour de la case du joueur, nom en Fraunces, phrase en italique, effet en une phrase avec les terrains concernés et la protection, ligne « pour qui / quand ».
- Code : `dist/event-card-ui.js` (eventFace, textes courts par type d'effet, boucle d'animation startCardScenes ; plus de 8 cartes à l'écran : seule la carte survolée s'anime) ; style à la fin de `dist/style.css`. Aucune règle changée.

## 17 octobre, 11 h 40 (cache v98-soir) — Deux corrections du mode original
- « Finir ma journée » ouvre bien « Où dormir ce soir ? » (la fenêtre était réservée au mode Immersion).
- En roulant jusqu'à une ville, la fenêtre de la ville ne clignote plus avant le trajet : elle reste cachée pendant que le cycliste roule (`.modal-back.hold` sans fondu).

## 17 octobre, 17 h 40 (cache v99-icone) — Icône et aperçu du lien
- Nouvelle icône aux couleurs du jeu : une case hexagonale bordée de crème avec un morceau de la carte, la route en pointillés orange et un vélo chargé (icon.svg, icon-192/512, icon-maskable-512, apple-touch-icon, favicon-32).
- Aperçu quand on partage le lien (WhatsApp, Messenger, mail…) : og-image.jpg 1200 × 630 avec titre, phrase et « Jouer gratuitement ». Balises Open Graph et Twitter dans index.html ; manifeste aux couleurs du jeu (#102226), nom court « Aventure à Vélo ».

## 17 octobre, 17 h 55 (cache v100-fin) — Nouvelle fin de partie (règle de Fi)
- Le premier cycliste qui réussit 3 voyages arrête la partie et reçoit +5 points d’aventure (`victory.voyagesBonus`, 5 par défaut).
- Le gagnant est ensuite celui qui a le plus de points d’aventure (à égalité : le plus de voyages, puis celui qui a fini en premier). En solo, rien ne change à part le bonus.
- Les conditions 35 points et 40 jours restent comme avant. Règles (onglet « Fin de partie ») et écran de choix de la fin de partie mis à jour. Code : checkMultiVictory (simulator.js).

## 17 octobre, 18 h 20 (cache v101-cartes-tour) — Cartes négatives reçues à son propre tour (règle de Fi)
- Une carte négative jouée contre un autre joueur ne bloque plus le tour de celui qui la joue : elle attend chez la cible (`incomingAttacks`) et s’ouvre au début de son propre tour (fenêtre « Réaction », parade possible), une carte après l’autre (`nextIncoming`, event-card-engine.js ; appelé à la fin d’advance dans simulator.js).
- Les effets « au prochain tour » (pas de trajet, route barrée, neige) s’appliquent au tour où la cible découvre la carte ; une crevaison, une casse ou une chute ouvre la réparation tout de suite.
- Celui qui joue la carte voit « Carte envoyée : … la découvrira au début de son tour ». Les cartes climatiques (jouées sur le trajet du joueur actif) ne changent pas.
- Tests des cartes adaptés à la nouvelle règle (cartes-fi, event-cards-v3, event-card-editor-v3).

## 17 octobre, 18 h 50 (cache v102-repas) — Repas, sacoches, nuits, zoom et passage plus rapide (demandes de Fi)
- Repas : un repas des sacoches se mange partout. Sans réchaud, repas froid +2 (sandwich à l’ouest, burek dans les Balkans, pain et fromage dans les Alpes, pirojkis à l’est, pain de seigle et poisson fumé au nord) ; avec réchaud, repas chaud +3. Règles food.coldEnergy / food.hotEnergy ; mealInfo et eatGain (simulator.js). La carte « réchaud » permanente compte comme un réchaud (+1 de plus avec le vrai réchaud).
- Sacoches : prennent 1 place mais en ajoutent 2 (capacityBonus:2 ; capacityFor / bagCapacity). On ne peut pas les déposer si les sacoches restantes débordent.
- Nuits : bivouac +1, camping +2, chez l’habitant au plus +2 (grand accueil +2 au lieu de +3), dans les deux modes.
- RULES_VERSION 5 : les règles « nourriture » et « équipement » enregistrées sur l’appareil sont remises aux nouvelles valeurs.
- Changement de joueur : la carte zoome sur le cycliste dont c’est le tour (TURN_ZOOM 2,1 dans board-renderer-svg.js).
- Passage plus rapide d’un tour à l’autre : la scène de la nuit joue deux fois plus vite (environ 5 s au lieu de 10, NIGHT_SPEED dans app.js) ; « Passer » la ferme toujours tout de suite.

## 17 octobre, 19 h (cache v103-montagnes) — Objectifs montagne (choix de Fi)
- Un col compte comme une montagne, pour « Montagnes consécutives » et « Tuiles montagne » (progress, voyages.js).
- Repasser sur une case déjà traversée ne compte pas, mais ne casse plus la série. La moyenne montagne casse toujours la série.
- À surveiller : VOYAGE_EFFORT a été calculé avant ce changement (quelques cartes de montagne deviennent un peu plus faciles).

## 17 octobre, 19 h 20 (cache v104-banque) — Banque, repas emportés, règles et tutoriel à jour (demandes de Fi)
- Banque (tous les modes) : bouton « 🏦 Banque » dans la fenêtre de la ville (intérieur dessiné dans town-scene.js), et « Emprunter 5 pièces » dans la fenêtre du train quand le billet est trop cher. Un seul prêt de 5 pièces, sans intérêts, remboursé en une fois dans une banque ; non remboursé à la fin : −3 points (rules.loan ; takeLoan, repayLoan, settleLoans dans simulator.js ; le classement de fin en tient compte). Prêt affiché sur la fiche (« · prêt 5 »).
- Repas emportés (RULES_VERSION 6) : 2 repas au départ pour tous ; au maximum Gravel 2, Randonneuse 4 (bikes.*.maxFood) ; Sacoches +2 repas (foodBonus 2) ; carte « grande sacoche » +3. Le maximum s’applique dans tous les modes (achats compris).
- Règles consultables (rules-help.js) et partie guidée (tutorial.js) mises à jour : on roule puis on dort, chiffres des nuits, repas froid/chaud, repas au maximum, cartes négatives reçues à son tour, cols = montagnes, fin de partie (+5 au premier à 3 voyages, le plus de points gagne), banque.
- Tests adaptés aux nouvelles limites de repas (cartes, partie guidée : on rachète des provisions à Thessalonique).

## 17 octobre, 19 h 25 (cache v105-fin-en-ligne) — Écran de fin en ligne
- En ligne, l’écran « Partie terminée » s’affiche aussi chez l’autre joueur (les fenêtres étaient cachées hors de son tour, même partie finie). Le bandeau dit « Partie terminée » au lieu de « … joue ».
- Classement de fin lisible (texte foncé sur la carte crème) et phrase de victoire à jour (+5 au premier à 3 voyages, le plus de points gagne).

## 17 octobre, 19 h 45 (cache v106-stats) — Écran de fin avec statistiques (planche « Statistiques de fin » validée par Fi)
- « Partie terminée » montre une fiche par joueur : d’où viennent les points (barre par catégorie), le détail de chaque point d’aventure jour par jour (à déplier), les voyages (complets ou −40 %), la route par terrain (cols mythiques, hors route, train), les nuits, les repas, les cartes jouées et subies ; puis les moments de la partie (roi des cols, plus de côtes, plus beau voyage, nuits dehors).
- Chaque ligne du journal garde désormais les points gagnés ou perdus (stampPoints dans event-card-engine.js, champ `pts`) ; pour les anciennes parties, les points se lisent dans le texte du journal.
- Code : `dist/end-stats.js` (endStatsHtml, playerStats, pointLines) ; styles `.es-*` à la fin de style.css. Ajouté à FILES de sw.js.

## 17 octobre, 19 h 35 (cache v107-stats) — Écran de fin
- Le détail de chaque point d’aventure est ouvert d’office pour tous les joueurs.

## 17 octobre, 19 h 55 (cache v108-sauvegardes) — Sauvegardes et lancement en ligne
- « Mes parties » créait une nouvelle entrée à chaque sauvegarde : l’identifiant venait de la graine du hasard (m.seed), qui change à chaque tirage. Identifiant fixe désormais (m.gameId, saveIdOf dans saves.js) ; une partie rouverte depuis « Mes parties » garde son entrée.
- Sauvegarde à la main (demande de Fi) : « 💾 Sauvegarder » remplace la sauvegarde de la partie dans « Mes parties » ; « Sauvegarde auto : oui/non » dans la fiche (désactivée par défaut) la réenregistre au même endroit à chaque action. La reprise rapide (« Continuer ») reste toujours à jour.
- Lancement en ligne : un deuxième clic sur « Lancer la partie » (ou une action de salle d’attente déjà fermée) affichait « Cannot read properties of null (reading 'code') ». Actions protégées, bouton « ⏳ Lancement… » pendant l’envoi.

## 17 octobre, 20 h 05 (cache v109-rapide) — Partie en ligne beaucoup plus légère
- Lenteur en ligne (plus d’une minute) : chaque action renvoyait tout le nœud Firebase de la partie, carte comprise (plusieurs centaines de Ko), dans une transaction qui pouvait tout retélécharger. Maintenant : petite transaction sur `rev`, puis écriture de `live:{state,rev}` sans la carte ; l’autre joueur écoute seulement `live` (et `seats`, `names`), la carte est lue une fois (online.js : pushState, listenOnline, stateOf, revOf). Les anciennes parties (state au premier niveau) restent lisibles.
- Doublon : une carte négative découverte au début de son tour (fenêtre « Réaction ») n’apparaît plus une deuxième fois dans « cartes reçues ».
- Les deux joueurs doivent recharger la page pour avoir cette version (les anciennes versions lisent l’état au premier niveau).

## 17 octobre, 20 h 15 (cache v110-mesure)
- En ligne : si l’envoi d’un coup dépasse 4 secondes, un message indique la durée et la taille envoyée (pour comprendre une lenteur restante).

## 17 octobre, 20 h 25 (cache v111-tour-rapide) — Passage du tour plus rapide et points visibles en ligne (choix A et B de Fi)
- À plusieurs : après « Où dormir ce soir ? », le tour passe tout de suite au joueur suivant. La pioche des cartes Événement se fait au début de son tour (« DÉBUT DE TA JOURNÉE », m.resumePhase ; afterDraw dans simulator.js), puis il découvre les cartes jouées contre lui. La scène de la nuit ne retient plus le tour. En solo, rien ne change.
- En ligne, quand un autre joueur gagne des points d’aventure (voyage, col, carte, lieu caché…), une bulle s’affiche en bas à gauche (« Marion +2 pts · Col du Stelvio franchi ») et la case du joueur brille sur la carte (pointToasts dans app.js, à partir du champ `pts` du journal).
- Tests des cartes adaptés à la pioche en début de tour.

## 17 octobre, 22 h — Départ simplifié (cache v112-depart)
- Nouvel écran « À quoi veux-tu jouer ? » : trois grandes cartes illustrées (Original · Immersion · Coopératif grisé « Bientôt »).
- « Qui part ? » refait : 1 · nombre de cyclistes (gros boutons), noms ; 2 · paramètres avec une phrase chacun (météo, imprévus, fin de partie). Règles et réglages par défaut inchangés.
- En ligne : « Créer une partie » passe par les deux mêmes écrans, puis la salle d'attente avec le code. « J'ai reçu un code » inchangé.
- Code : kindScreen, kindChoices, countPicker, paramsBlock (menus.js) ; setupPage et actions kind-next, kind, count-N, net-create-open, net-create-next, net-count-N (fin de app.js) ; styles .mc-kind, .mc-param… (fin de style.css). Planche : https://claude.ai/artifact/Kv1xFXZtbjHFXufwWX5dFM

## 17 octobre, 22 h 15 — Mode Bêta (cache v113-beta)
- 4ᵉ carte « Bêta · pour tester » sur l'écran « À quoi veux-tu jouer ? » : une copie exacte du mode Immersion, où les nouvelles règles à l'essai (eau, magasins fermés le dimanche…) seront ajoutées sans toucher aux autres modes.
- Code : `rules.immersion.beta` (rules.js), `m.beta` et `betaOn(m)` (simulator.js) ; action `mode-beta` (fin de app.js) ; carte et libellés dans menus.js. Une nouvelle règle Bêta s'écrit `if(betaOn(m)){…}`.

## 17 octobre, 22 h 45 — Mode Bêta : l'eau et le calendrier (cache v114-eau)
- Seulement dans le mode Bêta (`betaOn(m)`). Original et Immersion inchangés.
- Eau : gourdes Gravel 2 / Randonneuse 3 (pleines au départ) ; 1 gourde bue au premier déplacement du jour ; sans eau : −1 énergie et pas de repas chaud (le réchaud ne boit pas, il faut juste 1 gourde). Remplissage automatique : ville, hameaux (fontaine, 90 cases), camping, hôtel, « Demander ». Rivières et lacs dessinés sur la carte (≈200 cases) et torrents (moyenne montagne, montagne, col) : avec le filtre à eau (2 pièces, 1 place, garage et magasin de vélo) toujours ; sans filtre, seulement gourdes vides, et 1 fois sur 4 eau contaminée (−2 énergie, +1 fatigue).
- Calendrier : jour 1 = lundi, jour affiché sur la fiche. Supérette et magasin de vélo fermés le dimanche en France, Allemagne, Autriche, Suisse, Belgique, Pays-Bas, Italie, Espagne, Portugal, Norvège, Suède, Danemark, Finlande, Grèce, Pologne ; magasin de vélo fermé aussi le lundi en France. Jours fériés au hasard (≈1 jour sur 20 par pays) : boutiques fermées, +1 point « fête » en arrivant en ville.
- 6 scènes Bêta : fontaine à sec, source du berger, source glacée, ruisseau trouble (sans filtre, gourdes vides), tuyau d'arrosage, boulangerie du dimanche.
- Code : fin de simulator.js (WATER_CAP, waterSpot, betaStep, betaNight, weekday, shopClosed, holidayAt) ; crochets dans move, routeCheck, rest, buyFood, buy, hasStove, sceneFits, resolveEncounter ; scènes à la fin de immersion.js ; fiche et boutiques fermées à la fin de app.js ; `filtre` dans rules.js (betaOnly). Planche : https://claude.ai/artifact/H2MeaqWjfvpdmXFT8yFDQv

## 17 octobre, 22 h 40 — Bêta : bouton « Remplir les gourdes » (cache v115-gourdes, poussé, pas encore publié)
- Plus de remplissage automatique en roulant (l'eau ne baissait pas). Bouton « Remplir les gourdes » dans « Se ravitailler » quand on est arrêté sur un point d'eau : ville ou fontaine de hameau (sûr) ; rivière, lac, torrent (sûr avec le filtre, sinon 1 risque sur 4). Camping, hôtel, habitant remplissent toujours la nuit.
- Carte : goutte bleue sur les 90 fontaines de hameau, rivières et lacs plus visibles (classe `beta-water`).
- Code : waterInfo, refillWater (fin de simulator.js) ; betaWaterTile et action water-fill (fin de app.js) ; drawAdventure (board-renderer-svg.js).

## 17 octobre, nuit — Mode Ultra, première version (cache v116-ultra)
- 4ᵉ carte jouable « Ultra · en test » sur « À quoi veux-tu jouer ? » (solo ; grisée en ligne). Ne touche pas aux autres modes (`ultraOn(m)` = Immersion + `m.ultra`, Bêta compris : eau et calendrier).
- Course Lisbonne → contrôle 1 Zurich → contrôle 2 Saint-Pétersbourg → Cap Nord, 3 cols mythiques au choix ; barrières fin des jours 12, 26, 34 (hors délai = fin) ; on gagne à l'ordre d'arrivée ; abandon possible (onglet Course).
- Horloge 24 h : départ lundi 6 h ; chaque case prend des heures (plaine et côte 5, ville 4, moyenne montagne 6, montagne 7, col 8 ; +1 hors route, +1 de nuit 22 h – 6 h, +1 dès « Fatigué »). Un tour = une étape entre deux sommeils (8 cases au plus, l'énergie limite avant).
- Sommeil : sieste 20 min (+1, dette −4 h), un cycle 1 h 30 (+3, −10 h), nuit courte 4 h (+5, −20 h), vraie nuit 8 h (énergie pleine, dette effacée), hôtel 7 h en ville (pareil + gourdes pleines). Dette de sommeil (heures éveillé) → fatigue 0 à 5 (paliers 16/24/32/40/48 h) ; hallucinations dès 32 h, micro-sommeils (chute, 2 h perdues, −2 énergie) dès 40 h, risques doublés de 2 h à 6 h.
- Manger froid seulement (pas de réchaud) : supérette 8 h – 20 h (+2 repas), station-service la nuit en ville (+1), épicerie de hameau (+1) ; 30 min d'arrêt. Restaurant 11 h – 22 h. Pas d'argent à gérer (repas, restaurant, hôtel gratuits). Pas de « Demander », pas de train, un seul bateau (10 h).
- 10 rivaux (vrais noms, liste unique `ULTRA_RIVALS` dans `dist/ultra.js`), sans caractère : itinéraire avec 3 cols, rythme 2,5 à 3,4 cases/jour tiré au sort, mauvais jours, 12 % d'abandons. Pions de couleur sur la carte, classement en direct (onglet « Course »), fantôme de la barrière, tampon et réveil en petites scènes, écran de fin avec classement.
- Code : `dist/ultra.js` (réglages), fin de simulator.js (ultraStep, ultraSleep, ultraEvening, ultraRivals, ultraStandings, ultraGhost…), crochets (move, baseDistance, rest, endTurn, immersionEvening, advance, arrivalCheck, buyFood, restaurant, hasStove, travelFerry, ferryOptions, sleepOptions, shopClosed, createMatch), `ULTRA_VOYAGE` (voyages.js), écrans à la fin de app.js et menus.js, carte dans board-renderer-svg.js. Planche : https://claude.ai/artifact/7GfZ7bfqLaE2oLbVQHmrcb

## 18 octobre 2026 — Ultra : garage au poids, trois besoins, grand départ, chrono (cache v117)
- Carte Ultra : ruban « En développement » ; bande 🚧 sur la fiche.
- Garage de l'ultra (`dist/ultra-garage.js`) : vélo sur pied d'atelier, équipement au mur ; la monnaie est le poids. Montures : Route endurance (plaine/côte/ville −1 h, hors route +3 h), Gravel d'ultra, VTT semi-rigide (hors route 0, route +1 h). Équipements : prolongateurs, dynamo, sac d'hydratation, tige et fourche suspendues, tubeless, sac de bivouac, couverture de survie, GPS + batterie. Poids ≥ 15 kg : cols +1 h ; ≥ 18 kg : montagne aussi. Règles dans `dist/ultra.js` (ULTRA_BIKES, ULTRA_GEAR, ultraKitHours).
- Trois besoins (règle de Fi) : sommeil (dette = fatigue), faim (+1 par case, repas +2 énergie −2 faim, fringale dès 4, à jeun dès 6), soif (+1 par case, gourde bue toute seule dès 2 : +1 énergie ; soif dès 3, déshydraté dès 5). ULTRA_NEEDS dans `dist/ultra.js`. Trois jauges côte à côte sur la fiche.
- Grand départ à Lisbonne (`dist/ultra-start.js`) : la rue de la ville en fond, compte à rebours, 41 coureurs s'élancent.
- Chrono à côté du jour, qui défile pendant le trajet ; la carte passe au soir puis à la nuit.

## 18 octobre 2026 — Ultra : « Comment on court » (cache v118)
- La fenêtre de départ en Ultra explique la course (contrôles, barrières, cols, ordre d’arrivée), l’horloge, l’énergie et les trois besoins (sommeil, faim, soif), le vélo et le poids, l’autonomie. Chiffres tirés de `dist/ultra.js` (ultraIntro dans `dist/rules-help.js`).

## 18 octobre — Ville à rouvrir, fontaines cliquables, train sur les routes, vélos du garage (cache v119-ville-train)
- Tous les modes : en ville, tuile « 🏙️ <ville> » dans « Se ravitailler » pour rouvrir la rue animée après l'avoir fermée (action `town-open`, fin de app.js).
- Bêta : la goutte 💧 de la fontaine sur la carte (case du joueur) et la fontaine de la place en ville se cliquent pour remplir les gourdes, quand c'est possible (classe `can-fill`, `data-key` sur `.water-spot`).
- Train du voyage rapide : suit les routes de case en case (trainRoute dans board-renderer-svg.js), prend le ferry pour passer la mer (icône bateau `ferryShipArt`), 0,48 s par case, caméra qui suit avec un petit zoom (1,9). Règles et prix inchangés.
- Garage : gravel et randonneuse redessinés au trait (modèles de Fi), sacoches qui se remplissent ; avec l'objet « Sacoches », une sacoche de plus dessinée (fourche sur le gravel, tube sur la randonneuse). Dessin seulement.

## 18 octobre — Ruban « En développement » sur la carte Bêta (cache v120-beta-ruban)
- Même ruban que l’Ultra sur la carte Bêta de « À quoi veux-tu jouer ? », étiquette « Pour tester · en développement ».

## 18 octobre — La traversée ibérique : 1 ville au lieu de 2 (cache v121-iberique)
- Demande de Fi : le seul chemin à 2 villes passait par Bordeaux. Objectifs : 1 ville · 4 plaines · 2 moyennes montagnes. Effort (cases + énergie) 44 → 27 : 16 → 8 points. Trajet complet 12 cases.

## 18 octobre — Points des cartes Voyage selon le tableau de Fi (cache v122-points)
- Chaque carte a ses points max (tous les objectifs) et min (arrivé sans tous les objectifs) : VOYAGE_POINTS dans voyages.js. La règle des −40 % est remplacée par les points mini. La carte affiche « N points · M sans les objectifs ».
- Bug corrigé : l'objectif « col mythique » (De la Provence à la lagune) ne se validait jamais depuis que le col compte comme une montagne.

## 18 octobre — Carte : nouvelles villes, Lille déplacée, routes ajoutées (cache v123-carte, MAP_VERSION 14)
- Villes ajoutées (demande de Fi) : Brest, Oulu, et à l'est de la Caspienne Atyraou, Aktaou, Türkmenbaşy, Noukous, Achgabat. Lille descend d'une case (sous Calais) ; son ancienne case redevient une plaine.
- Routes ajoutées : Moscou → Voronej, Voronej → Samara, Orenburg → Volgograd (capture de Fi), et les routes des nouvelles villes (Brest → Paris, Brest → Bordeaux, Oulu → Luleå / Kuusamo / Helsinki, Astrakhan → Atyraou → Orenburg, Atyraou → Aktaou → Türkmenbaşy → Achgabat, Beyneu → Noukous → Achgabat).
- tools/routes/construire-routes.mjs garde désormais les routes déjà figées telles quelles et ne trace que les nouvelles.
- (v124) Les nouvelles villes ont leurs maisons peintes : PAINTED_BEFORE (terrain-dynamic.js) liste les cases changées après la peinture, que le dessin en direct refait ; sol peint gardé sous une nouvelle ville. Noukous placée une case plus à l'ouest (le nom sortait de la carte). Jetons « ? » : s'il manque des cases loin des routes dans la zone des voyages, on en cherche ailleurs (hors fond de la Russie).
- (v124, poussé, pas encore publié) Maisons peintes des nouvelles villes (PAINTED_BEFORE dans terrain-dynamic.js), Noukous une case plus à l'ouest, jetons « ? » toujours loin des routes.

## 18 octobre — Carte « L’Extrême » Lisbonne → Saint-Pétersbourg (cache v125-extreme)
- 5 villes · 3 montagnes d’affilée · 1 col mythique · 3 côtes ; environ 47 cases ; 35 points réussie (maximum du tableau, fin de partie), 28 sans tous les objectifs. Pas encore d’illustration.

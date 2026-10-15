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

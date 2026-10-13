# L’Aventure à Vélo

Jeu de société local pour 1 à 6 joueurs. Le mode Europe utilise la nouvelle image fournie, avec plus de 700 hexagones de même taille dont les centres sont relevés sur les cases visibles de la carte. Le mode Tuiles reste disponible.

## Jouer

Ouvrir le [site hébergé](https://aventure-velo-philippe.fifeetch.chatgpt.site/) ou démarrer un serveur statique sur `dist/`. Une partie est enregistrée dans le navigateur ; Paramètres permet de l’exporter/importer en JSON. Le site ne peut pas écrire directement sur `D:` depuis le navigateur.

Après le choix du vélo (4 ou 8 emplacements), chaque joueur achète son matériel sur son budget de départ. La tente permet le bivouac ; le réchaud permet de manger hors ville ou auberge ; le kit répare une crevaison. Les prix et emplacements, comme les coûts de terrain, sont modifiables dans Règles. La moyenne montagne est une catégorie distincte (2 énergie par défaut), la haute montagne coûte 3 ; plaine/côte 1 et ville 0.

Sur la carte, sélectionner successivement les cases voisines d’un itinéraire, puis cliquer « Effectuer le parcours ». L’énergie est déduite pour chaque case, dans l’ordre, avec un maximum de cinq cases par journée. Les ferries se prennent depuis leurs ports : destination affichée, confirmation, tarif modifiable (3 pièces par défaut) et fin de journée. Le départ Copenhague → Oslo est opérationnel.

Chaque joueur commence avec trois cartes de jeu, distinctes de sa carte Voyage. À la fin de **chaque** journée, y compris travail, hébergement ou ferry, il pioche deux cartes, en garde une et défausse l’autre. Les six cartes positives (boost, ravito, coup de main, vent favorable, bonne affaire et abri trouvé) se jouent pendant son tour. Les six cartes négatives se donnent à un adversaire et sont résolues au début de son prochain tour : crevaison (chambre à air ou −1 déplacement), panne mécanique (kit ou −2 énergie), pluie (−1 déplacement), faim (nourriture ou −2 énergie), mauvaise nuit (−1 énergie) et détour (+1 déplacement avec +1 énergie sur ce déplacement). La limite de cinq cases par tour s’applique toujours. Travail, bivouac, camping et hôtel consomment une journée ; leurs durées restent réglables. « Abri trouvé » donne un bivouac gratuit et +2 énergie.

## Sources et vérification

`scripts/build-europe-board.py` relève les cases de `dist/assets/europe/nouvelle-carte.png` et régénère `board-data.js`. `dist/europe.js` ajoute les villes et liaisons, `dist/simulator.js` contrôle les règles, `dist/cards.js` décrit les cartes, et `dist/app.js` gère l’interface. Les anciennes sauvegardes Europe sont adaptées à la nouvelle grille ; une copie préalable est conservée dans le navigateur sous `velo-save-before-new-map`.

Exécuter les tests récents avec `node --test tests/new-map-game.test.js`. Certains tests historiques des événements automatiques et de l’ancienne carte décrivent volontairement l’ancienne version et doivent encore être réécrits avant qu’un `npm test` global ne repasse au vert. L’essai visuel sur un téléphone réel reste également à faire.

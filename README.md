# L’Aventure à Vélo — simulateur de jeu de société

Jeu local de 1 à 6 joueurs : plateau Europe à 464 hexagones ou construction avec 48 tuiles. Un tour individuel représente une journée. Les vélos, inventaires, ressources, parcours et objectifs sont indépendants ; plateau, réseau et règles sont communs. Chaque joueur tire trois Voyages puis en choisit un.

## Lancer

Aucune dépendance à installer. Node 18+ pour les tests, Python 3 pour le serveur :

```
npm test
npm start
```

Ouvrir http://localhost:5173. Sur mobile, utiliser le lien hébergé HTTPS. Le service worker met les fichiers en cache ; l’installation dépend des capacités du navigateur et les sauvegardes restent propres à chaque navigateur.

## Architecture et décisions

`dist/engine.js` conserve le générateur, les routes et les mécanismes du prototype. `dist/simulator.js` réutilise ces mécanismes pour la partie multijoueur (sauvegarde version 2). `dist/rules.js` centralise les valeurs Classiques et leur validation. `dist/app.js` gère l’interface et la persistance. `style.css` conserve l’identité visuelle et `sw.js` le cache hors connexion. L’ancienne interface solo reste comme référence dans `scripts/legacy-app.js`, sans être chargée par le jeu.

JavaScript natif modulaire a été retenu pour une première version sans installation de dépendances, plutôt que React/TypeScript recommandés. Aucun backend ni Phaser nécessaire. Le plateau se déplace par défilement tactile et se zoome avec boutons. Pas de zoom par pincement pour cette version.

Par défaut : maximum 5 cases par journée (réglable de 1 à 5), plaine/côte 1 énergie, montagne/col 2, ville 0. Aucun dé ni pénalité cachée. Travail et repos occupent la journée entière : pas de déplacement ni pose de tuile ce jour-là. Bivouac gratuit avec tente, camping et hôtel payants. Les durées peuvent être réglées entre 1 et 30 jours ; l’ordre des joueurs suit leur prochain jour disponible. Une seule carte est tirée à la fin de chaque journée de voyage, sur le terrain final, avec 50 % négatifs / 30 % positifs / 20 % défis. Travail et repos n’en tirent pas par défaut ; deux options permettent de les activer. Le joueur suivant attend la résolution. Les points de première visite ne sont pas répétés et un objectif n’est primé qu’une fois. La capacité du Gravel est 4, celle du vélo de Randonnée 8. Une main bloquée conserve le secours de routes du prototype.

Le bouton « ⚙️ Règles » permet de modifier pendant la partie les coûts, départs, salaire, repos, repas, vélos, inventaires, équipements, probabilités, effets et coûts des défis, score et victoire. Validation atomique : une configuration incorrecte ne change pas la partie. Les changements concernent les prochaines actions ; ressources déjà détenues et carte Événement déjà tirée sont conservées. Les valeurs de départ concernent uniquement les nouvelles parties. Classique est toujours disponible et les profils Personnalisés sont sauvegardables. Le classement utilise les points Aventure ; victoire par premier/tous les objectifs, seuil de points ou nombre de jours.

La sauvegarde automatique et le bouton Sauvegarder utilisent le navigateur. Paramètres permet d’exporter/importer un JSON complet (règles, joueurs, journée en cours, carte en attente, historique et statistiques), à conserver notamment dans le dossier choisi sur D:. Le site web n’écrit pas directement sur ce disque. Les anciens jeux solo sont migrés sans perdre ressources ou historique d’objectif, avec une copie navigateur `velo-save-before-multiplayer`. L’import conserve la partie remplacée sous `velo-save-before-import`.

## Vérification

Tests automatisés des connexions, rotations, déplacements, coûts, événements, équipements, score, sérialisation et simulation de parties complètes. L’apparence et l’installation Android nécessitent encore une validation sur appareil réel.


## Deux versions
L’accueil propose Plateau Europe ou Tuiles, puis les joueurs, leurs vélos et trois cartes par joueur. Le plateau utilise une carte hexagonale simple définie dans `dist/europe.js`. Les reliefs sont simplifiés : ce n’est pas une carte de navigation. Les ferries sont en pointillés. En Tuiles, les villes de départ sont préposées sur le plateau commun ; les villes d’arrivée rejoignent le paquet partagé, au besoin en remplaçant une plaine, sans dépasser 48 tuiles. Le mode et le réseau sont sauvegardés ; les anciennes sauvegardes sans `mode` restent en Tuiles.

Les tests vérifient une réalisation effective des cinq Voyages sur le plateau, l’absence de pose, les déplacements et la reprise du mode. L’interface a un test de navigation sans navigateur ; l’affichage réel et le tactile sur téléphone restent à vérifier.

## Plateau hexagonal — base de travail

Le plateau Europe utilise une seule grille axiale de 464 hexagones réguliers de rayon 24 unités. `dist/europe.js` définit la géométrie et les six voisins terrestres ; `dist/europe-map.js` dessine ces mêmes hexagones comme cibles interactives. Les villes remplacent une case de la grille et les littoraux ne découpent pas les cases. Les ferries historiques constituent les seules liaisons à distance. Les terrains restent simples afin de valider la base avant une nouvelle illustration.

`dist/europe-legacy.js` conserve la géographie et le générateur précédent comme référence de migration. Les sauvegardes de plateau antérieures sont converties en version de carte 3. Ressources, événements, score et historique des terrains des cartes Voyage sont conservés ; la position rejoint l’hexagone le plus proche. Le navigateur garde aussi une copie sous `velo-save-before-hexagones` avant conversion. Le mode Tuiles conserve son fonctionnement.

Une case s’inspecte au clic, au toucher ou avec Entrée/Espace ; « Rouler ici » confirme le déplacement quand il est permis. Les voisins accessibles ont un contour doré, les visites un contour vert pointillé, la sélection un contour bleu. Le zoom agrandit la même géométrie pour toute la carte. La mer ne constitue pas une case jouable.

Régénérer la vignette SVG avec `node scripts/prepare-europe.mjs`. Les tests couvrent les dimensions identiques de toutes les cases, l’adjacence, la connectivité, les cinq Voyages, les étiquettes et la conversion de sauvegardes. Un contrôle navigateur à 390 × 844 vérifie la mise en page mobile ; cela ne remplace pas un essai sur appareil Android réel.

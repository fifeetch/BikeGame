# Transmission à Claude — Option B, étape 1

## Périmètre et consigne du propriétaire

Étape 1 réalisée uniquement, sur `option-b-plateau`, à partir de `203cf52`.
Les étapes 2 à 6 sont à reprendre par Claude. Pas de fusion dans `main`, pas de publication sur le site principal.

**Le propriétaire a confirmé pendant cette étape : développement uniquement pour PC. Aucune version téléphone à développer.** Pour la suite : souris, molette, clavier et affichage ordinateur. Cette consigne remplace les demandes mobiles du prompt initial.

## Travail réalisé

- Plateau Europe isolé derrière `createBoardRenderer(container, options)`.
- SVG et cases terrestres conservés entre les appels à `render()` : le conteneur est retiré temporairement avant le remplacement du reste de la page, puis réinséré au nouvel emplacement.
- Les attributs et les calques sont actualisés en fonction de leurs changements. Les objets renvoyés par `S.view()` sont copiés : les comparaisons portent donc sur leurs valeurs, pas leur identité.
- 1 297 groupes de mer remplacés par un seul chemin SVG contenant leur empreinte, rempli par un motif partagé. La grille et les vagues restent visibles.
- Suppression de tous les `<title>` du plateau. Les cases terrestres conservent leurs attributs accessibles et leur sélection au clavier.
- Détection géométrique de toutes les cases, y compris la mer. L’éditeur conserve le clic direct sur la mer et propose aussi un formulaire q/r accessible au clavier.
- Les changements mer/terre et les villes personnalisées actualisent les calques correspondants.
- Les clics sont délégués à un seul traitement dans `app.js`, identique à l’ancien : `routeCheck`, sélection/troncature de l’itinéraire, confirmation des ferries et fenêtre de l’éditeur.
- Les boutons de zoom et de centrage utilisent l’interface du renderer. Pas de nouvelle caméra gestuelle, de Pixi ou d’animation à cette étape.
- Cache hors ligne porté à `aventure-velo-v42-board-svg` et nouveaux modules ajoutés au précache.

## Interface effective

```js
import { createBoardRenderer } from './board-renderer.js';

const renderer = createBoardRenderer(host, { kind: 'svg' });
renderer.onHexClick(key => handleBoardHex(key));
renderer.update({
  g,                         // vue : board, pos, arrivalId, visited, players
  reachable,                 // cases ou clés
  cost: (_, tile) => S.cost(m, tile),
  selected: mapSelection,
  route,                     // clés dans l’ordre
  nextSteps,                 // clés autorisées par routeCheck
  editMode: false
});
renderer.setCamera({ zoom: 1.05 });
renderer.setCamera({ x: tile.x, y: tile.y, zoom: 1.05, behavior: 'smooth' });
renderer.getDiagnostics();    // informations de mise à jour, utile pour QA
renderer.destroy();
```

La factory est **synchrone pour le SVG actuel**. Un appelant peut déjà l’attendre avec `await`, mais `mountBoard()` dans l’application est actuellement synchrone. Pour l’initialisation asynchrone de Pixi, adapter ce montage et ignorer une initialisation devenue obsolète après changement d’écran.

`update` ne modifie pas la partie. `onHexClick` transmet seulement une clé de case. `setCamera` travaille dans les coordonnées existantes du plateau ; dans le SVG actuel, il dimensionne le monde et règle le défilement de son parent.

Seul `kind: 'svg'` est implémenté. Le sélecteur `velo-renderer = svg | pixi` reste à introduire à l’étape 2. La solution de repli SVG est conservée et disponible dans la factory.

`boardSnapshotMarkup(state)` sert aux tests d’application qui utilisent un document factice sans API SVG. Dans un vrai navigateur, le plateau est construit et maintenu par le renderer. L’application n’appelle plus directement `playableMap`.

## Fichiers

Modifiés :

- `dist/app.js` : montage persistant, état d’affichage, traitement partagé des clics et centrage.
- `dist/europe-map.js` : aides communes, motif de mer, instantané SVG allégé sans titres.
- `dist/style.css` : styles limités aux nouvelles commandes de l’éditeur et au calque de mer.
- `dist/index.html` : versions des ressources `board-svg-1`.
- `dist/sw.js` : nouveau cache et modules précachés.

Ajoutés :

- `dist/board-renderer.js` : factory et instantané de rendu.
- `dist/board-renderer-svg.js` : renderer SVG incrémental et cycle de vie.
- `dist/board-hit-test.js` : index axial et recherche géométrique exacte dans les hexagones.
- `tests/board-renderer.test.js` : 7 nouveaux tests.
- `tests/helpers/board-dom.js` : double de DOM pour les tests de cycle de vie et événements ; le navigateur vérifie le véritable SVG.
- `qa/serve-board.cjs` : serveur local sur boucle locale seulement ; peut servir la version initiale directement depuis Git pour comparaison, sans copie ni modification des sources.
- `qa/board-step1.html` : contrôles navigateur et mesures reproductibles.
- Ce document.

## Vérifications

`npm test` : **105 tests, 81 réussites, 24 échecs historiques**. Les noms des 74 tests verts initiaux ont été comparés : aucun perdu. Les tests existants n’ont pas été modifiés.

Les 7 nouveaux tests couvrent les centres et l’intérieur des six coins des 2 783 cases, le compte d’éléments, l’absence de titres, la conservation des nœuds sans réécriture inutile, les modifications mer/terre/ville, les clics et le clavier, la caméra, le déplacement du conteneur, le nettoyage des écouteurs, la sauvegarde MAP_VERSION 9, une route et un ferry.

Contrôles dans le vrai navigateur réussis :

- Reprise d’une sauvegarde de contrôle MAP_VERSION 9.
- Conservation de la même instance SVG et du même premier élément terrestre pendant 30 sélections/effacements et 20 actions de zoom.
- Confirmation du ferry Copenhague–Oslo, position du cycliste et pioche de fin de tour.
- Partie complète avec victoire configurée à 20 jours, jusqu’à l’écran de fin.
- Éditeur : clic géométrique sur la mer, sélection par q/r, transformation en col et actualisation du chemin de mer sans recréer le SVG.
- Sauvegarde de contrôle inchangée par l’affichage, sauvegarde automatique désactivée pendant QA ; restauration du stockage local après le scénario.

Il s’agit d’une sauvegarde de contrôle créée avec le moteur existant, pas d’un export réel fourni par le propriétaire. Le scénario complet vérifie une fin par limite de jours, pas l’accomplissement de chaque objectif Voyage.

## Mesures PC

Navigateur intégré, viewport du jeu 1 225 × 740. Même scénario, même sauvegarde, même machine. Version initiale servie depuis le commit `203cf52`, sans changer les fichiers du dépôt. Ces mesures incluent le traitement de l’action dans l’application, pas seulement `renderer.update()`.

| Mesure | Départ | Étape 1 |
|---|---:|---:|
| Éléments SVG (un joueur, aucun itinéraire) | 11 237 | 4 572 |
| Traitement synchrone de sélection, médiane | 217,2 ms | 109,1 ms |
| Traitement synchrone de sélection, P95 | 322,5 ms | 198,3 ms |
| Sélection jusqu’après deux frames, médiane | 373,9 ms | 204,2 ms |
| Sélection jusqu’après deux frames, P95 | 469,7 ms | 287,8 ms |
| Traitement synchrone du zoom, médiane | 204,4 ms | 87,4 ms |
| Traitement synchrone du zoom, P95 | 901,6 ms | 126,1 ms |

Environ 59 % d’éléments SVG en moins. 30 sélections mesurées, accompagnées de 30 effacements ; 20 actions de zoom. Une première exécution de la branche donnait 110,5 ms de sélection médiane et 89,3 ms de zoom médian.

**Aucune mesure de FPS/GPU ou de glissement continu.** Les deux frames sont un délai d’affichage, pas un débit. Ces chiffres sont une comparaison locale sur un seul scénario, pas une garantie sur tous les PC. La sélection reste coûteuse : la génération de `S.view`, le calcul des `nextSteps` sur toutes les cases et le remplacement du reste de l’interface existent encore.

## Reproduire et consulter

```powershell
git switch option-b-plateau
npm test
node qa/serve-board.cjs
```

- Jeu : `http://127.0.0.1:8191/dist/`
- Contrôles : `http://127.0.0.1:8191/qa/board-step1.html` puis « Lancer les contrôles ».
- Comparaison initiale : même page avec `?baseline=1`.
- Arrêt du serveur : Ctrl+C dans le terminal qui l’a lancé.

Le serveur utilise `BIKE_PREVIEW_PORT` si le port 8191 est pris. La comparaison nécessite l’historique Git contenant `203cf52`.

## Invariants et suite

`simulator.js`, `rules.js`, `europe.js`, `assets/europe/board-data.js`, les cartes, les voyages et `tile-art.js` sont inchangés. MAP_VERSION reste 9. Aucun champ de sauvegarde ajouté. Le mode Tuiles continue son chemin de rendu existant ; les nouveaux modules ne modifient pas son dessin.

Les routes et ferries dessinés, les illustrations nouvelles, les niveaux de détail, la mini-carte, les animations et Pixi ne sont pas réalisés. Le rendu conserve les graphismes existants à cette étape, avec une mer regroupée et un accès clavier supplémentaire dans l’éditeur.

Les calques SVG dynamiques disponibles sont `.hex-cells`, `.city-names`, `.route-numbers`, `.map-symbols` et `.board-sea-cursor`. Les IDs de peintures sont partagés comme avant : un plateau Europe est monté à la fois.

L’application conserve l’instance tant qu’un plateau Europe ou l’éditeur reste affiché, puis la détruit en quittant ces écrans. Les contrôles de l’éditeur sont déplacés dans le nouveau `.map-wrap` après remplacement de l’interface. Le défilement et le focus de case sont rétablis après remontage.

Pour l’étape 2 : implémenter la même interface Pixi, garder les règles et les clés intactes, traiter son initialisation asynchrone, fournir la liste clavier de cases accessibles, ajouter le choix SVG/Pixi et son repli, puis précacher le module local Pixi. Développement et vérification **PC uniquement**, conformément à la dernière consigne.

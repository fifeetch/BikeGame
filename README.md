# L’Aventure à Vélo — prototype 0.1

Jeu solo de construction de routes et exploration, 48 tuiles dont la ville de départ, 24 événements, deux vélos, cinq équipements, score et sauvegarde locale.

## Lancer

Aucune dépendance à installer. Node 18+ pour les tests, Python 3 pour le serveur :

```
npm test
npm start
```

Ouvrir http://localhost:5173. Sur mobile, utiliser le lien hébergé HTTPS. Le service worker met les fichiers en cache ; l’installation dépend des capacités du navigateur et les sauvegardes restent propres à chaque navigateur.

## Architecture et décisions

`dist/engine.js` : données configurables, générateur à graine et règles pures. `app.js` : interface et persistance. `style.css` : interface responsive et paysages SVG. `sw.js` : cache hors connexion.

JavaScript natif modulaire a été retenu pour une première version sans installation de dépendances, plutôt que React/TypeScript recommandés. Aucun backend ni Phaser nécessaire. Le plateau se déplace par défilement tactile et se zoome avec boutons. Pas de zoom par pincement pour cette version.

Les pauses et services sont libres entre les actions : économie volontairement permissive pour ce prototype. Le travail peut donc être répété ; l’équilibrage devra imposer un coût temporel dans une version suivante. Événements uniquement lors de la première visite (70 % de chance), pas de bonus sur les trajets répétés. La distance de score compte les étapes inédites, pas des kilomètres fictifs. Une main sans solution reçoit une route de secours qui correspond à un emplacement libre. Les effets négatifs sont limités à zéro. Le kit est permanent.

## Vérification

Tests automatisés des connexions, rotations, déplacements, coûts, événements, équipements, score, sérialisation et simulation de parties complètes. L’apparence et l’installation Android nécessitent encore une validation sur appareil réel.


## Deux versions
L’accueil d’une nouvelle aventure propose Plateau Europe ou Tuiles, puis le vélo et le tirage de trois Voyages. Le plateau utilise une carte illustrée et un réseau fixe de cases, défini dans `dist/europe.js`. Les reliefs et trajets sont simplifiés : ce n’est pas une carte de navigation. La destination est une vraie ville du réseau (ou le Cap Nord), les ferries sont signalés en pointillés. Les ressources, événements, équipements et compteurs restent ceux du prototype existant. Le mode et le réseau sont sauvegardés ; les anciennes sauvegardes sans champ `mode` restent en version Tuiles.

Les tests vérifient une réalisation effective des cinq Voyages sur le plateau, l’absence de pose, les déplacements et la reprise du mode. L’interface a un test de navigation sans navigateur ; l’affichage réel et le tactile sur téléphone restent à vérifier.

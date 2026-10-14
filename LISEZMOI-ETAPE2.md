# L'Aventure à Vélo — Étape 2 : fond de terrain en une seule image

Cette version est une **copie séparée** de l'étape 1. Ton dossier d'origine n'est pas touché :
si quelque chose ne te plaît pas, tu supprimes simplement ce dossier et tu gardes l'ancien.

## Lancer le jeu
1. Dézippe le dossier.
2. Ouvre un terminal dans ce dossier et tape : `npm start`
   (ou, sans npm : `python3 -m http.server 5173 --directory dist`)
3. Ouvre http://localhost:5173 dans ton navigateur.

## Ce qui change
- La carte d'Europe est maintenant **une seule image peinte et continue** (`dist/assets/terrain/europe-terrain.webp`, ~2 Mo) posée sous le plateau. Ce n'est plus un assemblage de tuiles : côtes organiques avec plages, mers en dégradé de profondeur, lacs, relief ombré, champs, forêts, collines ocre dessinées, montagnes grises (sans neige), villages aux toits rouges, bateaux, noms de mers, rose des vents.
- Les hexagones restent **les cases de déplacement** : fins traits blancs sur la carte, clics, cases accessibles, parcours, jetons, noms de villes fonctionnent comme avant.
- Repères de lecture : plaine = vert clair avec champs et arbres ; colline = ocre avec petites bosses ; montagne = pics gris ; ville = village ; côte = plage et eaux claires.
- Les **cases « côte » sans mer voisine** (116 dans les données) sont dessinées comme hauts-fonds/lacs : l'Angleterre et l'Irlande ne sont donc plus reliées visuellement au continent. Les règles ne changent pas : ces cases restent des cases « côte ».
- Un bouton **« 🖼️ Illustrations »** (en haut à droite de la carte) active/désactive le fond. Désactivé = l'ancien dessin à pictogrammes (retour arrière immédiat, mémorisé).
- Si tu modifies une case dans l'éditeur de carte, cette case repasse automatiquement sur l'ancien dessin (l'image ne connaît pas ta modification).

## Ce qui n'a PAS changé
Règles, moteur, sauvegardes, éditeur, cartes événement : aucun fichier du moteur n'est modifié.

## Fichiers ajoutés ou modifiés
- `dist/terrain-art.js` (nouveau) : gère l'image de fond et la détection des cases modifiées.
- `dist/board-renderer-svg.js`, `dist/board-renderer.js` : branchement du fond.
- `dist/app.js` : bouton « Illustrations » (3 lignes).
- `dist/style.css` : styles en fin de fichier (bloc « Étape 2 »).
- `dist/sw.js`, `dist/index.html` : version de cache + liste des nouveaux fichiers.
- `tests/terrain-art.test.js` (nouveau) : 5 tests.
- `tools/peinture/` : scripts qui **peignent** la carte (`python3 glyphs.py` dans ce dossier → `final.png`). `tools/terrain/` : ancienne version par tuiles (gardée en archive).

## Points connus
- Les tests : 24 échouaient déjà à l'étape 1 (même liste) ; aucun nouvel échec, +5 tests verts.
- **Données de la carte (non modifiées, à décider)** : dans les règles, l'Angleterre est reliée à la Belgique/France par une chaîne de cases « côte » (ex. Londres → Bruxelles par 3 cases de côte). Sur la planche d'origine, c'est de la mer avec un bac. Même chose pour l'Irlande–Angleterre. Visuellement c'est réglé ; pour que le jeu suive, il faudrait couper ces liaisons dans les données (cases → mer) et garder les bacs : cela change les règles, donc je ne l'ai pas fait sans ton accord.
- Quelques cases isolées en bordure de la carte (droite et bas) viennent des données de la carte d'origine, pas de l'image.
- Les routes ne sont pas encore dessinées (prévu : éditeur de routes, étape ultérieure).

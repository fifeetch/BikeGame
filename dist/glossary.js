export const GLOSSARY_CATEGORIES=[
 {id:'regles',label:'Règles générales'},
 {id:'terrains',label:'Terrains et lieux'},
 {id:'equipement',label:'Équipement'},
 {id:'cartes',label:'Cartes et objectifs'}
];

export const GLOSSARY=[
 {id:'energie',term:'Énergie',category:'regles',icon:'⚡',short:'La ressource dépensée pour traverser les cases.',body:'Chaque case parcourue coûte de l’énergie selon son terrain. La plaine et la côte coûtent généralement 1, la moyenne montagne 2 et la haute montagne 3. Le repos et certains effets de cartes permettent d’en récupérer.'},
 {id:'deplacement',term:'Déplacement',category:'regles',icon:'🚴',short:'Avancer sur une case voisine pendant sa journée.',body:'Le nombre de cases parcourables est limité par la distance du vélo et par les éventuels malus. Un parcours doit suivre des cases voisines et ne peut pas dépasser la limite quotidienne.'},
 {id:'fin-journee',term:'Fin de journée',category:'regles',icon:'🌙',short:'Le moment où le joueur termine son action.',body:'Terminer sa journée permet de passer au joueur suivant et déclenche la pioche prévue par les règles. Le travail, le bivouac, le camping, l’hôtel et le ferry consomment également une journée.'},
 {id:'points',term:'Points Aventure',category:'regles',icon:'✨',short:'Les points gagnés en explorant et en réussissant ses objectifs.',body:'Les points sont obtenus en découvrant des terrains, en visitant des villes, en franchissant des cols et en accomplissant son voyage.'},
 {id:'plaine',term:'Plaine',category:'terrains',icon:'🌾',short:'Un terrain facile à traverser.',body:'La plaine coûte généralement 1 énergie et rapporte 1 point. Certains voyages demandent de visiter des plaines ou d’enchaîner plusieurs cases de plaine.'},
 {id:'cote',term:'Côte',category:'terrains',icon:'🌊',short:'Une case située au bord de la mer.',body:'La côte coûte généralement 1 énergie et peut compter dans les objectifs liés aux littoraux. Elle ne doit pas être confondue avec la mer, qui n’est pas parcourable à vélo.'},
 {id:'moyenne-montagne',term:'Moyenne montagne',category:'terrains',icon:'⛰️',short:'Un terrain vallonné demandant un effort intermédiaire.',body:'La moyenne montagne coûte généralement 2 énergie. Elle constitue une catégorie distincte de la haute montagne dans les règles et les réglages.'},
 {id:'montagne',term:'Haute montagne',category:'terrains',icon:'🏔️',short:'Un terrain difficile et coûteux à franchir.',body:'La haute montagne coûte généralement 3 énergie et rapporte davantage de points. Les cartes Voyage peuvent demander plusieurs montagnes consécutives.'},
 {id:'ville',term:'Ville',category:'terrains',icon:'🏘️',short:'Un lieu où le cycliste peut se ravitailler et travailler.',body:'Dans une ville, le joueur peut acheter de la nourriture, travailler, manger au restaurant et acheter de l’équipement. Les villes sont aussi utilisées comme étapes des cartes Voyage.'},
 {id:'col',term:'Col mythique',category:'terrains',icon:'🏔️',short:'Une ascension spéciale qui rapporte beaucoup de points.',body:'Le col mythique est un terrain de montagne particulier. Son effort peut être réglé dans les règles ou dans l’éditeur de carte.'},
 {id:'bivouac',term:'Bivouac',category:'terrains',icon:'⛺',short:'Dormir en pleine nature avec une tente.',body:'Le bivouac permet de récupérer de l’énergie en dehors d’une ville. Selon le profil de règles, une tente peut être nécessaire et l’action consomme une journée.'},
 {id:'ferry',term:'Ferry',category:'terrains',icon:'⛴️',short:'Une liaison maritime entre deux ports.',body:'Les ferries relient certaines villes côtières. Ils ont un tarif réglable, déplacent le joueur vers le port de destination et terminent la journée.'},
 {id:'tente',term:'Tente',category:'equipement',icon:'⛺',short:'Permet de bivouaquer hors des villes.',body:'La tente occupe des emplacements dans le vélo et permet de choisir le bivouac lorsqu’il est activé dans les règles.'},
 {id:'rechaud',term:'Réchaud',category:'equipement',icon:'🍳',short:'Permet de manger plus efficacement hors des villes.',body:'Le réchaud permet de préparer un repas en dehors d’une ville ou d’une auberge et peut améliorer l’énergie récupérée.'},
 {id:'chambre',term:'Chambre à air',category:'equipement',icon:'🛞',short:'Protège contre la crevaison.',body:'Une chambre à air peut être utilisée pour résoudre une carte Crevaison. Sans cette protection, le joueur subit la pénalité prévue par la carte.'},
 {id:'kit',term:'Kit de réparation',category:'equipement',icon:'🧰',short:'Permet de résoudre les pannes mécaniques.',body:'Le kit de réparation protège contre les pannes mécaniques et peut être utilisé lors de certains défis ou incidents.'},
 {id:'sacoches',term:'Sacoches',category:'equipement',icon:'🎒',short:'Augmentent les provisions disponibles au départ.',body:'Les sacoches occupent de l’espace dans le vélo et donnent un bonus de provisions selon les règles du profil.'},
 {id:'carte-voyage',term:'Carte Voyage',category:'cartes',icon:'🗺️',short:'L’objectif personnel du cycliste.',body:'Au début de la partie, chaque joueur choisit une carte Voyage. Elle indique un départ, une arrivée et plusieurs objectifs à réaliser avant de terminer son parcours.'},
 {id:'carte-evenement',term:'Carte Événement',category:'cartes',icon:'🃏',short:'Une carte qui apporte un bonus, un malus ou une situation spéciale.',body:'Les cartes Événement sont tirées selon les règles de la partie. Elles peuvent être positives, négatives, climatiques ou devenir des bonus permanents.'},
 {id:'carte-positive',term:'Carte positive',category:'cartes',icon:'✅',short:'Une carte qui aide le joueur qui la joue.',body:'Une carte positive peut donner de l’énergie, de l’argent, de la nourriture ou un déplacement supplémentaire.'},
 {id:'carte-negative',term:'Carte négative',category:'cartes',icon:'⚠️',short:'Une carte jouée contre un autre cycliste.',body:'Une carte négative impose un incident à un adversaire. Certaines peuvent être résolues grâce à un équipement ou à une ressource.'},
 {id:'bonus-permanent',term:'Bonus permanent',category:'cartes',icon:'🏅',short:'Un effet qui reste actif après avoir été posé.',body:'Les bonus permanents améliorent certaines actions pendant le reste de la partie. Leur nombre maximal est défini dans les règles des cartes.'},
 {id:'objectif',term:'Objectif',category:'cartes',icon:'🎯',short:'Une condition à remplir sur sa carte Voyage.',body:'Les objectifs peuvent demander de visiter des villes, de parcourir certains terrains ou de réaliser des séries de cases.'}
];

export const glossaryById=id=>GLOSSARY.find(entry=>entry.id===id);

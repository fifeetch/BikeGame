// Mode Immersion : un voyage plein d'imprévus (conseillé en solo).
// Inspiré de vrais voyages à vélo, sans nom de personne réelle. Fi peut modifier ces textes ou en ajouter,
// en gardant la même forme.
//
// Une scène :
//  when    : 'route' (pendant l'étape, en entrant sur une case) ou 'soir' (en fin de journée)
//  kind    : 'galere' ou 'belle' (reposé, fatigue 0 ou 1 : jamais deux galères de suite en route)
//  cause   : pour une galère en route : 'meteo', 'meca', 'route' ou 'inattention' (voir FATIGUE plus bas)
//  rarity  : 'courante' (souvent), 'rare' (parfois), 'unique' (une fois par partie)
//  terrain : types de case où elle peut arriver (absent = partout) ; region : zones météo (absent = partout)
//  weather : temps du jour dans la zone (beau, vent, pluie, orage, neige) ; offroad : seulement hors route
//  notCity : jamais en ville ; item : il faut cet équipement (ex. 'tente', 'rechaud')
//  quote   : peut contenir {qui}, {lieu}, {offrande} : tirés au sort selon la zone (voir VARIANTS)
// Un choix : label, text, effect, need (ce qu'il faut avoir), ou chance (un pari) :
//  chance:{odds:0.67, ok:{text,effect}, ko:{text,effect}} → « souvent ça marche, parfois non ».
// Effets : energy, food, money, points, fatigue (−1 = repos), tomorrow (+1/−1 case demain),
//  stopToday (la journée de route s'arrête là), restDay (demain : repos forcé, pas de route).

export const SCENES=[
 // ---------- En route : galères ----------
 {id:'im-rayon',when:'route',kind:'galere',cause:'meca',rarity:'courante',terrain:['plaine','moyenne_montagne','montagne','cote'],title:'Le rayon qui casse',scene:'plaine',
  quote:'Un petit « tac » sec dans la roue arrière. Un rayon pend, deux autres se sont dévissés.',choices:[
  {label:'Scotcher le rayon et continuer',text:'Ruban adhésif et prudence.',chance:{odds:.67,ok:{text:'La roue tient jusqu’au soir.',effect:{energy:-1}},ko:{text:'Il recasse : demain, tu pars après la réparation.',effect:{energy:-1,tomorrow:-1}}}},
  {label:'Finir l’étape à l’atelier le plus proche',text:'Un détour, mais tu repars tranquille.',need:{money:1},effect:{money:-1,stopToday:true}}]},
 {id:'im-crevaison',when:'route',kind:'galere',cause:'meca',rarity:'courante',notCity:true,title:'Pschhh…',scene:'plaine',
  quote:'Le pneu avant se vide doucement sur le bas-côté.',choices:[
  {label:'Changer la chambre à air',text:'Deux minutes, et c’est reparti.',item:'chambre',effect:{}},
  {label:'Réparer avec le kit',text:'Démonte-pneu, rustine, pompe.',item:'kit',effect:{energy:-1}},
  {label:'Regonfler et croiser les doigts',text:'Ça passe ou ça casse.',chance:{odds:.5,ok:{text:'Ça tient jusqu’au soir.',effect:{}},ko:{text:'Deuxième crevaison deux kilomètres plus loin.',effect:{energy:-2}}}}]},
 {id:'im-chiens',when:'route',kind:'galere',cause:'route',rarity:'courante',terrain:['plaine','moyenne_montagne'],region:['balkans','est'],title:'Les chiens de la ferme',scene:'plaine',
  quote:'{lieu}, trois chiens jaillissent d’une cour et foncent sur tes mollets.',choices:[
  {label:'Sprinter',text:'Tu les sèmes, mais ça pique.',effect:{energy:-2}},
  {label:'Descendre et leur parler doucement',text:'Pas de geste brusque.',chance:{odds:.6,ok:{text:'Ils reniflent le vélo, puis s’en vont.',effect:{}},ko:{text:'Ils te suivent en aboyant sur deux kilomètres.',effect:{energy:-1}}}}]},
 {id:'im-canicule',when:'route',kind:'galere',cause:'meteo',rarity:'courante',terrain:['plaine','cote'],weather:['beau'],region:['balkans','ouest','est'],title:'39 °C sans ombre',scene:'plaine',
  quote:'Pas un arbre à l’horizon. L’eau de la gourde est tiède en une heure.',choices:[
  {label:'Serrer les dents',text:'Tu avances, lentement.',effect:{energy:-2}},
  {label:'Sieste à l’ombre jusqu’au soir',text:'La route attendra demain.',effect:{stopToday:true,energy:2}}]},
 {id:'im-orage-col',when:'route',kind:'galere',cause:'meteo',rarity:'courante',terrain:['col','montagne','moyenne_montagne'],weather:['orage'],title:'L’orage sur le col',scene:'montagne',
  quote:'Le ciel devient noir au-dessus du col. Les premiers grondements résonnent dans la vallée.',choices:[
  {label:'Attendre au refuge',text:'Au sec, avec un thé chaud.',effect:{stopToday:true,energy:2}},
  {label:'Tenter le passage',text:'Vite, avant le déluge.',chance:{odds:.5,ok:{text:'Tu passes juste avant la pluie.',effect:{points:2,energy:-1}},ko:{text:'Trempé jusqu’aux os, frigorifié dans la descente.',effect:{energy:-3,fatigue:1}}}}]},
 {id:'im-drache',when:'route',kind:'galere',cause:'meteo',rarity:'courante',weather:['pluie'],title:'La drache',scene:'plaine',
  quote:'Il pleut depuis le matin. L’eau ruisselle dans les chaussures.',choices:[
  {label:'Serrer les dents',text:'Cinquante kilomètres sous l’eau, ça se raconte.',effect:{energy:-2}},
  {label:'S’abriter dans un petit appartement',text:'Douche chaude et vêtements secs.',need:{money:2},effect:{money:-2,fatigue:-1,stopToday:true}}]},
 {id:'im-vent',when:'route',kind:'galere',cause:'meteo',rarity:'courante',weather:['vent'],terrain:['plaine','cote'],title:'Vent de face',scene:'cote',
  quote:'Un vent à couper le souffle. Tu pédales en descente et tu fais du surplace.',choices:[
  {label:'Baisser la tête',text:'Petit braquet, mâchoire serrée.',effect:{energy:-1}},
  {label:'S’arrêter au café du village',text:'On t’offre un café, on parle météo.',effect:{stopToday:true,energy:1}}]},
 {id:'im-bagages',when:'route',kind:'galere',cause:'route',rarity:'unique',terrain:['col','montagne','moyenne_montagne'],title:'Trop de bagages',scene:'montagne',
  quote:'Premier vrai col : chaque sacoche pèse une tonne. Tout ce que tu emportes, il faut le monter.',choices:[
  {label:'Trier et renvoyer par la poste',text:'Plus léger pour la suite.',need:{money:1},effect:{money:-1,tomorrow:1}},
  {label:'Tout garder',text:'On ne sait jamais…',effect:{energy:-1}}]},
 {id:'im-guepe',when:'route',kind:'galere',cause:'route',rarity:'rare',terrain:['plaine','moyenne_montagne'],weather:['beau'],title:'La guêpe',scene:'plaine',
  quote:'Une guêpe se cogne contre ton front et pique. Le visage gonfle à vue d’œil.',choices:[
  {label:'Pharmacie, puis repos forcé demain',text:'Impossible d’ouvrir les yeux correctement.',effect:{stopToday:true,restDay:true}}]},
 {id:'im-chute',when:'route',kind:'galere',cause:'inattention',rarity:'rare',terrain:['col','montagne'],title:'Les gravillons',scene:'montagne',
  quote:'Dans la descente, une plaque de gravillons… et la glissade.',choices:[
  {label:'Soigner les écorchures',text:'Plus de peur que de mal.',effect:{energy:-1,fatigue:1}}]},
 // Galères d'inattention : elles n'arrivent qu'à partir de la fatigue 2 (un cycliste reposé reste attentif).
 {id:'im-nid-de-poule',when:'route',kind:'galere',cause:'inattention',rarity:'courante',notCity:true,title:'Le nid-de-poule',scene:'plaine',
  quote:'Les yeux dans le vague, tu ne vois pas le trou. Bang ! Le pneu avant se vide aussitôt.',choices:[
  {label:'Changer la chambre à air',text:'Deux minutes, et c’est reparti.',item:'chambre',effect:{}},
  {label:'Réparer avec le kit',text:'Rustine, pompe, et on repart.',item:'kit',effect:{energy:-1}},
  {label:'Pousser jusqu’au village',text:'À pied, à côté du vélo.',effect:{energy:-2,tomorrow:-1}}]},
 {id:'im-erreur-route',when:'route',kind:'galere',cause:'inattention',rarity:'courante',terrain:['plaine','moyenne_montagne','cote','montagne'],title:'La mauvaise bifurcation',scene:'plaine',
  quote:'Depuis une heure, le soleil est du mauvais côté. Tu as raté l’embranchement sans t’en rendre compte.',choices:[
  {label:'Faire demi-tour',text:'Les mêmes kilomètres, dans l’autre sens.',effect:{energy:-2}},
  {label:'Chercher un raccourci',text:'Il doit bien y avoir un chemin…',chance:{odds:.5,ok:{text:'Une petite route rejoint la bonne. Ouf.',effect:{energy:-1}},ko:{text:'Cul-de-sac. Demain, tu repars avec du retard.',effect:{energy:-1,tomorrow:-1}}}}]},
 {id:'im-oubli',when:'route',kind:'galere',cause:'inattention',rarity:'courante',title:'Les affaires oubliées',scene:'plaine',
  quote:'Dix kilomètres après la pause, la poche est vide : le porte-monnaie est resté sur le muret.',choices:[
  {label:'Retourner le chercher',text:'Il est toujours là… mais l’aller-retour coûte cher.',effect:{energy:-2}},
  {label:'Tant pis, on continue',text:'Quelques pièces de moins.',effect:{money:-1}}]},
 {id:'im-chute-bete',when:'route',kind:'galere',cause:'inattention',rarity:'rare',terrain:['ville','plaine','cote'],title:'La chute à l’arrêt',scene:'ville',
  quote:'Au feu rouge, le pied reste coincé. Tu tombes sur le côté, lentement, avec tout le chargement.',choices:[
  {label:'Se relever en riant',text:'Un genou écorché, et l’amour-propre aussi.',effect:{energy:-1,fatigue:1}},
  {label:'Faire une vraie pause',text:'Un café, une rustine sur le genou, et la journée s’arrête là.',effect:{stopToday:true,energy:1}}]},
 {id:'im-travaux',when:'route',kind:'galere',cause:'route',rarity:'courante',terrain:['plaine','moyenne_montagne'],title:'Route barrée',scene:'plaine',
  quote:'Panneau « Travaux » : la déviation part sur une piste caillouteuse.',choices:[
  {label:'Prendre la déviation',text:'Des cailloux plein les pneus.',effect:{energy:-1}},
  {label:'Passer quand même',text:'Avec un grand sourire aux ouvriers.',chance:{odds:.5,ok:{text:'Ils te font signe de passer.',effect:{points:1}},ko:{text:'Demi-tour forcé.',effect:{energy:-2}}}}]},
 {id:'im-perdu',when:'route',kind:'galere',cause:'route',rarity:'courante',offroad:true,title:'Où est passé le chemin ?',scene:'plaine',
  quote:'La trace disparaît dans les champs. Devant toi : des ronces et une clôture.',choices:[
  {label:'Revenir sur tes pas',text:'Sage décision.',effect:{energy:-1}},
  {label:'Couper à travers',text:'Ça doit bien passer quelque part.',chance:{odds:.5,ok:{text:'Un raccourci magnifique !',effect:{points:1}},ko:{text:'Ronces, clôtures et vélo poussé.',effect:{energy:-2,fatigue:1}}}}]},
 {id:'im-derailleur',when:'route',kind:'galere',cause:'meca',rarity:'rare',title:'Le dérailleur capricieux',scene:'ville',
  quote:'La chaîne saute à chaque coup de pédale. Le dérailleur arrière fait des siennes.',choices:[
  {label:'Régler toi-même',text:'Tournevis et patience.',chance:{odds:.5,ok:{text:'Tout tourne rond.',effect:{}},ko:{text:'Pire qu’avant : demain, réparation.',effect:{tomorrow:-1}}}},
  {label:'Finir à l’atelier',text:'Un ami du patron répare pour presque rien.',need:{money:1},effect:{money:-1,stopToday:true}}]},
 {id:'im-heure',when:'route',kind:'galere',cause:'route',rarity:'unique',region:['balkans'],terrain:['plaine','ville'],title:'Le changement d’heure',scene:'ville',
  quote:'En passant la frontière, une heure de décalage : le train que tu visais n’existe même pas.',choices:[
  {label:'Demander autour de toi',text:'Un chauffeur de bus scolaire embarque ton vélo.',effect:{tomorrow:1}},
  {label:'Pédaler',text:'Tant pis pour le train.',effect:{energy:-2}}]},
 {id:'im-camion',when:'route',kind:'belle',rarity:'rare',terrain:['plaine'],title:'« On t’avance ? »',scene:'plaine',
  quote:'Sur une route trop fréquentée, un pick-up s’arrête : « On t’avance de trente kilomètres ? »',choices:[
  {label:'Monter avec eux',text:'Le vélo dans la benne, la vitre ouverte.',effect:{tomorrow:1}},
  {label:'Refuser poliment',text:'Tu tiens à tes kilomètres.',effect:{}}]},
 // ---------- En route : belles surprises ----------
 {id:'im-riviere',when:'route',kind:'belle',rarity:'courante',terrain:['moyenne_montagne','montagne'],weather:['beau','vent'],title:'La rivière glacée',scene:'montagne',
  quote:'Une rivière à 12 degrés coule juste sous la route.',choices:[
  {label:'Tremper les jambes',text:'Les muscles revivent.',effect:{energy:2}},
  {label:'Remplir les gourdes et repartir',text:'L’eau la plus fraîche du voyage.',effect:{}}]},
 {id:'im-offrande',when:'route',kind:'belle',rarity:'courante',terrain:['plaine','cote','moyenne_montagne'],notCity:true,title:'Une halte imprévue',scene:'plaine',
  quote:'{qui} t’arrête {lieu} et t’offre {offrande}. Vous ne parlez pas la même langue, mais vous riez beaucoup.',choices:[
  {label:'Accepter et discuter',text:'Un vrai moment de voyage.',effect:{food:1}},
  {label:'Remercier et repartir',text:'Le ventre plein de gentillesse.',effect:{energy:1}}]},
 {id:'im-cycliste',when:'route',kind:'belle',rarity:'courante',title:'Le cycliste du coin',scene:'plaine',
  quote:'Un cycliste du coin te rattrape, te tend {offrande} et repart aussi vite qu’il est venu.',choices:[
  {label:'Le suivre un bout',text:'Il connaît toutes les petites routes.',effect:{energy:-1,points:1}},
  {label:'Le remercier',text:'Une provision de plus.',effect:{food:1}}]},
 {id:'im-paysage',when:'route',kind:'belle',rarity:'rare',terrain:['cote','montagne','col','moyenne_montagne'],weather:['beau'],title:'Paysage exceptionnel',scene:'montagne',
  quote:'Au détour d’un virage, la vue s’ouvre d’un coup. Tu poses le vélo sans réfléchir.',choices:[
  {label:'Prendre le temps',text:'Une photo, puis juste regarder.',effect:{points:2}}]},
 {id:'im-voie-verte',when:'route',kind:'belle',rarity:'courante',terrain:['plaine'],region:['ouest','alpes','nord'],title:'La voie verte',scene:'plaine',
  quote:'Une voie verte toute neuve, lisse comme un billard, sans une voiture.',choices:[
  {label:'Filer',text:'Demain, tu iras plus loin.',effect:{tomorrow:1}},
  {label:'Pique-nique au bord',text:'Pain, fromage, soleil.',effect:{energy:2}}]},
 {id:'im-bac',when:'route',kind:'belle',rarity:'rare',terrain:['plaine'],region:['balkans','est','alpes'],title:'Le petit bac',scene:'cote',
  quote:'Le petit bac pour traverser le fleuve se fait attendre. D’autres voyageurs patientent avec toi.',choices:[
  {label:'Attendre en discutant',text:'Chacun raconte d’où il vient.',effect:{energy:1}}]},
 {id:'im-gorges',when:'route',kind:'belle',rarity:'rare',terrain:['montagne','moyenne_montagne'],region:['balkans','alpes'],title:'Les gorges',scene:'montagne',
  quote:'La route se faufile entre la roche et l’eau. Des gorges grandioses.',choices:[
  {label:'Rouler lentement pour tout voir',text:'Paysage exceptionnel.',effect:{points:2}}]},
 {id:'im-addition',when:'route',kind:'belle',rarity:'rare',terrain:['ville'],region:['balkans'],title:'L’addition',scene:'ville',
  quote:'En terrasse, des inconnus curieux de ton voyage. Au moment de payer : ils ont déjà réglé ta note.',choices:[
  {label:'Les remercier chaleureusement',text:'Une belle leçon d’hospitalité.',effect:{money:1}}]},
 {id:'im-marche',when:'route',kind:'belle',rarity:'courante',terrain:['ville'],title:'Le marché',scene:'ville',
  quote:'Le marché déborde : {offrande}, des épices, des cris, des couleurs.',choices:[
  {label:'Faire le plein',text:'Pour trois fois rien.',need:{money:1},effect:{money:-1,food:2}},
  {label:'Flâner entre les étals',text:'Les couleurs, les voix, les odeurs.',effect:{}}]},
 {id:'im-enfants',when:'route',kind:'belle',rarity:'courante',terrain:['plaine','moyenne_montagne'],region:['balkans','est'],title:'« Hello ! »',scene:'plaine',
  quote:'Les enfants du village courent à côté du vélo en criant « Hello ! ».',choices:[
  {label:'Faire la course',text:'Tu laisses gagner le plus petit.',effect:{energy:-1,points:1}},
  {label:'Saluer de la main',text:'Ça donne des ailes.',effect:{}}]},
 {id:'im-cyclos',when:'route',kind:'belle',rarity:'courante',title:'D’autres voyageurs à vélo',scene:'plaine',
  quote:'Des voyageurs à vélo arrivent en face. Arrêt immédiat : on compare les itinéraires.',choices:[
  {label:'Échanger les bons plans',text:'Ils connaissent une route plus douce.',effect:{tomorrow:1}},
  {label:'Partager le goûter',text:'Biscuits, histoires et rires.',effect:{energy:1}}]},

 // ---------- La nuit : un pari selon l'endroit où l'on dort (night = bivouac, camping, hotel, dehors) ----------
 // Galères
 {id:'im-moustiques',when:'soir',night:['bivouac','dehors','camping'],kind:'galere',rarity:'courante',terrain:['plaine','cote'],title:'Les moustiques',scene:'plaine',
  quote:'Des nuées de moustiques autour de la tente. Impossible de fermer l’œil.',choices:[
  {label:'Allumer un feu qui fume',text:'Ça peut marcher.',chance:{odds:.5,ok:{text:'Ils s’en vont. Nuit tranquille.',effect:{}},ko:{text:'Les yeux qui piquent, et toujours les moustiques.',effect:{fatigue:1}}}},
  {label:'S’enfermer et transpirer',text:'Longue nuit.',effect:{fatigue:1}}]},
 {id:'im-bruit',when:'soir',night:['bivouac','dehors'],kind:'galere',rarity:'courante',notCity:true,title:'C’était quoi ce bruit ?',scene:'montagne',
  quote:'Un craquement dans les buissons. Puis un autre. La moindre branche devient énorme une fois la tente fermée.',choices:[
  {label:'Sortir avec la frontale',text:'Il faut en avoir le cœur net.',chance:{odds:.7,ok:{text:'Une biche ! Elle te regarde, puis file.',effect:{}},ko:{text:'Rien vu, mal dormi.',effect:{fatigue:1}}}},
  {label:'Se boucher les oreilles',text:'Demain, tout ira bien.',effect:{energy:-1}}]},
 {id:'im-patrouille',when:'soir',night:['bivouac','dehors'],kind:'galere',rarity:'courante',terrain:['cote','plaine'],notCity:true,title:'La patrouille',scene:'cote',
  quote:'À la nuit tombée, un pick-up de la police s’arrête près de la tente.',choices:[
  {label:'Expliquer ton voyage',text:'D’où tu viens, où tu vas.',chance:{odds:.6,ok:{text:'« Bonne nuit, bon voyage ! »',effect:{}},ko:{text:'Il faut plier la tente et aller plus loin, en pleine nuit.',effect:{energy:-1,fatigue:1}}}}]},
 {id:'im-arceau',when:'soir',night:['bivouac','camping'],kind:'galere',rarity:'rare',weather:['orage','pluie'],item:'tente',title:'L’arceau cassé',scene:'plaine',
  quote:'En plongeant dans la tente pour fuir l’orage, crac : l’arceau casse net.',choices:[
  {label:'Bricoler une attelle',text:'Ça tient, à peu près. Mauvaise nuit.',effect:{fatigue:1}},
  {label:'Échanger la tente en ville demain',text:'Une matinée de perdue.',need:{money:1},effect:{money:-1,tomorrow:-1}}]},
 {id:'im-deluge',when:'soir',night:['bivouac','dehors'],kind:'galere',rarity:'courante',weather:['orage','pluie'],title:'Le déluge',scene:'plaine',
  quote:'Toute la nuit, la pluie tambourine. Au matin, une flaque s’est invitée sous le matelas.',choices:[
  {label:'Tout faire sécher au soleil',text:'Départ tardif.',effect:{tomorrow:-1}},
  {label:'Repartir mouillé',text:'Ça finira par sécher en roulant.',effect:{fatigue:1}}]},
 {id:'im-froid',when:'soir',night:['bivouac','dehors'],kind:'galere',rarity:'courante',terrain:['montagne','col','moyenne_montagne'],title:'La nuit glacée',scene:'montagne',
  quote:'En altitude, la température tombe sous zéro. Le duvet ne suffit pas.',choices:[
  {label:'Enfiler toutes tes affaires',text:'Tu grelottes jusqu’au matin.',effect:{fatigue:1}}]},
 {id:'im-gaz',when:'soir',night:['bivouac','camping'],kind:'galere',rarity:'courante',item:'rechaud',title:'La mauvaise bouteille de gaz',scene:'plaine',
  quote:'Le réchaud refuse de s’allumer : la bouteille de gaz n’est pas la bonne.',choices:[
  {label:'Demander aux voisins',text:'Ils te dépannent… ou pas.',chance:{odds:.6,ok:{text:'Dîner chaud et bonne humeur.',effect:{}},ko:{text:'Personne autour : pain sec et fromage.',effect:{energy:-1}}}},
  {label:'Manger froid',text:'Pain sec et fromage.',effect:{energy:-1}}]},
 {id:'im-complet',when:'soir',night:['camping'],kind:'galere',rarity:'courante',title:'Camping complet',scene:'cote',
  quote:'« Complet, désolé. » Le suivant est à dix kilomètres… ou il reste un coin de pelouse, à prix d’or.',choices:[
  {label:'Payer le coin de pelouse',text:'Une pièce de plus.',need:{money:1},effect:{money:-1}},
  {label:'Pédaler jusqu’au suivant',text:'Dix kilomètres de nuit.',effect:{energy:-2}}]},
 {id:'im-voisins-bruyants',when:'soir',night:['camping'],kind:'galere',rarity:'courante',title:'Les voisins bruyants',scene:'cote',
  quote:'Barbecue, musique et rires jusqu’à deux heures du matin, juste à côté de ta tente.',choices:[
  {label:'Les rejoindre',text:'Autant en profiter.',effect:{fatigue:1,points:1}},
  {label:'Bouchons d’oreilles',text:'Nuit courte.',effect:{energy:-1}}]},
 {id:'im-punaises',when:'soir',night:['hotel'],kind:'galere',rarity:'rare',title:'Les punaises',scene:'ville',
  quote:'Au milieu de la nuit, ça gratte. Beaucoup trop.',choices:[
  {label:'Changer de chambre',text:'Le réceptionniste est désolé.',effect:{fatigue:1}}]},
 {id:'im-ventre',when:'soir',night:['hotel','camping'],kind:'galere',rarity:'rare',terrain:['ville'],title:'Le repas qui passe mal',scene:'ville',
  quote:'Le repas du soir passe mal. Très mal.',choices:[
  {label:'Rester au lit demain',text:'La route attendra.',effect:{restDay:true}},
  {label:'Repartir quand même',text:'Pâle comme un linge.',effect:{energy:-3}}]},
 {id:'im-telephone',when:'soir',night:['hotel','camping'],kind:'galere',rarity:'rare',terrain:['ville'],title:'Le téléphone oublié',scene:'ville',
  quote:'Le téléphone est resté sur un banc de la gare !',choices:[
  {label:'Retourner le chercher',text:'Une serveuse l’a gardé. Ouf, mais la matinée y passe.',effect:{tomorrow:-1}}]},
 // Belles surprises (rares et modestes)
 {id:'im-etoiles',when:'soir',night:['bivouac','dehors'],kind:'belle',rarity:'courante',weather:['beau','vent'],notCity:true,title:'La nuit étoilée',scene:'montagne',
  quote:'Pas un nuage. La Voie lactée au-dessus de la tente.',choices:[
  {label:'Veiller pour regarder',text:'Une étoile filante. Tu dors moins.',effect:{points:1,fatigue:1}},
  {label:'Dormir tout de suite',text:'Bercé par le silence.',effect:{}}]},
 {id:'im-bieres',when:'soir',night:['bivouac'],kind:'belle',rarity:'rare',notCity:true,title:'Les bières de l’inconnu',scene:'montagne',
  quote:'Un habitant arrive au bivouac avec des bières : ses amis ne sont pas venus, alors il te les offre.',choices:[
  {label:'Partager la soirée',text:'Un personnage qu’on n’oublie pas.',effect:{points:1,fatigue:1}},
  {label:'Une bière, puis dodo',text:'Il comprend et te souhaite bon voyage.',effect:{}}]},
 {id:'im-meute',when:'soir',night:['bivouac','dehors'],kind:'belle',rarity:'rare',terrain:['cote','plaine'],region:['balkans','est'],notCity:true,title:'La meute protectrice',scene:'cote',
  quote:'Une meute de chiens du village s’installe autour de la tente et monte la garde toute la nuit.',choices:[
  {label:'Dormir tranquille',text:'Tes gardes du corps veillent.',effect:{fatigue:-1}}]},
 {id:'im-feu',when:'soir',night:['bivouac'],kind:'belle',rarity:'courante',terrain:['cote','montagne','moyenne_montagne'],weather:['beau','vent'],notCity:true,title:'Le feu de bois',scene:'montagne',
  quote:'Cuisine au feu de bois, face à la mer ou aux sommets. La vie est douce.',choices:[
  {label:'Cuisiner tranquillement',text:'Le meilleur repas de la semaine.',effect:{energy:1}}]},
 {id:'im-nomades',when:'soir',night:['camping','bivouac'],kind:'belle',rarity:'courante',title:'Les voyageurs au long cours',scene:'montagne',
  quote:'Un couple qui voyage depuis deux ans plante sa tente à côté de la tienne.',choices:[
  {label:'Écouter leurs histoires',text:'Le voyage comme manière de vivre.',effect:{points:1}},
  {label:'Leur demander les bons coins',text:'Ils connaissent la route de demain.',effect:{tomorrow:1}}]},
 {id:'im-fin-camping',when:'soir',night:['camping'],kind:'belle',rarity:'rare',title:'Le camping qui ferme',scene:'cote',
  quote:'Le camping ferme dans deux jours : le gérant te rend ta pièce.',choices:[
  {label:'Profiter du calme',text:'Douche chaude et hamac.',effect:{money:1}}]},
 {id:'im-lessive',when:'soir',night:['camping','hotel'],kind:'belle',rarity:'courante',title:'Le jour de lessive',scene:'cote',
  quote:'Machine à laver et linge propre : le luxe.',choices:[
  {label:'Profiter de la soirée',text:'Propre, enfin.',effect:{fatigue:-1}}]},
 {id:'im-festival',when:'soir',night:['hotel','camping'],kind:'belle',rarity:'rare',terrain:['ville'],title:'Le festival',scene:'ville',
  quote:'Concerts et brasseries locales sur la place : la ville est en fête.',choices:[
  {label:'Faire la fête',text:'Après des jours de route, ça fait du bien.',effect:{points:1,fatigue:1}},
  {label:'Rentrer tôt',text:'La musique te berce.',effect:{}}]},
 {id:'im-accordeon',when:'soir',night:['hotel'],kind:'belle',rarity:'rare',terrain:['ville'],title:'Le concert d’accordéon',scene:'ville',
  quote:'Le patron de l’hôtel sort l’accordéon : polka, country, fausses notes. Quarante-cinq minutes.',choices:[
  {label:'Garder ton sérieux',text:'Quarante-cinq très longues minutes.',effect:{points:1}}]},
];

// Détails tirés au sort selon la zone : la même scène change à chaque fois.
export const VARIANTS={
 ouest:{qui:['Une vieille dame','Un vigneron','Une boulangère','Un berger','Un retraité à vélo'],lieu:['devant sa maison','sur la place du village','à la sortie d’un hameau','au bord du canal'],offrande:['des pommes et un café','une part de tarte','du fromage et du pain','une bouteille de cidre']},
 alpes:{qui:['Une fermière','Un berger','Un randonneur','Une famille en pique-nique'],lieu:['devant un chalet','au bord d’un lac','près d’une fontaine','à l’entrée d’un alpage'],offrande:['du fromage d’alpage','des pommes du verger','une part de strudel','du sirop de sureau']},
 nord:{qui:['Un pêcheur','Une institutrice','Un randonneur','Un vieux marin'],lieu:['près d’un lac','au bord d’un fjord','devant une maison rouge','sur un ponton'],offrande:['du poisson fumé','des myrtilles','une brioche à la cannelle','un café brûlant']},
 est:{qui:['Une babouchka','Un paysan','Une institutrice','Un vieux cycliste'],lieu:['devant une maison en bois','au bord de la route','près d’un puits','sur la place du marché'],offrande:['du thé et des pirojki','des concombres du jardin','du pain noir et du miel','des pommes']},
 balkans:{qui:['Une vieille dame','Un berger','Un chauffeur de bus','Un vendeur au bord de la route','Un cycliste du coin'],lieu:['devant sa maison','sur la place','à l’épicerie qui fait aussi bar','au bord de la rivière'],offrande:['un burek tout chaud','des poivrons grillés et de l’ajvar','un verre de rakija','du thé et du poisson grillé','des pommes et un café','une pastèque']}
};
export function fillVariants(text,region,rnd){const v=VARIANTS[region]||VARIANTS.ouest;
 return String(text).replace(/\{(qui|lieu|offrande)\}/g,(_,k)=>{const list=v[k];const s=list[Math.floor(rnd()*list.length)%list.length];return k==='lieu'&&/^\{lieu\}/.test(text)?s[0].toUpperCase()+s.slice(1):s;});}

// ---------- Imprévus qui durent : une zone de la carte pendant quelques jours ----------
// seed : type de case où naît la zone ; zone : types de cases qu'elle couvre ; size : nombre de cases ; days : durée.
// Effets dans la zone : campingPrice (prix du camping), noBivouac, every2 (+1 énergie une case sur deux),
//  entry (+1 énergie en entrant dans la zone), block (cases interdites), blockCols (cols interdits),
//  evening (scène du soir propre à l'imprévu), eveningEnergy (énergie rendue le soir dans la zone).
export const SITUATIONS=[
 {id:'cote-aout',kind:'neg',region:['balkans','ouest'],seed:['cote'],zone:['cote'],size:10,days:6,title:'La côte en plein mois d’août',
  text:'Voitures pare-chocs contre pare-chocs, campings pleins, et des panneaux partout : bivouac interdit jusqu’à la fin de l’été.',
  effects:{campingPrice:2,noBivouac:true,every2:true},rules:['Camping : 2 pièces','Bivouac interdit','+1 énergie une case sur deux'],advice:'Changer de cap vers l’intérieur ?'},
 {id:'canicule',kind:'neg',region:['balkans','est','ouest'],seed:['plaine'],zone:['plaine'],size:12,days:4,title:'Canicule sur la plaine',
  text:'Plus de 40 °C annoncés. Pas d’ombre, l’asphalte fond.',effects:{every2:true},rules:['+1 énergie une case sur deux'],advice:'Passer par les collines ?'},
 {id:'feu',kind:'neg',region:['balkans','ouest'],seed:['moyenne_montagne','montagne'],zone:['moyenne_montagne','montagne'],size:7,days:5,title:'Feu de forêt',
  text:'Un feu de forêt : les pompiers ont fermé les routes de la colline.',effects:{block:true},rules:['Cases interdites'],advice:'Il faut contourner.'},
 {id:'col-ferme',kind:'neg',region:['alpes','nord'],seed:['col'],zone:['col','montagne'],size:5,days:5,title:'Col fermé par la neige',
  text:'Neige précoce : le col est fermé, les chasse-neige ne passeront pas avant plusieurs jours.',effects:{blockCols:true},rules:['Cols interdits'],advice:'Un autre col, ou attendre.'},
 {id:'travaux',kind:'neg',seed:['plaine','moyenne_montagne'],zone:['plaine','moyenne_montagne'],size:6,days:5,title:'Travaux sur la grande route',
  text:'Chantier sur des kilomètres : déviations par des pistes cassantes.',effects:{entry:1},rules:['+1 énergie en entrant dans la zone'],advice:'Un petit détour suffit.'},
 {id:'coup-de-vent',kind:'neg',region:['nord','ouest'],seed:['cote'],zone:['cote'],size:8,days:4,title:'Coup de vent sur la côte',
  text:'Tempête annoncée sur le littoral : rafales de face et embruns.',effects:{every2:true},rules:['+1 énergie une case sur deux'],advice:'Rentrer dans les terres ?'},
 {id:'vendanges',kind:'pos',region:['ouest','alpes','balkans'],seed:['plaine','moyenne_montagne'],zone:['plaine','moyenne_montagne'],size:8,days:6,title:'Les vendanges : on embauche',
  text:'C’est la saison : les vignerons cherchent des bras, et partagent volontiers leur table.',effects:{evening:'sit-vendanges'},rules:['Le soir dans la zone : on t’embauche'],advice:'Un détour qui peut rapporter.'},
 {id:'fete',kind:'pos',seed:['ville'],zone:['ville','plaine','moyenne_montagne','cote'],size:6,days:3,title:'Fête nationale',
  text:'Drapeaux, fanfares et grandes tablées : tout le monde t’invite.',effects:{evening:'sit-fete'},rules:['Le soir dans la zone : la fête'],advice:'Passer par là ce soir ?'},
 {id:'voie-verte',kind:'pos',region:['ouest','alpes','nord'],seed:['plaine'],zone:['plaine'],size:8,days:8,title:'Voie verte toute neuve',
  text:'Une piste cyclable vient d’ouvrir : lisse, ombragée, sans voitures.',effects:{eveningEnergy:2},rules:['Soir dans la zone : +2 énergie'],advice:'La route douce.'},
 {id:'fin-saison',kind:'pos',region:['balkans','ouest'],seed:['cote'],zone:['cote'],size:10,days:8,title:'Fin de saison sur la côte',
  text:'Les touristes sont partis : plages vides, campings qui bradent leurs derniers jours.',effects:{campingPrice:0},rules:['Camping gratuit'],advice:'Le bon moment pour la mer.'}
];
export const SITUATION_SCENES={
 'sit-vendanges':{id:'sit-vendanges',when:'soir',kind:'belle',title:'Les vendanges',scene:'plaine',quote:'« Tu as deux bras ? Viens, on te paie et on dîne ensemble. »',choices:[
  {label:'Vendanger demain matin',text:'Une demi-journée de paie, des mains violettes.',effect:{money:2,tomorrow:-1}},
  {label:'Goûter et rester dîner',text:'Une soirée au milieu des vignes.',effect:{energy:1,points:1}}]},
 'sit-fete':{id:'sit-fete',when:'soir',kind:'belle',title:'La fête nationale',scene:'ville',quote:'Fanfare, drapeaux, poisson grillé et grandes tablées. On te tire par la manche.',choices:[
  {label:'Danser jusqu’à minuit',text:'Inoubliable. Les jambes, un peu moins.',effect:{points:2,fatigue:1}},
  {label:'Manger au banquet',text:'On te sert sans même demander.',effect:{energy:2}}]}
};

// ---------- Compagnons de route : ils reviennent plus loin dans la partie ----------
export const COMPANIONS=[
 {id:'sabbatique',name:'La voyageuse en année sabbatique',meet:'Une voyageuse en année sabbatique plante sa tente à côté. Vous comparez vos routes : « On se recroisera peut-être ! »',
  again:'Plusieurs jours plus tard, une silhouette familière te fait signe : la voyageuse en année sabbatique !'},
 {id:'mer-noire',name:'Le cyclo parti vers la mer Noire',meet:'Un cyclo solitaire, parti un mois pour souffler. Vous cuisinez un énorme plat de pâtes pimentées ensemble.',
  again:'Le cyclo de la mer Noire est là, au bord de la route, fatigué mais ravi de te revoir.'},
 {id:'tandem',name:'Le couple en tandem',meet:'Un couple en tandem arrive au même endroit que toi. Hamac, apéro et longues discussions.',
  again:'Un tandem au loin… ce sont eux ! Le couple en tandem t’attend au carrefour.'}
];

// ---------- « Demander » l'hospitalité : un pari ----------
export const DEMAND={base:{grand:25,jardin:40,refus:35},lateCampingPrice:2};
// streak = nombre de soirs d'affilée où l'on a déjà demandé : chaque soir de plus, +10 % de refus (au plus +30 %).
export function demandOdds({city,exhausted,region,streak=0}){let refus=DEMAND.base.refus,grand=DEMAND.base.grand;
 refus+=city?10:-5;if(exhausted)refus-=10;refus+={balkans:-10,est:-5,alpes:5}[region]||0;
 const s=Math.min(3,streak);refus+=10*s;grand-=5*s;
 refus=Math.max(10,Math.min(70,refus));grand=Math.max(10,grand);const jardin=Math.max(0,100-grand-refus);return {grand,jardin,refus,streak:s};}
// Plusieurs textes pour chaque réponse ({qui}, {lieu}, {offrande} changent avec la zone).
export const DEMAND_TEXTS={
 grand:['{qui} t’installe dans la chambre d’amis, puis t’invite à table : {offrande}, et des histoires jusque tard.','On te reçoit comme un cousin : douche chaude, dîner en famille et {offrande} pour la route.','{qui} insiste : « Pas de tente ce soir, il y a un lit. » Repas partagé, rires et photos de famille.','Une grande tablée t’attend {lieu}. Tu repars le lendemain avec {offrande} dans les sacoches.'],
 jardin:['« Mettez la tente au fond du jardin, il y a un robinet. » Nuit gratuite et tranquille.','{qui} te montre un coin d’herbe derrière la grange. Personne ne viendra te déranger.','On te laisse planter la tente sous les arbres fruitiers. Le chien de la maison monte la garde.','« Le pré est à vous jusqu’à demain matin. » Un simple merci, et la nuit est à toi.'],
 refusCamping:['« Désolé, pas ce soir. » Il fait nuit : camping de dernière minute, {prix} pièces.','Trois portes, trois refus polis. Tu finis au camping du village, {prix} pièces.','{qui} hésite, puis secoue la tête. Il faut payer un camping de dernière minute : {prix} pièces.'],
 refusDehors:['« Désolé, pas ce soir. » Plus une pièce en poche : nuit dehors, sans vrai repos.','Personne ne répond. Tu dors roulé dans ta veste, sous un abri de bus.','Refus après refus. La nuit tombe, et tu t’allonges près du vélo, sans tente montée.']
};
export function oddsLabel(pct){const list=[[10,'1 sur 10'],[15,'1 sur 7'],[20,'1 sur 5'],[25,'1 sur 4'],[33,'1 sur 3'],[40,'2 sur 5'],[50,'1 sur 2'],[60,'3 sur 5'],[67,'2 sur 3'],[75,'3 sur 4']];
 return list.reduce((best,x)=>Math.abs(x[0]-pct)<Math.abs(best[0]-pct)?x:best)[1];}

export const RARITY_WEIGHT={courante:3,rare:1,unique:1};
export const SCENE_COOLDOWN=10;// jours avant de revoir une même scène
export const ROAD_CHANCE=.5;// (ancien réglage ; en Immersion, la chance d'un événement dépend de la fatigue : voir FATIGUE)

// ---------- La fatigue (mode Immersion) : l'énergie, c'est la journée ; la fatigue, c'est la semaine ----------
// 6 niveaux, de 0 à 5. Chaque niveau bloque une case en haut de la barre d'énergie (10, 9, 8, 7, 6, 5).
//  road    : chance d'un événement en route dans la journée ; galere : part de galères parmi ces événements
//  causes  : galères possibles ('inattention' = chute, erreur d'itinéraire, nid-de-poule, affaires oubliées)
//  meal    : énergie en moins par repas ; bet : chance en moins sur les paris ; less : cases en moins par jour
//  forced  : le lendemain, repos forcé
export const FATIGUE=[
 {name:'En forme',road:1/3,galere:1/5,causes:['meteo','meca'],risk:'seulement météo et mécanique'},
 {name:'Un peu las',road:2/5,galere:1/3,causes:['meteo','meca','route'],risk:'météo, mécanique, imprévus de la route'},
 {name:'Fatigué',road:1/2,galere:1/2,causes:['meteo','meca','route','inattention'],risk:'chute et erreur d’itinéraire possibles'},
 {name:'Épuisé',road:3/5,galere:2/3,causes:['meteo','meca','route','inattention'],meal:1,bet:.15,risk:'chute, erreur d’itinéraire, crevaison sur un nid-de-poule, affaires oubliées…'},
 {name:'À bout',road:2/3,galere:3/4,causes:['meteo','meca','route','inattention'],meal:1,bet:.15,less:1,risk:'chute, erreur d’itinéraire, crevaison sur un nid-de-poule, affaires oubliées…'},
 {name:'Fourbu',road:2/3,galere:3/4,causes:['meteo','meca','route','inattention'],meal:1,bet:.15,less:1,forced:true,risk:'demain : repos forcé'}
];
// Ce qui fatigue : +1 par journée de route, +1 de plus avec un col ou 5 cases ; la mauvaise nuit est dans la nuit elle-même
// (nuit dehors +1, galères de nuit comme les moustiques +1).
export const FATIGUE_GAIN={day:1,hard:1,hardCases:5};
// Ce qui repose : la nuit (NIGHT) ; une journée sans rouler suivie d'une vraie nuit : −3, ou −4 en ville.
export const FATIGUE_REST_DAY={plain:-3,city:-4};

// ---------- La nuit (mode Immersion) : dormir termine toujours la journée ----------
// energy : énergie rendue ; fatigue : ce que la nuit enlève (−2, −1, 0) ou ajoute (+1) ; calm/galere/belle : chances (en %) du pari de la nuit.
// Une journée sans rouler : la nuit qui suit rend deux fois plus d'énergie (REST_DAY_FACTOR).
export const NIGHT={
 bivouac:{name:'Bivouac',energy:1,fatigue:0,odds:{calm:45,galere:35,belle:20},stormy:{calm:30,galere:55,belle:15}},
 camping:{name:'Camping',energy:2,fatigue:-1,odds:{calm:60,galere:20,belle:20},stormy:{calm:50,galere:30,belle:20}},
 hotel:{name:'Hôtel',energy:3,fatigue:-2,odds:{calm:80,galere:5,belle:15},stormy:{calm:80,galere:5,belle:15}},
 dehors:{name:'Nuit dehors',energy:0,fatigue:1,odds:{calm:40,galere:50,belle:10},stormy:{calm:25,galere:65,belle:10}}
};
export const REST_DAY_FACTOR=2;
// « Demander » : ce que donne chaque réponse (la nuit compte comme un hôtel, un camping, ou un refus).
export const DEMAND_NIGHT={grand:{energy:3,fatigue:-2,food:1,points:1},jardin:{energy:2,fatigue:-1},refusCamping:{energy:2,fatigue:-1},refusDehors:{energy:0,fatigue:1}};

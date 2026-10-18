// Définitions courtes pour la fiche du cycliste. Les chiffres viennent du profil actif.
export const WIKI_CATEGORIES=[
 {id:'jouer',label:'Jouer'},
 {id:'terrain',label:'Terrains et carte'},
 {id:'vie',label:'Vie du cycliste'},
 {id:'voyage',label:'Voyages et cartes'}
];

export function wikiEntries(r){
 const terrain=(id,name,icon,body)=>({id,name,icon,category:'terrain',short:`${r.terrain[id]} énergie de base par case`,body});
 const immersion=Boolean(r.immersion?.enabled);
 return [
  {id:'journee',name:'Journée',icon:'☀️',category:'jouer',short:'Rouler, manger, puis choisir où dormir.',body:'Chaque cycliste dispose d’un nombre limité de cases par journée. Dormir termine la journée. Une journée sans rouler rend davantage d’énergie pendant la nuit.'},
  {id:'deplacement',name:'Déplacement',icon:'🚴',category:'jouer',short:'Avancer de case voisine en case voisine.',body:'Sélectionne les cases entourées sur la carte dans l’ordre, puis confirme le trajet. Tu ne peux pas dépasser ta distance du jour ni dépenser plus d’énergie que tu n’en possèdes.'},
  {id:'hors-route',name:'Hors route',icon:'🛣️',category:'jouer',short:'Quitter les chemins peut limiter la journée.',body:r.offroad?.enabled?'Sans GPS, un pas hors route limite toute la journée : les cases déjà parcourues comptent aussi. Un GPS supprime cette limite.':'Les routes ne changent pas la limite de déplacement dans ce profil.'},
  {id:'energie',name:'Énergie',icon:'⚡',category:'vie',short:'La réserve dépensée pour pédaler.',body:`Tu commences avec ${r.startEnergy} énergie et peux en avoir jusqu’à ${r.maxEnergy}, sous réserve de la fatigue. Le coût de chaque case dépend de son terrain. Manger et dormir permettent d’en récupérer.`},
  {id:'fatigue',name:'Fatigue',icon:'😴',category:'vie',short:'Elle réduit l’énergie maximale disponible.',body:r.fatigue?.enabled?(immersion?'En mode Immersion, la fatigue va de 0 à 5 : chaque niveau bloque 1 point d’énergie maximale. Les journées difficiles et les cols l’augmentent ; une bonne nuit aide à récupérer.':`Chaque niveau de fatigue enlève ${r.fatigue.maxEnergyPenalty} énergie au maximum disponible. Les journées de route et les cols l’augmentent ; une bonne nuit aide à récupérer.`):'La fatigue est désactivée dans ce profil de règles.'},
  {id:'repas',name:'Repas',icon:'🍲',category:'vie',short:'Manger rend de l’énergie.',body:`Un repas froid rend ${r.food.coldEnergy??2} énergie. Avec un réchaud, un repas chaud rend ${r.food.hotEnergy??3} énergie. Les provisions s’achètent en ville selon les règles de la partie.`},
  {id:'bivouac',name:'Bivouac',icon:'⛺',category:'vie',short:'Dormir dehors, normalement avec une tente.',body:'Le bivouac est gratuit. Il termine la journée et rend de l’énergie, mais ne supprime pas toute la fatigue. Les conditions et effets exacts dépendent du mode et des règles actifs.'},
  {id:'camping',name:'Camping et hôtel',icon:'🏕️',category:'vie',short:'Des nuits payantes pour mieux récupérer.',body:'Le camping et l’hôtel terminent la journée. L’hôtel se trouve en ville. Ces nuits offrent une meilleure récupération que le bivouac et peuvent effacer la fatigue.'},
  terrain('plaine','Plaine','🌾','La plaine est un terrain facile à traverser. Son coût est indiqué dans les règles de la partie.'),
  terrain('cote','Côte','🌊','Une case de littoral. La mer voisine ne se traverse pas à vélo : utilise une liaison de ferry depuis un port.'),
  terrain('moyenne_montagne','Moyenne montagne','⛰️','Un terrain plus exigeant que la plaine, distinct de la haute montagne.'),
  terrain('montagne','Haute montagne','🏔️','La montagne demande davantage d’énergie. Certaines cartes Voyage exigent plusieurs cases de montagne consécutives.'),
  terrain('col','Col mythique','🚩',`Le col est une ascension particulière. Sa première visite peut rapporter des points d’aventure. Son coût de base dans ce profil est de ${r.terrain.col} énergie.`),
  terrain('ville','Ville','🏘️','La ville permet notamment le ravitaillement, le restaurant, les achats de matériel et parfois le départ ou l’arrivée d’un voyage.'),
  {id:'ferry',name:'Ferry',icon:'⛴️',category:'terrain',short:`Une traversée entre ports pour ${r.ferryPrice} pièces.`,body:'Le ferry relie deux ports désignés. La traversée coûte des pièces et termine la journée à l’arrivée.'},
  {id:'equipement',name:'Équipement',icon:'🎒',category:'vie',short:'Les objets transportés dans les sacoches.',body:'Chaque objet a un prix et occupe des places. La tente, le réchaud, le GPS, le kit et les autres équipements facilitent certaines actions ou protègent contre des incidents.'},
  {id:'voyage',name:'Carte Voyage',icon:'🗺️',category:'voyage',short:'Ton trajet et ses objectifs personnels.',body:'Une carte Voyage indique une ville de départ, une arrivée et des objectifs de terrain ou de villes. Remplis les étapes, puis rejoins l’arrivée pour obtenir les points annoncés sur la carte.'},
  {id:'objectif',name:'Objectif',icon:'🎯',category:'voyage',short:'Une condition à remplir pendant le voyage.',body:'Un objectif peut demander des villes intermédiaires, certains terrains ou des cases consécutives. La fiche Voyage montre la progression de chacun.'},
  {id:'points',name:'Points d’aventure',icon:'✨',category:'voyage',short:'Le score obtenu en explorant et en terminant des voyages.',body:'Les voyages réussis, les cols et certaines découvertes rapportent des points. La condition de fin de partie est choisie avant le départ.'},
  {id:'cartes',name:'Cartes Événement',icon:'🃏',category:'voyage',short:'Des effets positifs, négatifs, météo ou permanents.',body:r.immersion?.enabled?'Le mode Immersion remplace les cartes Événement par des scènes de voyage et des choix en route.':r.encounters?.enabled?'Ce profil utilise des rencontres à la place des cartes Événement.':'Selon les règles choisies, les cartes se piochent en fin de tour. Elles peuvent aider, gêner un adversaire ou offrir un bonus permanent.'}
 ];
}

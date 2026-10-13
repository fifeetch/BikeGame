// Cartes de jeu. Les positives aident leur propriétaire ; les négatives
// restent en main jusqu'à ce qu'on les donne à un adversaire.
export const CARDS=[
 {id:'coup-boost',title:'Coup de boost',icon:'⚡',type:'positive',text:'+2 énergie.',target:'self',effect:{energy:2},weight:1},
 {id:'bon-ravito',title:'Bon ravito',icon:'🍎',type:'positive',text:'+1 nourriture ou +1 énergie, au choix.',target:'self',choice:'food-energy',weight:1},
 {id:'coup-main',title:'Coup de main',icon:'🧰',type:'positive',text:'Annule gratuitement un malus de déplacement en cours.',target:'self',effect:{repair:true},weight:1},
 {id:'vent-favorable',title:'Vent favorable',icon:'🌬️',type:'positive',text:'+1 déplacement ce tour, dans la limite de 5 cases.',target:'self',effect:{bonusDistance:1},weight:1},
 {id:'bonne-affaire',title:'Bonne affaire',icon:'🪙',type:'positive',text:'+2 argent.',target:'self',effect:{money:2},weight:1},
 {id:'abri-trouve',title:'Abri trouvé',icon:'⛺',type:'positive',text:'Bivouac gratuit et +2 énergie. Le bivouac consomme la journée.',target:'self',effect:{energy:2,freeBivouac:true},weight:1},
 {id:'crevaison',title:'Crevaison',icon:'🛞',type:'negative',text:'Au début de son prochain tour, l’adversaire utilise une chambre à air ou perd 1 déplacement.',target:'other',resolution:'tube',weight:1},
 {id:'panne-mecanique',title:'Panne mécanique',icon:'🔧',type:'negative',text:'Au début de son prochain tour, l’adversaire utilise son kit de réparation ou perd 2 énergie.',target:'other',resolution:'kit-energy',weight:1},
 {id:'pluie-battante',title:'Pluie battante',icon:'🌧️',type:'negative',text:'Au début de son prochain tour, l’adversaire perd 1 déplacement.',target:'other',resolution:'rain',weight:1},
 {id:'faim-soudaine',title:'Faim soudaine',icon:'🍽️',type:'negative',text:'Au début de son prochain tour, l’adversaire dépense 1 nourriture ou perd 2 énergie.',target:'other',resolution:'hunger',weight:1},
 {id:'mauvaise-nuit',title:'Mauvaise nuit',icon:'🌙',type:'negative',text:'Au début de son prochain tour, l’adversaire commence avec −1 énergie.',target:'other',resolution:'bad-night',weight:1},
 {id:'detour-imprevu',title:'Détour imprévu',icon:'🪧',type:'negative',text:'Au début de son prochain tour, l’adversaire peut faire 1 déplacement supplémentaire, qui coûte +1 énergie.',target:'other',resolution:'detour',weight:1},
 // Cartes conservées pour que les anciennes sauvegardes restent lisibles.
 {id:'vent-contraire',title:'Vent contraire',icon:'💨',type:'negative',text:'Perd 2 énergie.',target:'other',effect:{energy:-2},weight:0,legacy:true},
 {id:'coup-de-pouce',title:'Coup de pouce',icon:'🪙',type:'positive',text:'Gagne 2 pièces.',target:'self',effect:{money:2},weight:0,legacy:true},
 {id:'ravitaillement',title:'Ravitaillement',icon:'🥕',type:'positive',text:'Gagne 2 provisions.',target:'self',effect:{food:2},weight:0,legacy:true},
 {id:'pause',title:'Pause bienvenue',icon:'⚡',type:'positive',text:'Récupère 2 énergie.',target:'self',effect:{energy:2},weight:0,legacy:true},
 {id:'panorama',title:'Panorama',icon:'🏞️',type:'positive',text:'Gagne 2 points Aventure.',target:'self',effect:{points:2},weight:0,legacy:true}
];
export const cardById=id=>CARDS.find(c=>c.id===id);

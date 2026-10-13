// Cartes de jeu distinctes des objectifs Voyage. The deck is inexhaustible.
export const CARDS=[
 {id:'crevaison',title:'Crevaison',text:'Le joueur choisi crève au début de son prochain tour.',target:'other',weight:3},
 {id:'vent-contraire',title:'Vent contraire',text:'Le joueur choisi perd 2 énergie.',target:'other',weight:2,effect:{energy:-2}},
 {id:'coup-de-pouce',title:'Coup de pouce',text:'Gagne 2 pièces.',target:'self',weight:3,effect:{money:2}},
 {id:'ravitaillement',title:'Ravitaillement',text:'Gagne 2 provisions.',target:'self',weight:3,effect:{food:2}},
 {id:'pause',title:'Pause bienvenue',text:'Récupère 2 énergie.',target:'self',weight:3,effect:{energy:2}},
 {id:'panorama',title:'Panorama',text:'Gagne 2 points Aventure.',target:'self',weight:2,effect:{points:2}}
];
export const cardById=id=>CARDS.find(c=>c.id===id);

// The forty physical Event cards. IDs are stable and unique, including cards
// with the same printed title in different categories.
export const EVENT_COLORS={positive:'#2E8B57',negative:'#C0392B',climatic:'#2980B9',permanent:'#D4A017'};
const make=(number,name,category,description,effectText,effectType,effectValue=0,icon='✦',terrainCondition='')=>({
 id:`evt-${String(number).padStart(2,'0')}`,number,name,title:name,category,type:category,description,effectText,text:effectText,
 effectType,effectValue,targetType:['negative','climatic'].includes(category)?'opponent':'self',
 playTiming:category==='climatic'?'anytime':number===7?'reaction':'own_turn',terrainCondition,
 isPermanent:category==='permanent',icon,color:EVENT_COLORS[category]
});
export const EVENT_CARDS=[
 make(1,'Vent dans le dos','positive','Une brise favorable te pousse sur la route.','Avance gratuitement de 2 cases supplémentaires en plaine, sur la côte ou en moyenne montagne.','free_steps',2,'🌬️'),
 make(2,'Rencontre généreuse','positive','Un habitant t’accueille et partage son repas.','Gagne immédiatement 2 nourritures.','gain_food',2,'🍎'),
 make(3,'Belle descente','positive','Après l’effort, le plaisir d’une longue descente !','Récupère immédiatement 2 énergies.','gain_energy',2,'⛰️'),
 make(4,'Nuit chez l’habitant','positive','Une famille t’offre un toit pour la nuit.','Récupère immédiatement 3 énergies.','gain_energy',3,'🏠'),
 make(5,'Petit boulot','positive','Quelques heures de travail permettent de financer la suite du voyage.','Gagne immédiatement 3 pièces d’or.','gain_money',3,'🪙'),
 make(6,'Marché local','positive','Un marché animé permet de refaire les provisions.','Gagne immédiatement 2 nourritures et 1 pièce d’or.','market',2,'🧺'),
 make(7,'Coup de pouce','positive','Un autre voyageur arrive au bon moment pour t’aider.','Annule une carte négative ou climatique qui vient d’être jouée contre toi.','cancel_attack',0,'🛡️'),
 make(8,'Paysage exceptionnel','positive','Un panorama incroyable récompense tes efforts.','Gagne immédiatement 2 points Aventure.','gain_points',2,'🏞️'),
 make(9,'Raccourci découvert','positive','Un cycliste local t’indique un itinéraire plus facile.','Ignore les surcoûts d’énergie liés au terrain pendant ton prochain déplacement.','terrain_shortcut',0,'🧭'),
 make(10,'Covoiturage improvisé','positive','Un véhicule accepte de transporter ton vélo sur quelques kilomètres.','Avance gratuitement jusqu’à 3 cases en suivant une route existante.','free_road_steps',3,'🚐'),
 make(11,'Crevaison','negative','Un morceau de verre met fin à ta progression.','Au début de son tour, le joueur ciblé répare avec son kit de réparation ; sans kit, il retourne à la dernière ville et perd sa journée. Pneus renforcés annule l’effet.','puncture',0,'🛞'),
 make(12,'Casse mécanique','negative','Un problème de transmission immobilise ton vélo.','Au début de son tour, le joueur ciblé répare avec son kit de réparation ; sans kit, il retourne à la dernière ville et perd sa journée. Outils multifonctions annule l’effet.','mechanical',0,'🔧'),
 make(13,'Vent de face','negative','Un vent contraire transforme la route en épreuve.','Le prochain déplacement du joueur ciblé coûte 2 énergies supplémentaires.','headwind_next',2,'💨'),
 make(14,'Orage violent','negative','Les éclairs obligent à trouver un abri.','Le joueur ciblé perd 1 énergie et ne peut pas effectuer son prochain déplacement.','storm_next',1,'⛈️'),
 make(15,'Erreur d’itinéraire','negative','Une mauvaise intersection t’éloigne de ton parcours.','Le joueur ciblé ne se déplace pas à son prochain tour. GPS de randonnée annule l’effet.','wrong_turn',0,'🪧'),
 make(16,'Chute à vélo','negative','Un virage mal négocié provoque une lourde chute.','Le joueur ciblé perd 2 énergies. Au début de son tour, il se soigne avec sa trousse de secours ; sans trousse, il retourne à la dernière ville et perd sa journée.','fall',2,'⚠️'),
 make(17,'Intoxication alimentaire','negative','Le dernier repas ne passe vraiment pas…','Le joueur ciblé perd immédiatement 2 énergies.','food_poisoning',2,'🤢'),
 make(18,'Route barrée','negative','Des travaux t’obligent à modifier ton itinéraire.','Le prochain trajet annoncé est interdit ; choisis une autre route. GPS de randonnée annule l’effet.','road_closed',0,'🚧'),
 make(19,'Sacoche déchirée','negative','Une sacoche s’accroche et des provisions disparaissent.','Le joueur ciblé perd 1 nourriture, ou 1 énergie s’il n’en possède pas.','torn_bag',1,'🎒'),
 make(20,'Matériel endommagé','negative','Une mauvaise manipulation abîme un équipement essentiel.','Le joueur ciblé choisit un bonus permanent à défausser ; sinon il perd 1 énergie.','damage_bonus',1,'💥'),
 make(21,'Vent de face','climatic','De puissantes rafales ralentissent le cycliste.','Le déplacement en cours coûte 2 énergies supplémentaires.','headwind_now',2,'🌬️'),
 make(22,'Canicule','climatic','La chaleur écrasante épuise les réserves.','Le joueur ciblé perd immédiatement 2 énergies.','heatwave',2,'☀️'),
 make(23,'Orage violent','climatic','La pluie et les éclairs rendent la route dangereuse.','Interrompt le déplacement sur la dernière case atteinte.','storm_now',0,'⛈️'),
 make(24,'Brouillard épais','climatic','La visibilité devient presque nulle.','Réduis de 2 cases la distance restante du déplacement en cours.','fog',2,'🌫️'),
 make(25,'Neige au sommet','climatic','La neige recouvre la route du col.','Au prochain tour du joueur ciblé, les cases de montagne et les cols lui sont interdits.','mountain_snow',0,'❄️'),
 make(26,'Pluie torrentielle','climatic','Le chemin devient un véritable bourbier.','Sur une case sans route, le joueur ciblé perd 2 énergies.','heavy_rain',2,'🌧️','sans_route'),
 make(27,'Vent latéral','climatic','De violentes bourrasques gênent la trajectoire.','Réduis de 2 cases le déplacement en cours.','crosswind',2,'💨'),
 make(28,'Gel matinal','climatic','Une fine couche de glace rend la chaussée glissante.','Le joueur ciblé perd les avantages de déplacement des cartes pendant ce tour.','morning_frost',0,'🧊'),
 make(29,'Tempête côtière','climatic','La mer se déchaîne sur la route littorale.','Sur une case côtière, le joueur ciblé perd 2 énergies et termine son déplacement.','coastal_storm',2,'🌊','cote'),
 make(30,'Froid glacial','climatic','Le corps peine à se réchauffer.','Dépense 1 nourriture ou perds immédiatement 2 énergies.','freezing_cold',2,'🥶'),
 make(31,'Pneus renforcés','permanent','Des pneus robustes pour les kilomètres à venir.','Immunité contre Crevaison.','puncture_immunity',0,'🛞'),
 make(32,'Outils multifonctions','permanent','Le nécessaire pour les petites pannes.','Annule Casse mécanique.','mechanical_immunity',0,'🧰'),
 make(33,'Sacoches supplémentaires','permanent','Plus de place pour les provisions.','Augmente de 3 la capacité maximale de nourriture.','food_capacity',3,'🎒'),
 make(34,'Panneau solaire','permanent','Produire de l’énergie au fil des kilomètres.','Récupère 1 énergie à la fin de chacun de tes tours.','solar',1,'☀️'),
 make(35,'GPS de randonnée','permanent','Un bon itinéraire évite les difficultés.','Immunité contre Erreur d’itinéraire et Route barrée. Quitter la route sans pénalité.','gps_immunity',0,'🧭'),
 make(36,'Réchaud performant','permanent','Un bon repas chaud aide à repartir.','Chaque nourriture consommée rapporte 3 énergies au lieu de 2.','efficient_stove',3,'🍲'),
 make(37,'Tente grand confort','permanent','Bien dormir aide à rouler longtemps.','Lors d’une nuit sous tente, récupère 2 énergies au lieu de 1.','comfortable_tent',2,'⛺'),
 make(38,'Vélo léger','permanent','Quelques kilos en moins comptent en montagne.','Réduis de 1 énergie le premier surcoût de terrain à chaque tour.','light_bike',1,'🚲'),
 make(39,'Carnet de voyage','permanent','Chaque ville traversée enrichit ton aventure.','Souvenir de route. (Nouvel effet à venir.)','travel_journal',0,'📓'),
 make(40,'Réseau Warmshowers','permanent','La communauté accueille les cyclistes.','Une fois par tour, à l’arrivée dans une ville : +1 énergie.','warmshowers',1,'🏠')
];
const officialCard=id=>EVENT_CARDS.find(card=>card.id===id);
export function normalizeEventEdits(edits=[]){
 if(!Array.isArray(edits)||edits.length>EVENT_CARDS.length)throw Error('La bibliothèque des cartes Événement est invalide.');
 const seen=new Set();return edits.map(edit=>{
  const slot=officialCard(edit?.slotId),effect=officialCard(edit?.templateId),name=String(edit?.name||'').trim(),description=String(edit?.description||'').trim();
  if(!slot||!effect||slot.category!==effect.category||seen.has(slot.id)||!name||name.length>50||!description||description.length>180)throw Error('Variante de carte invalide : choisis un effet de la même catégorie et un texte court.');
  seen.add(slot.id);return {slotId:slot.id,templateId:effect.id,name,description};
 });
}
export function eventCardById(id,game){
 const base=officialCard(id),edit=game?.eventCardEdits?.find(entry=>entry.slotId===id);if(!base||!edit)return base;
 const effect=officialCard(edit.templateId);if(!effect||effect.category!==base.category)return base;
 return {...base,name:edit.name,title:edit.name,description:edit.description,effectText:effect.effectText,text:effect.effectText,effectType:effect.effectType,effectValue:effect.effectValue,playTiming:effect.playTiming,terrainCondition:effect.terrainCondition,icon:effect.icon};
}
export const eventCardsFor=game=>EVENT_CARDS.map(base=>eventCardById(base.id,game));

// Mode Ultra (17 octobre, idée de Fi) : course d'ultra-distance en autonomie, Lisbonne → Cap Nord.
// Inspiré des vraies courses (Transcontinental, NorthCape 4000, BikingMan, Silk Road Mountain Race) :
// l'horloge ne s'arrête jamais, contrôles dans l'ordre, cols obligatoires, barrières horaires.
// Une case ≈ 100 km de route (mesuré sur la carte : ~80 km à vol d'oiseau).

export const ULTRA_RACE={
 id:'ultra-lcn',title:'Ultra Lisbonne → Cap Nord',from:'Lisbonne',to:'Cap Nord',
 checkpoints:['Zurich','Saint-Pétersbourg'],
 cols:3,                     // cols mythiques obligatoires (au choix parmi les 8)
 barriers:[12,26,34],        // fin du jour 12 à Zurich, 26 à Saint-Pétersbourg, 34 au Cap Nord
 startHour:6                 // départ le lundi à 6 h (jour 1 = lundi)
};

// Heures pour traverser une case (≈ 100 km, arrêts compris), selon le terrain.
export const ULTRA_HOURS={plaine:5,cote:5,ville:4,moyenne_montagne:6,montagne:7,col:8};
export const ULTRA_OFFROAD_HOURS=1;   // hors route : +1 h
export const ULTRA_NIGHT_HOURS=1;     // de nuit (22 h – 6 h) : +1 h
export const ULTRA_TIRED_HOURS=1;     // dès « Fatigué » (dette ≥ 24 h) : +1 h
export const ULTRA_NIGHT=[22,6];
export const ULTRA_STEP_MAX=8;        // cases au plus entre deux sommeils (l'énergie limite avant)

// Le sommeil : chaque choix fait avancer l'horloge et efface une partie de la dette de sommeil.
export const ULTRA_SLEEP=[
 {id:'sieste',name:'Sieste',icon:'💤',hours:1/3,awake:-4,energy:1,text:'20 minutes sur le bas-côté, casque sous la tête.'},
 {id:'cycle',name:'Un cycle',icon:'🌙',hours:1.5,awake:-10,energy:3,text:'1 h 30 : un vrai cycle de sommeil, couverture de survie.'},
 {id:'court',name:'Nuit courte',icon:'⛺',hours:4,awake:-20,energy:5,text:'4 heures au bivouac, réveil avant l’aube.'},
 {id:'nuit',name:'Vraie nuit',icon:'🛌',hours:8,awake:'reset',energy:'full',text:'8 heures : le grand reset, mais les rivaux filent.'},
 {id:'hotel',name:'Hôtel',icon:'🏨',hours:7,awake:'reset',energy:'full',city:true,text:'Douche, lit, gourdes pleines. En ville seulement.'}
];

// Dette de sommeil (heures éveillé) → niveau de fatigue 0 à 5 (les effets de la fatigue de l'Immersion s'appliquent).
export const ULTRA_DEBT=[16,24,32,40,48];
export const ULTRA_DEBT_NAMES=['Frais','Les yeux piquent','Fatigué','Hallucinations','Micro-sommeils','Au bout du rouleau'];
export const ULTRA_HALLU={from:32,odds:.18};      // hallucinations dès 32 h éveillé
export const ULTRA_MICRO={from:40,odds:.22,hours:2,energy:-2};  // micro-sommeil : chute, 2 h perdues
export const ULTRA_LATE_NIGHT=[2,6];              // entre 2 h et 6 h : risques doublés

// Magasins : supérette et magasin de vélo ouverts de 8 h à 20 h ; restaurant de 11 h à 22 h ; station-service 24 h/24.
export const ULTRA_SHOP_HOURS=[8,20];
export const ULTRA_RESTO_HOURS=[11,22];
export const ULTRA_FOOD={superette:2,station:1,hameau:1,hours:.5};  // repas achetés et temps perdu
export const ULTRA_FERRY_MAX=1;   // un seul bateau autorisé (comme la NorthCape 4000)
export const ULTRA_FERRY_HOURS=10;

// Les 10 rivaux : leurs vrais noms, à la demande de Fi pour jouer entre amis (« si je publie le jeu, on verra »).
// Tous les noms sont ici, dans cette seule liste, pour les changer d'un coup.
export const ULTRA_RIVALS=[
 {id:'strasser',name:'Christoph Strasser',color:'#d0574a'},
 {id:'kolbinger',name:'Fiona Kolbinger',color:'#7fb3d5'},
 {id:'wilcox',name:'Lael Wilcox',color:'#c9a2e0'},
 {id:'gemperle',name:'Robin Gemperle',color:'#9fd08a'},
 {id:'sehili',name:'Sofiane Sehili',color:'#e0c36a'},
 {id:'difelice',name:'Omar Di Felice',color:'#e88aa8'},
 {id:'deichmann',name:'Jonas Deichmann',color:'#8fd3c7'},
 {id:'bosini',name:'Victor Bosini',color:'#f0a070'},
 {id:'roland',name:'Pierre Roland',color:'#b0b8ff'},
 {id:'frings',name:'Eva Frings',color:'#ffd6a0'}
];
// Rythme des rivaux (cases par jour) : tirés au sort, sans caractère pour l'instant (choix de Fi).
export const ULTRA_RIVAL_PACE={min:2.5,max:3.4,badDay:.12,badFactor:.35,dnf:.12};
// Les cols des rivaux : 3 cols, avant et après Zurich.
export const ULTRA_COL_PLANS=[
 {before:['Alto de l’Angliru','Col du Tourmalet','Col du Galibier'],after:[]},
 {before:['Col du Tourmalet','Mont Ventoux','Col du Galibier'],after:[]},
 {before:['Col du Tourmalet','Col du Galibier'],after:['Col du Stelvio']},
 {before:['Mont Ventoux'],after:['Col du Stelvio','Grossglockner']},
 {before:['Col du Galibier'],after:['Col du Stelvio','Grossglockner']},
 {before:['Alto de l’Angliru','Col du Tourmalet'],after:['Grossglockner']}
];

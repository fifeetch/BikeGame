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

// ---------- Le garage de l'ultra (18 octobre, choix de Fi : la monnaie, c'est le poids) ----------
// Montures : la route va vite sur le goudron mais souffre beaucoup hors route ; le VTT l'inverse.
// road : heures en plus ou en moins sur plaine, côte et ville ; offroad : heures en plus hors route (remplace le +1 h).
export const ULTRA_BIKES={
 route:{name:'Route endurance',kg:8.5,road:-1,offroad:3,tag:'Rapide sur le goudron',line:'Plaine, côte, ville : −1 h par case. Hors route : +3 h par case.'},
 gravel:{name:'Gravel d’ultra',kg:9.5,road:0,offroad:1,tag:'Passe partout',line:'Même allure partout. Hors route : +1 h.'},
 vtt:{name:'VTT semi-rigide',kg:11.5,road:1,offroad:0,fork:true,tag:'Roi des pistes',line:'Hors route : aucune heure en plus, fourche suspendue montée. Plaine, côte, ville : +1 h par case.'}
};
export const ULTRA_GEAR={
 aero:{name:'Prolongateurs',kg:.4,text:'Plaine et côte : −½ h par case. Les mains se reposent.'},
 dynamo:{name:'Moyeu dynamo + phare',kg:.6,text:'La nuit ne coûte plus que +½ h par case.'},
 camel:{name:'Sac d’hydratation',kg:.4,text:'+1 gourde : moins d’arrêts pour l’eau.'},
 tige:{name:'Tige de selle suspendue',kg:.5,text:'Hors route : −½ h par case.'},
 fourche:{name:'Fourche suspendue',kg:1.3,text:'Hors route : −1 h par case. Gravel seulement (déjà sur le VTT).',not:['route','vtt']},
 tubeless:{name:'Pneus tubeless',kg:.2,text:'Crevaisons 2 fois moins souvent.'},
 bivy:{name:'Sac de bivouac',kg:.5,text:'« Nuit courte » : +2 énergie de plus.'},
 couverture:{name:'Couverture de survie',kg:.05,text:'« Un cycle » : +1 énergie de plus.'},
 gps:{name:'GPS + batterie',kg:.3,text:'Hors route sans limite de cases.'}
};
export const ULTRA_BASE_KG=5.4;            // sacoches 2,4 kg + vêtements, nourriture et outils 3 kg
export const ULTRA_WEIGHT={light:15,heavy:18}; // < 15 kg léger ; 15 à 18 : cols +1 h ; ≥ 18 : cols et montagne +1 h
export const ULTRA_DEFAULT={bike:'gravel',gear:['tubeless','dynamo']};
export function ultraKit(bike,gear){const b=ULTRA_BIKES[bike]?bike:'gravel';const g=[...new Set((gear||[]).filter(id=>ULTRA_GEAR[id]&&!(ULTRA_GEAR[id].not||[]).includes(b)))];return {bike:b,gear:g};}
export function ultraKg(bike,gear){const k=ultraKit(bike,gear);return Math.round((ULTRA_BIKES[k.bike].kg+ULTRA_BASE_KG+k.gear.reduce((n,id)=>n+ULTRA_GEAR[id].kg,0))*100)/100;}
export function ultraLoad(kg){return kg>=ULTRA_WEIGHT.heavy?{id:'lourd',name:'Lourd',text:'cols et montagne +1 h'}:kg>=ULTRA_WEIGHT.light?{id:'charge',name:'Chargé',text:'cols +1 h'}:{id:'leger',name:'Léger',text:'les cols coûtent leurs heures normales'};}
// Heures pour une case selon le vélo, l'équipement et le poids (le reste — nuit, fatigue — est ajouté par le moteur).
export function ultraKitHours(kit,type,onRoad,night){const k=ultraKit(kit?.bike,kit?.gear),b=ULTRA_BIKES[k.bike],has=id=>k.gear.includes(id)||(id==='fourche'&&b.fork);
 let h=ULTRA_HOURS[type]??5;
 if(['plaine','cote','ville'].includes(type))h+=b.road;
 if(has('aero')&&['plaine','cote'].includes(type))h-=.5;
 if(!onRoad){let o=b.offroad;if(has('tige'))o-=.5;if(has('fourche'))o-=1;h+=Math.max(0,o);}
 if(night)h+=has('dynamo')?.5:ULTRA_NIGHT_HOURS;
 const load=ultraLoad(ultraKg(k.bike,k.gear)).id;if(type==='col'&&load!=='leger')h+=1;else if(type==='montagne'&&load==='lourd')h+=1;
 return Math.max(2,h);}

// Les trois besoins (18 octobre, règle de Fi) : le sommeil, la nourriture et l'eau rendent tous de l'énergie,
// et chacun a sa dette : on ne peut se passer d'aucun.
// Faim : +1 par case ; un repas = +2 énergie (froid), −2 de faim, 15 minutes.
// Soif : +1 par case ; une gourde se boit toute seule dès 2 de soif : +1 énergie, −2 de soif.
// Paliers : [seuil, nom, heures en plus par case, énergie en plus par case].
export const ULTRA_NEEDS={
 faim:{per:1,meal:2,hours:.25,levels:[[0,'Calé',0,0],[2,'Petit creux',0,0],[4,'Fringale',1,1],[6,'À jeun',2,2]]},
 soif:{per:1,drink:2,auto:2,energy:1,levels:[[0,'Désaltéré',0,0],[2,'Gorge sèche',0,0],[3,'Soif',1,1],[5,'Déshydraté',2,2]]},
 wake:{faim:1}   // après une nuit courte ou une vraie nuit (l'hôtel sert le petit-déjeuner : faim 0, gourdes pleines, soif 0)
};
export function ultraNeedLevel(kind,v){const L=ULTRA_NEEDS[kind].levels;let i=0;L.forEach((l,j)=>{if(v>=l[0])i=j;});const l=L[i];return {level:i,max:L.length-1,name:l[1],hours:l[2],energy:l[3],next:L[i+1]?.[0]??null};}

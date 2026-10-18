export const voyages=[
{id:'traversee',title:'La grande traversée',from:'Paris',to:'Istanbul',color:'#ba4d2a',cities:5,mountainRun:3,coast:2},
{id:'soleil',title:'La route du soleil',from:'Barcelone',to:'Rome',color:'#287a80',cities:3,coast:4,coastRun:3,plain:2},
{id:'alpes',title:'Au-delà des Alpes',from:'Lyon',to:'Vienne',color:'#345a74',cities:2,mountainRun:4,plain:3},
{id:'campagne',title:'Les chemins de campagne',from:'Amsterdam',to:'Prague',color:'#aa781e',cities:4,plain:5,plainRun:3,mountain:1},
{id:'nord',title:'Cap vers le Nord',from:'Copenhague',to:'Cap Nord',color:'#416546',cities:4,coast:3,chains:2},
{id:'atlantique',title:'De l’Atlantique aux Alpes',from:'Bordeaux',to:'Zurich',color:'#865b39',cities:3,coast:2,mountainRun:2,art:'atlantique-alpes.png'},
{id:'est',title:'Les routes de l’Est',from:'Berlin',to:'Bucarest',color:'#935836',cities:4,plain:4,mountain:4,art:'routes-est.png'},
{id:'balkans',title:'Le tour des Balkans',from:'Venise',to:'Thessalonique',color:'#287a80',cities:3,coast:3,mountainRun:2,art:'balkans.png'},
// Nouveaux voyages (15 octobre 2026). Sans illustration : une petite carte du trajet est dessinée à la place.
{id:'iberique',title:'La traversée ibérique',from:'Lisbonne',to:'Barcelone',color:'#b5652b',cities:1,plain:4,hills:2},
{id:'manche',title:'Par-delà la Manche',from:'Londres',to:'Bordeaux',color:'#3f6f8f',cities:3,plain:4,coast:2},
{id:'iles',title:'Des îles au continent',from:'Dublin',to:'Paris',color:'#3d7a4f',cities:4,plain:3,coast:3},
{id:'rhin',title:'Le long du Rhin',from:'Amsterdam',to:'Milan',color:'#6a5a8c',cities:2,hills:3,mountainRun:2},
{id:'danube',title:'Le fil du Danube',from:'Vienne',to:'Constanța',color:'#2f6f86',cities:3,hills:4,mountain:2,coast:3},
{id:'adriatique',title:'Les rives de l’Adriatique',from:'Venise',to:'Skopje',color:'#2a7f8f',cities:3,coast:3,mountain:2},
{id:'grece',title:'Vers la mer Égée',from:'Sofia',to:'Athènes',color:'#3b6fa8',cities:2,coast:3,mountain:1},
{id:'anatolie',title:'Les hauts plateaux d’Anatolie',from:'Izmir',to:'Trabzon',color:'#a4532f',cities:2,mountainRun:3,coast:1},
{id:'fjords',title:'La route des fjords',from:'Bergen',to:'Narvik',color:'#3c6475',cities:2,coastRun:4,mountain:1},
{id:'baltique',title:'Les rivages baltes',from:'Varsovie',to:'Saint-Pétersbourg',color:'#5a6f3a',cities:3,plainRun:4,coast:2},
{id:'riviera',title:'De la Provence à la lagune',from:'Marseille',to:'Venise',color:'#c0703a',cities:2,cols:1,coast:2},
{id:'carpates',title:'Au pied des Carpates',from:'Budapest',to:'Odessa',color:'#7a6a2e',cities:2,plainRun:3,mountainRun:2},
// Carte « Extrême » (idée de Fi, 18 octobre) : traverser toute l'Europe. Réussie, elle vaut le maximum du tableau (35 points = fin de partie).
{id:'extreme',title:'L’Extrême',from:'Lisbonne',to:'Saint-Pétersbourg',color:'#7a2e3a',cities:5,mountainRun:3,cols:1,coast:3}
];
// Carte Voyage de la partie guidée « Apprendre à jouer » : hors des 21 cartes, jamais tirée au hasard.
export const TUTORIAL_VOYAGE={id:'apprentissage',title:'Premier voyage : vers la mer Égée',from:'Budapest',to:'Athènes',color:'#3b6fa8',cities:3,coast:3,mountain:1,tutorial:true};
// Trouver une carte Voyage par son identifiant (les 21 cartes + celle de la partie guidée).
// Mode Ultra (17 octobre) : la course Lisbonne → Cap Nord (pas d'objectifs de voyage : contrôles et cols gérés par le mode Ultra).
export const ULTRA_VOYAGE={id:'ultra-lcn',title:'Ultra Lisbonne → Cap Nord',from:'Lisbonne',to:'Cap Nord',color:'#c8483a',ultra:true};
export const findVoyage=id=>voyages.find(v=>v.id===id)||(id===TUTORIAL_VOYAGE.id?TUTORIAL_VOYAGE:id===ULTRA_VOYAGE.id?ULTRA_VOYAGE:undefined);
// Points d'aventure selon l'EFFORT du voyage (barème de Fi, 17 octobre 2026 : 1 point = 2,5 d'effort).
// Effort = cases + énergie du meilleur trajet qui remplit TOUS les objectifs (plaine 1, moyenne montagne 2, montagne 3, côte 1, ville 0, col 3).
// 10 et plus → 4 · 20 et plus → 8 · 30 et plus → 12 · 40 et plus → 16 · 50 et plus → 20.
// Le 17 octobre, 5 cartes trop faciles dans leur tranche ont reçu un objectif de plus (Nord, Est, îles, mer Égée, Danube).
export const VOYAGE_TIERS=[{max:19,name:'Facile',points:4},{max:29,name:'Modéré',points:8},{max:39,name:'Difficile',points:12},{max:49,name:'Très difficile',points:16},{max:Infinity,name:'Épique',points:20}];
export const VOYAGE_EFFORT={traversee:57,soleil:34,alpes:36,campagne:39,nord:58,atlantique:37,est:47,balkans:29,iberique:27,manche:16,iles:17,rhin:26,danube:38,adriatique:26,grece:19,anatolie:25,fjords:47,baltique:26,riviera:26,carpates:29,apprentissage:26};
// Longueur du trajet le plus court (affichée « environ N cases »).
export const VOYAGE_LENGTHS={extreme:47,traversee:27,soleil:14,alpes:13,campagne:11,nord:21,atlantique:11,est:16,balkans:12,iberique:11,manche:10,iles:9,rhin:9,danube:12,adriatique:10,grece:6,anatolie:9,fjords:15,baltique:12,riviera:8,carpates:10,apprentissage:13};
// Points des cartes Voyage (tableau de Fi, 18 octobre 2026) : max = tous les objectifs remplis, min = arrivé sans tous les objectifs.
// Calcul de Fi : effort = énergie des cases (plaine 1, côte 1, moyenne montagne 2, montagne 3, col 3, ville 0) ;
// min selon l'effort du trajet le plus court, max selon l'effort du trajet qui remplit tous les objectifs, grille par tranches de 5.
export const VOYAGE_POINTS={traversee:[10,18],soleil:[6,10],alpes:[6,14],campagne:[4,10],nord:[10,22],atlantique:[4,10],est:[6,18],balkans:[4,8],iberique:[4,10],manche:[3,6],iles:[2,6],rhin:[4,10],danube:[4,14],adriatique:[3,8],grece:[3,6],anatolie:[4,10],fjords:[6,18],baltique:[4,8],riviera:[3,8],carpates:[4,8],extreme:[28,35],apprentissage:[3,8]};
const tierName=pts=>pts<=6?'Facile':pts<=10?'Modéré':pts<=14?'Difficile':pts<=18?'Très difficile':'Épique';
export const voyageTier=v=>{const id=typeof v==='string'?v:v?.id,[min,max]=VOYAGE_POINTS[id]||[2,4];return {name:tierName(max),points:max,min};};
export const voyagePoints=v=>voyageTier(v).points;
export const voyageMinPoints=v=>voyageTier(v).min;
export function drawVoyages(rng=Math.random){const cards=[...voyages];for(let i=cards.length-1;i>0;i--){let j=Math.floor(rng()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}return cards.slice(0,3);}
export function progress(g){const v=findVoyage(g.voyage);if(!v)return null;const history=g.travelHistory||(g.travel||[]).map(k=>({key:k,type:g.board[k]?.type,endpoint:g.board[k]?.id===0||g.board[k]?.id===g.arrivalId}));// Règle de Fi (17 octobre) : un col compte comme une montagne (objectifs montagne et montagnes consécutives).
const mt=t=>t.type==='col'?{...t,type:'montagne'}:t;const first=new Map();for(const t of history)if(!first.has(t.key))first.set(t.key,mt(t));const unique=[...first.values()];const count=type=>unique.filter(t=>t.type===type&&!t.endpoint).length;
let runs={montagne:0,cote:0,plaine:0},current=0,last='',seen=new Set(),chains=0,chainAwarded=false;
for(const step of history){const {key:k,type}=mt(step);if(seen.has(k)&&type===last)continue;/* case déjà traversée : ne compte pas, ne casse pas la série */if(type!==last){current=0;chainAwarded=false;}if(seen.has(k)){current=0;}else {current++;seen.add(k);}last=type;if(type in runs)runs[type]=Math.max(runs[type],current);if(type==='montagne'&&current>=2&&!chainAwarded){chains++;chainAwarded=true;}}
const rows=[];const add=(label,value,target)=>rows.push({label,value:Math.min(value,target),target,done:value>=target});
add(v.cities===1?'Ville intermédiaire':'Villes intermédiaires',count('ville'),v.cities);
if(v.mountainRun)add('Montagnes consécutives',runs.montagne,v.mountainRun);
if(v.coast)add('Tuiles côtières',count('cote'),v.coast);
if(v.coastRun)add('Côtes consécutives',runs.cote,v.coastRun);
if(v.plain)add('Tuiles plaine',count('plaine'),v.plain);
if(v.plainRun)add('Plaines consécutives',runs.plaine,v.plainRun);
if(v.mountain)add(v.mountain===1?'Tuile montagne':'Tuiles montagne',count('montagne'),v.mountain);
if(v.chains)add('Chaînes distinctes de 2 montagnes',chains,v.chains);
if(v.hills)add('Tuiles moyenne montagne',count('moyenne_montagne'),v.hills);
if(v.cols){const cols=new Set(history.filter(t=>t.type==='col'&&!t.endpoint).map(t=>t.key)).size;add(v.cols===1?'Col mythique':'Cols mythiques',cols,v.cols);}
if(g.mode==='plateau')for(const r of rows)r.label=r.label.replace('Tuiles','Cases').replace('Tuiles','Cases').replace('tuiles','cases').replace('Tuile','Case');return {v,rows,ready:rows.every(r=>r.done),won:!!g.voyageWon};}

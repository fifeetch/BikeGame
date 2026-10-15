export const voyages=[
{id:'traversee',title:'La grande traversée',from:'Paris',to:'Istanbul',color:'#ba4d2a',cities:5,mountainRun:3,coast:2},
{id:'soleil',title:'La route du soleil',from:'Barcelone',to:'Rome',color:'#287a80',cities:3,coast:4,coastRun:3,plain:2},
{id:'alpes',title:'Au-delà des Alpes',from:'Lyon',to:'Vienne',color:'#345a74',cities:2,mountainRun:4,plain:3},
{id:'campagne',title:'Les chemins de campagne',from:'Amsterdam',to:'Prague',color:'#aa781e',cities:4,plain:5,plainRun:3,mountain:1},
{id:'nord',title:'Cap vers le Nord',from:'Copenhague',to:'Cap Nord',color:'#416546',cities:3,coast:3,chains:2},
{id:'atlantique',title:'De l’Atlantique aux Alpes',from:'Bordeaux',to:'Zurich',color:'#865b39',cities:3,coast:2,mountainRun:2,art:'atlantique-alpes.png'},
{id:'est',title:'Les routes de l’Est',from:'Berlin',to:'Bucarest',color:'#935836',cities:4,plain:4,mountain:2,art:'routes-est.png'},
{id:'balkans',title:'Le tour des Balkans',from:'Venise',to:'Thessalonique',color:'#287a80',cities:3,coast:3,mountainRun:2,art:'balkans.png'},
// Nouveaux voyages (15 octobre 2026). Sans illustration : une petite carte du trajet est dessinée à la place.
{id:'iberique',title:'La traversée ibérique',from:'Lisbonne',to:'Barcelone',color:'#b5652b',cities:2,plain:4,hills:2},
{id:'manche',title:'Par-delà la Manche',from:'Londres',to:'Bordeaux',color:'#3f6f8f',cities:3,plain:4,coast:2},
{id:'iles',title:'Des îles au continent',from:'Dublin',to:'Paris',color:'#3d7a4f',cities:4,plain:3,coast:1},
{id:'rhin',title:'Le long du Rhin',from:'Amsterdam',to:'Milan',color:'#6a5a8c',cities:2,hills:3,mountainRun:2},
{id:'danube',title:'Le fil du Danube',from:'Vienne',to:'Constanța',color:'#2f6f86',cities:3,hills:4,mountain:2,coast:1},
{id:'adriatique',title:'Les rives de l’Adriatique',from:'Venise',to:'Skopje',color:'#2a7f8f',cities:3,coast:3,mountain:2},
{id:'grece',title:'Vers la mer Égée',from:'Sofia',to:'Athènes',color:'#3b6fa8',cities:1,coast:3,mountain:1},
{id:'anatolie',title:'Les hauts plateaux d’Anatolie',from:'Izmir',to:'Trabzon',color:'#a4532f',cities:2,mountainRun:3,coast:1},
{id:'fjords',title:'La route des fjords',from:'Bergen',to:'Narvik',color:'#3c6475',cities:2,coastRun:4,mountain:1},
{id:'baltique',title:'Les rivages baltes',from:'Varsovie',to:'Saint-Pétersbourg',color:'#5a6f3a',cities:3,plainRun:4,coast:2},
{id:'riviera',title:'De la Provence à la lagune',from:'Marseille',to:'Venise',color:'#c0703a',cities:2,cols:1,coast:2},
{id:'carpates',title:'Au pied des Carpates',from:'Budapest',to:'Odessa',color:'#7a6a2e',cities:2,plainRun:3,mountainRun:2}
];
// Points d'aventure du voyage selon sa longueur (nombre de cases du trajet le plus court).
export const VOYAGE_TIERS=[{max:8,name:'Courte',points:6},{max:13,name:'Moyenne',points:9},{max:20,name:'Longue',points:12},{max:Infinity,name:'Très longue',points:15}];
export const VOYAGE_LENGTHS={traversee:27,soleil:14,alpes:13,campagne:11,nord:21,atlantique:11,est:16,balkans:12,iberique:11,manche:10,iles:9,rhin:9,danube:12,adriatique:10,grece:6,anatolie:9,fjords:15,baltique:12,riviera:8,carpates:10};
export const voyageTier=v=>{const id=typeof v==='string'?v:v?.id,len=VOYAGE_LENGTHS[id]||0;return VOYAGE_TIERS.find(t=>len<=t.max);};
export const voyagePoints=v=>voyageTier(v).points;
export function drawVoyages(rng=Math.random){const cards=[...voyages];for(let i=cards.length-1;i>0;i--){let j=Math.floor(rng()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}return cards.slice(0,3);}
export function progress(g){const v=voyages.find(v=>v.id===g.voyage);if(!v)return null;const history=g.travelHistory||(g.travel||[]).map(k=>({key:k,type:g.board[k]?.type,endpoint:g.board[k]?.id===0||g.board[k]?.id===g.arrivalId}));const first=new Map();for(const t of history)if(!first.has(t.key))first.set(t.key,t);const unique=[...first.values()];const count=type=>unique.filter(t=>t.type===type&&!t.endpoint).length;
let runs={montagne:0,cote:0,plaine:0},current=0,last='',seen=new Set(),chains=0,chainAwarded=false;
for(const {key:k,type} of history){if(type!==last){current=0;chainAwarded=false;}if(seen.has(k)){current=0;}else {current++;seen.add(k);}last=type;if(type in runs)runs[type]=Math.max(runs[type],current);if(type==='montagne'&&current>=2&&!chainAwarded){chains++;chainAwarded=true;}}
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
if(v.cols)add(v.cols===1?'Col mythique':'Cols mythiques',count('col'),v.cols);
if(g.mode==='plateau')for(const r of rows)r.label=r.label.replace('Tuiles','Cases').replace('Tuiles','Cases').replace('tuiles','cases').replace('Tuile','Case');return {v,rows,ready:rows.every(r=>r.done),won:!!g.voyageWon};}

// Fige le réseau de routes du plateau Europe dans dist/assets/europe/routes-data.js.
//  - grandes routes actuelles : celles que le jeu dessinait jusqu'ici entre les villes (board-roads.js, roadNetwork) ;
//  - routes ajoutées par Fi (capture « routes en rouge ») : tracées le long des VRAIES routes, étape par étape,
//    en passant par des villes repères (longitude, latitude) projetées sur le plateau.
// Les petits chemins vers les hameaux du décor ne sont PAS des routes : ils restent un décor.
// Usage (depuis la racine du dépôt) : node tools/routes/construire-routes.mjs
import {writeFileSync} from 'node:fs';
import {europeBoard,HEX_DIRECTIONS,HEX_SPACING} from '../../dist/europe.js';
import {roadNetwork} from '../../dist/board-roads.js';
import {makeProjection} from '../carte/projection.mjs';
import {PROJECTION,CITIES} from '../carte/geographie.mjs';

const proj=makeProjection(PROJECTION,n=>{const c=CITIES.find(c=>c.name===n);return [c.lon,c.lat];});

// Routes rouges. Chaque étape : nom d'une ville du plateau, ou [longitude, latitude, 'repère'].
export const RED_ROUTES=[
 {name:'Amsterdam → Berlin → Varsovie',via:['Amsterdam',[5.39,52.16,'Amersfoort'],[6.16,52.25,'Deventer'],[8.05,52.28,'Osnabrück'],[9.73,52.37,'Hanovre'],[10.52,52.27,'Brunswick'],[11.63,52.13,'Magdebourg'],'Berlin',[14.55,52.34,'Francfort-sur-l’Oder'],[16.93,52.41,'Poznań'],[18.25,52.22,'Konin'],[19.94,52.11,'Łowicz'],'Varsovie']},
 {name:'Paris → Prague → Lviv',via:['Paris',[4.03,49.26,'Reims'],[6.18,49.12,'Metz'],[7.00,49.23,'Sarrebruck'],[8.47,49.49,'Mannheim'],[11.08,49.45,'Nuremberg'],[13.38,49.75,'Plzeň'],'Prague',[16.61,49.19,'Brno'],[18.29,49.82,'Ostrava'],[19.02,50.26,'Katowice'],[19.94,50.06,'Cracovie'],[22.00,50.04,'Rzeszów'],[22.77,49.78,'Przemyśl'],'Lviv']},
 {name:'Vienne → Chișinău',via:['Vienne',[17.63,47.69,'Győr'],'Budapest',[21.63,47.53,'Debrecen'],[21.92,47.07,'Oradea'],[23.59,46.77,'Cluj'],[24.50,47.13,'Bistrița'],[25.36,47.35,'Vatra Dornei'],[26.25,47.65,'Suceava'],[27.60,47.16,'Iași'],'Chișinău']},
 {name:'Paris → Bordeaux',via:['Paris',[1.91,47.90,'Orléans'],[0.69,47.39,'Tours'],[0.34,46.58,'Poitiers'],[0.16,45.65,'Angoulême'],'Bordeaux']},
 {name:'Paris → Lyon',via:['Paris',[3.28,48.20,'Sens'],[3.57,47.80,'Auxerre'],[3.91,47.49,'Avallon'],[4.84,47.02,'Beaune'],[4.85,46.78,'Chalon-sur-Saône'],[4.83,46.31,'Mâcon'],'Lyon']},
 {name:'Milan → Ancona',via:['Milan',[9.69,45.05,'Plaisance'],[10.33,44.80,'Parme'],[11.34,44.49,'Bologne'],[12.57,44.06,'Rimini'],[12.91,43.91,'Pesaro'],'Ancona']},
 {name:'Madrid → Barcelone',via:['Madrid',[-3.17,40.63,'Guadalajara'],[-1.64,41.35,'Calatayud'],[-0.88,41.65,'Saragosse'],[0.62,41.62,'Lleida'],'Barcelone']},
 {name:'Oslo → Stockholm',via:['Oslo',[11.83,59.61,'Ørje'],[12.59,59.65,'Arvika'],[13.50,59.38,'Karlstad'],[15.21,59.27,'Örebro'],[16.54,59.61,'Västerås'],'Stockholm']},
 {name:'Stockholm → Narvik',via:['Stockholm',[17.64,59.86,'Uppsala'],[17.14,60.67,'Gävle'],[17.31,62.39,'Sundsvall'],[20.26,63.83,'Umeå'],[22.15,65.58,'Luleå'],[20.66,67.13,'Gällivare'],[20.23,67.86,'Kiruna'],[18.83,68.35,'Abisko'],'Narvik']},
 {name:'Cap Nord → Petrozavodsk',via:['Cap Nord',[24.96,70.05,'Lakselv'],[25.51,69.47,'Karasjok'],[27.03,68.91,'Inari'],[26.59,67.42,'Sodankylä'],[27.43,66.71,'Kemijärvi'],[29.18,65.97,'Kuusamo'],[31.18,65.20,'Kalevala'],[34.58,64.95,'Kem'],[34.31,63.74,'Segueja'],[34.45,62.91,'Medvejiegorsk'],'Petrozavodsk']}
];

const {board}=europeBoard('Paris','Istanbul');
const land=Object.values(board).filter(t=>t.type!=='mer');
const byAxial=new Map(land.map(t=>[`${t.q},${t.r}`,t]));
const edgeKey=(a,b)=>a<b?a+'|'+b:b+'|'+a;
const neighbours=t=>HEX_DIRECTIONS.map(([dq,dr])=>byAxial.get(`${t.q+dq},${t.r+dr}`)).filter(Boolean);

// 1. Grandes routes actuelles (sans les chemins des hameaux).
const current=roadNetwork(board).main,edges=new Set(current);

// 2. Routes rouges : plus court chemin entre deux repères, en restant près de la ligne droite entre eux
//    (comme la vraie route) ; le relief compte un peu, et on rejoint volontiers une route déjà tracée.
const RELIEF={plaine:0,ville:0,cote:.1,moyenne_montagne:.5,col:1,montagne:1.4};
const snap=([x,y])=>land.reduce((b,t)=>Math.hypot(t.x-x,t.y-y)<Math.hypot(b.x-x,b.y-y)?t:b);
const at=step=>typeof step==='string'?board['city-'+step]:snap(proj([step[0],step[1]]));
function segment(a,b){
 const ax=a.x,ay=a.y,dx=b.x-ax,dy=b.y-ay,l2=dx*dx+dy*dy||1;
 const off=t=>{const u=Math.max(0,Math.min(1,((t.x-ax)*dx+(t.y-ay)*dy)/l2));return Math.hypot(t.x-ax-u*dx,t.y-ay-u*dy)/HEX_SPACING;};
 const dist=new Map([[a.key,0]]),prev=new Map(),open=[[0,a.key]];
 while(open.length){open.sort((u,v)=>u[0]-v[0]);const [d,k]=open.shift();if(k===b.key)break;if(d>dist.get(k))continue;
  for(const n of neighbours(board[k])){const lateral=Math.max(0,off(n)-.8),step=(1+(RELIEF[n.type]??.5)+lateral*lateral*1.5)*(edges.has(edgeKey(k,n.key))?.85:1);
   const nd=d+step;if(nd<(dist.get(n.key)??Infinity)){dist.set(n.key,nd);prev.set(n.key,k);open.push([nd,n.key]);}}}
 const path=[b.key];while(path[0]!==a.key){const p=prev.get(path[0]);if(!p)throw Error(`Pas de chemin ${a.key} → ${b.key}`);path.unshift(p);}
 return path;
}
const named=[];
for(const route of RED_ROUTES){const stops=route.via.map(at),cells=[stops[0].key];
 for(let i=1;i<stops.length;i++){const part=segment(stops[i-1],stops[i]);cells.push(...part.slice(1));}
 for(let i=1;i<cells.length;i++)edges.add(edgeKey(cells[i-1],cells[i]));
 named.push({name:route.name,cells:cells.map(k=>[board[k].q,board[k].r])});}

// 3. Côtés de chaque case : direction i (HEX_DIRECTIONS) porte une route si l'arête vers ce voisin est une route.
const sides=new Map();
for(const e of edges){const [ka,kb]=e.split('|'),a=board[ka],b=board[kb];
 const i=HEX_DIRECTIONS.findIndex(([dq,dr])=>a.q+dq===b.q&&a.r+dr===b.r);if(i<0)throw Error('Arête entre cases non voisines : '+e);
 const add=(t,d)=>{const k=`${t.q},${t.r}`;sides.set(k,[...new Set([...(sides.get(k)||[]),d])].sort());};add(a,i);add(b,(i+3)%6);}
const cells=[...sides].map(([k,s])=>{const [q,r]=k.split(',').map(Number);return [q,r,s];}).sort((u,v)=>u[1]-v[1]||u[0]-v[0]);

const out=`// Réseau de routes JOUABLES du plateau Europe (généré par tools/routes/construire-routes.mjs, ne pas modifier à la main).
// Chaque case : [q, r, côtés]. Les côtés sont les directions de la grille qui portent une route :
//   0 = [1,0]  1 = [1,1]  2 = [0,1]  3 = [-1,0]  4 = [-1,-1]  5 = [0,-1]
// Un pas est « sur la route » quand le côté traversé porte une route des deux côtés.
// Contenu : les grandes routes entre villes (${current.size} tronçons) + les routes ajoutées par Fi (liste ROUTES_AJOUTEES).
// Les petits chemins vers les hameaux du décor ne sont pas des routes.
export const ROUTES_VERSION=1;
export const ROAD_CELLS=${JSON.stringify(cells)};
export const ROUTES_AJOUTEES=${JSON.stringify(named.map(r=>({name:r.name,cells:r.cells})))};
`;
writeFileSync(new URL('../../dist/assets/europe/routes-data.js',import.meta.url),out);
console.log(`${cells.length} cases avec route, ${edges.size} tronçons (dont ${current.size} anciens).`);
for(const r of named)console.log(` ${r.name} : ${r.cells.length} cases`);

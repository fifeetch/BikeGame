// Reconstruit le plateau Europe à partir de la VRAIE géographie, sur la grille d'hexagones existante.
//  - côtes : tracé réel (Natural Earth 1:50m, domaine public, paquet npm « world-atlas »)
//  - relief : grandes chaînes de montagnes et massifs, décrits ci-dessous en longitude/latitude
//  - villes : à leurs vraies coordonnées, posées sur la case la plus proche
// La grille (q, r, x, y), la taille des cases et les types de terrain du jeu ne changent pas.
// Usage : (dans un dossier où « world-atlas », « topojson-client » et « d3-geo » sont installés)
//   node construire-carte.mjs <board-data.js à réécrire> [etiquettes.json pour la peinture] [rivieres.json pour le décor]
import * as d3 from 'd3-geo';
import {feature} from 'topojson-client';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {makeProjection} from './projection.mjs';
import {PROJECTION,CITIES,FERRIES,STRAITS,LAKES,RANGES,RETOUCHES,SEA_LABELS,RIVERS} from './geographie.mjs';
const require=createRequire(import.meta.url);
const target=process.argv[2];if(!target)throw Error('Chemin de board-data.js manquant');
const src=readFileSync(target,'utf8'),head='export const MAP_CELLS=',i0=src.indexOf(head),j0=src.indexOf('];',i0)+1;
const cells=JSON.parse(src.slice(i0+head.length,j0)).map(({q,r,x,y})=>({q,r,x,y,type:'mer',name:''}));
const coordOf=n=>{const c=CITIES.find(c=>c.name===n);return [c.lon,c.lat];};
const proj=makeProjection(PROJECTION,coordOf);
const R=29/Math.sqrt(2)/Math.sqrt(3),EARTH=6371;

// ---------- Terre / mer ----------
const topo=JSON.parse(readFileSync(require.resolve('world-atlas/land-50m.json'),'utf8'));
const polys=feature(topo,topo.objects.land).features.flatMap(f=>f.geometry.type==='MultiPolygon'?f.geometry.coordinates.map(c=>({type:'Polygon',coordinates:c})):[f.geometry]).map(g=>({g,b:d3.geoBounds(g)}));
const inBox=([lon,lat],[[a,b],[c,d]])=>lat>=b-0.01&&lat<=d+0.01&&(a<=c?lon>=a-0.01&&lon<=c+0.01:lon>=a||lon<=c);
const isLand=p=>polys.some(({g,b})=>inBox(p,b)&&d3.geoContains(g,p));
const samples=[[0,0],...Array.from({length:6},(_,i)=>[.5*Math.cos(i*Math.PI/3),.5*Math.sin(i*Math.PI/3)]),...Array.from({length:12},(_,i)=>[.85*Math.cos(i*Math.PI/6+.26),.85*Math.sin(i*Math.PI/6+.26)])];
const lonlat=c=>proj.invert([c.x,c.y]);
for(const c of cells){let n=0;for(const [dx,dy]of samples)if(isLand(proj.invert([c.x+dx*R,c.y+dy*R])))n++;c.frac=n/samples.length;c.type=c.frac>=.45?'plaine':'mer';}

// Distance (km) entre un point et une ligne lon/lat (échantillonnée tous les ~5 km).
const km=(a,b)=>d3.geoDistance(a,b)*EARTH;
function lineDistance(p,line){let best=1e9;for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],n=Math.max(1,Math.ceil(km(a,b)/5)),interp=d3.geoInterpolate(a,b);for(let k=0;k<=n;k++){const d=km(p,interp(k/n));if(d<best)best=d;}}if(line.length===1)best=km(p,line[0]);return best;}

// Lacs (cercles) et détroits plus étroits qu'une case : forcés en mer.
for(const c of cells){const p=lonlat(c);if(LAKES.some(([lon,lat,rad])=>km(p,[lon,lat])<=rad))c.type='mer';}
// Détroit : chaîne continue de cases de mer le long de la ligne (une chaîne d'hexagones sépare toujours les deux rives).
const cellAt=(x,y)=>cells.reduce((b,c)=>{const d=Math.hypot(c.x-x,c.y-y);return d<b.d?{c,d}:b;},{c:null,d:1e9}).c;
for(const s of STRAITS)for(let i=1;i<s.line.length;i++){const a=s.line[i-1],b=s.line[i],n=Math.ceil(km(a,b)/8),interp=d3.geoInterpolate(a,b);for(let k=0;k<=n;k++){const [x,y]=proj(interp(k/n)),c=cellAt(x,y);c.type='mer';c.strait=true;}}
// ---------- Relief ----------
for(const c of cells){if(c.type==='mer')continue;const p=lonlat(c);let level=0;
 for(const r of RANGES){const d=lineDistance(p,r.line);if(d<=r.core)level=Math.max(level,2);else if(d<=r.hills)level=Math.max(level,1);}
 c.type=level===2?'montagne':level===1?'moyenne_montagne':'plaine';}

// ---------- Retouches à la main (bras de mer trop fins pour la grille, ex. Danemark) ----------
const cellQR=(q,r)=>cells.find(c=>c.q===q&&c.r===r);
for(const {q,r,type}of RETOUCHES){const c=cellQR(q,r);if(!c)throw Error('Retouche hors plateau '+q+','+r);c.type=type;}
// ---------- Villes ----------
const key=(q,r)=>`${q},${r}`,at=new Map(cells.map(c=>[key(c.q,c.r),c])),DIRS=[[1,0],[1,1],[0,1],[-1,0],[-1,-1],[0,-1]];
const near=c=>DIRS.map(([a,b])=>at.get(key(c.q+a,c.r+b))).filter(Boolean);
const seaSide=c=>near(c).some(n=>n.type==='mer');
const placed=[];const byNameEarly=n=>cells.find(c=>c.name===n);
// Masses de terre (avant les ferries) : un port « avec » une ville doit être sur la même terre qu'elle.
const comp=new Map();let cid=0;for(const c of cells){if(c.type==='mer'||comp.has(c))continue;cid++;const queue=[c];comp.set(c,cid);while(queue.length){const u=queue.shift();for(const n of near(u))if(n.type!=='mer'&&!comp.has(n)){comp.set(n,cid);queue.push(n);}}}
const nearestLand=(lon,lat)=>{const [x,y]=proj([lon,lat]);return cells.filter(c=>c.type!=='mer').reduce((b,c)=>{const d=Math.hypot(c.x-x,c.y-y);return d<b.d?{c,d}:b;},{c:null,d:1e9}).c;};
const coord=Object.fromEntries(CITIES.map(c=>[c.name,c]));
for(const city of CITIES){
 const [x,y]=proj([city.lon,city.lat]),land=city.with?comp.get(nearestLand(coord[city.with].lon,coord[city.with].lat)):null;
 const ok=c=>c.type!=='mer'&&!c.name&&(!city.port||seaSide(c))&&(!city.inland||!seaSide(c))&&(!land||comp.get(c)===land)&&(!city.cell||(c.q===city.cell[0]&&c.r===city.cell[1]));
 const cand=cells.filter(ok).map(c=>({c,d:Math.hypot(c.x-x,c.y-y)+(near(c).some(n=>n.name)?6:0)})).sort((a,b)=>a.d-b.d);
 if(!cand.length)throw Error('Aucune case pour '+city.name);
 const c=cand[0].c;c.name=city.name;c.type='ville';placed.push({name:city.name,q:c.q,r:c.r,shift:Math.round(Math.hypot(c.x-x,c.y-y)/20.5*100)/100});
}
// Côtes : case terrestre (hors ville et haute montagne) qui touche la mer.
for(const c of cells)if(c.type!=='mer'&&c.type!=='ville'&&c.type!=='montagne'&&seaSide(c))c.type='cote';

// ---------- Contrôles ----------
const byName=new Map(cells.filter(c=>c.name).map(c=>[c.name,c]));
for(const [a,b]of FERRIES){if(!byName.get(a)||!byName.get(b))throw Error('Port manquant '+a+'–'+b);}
const reach=start=>{const seen=new Set([start]),queue=[start];while(queue.length){const c=queue.shift();const next=[...near(c).filter(n=>n.type!=='mer')];for(const [a,b]of FERRIES){if(byName.get(a)===c)next.push(byName.get(b));if(byName.get(b)===c)next.push(byName.get(a));}for(const n of next)if(!seen.has(n)){seen.add(n);queue.push(n);}}return seen;};
const fromParis=reach(byName.get('Paris')),isolated=[...byName.values()].filter(c=>!fromParis.has(c)).map(c=>c.name);
const counts={};for(const c of cells)counts[c.type]=(counts[c.type]||0)+1;
const out=cells.map(({q,r,x,y,type,name})=>({q,r,x,y,type,name}));
writeFileSync(target,src.slice(0,i0)+head+JSON.stringify(out)+src.slice(j0));
// Noms des mers et fleuves projetés sur le plateau (pour la peinture et le décor).
const r1=v=>Math.round(v*10)/10;
if(process.argv[3])writeFileSync(process.argv[3],JSON.stringify(SEA_LABELS.map(([t,lon,lat,size,ang])=>{const [x,y]=proj([lon,lat]);return [t,r1(x),r1(y),size,ang];})));
if(process.argv[4])writeFileSync(process.argv[4],JSON.stringify(Object.fromEntries(Object.entries(RIVERS).map(([n,line])=>{const pts=[];for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],n=Math.max(1,Math.ceil(km(a,b)/25)),interp=d3.geoInterpolate(a,b);for(let k=i===1?0:1;k<=n;k++){const [x,y]=proj(interp(k/n));pts.push([r1(x),r1(y)]);}}return [n,pts];}))));
console.log(JSON.stringify({counts,isolated,placed:placed.filter(p=>p.shift>0.6)},null,0));

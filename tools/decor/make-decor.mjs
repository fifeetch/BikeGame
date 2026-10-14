// Génère dist/assets/europe/decor-data.js : calque de décor PUREMENT VISUEL
// (rivières, bosquets, petits lacs, hameaux). Ne change aucune règle et ne modifie pas board-data.js.
// Usage (depuis la racine du dépôt) : node tools/decor/make-decor.mjs
// Les fleuves viennent de tools/decor/rivieres.json, produit par tools/carte (npm run carte).
import {MAP_CELLS} from '../../dist/assets/europe/board-data.js';
import {writeFileSync,readFileSync} from 'node:fs';

const DIRS=[[1,0],[1,1],[0,1],[-1,0],[-1,-1],[0,-1]];
const at=new Map(MAP_CELLS.map(c=>[`${c.q},${c.r}`,c]));
const land=MAP_CELLS.filter(c=>c.type!=='mer');
const near=c=>DIRS.map(([dq,dr])=>at.get(`${c.q+dq},${c.r+dr}`)).filter(Boolean);
const seaSide=c=>near(c).some(n=>n.type==='mer');
// Petit générateur pseudo-aléatoire déterministe (même carte à chaque génération).
const hash=(q,r,s=0)=>{let h=(q*374761393+r*668265263+s*2147483647)>>>0;h=Math.imul(h^(h>>>13),1274126177)>>>0;return ((h^(h>>>16))>>>0)/4294967296;};
const r1=v=>Math.round(v*10)/10;
const cities=land.filter(c=>c.type==='ville');
const distCity=c=>Math.min(...cities.map(v=>Math.hypot(v.x-c.x,v.y-c.y)));

// ---------- Rivières : tracés réels projetés sur le plateau par tools/carte (rivieres.json) ----------
// Chaque point garde la case (q, r) la plus proche ; les points en mer sont retirés au dessin.
const nearestCell=(x,y)=>MAP_CELLS.reduce((b,c)=>{const d=(c.x-x)**2+(c.y-y)**2;return d<b.d?{c,d}:b;},{c:null,d:1e9}).c;
const riverLines=JSON.parse(readFileSync(new URL('./rivieres.json',import.meta.url),'utf8'));
const rivers=Object.entries(riverLines).map(([name,pts])=>({name,points:pts.map(([x,y])=>{const c=nearestCell(x,y);return [r1(x),r1(y),c.q,c.r];}).filter(([,,q,r])=>at.get(`${q},${r}`)?.type!=='mer')})).filter(r=>r.points.length>1);
const riverCells=new Set(rivers.flatMap(r=>r.points.map(p=>`${p[2]},${p[3]}`)));

// ---------- Bosquets, lacs, hameaux ----------
const forests=[],lakes=[],villages=[];
for(const c of land){
 if(c.type==='ville'||c.name)continue;
 const dc=distCity(c),h=hash(c.q,c.r,1),h2=hash(c.q,c.r,2);
 if(c.type==='plaine'&&h<.26&&dc>14){const n=3+Math.floor(h2*3);for(let i=0;i<n;i++){const a=hash(c.q,c.r,10+i)*Math.PI*2,d=2+hash(c.q,c.r,20+i)*6.5;forests.push([r1(c.x+Math.cos(a)*d),r1(c.y+Math.sin(a)*d),r1(2.1+hash(c.q,c.r,30+i)*1.4),hash(c.q,c.r,40+i)<.55?0:1,c.q,c.r]);}}
 else if(c.type==='moyenne_montagne'&&h<.16){for(let i=0;i<2;i++){const a=hash(c.q,c.r,10+i)*Math.PI*2,d=3+hash(c.q,c.r,20+i)*5;forests.push([r1(c.x+Math.cos(a)*d),r1(c.y+Math.sin(a)*d),r1(1.8+hash(c.q,c.r,30+i)),0,c.q,c.r]);}}
 else if(c.type==='cote'&&h<.12&&!seaSide(c)){const a=hash(c.q,c.r,10)*Math.PI*2;forests.push([r1(c.x+Math.cos(a)*4),r1(c.y+Math.sin(a)*4),2,1,c.q,c.r]);}
 if(c.type==='plaine'&&h>.965&&!riverCells.has(`${c.q},${c.r}`)&&!seaSide(c))lakes.push([r1(c.x+(h2-.5)*5),r1(c.y+(hash(c.q,c.r,5)-.5)*4),r1(3.2+h2*2.2),r1(2+hash(c.q,c.r,6)*1.4),Math.round(hash(c.q,c.r,8)*180),c.q,c.r]);
 if(['plaine','cote','moyenne_montagne'].includes(c.type)&&h>.86&&h<=.94&&dc>24){const a=hash(c.q,c.r,11)*Math.PI*2;villages.push([r1(c.x+Math.cos(a)*4),r1(c.y+Math.sin(a)*4),2+Math.floor(h2*2.5),c.q,c.r]);}
}

const body=`// Calque de décor PUREMENT VISUEL (rivières, bosquets, petits lacs, hameaux).
// Fichier généré par tools/decor/make-decor.mjs à partir de board-data.js — ne pas modifier à la main.
// Il ne change aucune règle : aucune case, aucun voisinage, aucun coût. Chaque élément garde la case (q, r)
// sur laquelle il est posé : si l'éditeur transforme cette case en mer, l'élément n'est pas dessiné.
// rivers : {name, points:[[x, y, q, r], ...]}
// forests : [x, y, taille, forme (0 = sapin, 1 = feuillu), q, r]
// lakes : [x, y, rayonX, rayonY, rotation, q, r]
// villages : [x, y, nombre de maisons, q, r]
export const DECOR_VERSION=1;
export const DECOR=${JSON.stringify({rivers,forests,lakes,villages})};
`;
writeFileSync(new URL('../../dist/assets/europe/decor-data.js',import.meta.url),body);
console.log(`rivières ${rivers.length} (${rivers.reduce((s,r)=>s+r.points.length,0)} points), arbres ${forests.length}, lacs ${lakes.length}, hameaux ${villages.length}, ${body.length} octets`);

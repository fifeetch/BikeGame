// Génère dist/assets/europe/decor-data.js : calque de décor PUREMENT VISUEL
// (rivières, bosquets, petits lacs, hameaux). Ne change aucune règle et ne modifie pas board-data.js.
// Usage (depuis la racine du dépôt) : node tools/decor/make-decor.mjs
import {MAP_CELLS} from '../../dist/assets/europe/board-data.js';
import {writeFileSync} from 'node:fs';

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

// ---------- Rivières : tracées de case terrestre en case terrestre (évitent la mer et les montagnes) ----------
const RIVERS={
 Danube:[[565,442],[625,442],[702,458],[774,476],[794,547],[870,548],[940,548],[1000,525]],
 Rhin:[[548,450],[522,402],[492,352],[462,325]],
 Seine:[[392,432],[353,423],[312,396]],
 Loire:[[402,474],[352,466],[292,456]],
 Rhône:[[505,470],[415,494],[418,548]],
 Garonne:[[310,532],[275,500],[255,474]],
 Elbe:[[662,418],[640,378],[602,330],[580,305]],
 Oder:[[722,412],[694,356],[684,302]],
 Vistule:[[772,440],[784,352],[772,300]],
 Pô:[[482,522],[560,522],[618,526]],
 Tage:[[205,600],[125,615],[62,616]],
 Èbre:[[212,548],[270,566],[300,576]],
 Dniepr:[[1002,322],[1009,423],[998,486],[992,522]]
};
const weight={plaine:1,ville:1.3,cote:2.2,moyenne_montagne:3,montagne:9,col:7};
const nearestLand=([x,y],filter=()=>true)=>land.filter(filter).reduce((b,c)=>{const d=Math.hypot(c.x-x,c.y-y);return d<b.d?{c,d}:b;},{c:null,d:1e9}).c;
function path(a,b){
 const dist=new Map([[a,0]]),prev=new Map(),open=[a];
 while(open.length){open.sort((u,v)=>dist.get(u)-dist.get(v));const u=open.shift();if(u===b)break;
  for(const v of near(u)){if(v.type==='mer')continue;const d=dist.get(u)+(weight[v.type]||1)*(1+hash(v.q,v.r,7)*.35);if(d<(dist.get(v)??1e9)){dist.set(v,d);prev.set(v,u);if(!open.includes(v))open.push(v);}}}
 const out=[b];while(out[0]!==a){const p=prev.get(out[0]);if(!p)return [a,b];out.unshift(p);}return out;
}
const rivers=[];
for(const [name,anchors]of Object.entries(RIVERS)){
 const cells=anchors.map((p,i)=>i===anchors.length-1?nearestLand(p,seaSide):nearestLand(p));
 let chain=[cells[0]];for(let i=1;i<cells.length;i++)chain.push(...path(cells[i-1],cells[i]).slice(1));
 chain=chain.filter((c,i)=>chain.indexOf(c)===i);
 // Décalage léger hors du centre des cases (les jetons et les numéros y sont posés).
 const points=chain.map(c=>{const a=hash(c.q,c.r,3)*Math.PI*2,d=3+hash(c.q,c.r,4)*3;return [r1(c.x+Math.cos(a)*d),r1(c.y+Math.sin(a)*d),c.q,c.r];});
 // Embouchure : on prolonge vers la mer voisine la plus proche.
 const last=chain.at(-1),sea=near(last).filter(n=>n.type==='mer').sort((u,v)=>Math.hypot(u.x-last.x,u.y-last.y)-Math.hypot(v.x-last.x,v.y-last.y))[0];
 if(sea)points.push([r1((last.x+sea.x)/2),r1((last.y+sea.y)/2),last.q,last.r]);
 rivers.push({name,points});
}
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

// Corrections géographiques du plateau Europe (octobre 2026), demandées par Fi.
// Ce script modifie dist/assets/europe/board-data.js. Il est rejouable : il part de l'état actuel du fichier.
//  1. Les ports des ferries deviennent de vraies villes portuaires (type « ville ») :
//     Calais–Douvres, Helsingør–Helsingborg, Hirtshals–Kristiansand, Ancona–Split, Thessalonique–Izmir.
//  3. Deux noms de villes abîmés sont réparés : « Saint-Pétersbourg » et « Athènes ».
//  2. Le bord est de la carte (Russie, Caucase, Anatolie) redevient de la terre ; la mer de Barents (nord)
//     et la Méditerranée (sud) sont gardées, la mer Noire devient une mer fermée.
// (Les 4 zones de mer de la Manche, du golfe du Lion, de la mer Tyrrhénienne et de l'Adriatique ont été
//  corrigées juste avant à partir de la capture annotée : 28 cases passées en mer.)
// Usage : node tools/carte/corrections-carte.mjs
import {readFileSync,writeFileSync} from 'node:fs';
const file=new URL('../../dist/assets/europe/board-data.js',import.meta.url);
const src=readFileSync(file,'utf8'),head='export const MAP_CELLS=',i=src.indexOf(head),j=src.indexOf('];',i)+1;
const cells=JSON.parse(src.slice(i+head.length,j)),at=new Map(cells.map(c=>[`${c.q},${c.r}`,c]));
const DIRS=[[1,0],[1,1],[0,1],[-1,0],[-1,-1],[0,-1]];
const near=c=>DIRS.map(([a,b])=>at.get(`${c.q+a},${c.r+b}`)).filter(Boolean);
const hash=(q,r,s=0)=>{let h=(q*374761393+r*668265263+s*2147483647)>>>0;h=Math.imul(h^(h>>>13),1274126177)>>>0;return ((h^(h>>>16))>>>0)/4294967296;};

// ---- 2. Bord est ----
let east=0;
for(const c of cells){
 if(c.type!=='mer'||c.r<5||c.r>37||c.x<1060)continue;
 const blackSea=(c.r>=27&&c.r<=31&&c.x<1215)||(c.r>=27&&c.q<=37);
 if(blackSea)continue;
 const h=hash(c.q,c.r,11);
 if(c.r>=22&&c.r<=33&&c.x>=1150)c.type=h<.35?'montagne':'moyenne_montagne';// Caucase
 else if(c.r>=32)c.type=h<.55?'moyenne_montagne':'plaine';// Anatolie
 else c.type=h<.3?'moyenne_montagne':'plaine';// Russie
 c.converted=true;east++;
}
// Les nouvelles terres qui bordent encore la mer deviennent des côtes (sauf les montagnes).
for(const c of cells)if(c.converted){if(c.type!=='montagne'&&near(c).some(n=>n.type==='mer'))c.type='cote';delete c.converted;}

// ---- 1. Ports ----
const PORTS={Douvres:[-8,16],Calais:[-4,17],Hirtshals:[1,12],Kristiansand:[1,10],'Helsingør':[5,14],Helsingborg:[5,10],Ancona:[15,30],Split:[20,31],Izmir:[38,37]};
for(const [name,[q,r]]of Object.entries(PORTS)){
 const c=at.get(`${q},${r}`);if(!c)throw Error(`Case ${q},${r} absente`);if(c.type==='mer')throw Error(`${name} : la case ${q},${r} est en mer`);
 if(!near(c).some(n=>n.type==='mer'))throw Error(`${name} : la case ${q},${r} ne touche pas la mer`);
 if(c.name&&c.name!==name)throw Error(`${name} : la case porte déjà ${c.name}`);c.type='ville';c.name=name;
}
for(const c of cells){if(c.name==='Saint-PÃ©tersbourg')c.name='Saint-Pétersbourg';if(c.name==='nes')c.name='Athènes';}
writeFileSync(file,src.slice(0,i)+head+JSON.stringify(cells)+src.slice(j));
console.log(`Bord est : ${east} cases de mer passées en terre. Ports : ${Object.keys(PORTS).join(', ')}.`);

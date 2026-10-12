export const voyages=[
{id:'traversee',title:'La grande traversée',from:'Paris',to:'Istanbul',color:'#ba4d2a',cities:5,mountainRun:3,coast:2},
{id:'soleil',title:'La route du soleil',from:'Barcelone',to:'Rome',color:'#287a80',cities:3,coast:4,coastRun:3,plain:2},
{id:'alpes',title:'Au-delà des Alpes',from:'Lyon',to:'Vienne',color:'#345a74',cities:2,mountainRun:4,plain:3},
{id:'campagne',title:'Les chemins de campagne',from:'Amsterdam',to:'Prague',color:'#aa781e',cities:4,plain:5,plainRun:3,mountain:1},
{id:'nord',title:'Cap vers le Nord',from:'Copenhague',to:'Cap Nord',color:'#416546',cities:3,coast:3,chains:2}
];
export function drawVoyages(rng=Math.random){const cards=[...voyages];for(let i=cards.length-1;i>0;i--){let j=Math.floor(rng()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}return cards.slice(0,3);}
export function progress(g){const v=voyages.find(v=>v.id===g.voyage);if(!v)return null;const unique=[...new Set(g.travel||[])].map(k=>g.board[k]).filter(Boolean);const count=type=>unique.filter(t=>t.type===type&&t.id!==g.arrivalId&&t.id!==0).length;
let runs={montagne:0,cote:0,plaine:0},current=0,last='',seen=new Set(),chains=0,chainAwarded=false;
for(const k of g.travel||[]){const type=g.board[k]?.type;if(type!==last){current=0;chainAwarded=false;}if(seen.has(k)){current=0;}else {current++;seen.add(k);}last=type;if(type in runs)runs[type]=Math.max(runs[type],current);if(type==='montagne'&&current>=2&&!chainAwarded){chains++;chainAwarded=true;}}
const rows=[];const add=(label,value,target)=>rows.push({label,value:Math.min(value,target),target,done:value>=target});
add('Villes intermédiaires',count('ville'),v.cities);
if(v.mountainRun)add('Montagnes consécutives',runs.montagne,v.mountainRun);
if(v.coast)add('Tuiles côtières',count('cote'),v.coast);
if(v.coastRun)add('Côtes consécutives',runs.cote,v.coastRun);
if(v.plain)add('Tuiles plaine',count('plaine'),v.plain);
if(v.plainRun)add('Plaines consécutives',runs.plaine,v.plainRun);
if(v.mountain)add('Tuile montagne',count('montagne'),v.mountain);
if(v.chains)add('Chaînes distinctes de 2 montagnes',chains,v.chains);
return {v,rows,ready:rows.every(r=>r.done),won:!!g.voyageWon};}

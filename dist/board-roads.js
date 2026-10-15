// Routes et ferries dessinés (étape 5).
// Depuis l'étape « routes qui comptent », les grandes routes JOUABLES sont figées dans assets/europe/routes-data.js
// (voir routes.js) : roadNetwork ne sert plus qu'à les générer (tools/routes) et à tracer les petits chemins du décor.
// Les routes suivent uniquement les liaisons qui existent déjà entre cases voisines : elles illustrent
// le voisinage actuel et ne créent aucun chemin. Le joueur reste libre de passer par n'importe quelle case.
//  - grandes routes : entre villes proches, par le passage le plus facile (on évite collines et montagnes) ;
//  - chemins : petites routes qui relient les hameaux du décor au réseau (visibles seulement de près).

const COST={plaine:1,ville:1,cote:1.25,moyenne_montagne:2.2,col:3,montagne:4.5};
const hash=(q,r,s=0)=>{let h=(q*374761393+r*668265263+s*2147483647)>>>0;h=Math.imul(h^(h>>>13),1274126177)>>>0;return ((h^(h>>>16))>>>0)/4294967296;};
const isNeighbour=(a,b)=>{const dq=b.q-a.q,dr=b.r-a.r;return (Math.abs(dq)<=1&&Math.abs(dr)<=1&&dq!==-dr)||false;};

// Petite file de priorité (tas binaire).
function heap(){const a=[];return {get size(){return a.length;},push(n,p){a.push([p,n]);let i=a.length-1;while(i){const j=(i-1)>>1;if(a[j][0]<=a[i][0])break;[a[i],a[j]]=[a[j],a[i]];i=j;}},pop(){const top=a[0],last=a.pop();if(a.length){a[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<a.length&&a[l][0]<a[m][0])m=l;if(r<a.length&&a[r][0]<a[m][0])m=r;if(m===i)break;[a[i],a[m]]=[a[m],a[i]];i=m;}}return top[1];}};}

function landGraph(board){
 const nodes=Object.values(board).filter(t=>t.type!=='mer'),adj=new Map();
 for(const t of nodes)adj.set(t.key,(t.links||[]).map(k=>board[k]).filter(n=>n&&n.type!=='mer'&&isNeighbour(t,n)));
 return {nodes,adj};
}
function shortest(board,adj,from){
 const dist=new Map([[from,0]]),prev=new Map(),open=heap();open.push(from,0);
 while(open.size){const u=open.pop(),du=dist.get(u);
  for(const v of adj.get(u)||[]){const d=du+(COST[v.type]??1.5)*(1+hash(v.q,v.r,5)*.15);if(d<(dist.get(v.key)??Infinity)){dist.set(v.key,d);prev.set(v.key,u);open.push(v.key,d);}}}
 return {dist,prev};
}
const trace=(prev,from,to)=>{const out=[to];while(out[0]!==from){const p=prev.get(out[0]);if(!p)return null;out.unshift(p);}return out;};
const edgeKey=(a,b)=>a<b?a+'|'+b:b+'|'+a;

// Réseau : ensembles d'arêtes (paires de cases voisines) pour les grandes routes et les chemins.
export function roadNetwork(board,{villages=[],main:fixed=null}={}){
 const {nodes,adj}=landGraph(board),byAxial=new Map(nodes.map(t=>[`${t.q},${t.r}`,t]));
 const cities=fixed?[]:nodes.filter(t=>t.name&&t.type==='ville'),main=new Set(fixed||[]),minor=new Set();// main fourni : réseau figé
 // Paires de villes : chaque ville vers ses 3 voisines les plus proches (à vol d'oiseau, pas trop loin).
 const pairs=new Set();
 for(const a of cities){const near=cities.filter(b=>b!==a).map(b=>[b,Math.hypot(b.x-a.x,b.y-a.y)]).sort((u,v)=>u[1]-v[1]);
  near.slice(0,3).forEach(([b,d],i)=>{if(i===0||d<190)pairs.add(edgeKey(a.key,b.key));});}
 const trees=new Map();
 for(const a of cities)trees.set(a.key,shortest(board,adj,a.key));
 for(const pair of pairs){const [a,b]=pair.split('|'),{prev,dist}=trees.get(a);
  // On ne trace pas un détour absurde (ex. deux villes séparées par la mer).
  const straight=Math.hypot(board[a].x-board[b].x,board[a].y-board[b].y)/20.5;if(!(dist.get(b)<straight*3.2+4))continue;
  const path=trace(prev,a,b);if(path)for(let i=1;i<path.length;i++)main.add(edgeKey(path[i-1],path[i]));}
 // Chemins : chaque hameau du décor rejoint la case de route la plus proche (5 cases au plus).
 const onRoad=new Set([...main].flatMap(e=>e.split('|')));
 for(const [q,r]of villages){const start=byAxial.get(`${q},${r}`);if(!start||onRoad.has(start.key))continue;
  const seen=new Map([[start.key,null]]);let frontier=[start.key],found=null;
  for(let depth=0;depth<5&&!found&&frontier.length;depth++){const next=[];for(const k of frontier){for(const n of adj.get(k)||[]){if(seen.has(n.key))continue;seen.set(n.key,k);if(onRoad.has(n.key)){found=n.key;break;}if(n.type!=='montagne')next.push(n.key);}if(found)break;}frontier=next;}
  if(found){let k=found;while(seen.get(k)){const p=seen.get(k);if(!main.has(edgeKey(k,p)))minor.add(edgeKey(k,p));k=p;}}
 }
 return {main,minor};
}

// Découpe un ensemble d'arêtes en tracés continus (de carrefour en carrefour) pour un dessin propre.
export function chains(edges){
 const adj=new Map();for(const e of edges){const [a,b]=e.split('|');(adj.get(a)||adj.set(a,[]).get(a)).push(b);(adj.get(b)||adj.set(b,[]).get(b)).push(a);}
 const used=new Set(),out=[];
 const walk=(a,b)=>{const line=[a,b];used.add(edgeKey(a,b));let prev=a,cur=b;
  while((adj.get(cur)||[]).length===2){const nx=adj.get(cur).find(n=>n!==prev);if(!nx||used.has(edgeKey(cur,nx)))break;used.add(edgeKey(cur,nx));line.push(nx);prev=cur;cur=nx;}return line;};
 for(const [k,ns]of adj)if(ns.length!==2)for(const n of ns)if(!used.has(edgeKey(k,n)))out.push(walk(k,n));
 for(const [k,ns]of adj)for(const n of ns)if(!used.has(edgeKey(k,n)))out.push(walk(k,n));// boucles fermées
 return out;
}

// Tracé légèrement sinueux : un point intermédiaire décalé entre deux cases, puis courbe lissée.
export function sinuousPath(board,keys,{wobble=2.4}={}){
 const pts=[];
 keys.forEach((k,i)=>{const t=board[k];if(!t)return;
  const jitter=t.name?0:1.6,ang=hash(t.q,t.r,9)*Math.PI*2;pts.push([t.x+Math.cos(ang)*jitter,t.y+Math.sin(ang)*jitter]);
  const n=board[keys[i+1]];if(!n)return;
  const mx=(t.x+n.x)/2,my=(t.y+n.y)/2,dx=n.x-t.x,dy=n.y-t.y,l=Math.hypot(dx,dy)||1,side=(hash(t.q+n.q,t.r+n.r,4)-.5)*2*wobble;
  pts.push([mx-dy/l*side,my+dx/l*side]);});
 return smooth(pts);
}
export function smooth(pts){
 if(pts.length<2)return '';
 const f=v=>Math.round(v*10)/10;let d=`M${f(pts[0][0])} ${f(pts[0][1])}`;
 for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
  d+=`C${f(p1[0]+(p2[0]-p0[0])/6)} ${f(p1[1]+(p2[1]-p0[1])/6)} ${f(p2[0]-(p3[0]-p1[0])/6)} ${f(p2[1]-(p3[1]-p1[1])/6)} ${f(p2[0])} ${f(p2[1])}`;}
 return d;
}

// Ferries : arc en mer entre les deux ports, et point milieu (pour le bateau).
export function ferryArc(a,b){
 const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,bend=Math.min(34,l*.22);
 const cx=mx-dy/l*bend,cy=my+dx/l*bend,f=v=>Math.round(v*10)/10;
 return {d:`M${f(a.x)} ${f(a.y)}Q${f(cx)} ${f(cy)} ${f(b.x)} ${f(b.y)}`,mid:{x:(a.x+2*cx+b.x)/4,y:(a.y+2*cy+b.y)/4},point:t=>({x:(1-t)*(1-t)*a.x+2*(1-t)*t*cx+t*t*b.x,y:(1-t)*(1-t)*a.y+2*(1-t)*t*cy+t*t*b.y})};
}

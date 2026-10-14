// Redessin « en direct » des cases modifiées dans l'éditeur (ou venant d'une carte personnalisée).
// Le fond fabriqué à l'avance (europe-terrain.webp) correspond à l'Europe d'origine. Dès qu'une case change de type,
// on passe sur : le sol peint SANS motifs (europe-ground.webp) + un calque dessiné par le navigateur avec
//   - des morceaux de sol du bon type (plaine, colline, montagne, mer plus ou moins profonde) sur les cases changées,
//   - les motifs (arbres, collines, montagnes, maisons) de TOUTES les cases, tirés de la planche patches.webp.
// Les règles du jeu et les types de terrain ne sont jamais touchés : ceci ne fait que dessiner.
import {MAP_CELLS} from './assets/europe/board-data.js';
import {CELL_PATCHES,GROUND_PATCHES,PATCH_SCALE} from './terrain-patches.js';
import {MAP_WIDTH,MAP_HEIGHT} from './europe.js';

export const GROUND_SRC='./assets/terrain/europe-ground.webp';
export const PATCHES_SRC='./assets/terrain/patches.webp';
const DIRS=[[1,0],[1,1],[0,1],[-1,0],[-1,-1],[0,-1]];
const baked=new Map(MAP_CELLS.map(c=>[`${c.q},${c.r}`,c.type]));
// Cases d'origine qui ont des motifs, rangées par type : elles servent de modèles quand une case change de type.
const models={};
for(const [key,type] of baked)if(CELL_PATCHES[key])(models[type]??=[]).push(key);
export const groundGroup=(type,depth=0)=>type==='mer'?`mer${depth<=2?0:depth<=5?1:2}`:type==='moyenne_montagne'?'colline':type==='montagne'||type==='col'?'montagne':'plaine';
const hash=(q,r)=>(((q*73856093)^(r*19349663))>>>0);
const pickFrom=(list,t,salt=0)=>list?.length?list[(hash(t.q,t.r)+salt)%list.length]:undefined;

// Plan de dessin (sans canvas, donc testable) : quels morceaux de sol, quels motifs, dans quel ordre.
export function planDynamic(nodes){
 const byPos=new Map(nodes.map(t=>[`${t.q},${t.r}`,t]));
 // profondeur de mer = nombre de cases jusqu'à la terre la plus proche
 const depth=new Map();let frontier=[];
 for(const t of nodes)if(t.type!=='mer'){depth.set(`${t.q},${t.r}`,0);frontier.push(t);}
 while(frontier.length){const next=[];for(const t of frontier){const d=depth.get(`${t.q},${t.r}`);for(const [a,b] of DIRS){const k=`${t.q+a},${t.r+b}`,n=byPos.get(k);if(n&&!depth.has(k)){depth.set(k,d+1);next.push(n);}}}frontier=next;}
 const ground=[],motifs=[];
 for(const t of nodes){
  const key=`${t.q},${t.r}`,was=baked.get(key),stale=was!==t.type;
  if(stale){
   const d=depth.get(key)??9;
   let group=groundGroup(t.type,d),pass=0;
   if(t.type==='mer'){
    const landSides=DIRS.filter(([a,b])=>{const n=byPos.get(`${t.q+a},${t.r+b}`);return n&&n.type!=='mer';}).length;
    if(landSides>=4)group='lac';
   }
   if(group==='lac'){
    const rim=GROUND_PATCHES.lacRim,water=GROUND_PATCHES.lacWater,i=hash(t.q,t.r)%(rim?.length||1);
    if(rim&&water){ground.push({t,rect:rim[i],pass:1});ground.push({t,rect:water[i],pass:2});}
   }else if(group!==groundGroup(was,d)||t.type==='mer'||was==='mer'){
    const list=GROUND_PATCHES[group];
    if(list?.length)ground.push({t,rect:list[hash(t.q,t.r)%list.length],pass:0});
   }
   const type=t.type==='col'?'montagne':t.type,model=pickFrom(models[type],t,7);
   if(model)motifs.push({t,rect:CELL_PATCHES[model],snow:t.type==='col'});
  }else if(CELL_PATCHES[key])motifs.push({t,rect:CELL_PATCHES[key],snow:false});
 }

 // rivages : un côté de terre qui touche la mer reçoit une bande de sable et d'eau claire, si l'un des deux a changé
 if(GROUND_PATCHES.shore?.length===6)for(const t of nodes){
  if(t.type==='mer')continue;const tStale=baked.get(`${t.q},${t.r}`)!==t.type;
  DIRS.forEach(([a,b],i)=>{const n=byPos.get(`${t.q+a},${t.r+b}`);if(n?.type==='mer'&&(tStale||baked.get(`${n.q},${n.r}`)!=='mer'))ground.push({t,rect:GROUND_PATCHES.shore[i],pass:3});});
 }
 ground.sort((a,b)=>a.pass-b.pass);
 motifs.sort((a,b)=>a.t.y-b.t.y||a.t.x-b.t.x);
 return {ground,motifs};
}
export const staleCount=nodes=>{let n=0;for(const t of nodes)if(baked.get(`${t.q},${t.r}`)!==t.type)n++;return n;};

// Couche DOM : une image de sol + un canvas. Les ressources ne sont chargées qu'à la première modification.
export function createDynamicLayer(container){
 const doc=container?.ownerDocument;
 if(!doc||typeof doc.createElement!=='function')return null;
 let state='idle',groundImg=null,atlas=null,canvas=null,ctx=null,signature='';const listeners=new Set();
 const start=()=>{
  if(state!=='idle')return;state='loading';
  try{
   groundImg=doc.createElement('img');atlas=doc.createElement('img');
   groundImg.className='terrain-art terrain-ground';groundImg.alt='';groundImg.draggable=false;groundImg.setAttribute('aria-hidden','true');groundImg.hidden=true;
   canvas=doc.createElement('canvas');canvas.className='terrain-art terrain-dyn';canvas.setAttribute('aria-hidden','true');canvas.hidden=true;
   canvas.width=Math.round(MAP_WIDTH*PATCH_SCALE);canvas.height=Math.round(MAP_HEIGHT*PATCH_SCALE);
   ctx=canvas.getContext?.('2d');if(!ctx)throw Error('canvas indisponible');
   let loaded=0;const done=()=>{if(++loaded===2){state='ready';listeners.forEach(fn=>fn());}};
   const fail=()=>{state='failed';listeners.forEach(fn=>fn());};
   for(const im of [groundImg,atlas]){im.addEventListener?.('load',done);im.addEventListener?.('error',fail);}
   groundImg.src=GROUND_SRC;atlas.src=PATCHES_SRC;
   container.append(groundImg,canvas);
  }catch{state='failed';}
 };
 const paint=nodes=>{
  const sig=nodes.filter(t=>baked.get(`${t.q},${t.r}`)!==t.type).map(t=>`${t.q},${t.r}:${t.type}`).join('|');
  if(sig===signature)return;signature=sig;
  const plan=planDynamic(nodes),k=PATCH_SCALE;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const draw=({t,rect:[sx,sy,sw,sh,ox,oy,wu,hu]})=>ctx.drawImage(atlas,sx,sy,sw,sh,(t.x+ox)*k,(t.y+oy)*k,wu*k,hu*k);
  for(const g of plan.ground)draw(g);
  for(const m of plan.motifs){
   if(m.snow){ctx.filter='brightness(1.32) saturate(.35)';draw(m);ctx.filter='none';}else draw(m);
  }
 };
 return {
  // Renvoie true quand le dessin en direct est prêt ET nécessaire (au moins une case modifiée).
  sync(nodes,enabled){
   const needed=enabled&&staleCount(nodes)>0;
   if(needed)start();
   const active=needed&&state==='ready';
   if(active)paint(nodes);
   if(groundImg){groundImg.hidden=!active;canvas.hidden=!active;}
   return active;
  },
  get state(){return state;},
  onChange(fn){listeners.add(fn);},
  destroy(){groundImg?.remove();canvas?.remove();listeners.clear();}
 };
}

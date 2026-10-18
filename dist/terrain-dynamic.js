// Redessin « en direct » des cases modifiées dans l'éditeur (ou venant d'une carte personnalisée).
// Le fond fabriqué à l'avance (europe-terrain.webp) correspond à l'Europe d'origine. Dès qu'une case change de type
// (ou reçoit une variante d'apparence), on passe sur : le sol peint SANS motifs (europe-ground.webp) + un calque
// dessiné par le navigateur avec
//   - des morceaux de sol du bon type/variante sur les cases changées, des lacs, des bandes de rivage,
//   - les motifs (arbres, collines, montagnes, maisons…) de TOUTES les cases, tirés de la planche patches.webp.
// Les règles du jeu et les types de terrain ne sont jamais touchés : ceci ne fait que dessiner.
import {MAP_CELLS} from './assets/europe/board-data.js';
import {CELL_PATCHES,GROUND_PATCHES,MOTIF_PATCHES,PATCH_SCALE} from './terrain-patches.js';
import {MAP_WIDTH,MAP_HEIGHT,NAMED_COLS} from './europe.js';
import {validVariant} from './terrain-variants.js';

export const GROUND_SRC='./assets/terrain/europe-ground.webp';
export const PATCHES_SRC='./assets/terrain/patches.webp';
const DIRS=[[1,0],[1,1],[0,1],[-1,0],[-1,-1],[0,-1]];
const baked=new Map(MAP_CELLS.map(c=>[`${c.q},${c.r}`,c.type]));
for(const c of NAMED_COLS)if(baked.has(`${c.q},${c.r}`))baked.set(`${c.q},${c.r}`,'col');
// Cases changées APRÈS la peinture (18 octobre, demande de Fi : nouvelles villes, Lille déplacée) : ce que l'image montre encore.
export const PAINTED_BEFORE={'1,25':'ville','1,26':'plaine','-4,28':'cote','11,6':'cote','41,31':'cote','43,36':'cote','45,40':'cote','45,34':'plaine','49,42':'plaine'};
for(const [k,type] of Object.entries(PAINTED_BEFORE))baked.set(k,type);
// Cases d'origine qui ont des motifs, rangées par type : elles servent de modèles quand une case change de type.
const models={};
for(const [key,type] of baked)if(CELL_PATCHES[key])(models[type]??=[]).push(key);
const seaBin=depth=>depth<=2?0:depth<=5?1:2;
export const groundGroup=(type,depth=0)=>type==='mer'?`mer${seaBin(depth)}`:type==='moyenne_montagne'?'colline':type==='montagne'||type==='col'?'montagne':type==='cote'?'cote:verte':'plaine';
const hash=(q,r)=>(((q*73856093)^(r*19349663))>>>0);
const pick=(list,t,salt=0)=>list?.length?list[(hash(t.q,t.r)+salt)%list.length]:undefined;
export const variantOf=t=>validVariant(t.type,t.variant)?t.variant:'';
const isStale=t=>baked.get(`${t.q},${t.r}`)!==t.type||Boolean(variantOf(t));

// Quels dessins pour une case (type + variante) ? Partagé par la carte et par l'aperçu de l'éditeur.
// info : {depth, landSides, was} (was = type d'origine de la case, '' pour un aperçu)
export function stylesFor(t,info={}){
 const v=variantOf(t),{depth=9,landSides=0,was=''}=info,ground=[];let motif;
 if(t.type==='mer'){
  const lac=v==='lac'||(!v&&landSides>=4),group=lac?'lac':v==='profonde'?'mer2':v==='cotiere'?'mer0':`mer${seaBin(depth)}`;
  if(lac){const rim=GROUND_PATCHES.lacRim,water=GROUND_PATCHES.lacWater,i=hash(t.q,t.r)%(rim?.length||1);if(rim&&water){ground.push({rect:rim[i],pass:1},{rect:water[i],pass:2});}}
  else if(GROUND_PATCHES[group]?.length)ground.push({rect:pick(GROUND_PATCHES[group],t),pass:0});
  return {ground,motif};
 }
 const key=v?`${t.type}:${v}`:groundGroup(t.type),wasKey=was?groundGroup(was,depth):'';
 // Nouvelle ville posée sur une case peinte (18 octobre) : on garde le sol peint (côte, plaine) et on pose seulement les maisons.
 const keepGround=!v&&t.type==='ville'&&was&&was!=='ville'&&was!=='mer';
 if(!keepGround&&(v||key!==wasKey)){const list=GROUND_PATCHES[key]||GROUND_PATCHES[groundGroup(t.type)];if(list?.length)ground.push({rect:pick(list,t),pass:0});}
 const mlist=v&&MOTIF_PATCHES[`${t.type}:${v}`];
 if(mlist?.length)motif=pick(mlist,t,3);
 else{const model=pick(models[t.type==='col'?'montagne':t.type],t,7);if(model)motif=CELL_PATCHES[model];}
 return {ground,motif};
}

// Plan de dessin (sans canvas, donc testable) : quels morceaux de sol, quels motifs, dans quel ordre.
export function planDynamic(nodes){
 const byPos=new Map(nodes.map(t=>[`${t.q},${t.r}`,t]));
 // profondeur de mer = nombre de cases jusqu'à la terre la plus proche
 const depth=new Map();let frontier=[];
 for(const t of nodes)if(t.type!=='mer'){depth.set(`${t.q},${t.r}`,0);frontier.push(t);}
 while(frontier.length){const next=[];for(const t of frontier){const d=depth.get(`${t.q},${t.r}`);for(const [a,b] of DIRS){const k=`${t.q+a},${t.r+b}`,n=byPos.get(k);if(n&&!depth.has(k)){depth.set(k,d+1);next.push(n);}}}frontier=next;}
 const ground=[],motifs=[];
 for(const t of nodes){
  const key=`${t.q},${t.r}`,was=baked.get(key);
  if(isStale(t)){
   const landSides=t.type==='mer'?DIRS.filter(([a,b])=>{const n=byPos.get(`${t.q+a},${t.r+b}`);return n&&n.type!=='mer';}).length:0;
   const st=stylesFor(t,{depth:depth.get(key)??9,landSides,was});
   for(const g of st.ground)ground.push({t,rect:g.rect,pass:g.pass});
   if(st.motif)motifs.push({t,rect:st.motif,snow:t.type==='col'});
  }else if(CELL_PATCHES[key])motifs.push({t,rect:CELL_PATCHES[key],snow:false});
 }
 // rivages : un côté de terre qui touche la mer reçoit une bande de sable (ou de falaise) et d'eau claire, si l'un des deux a changé
 if(GROUND_PATCHES.shore?.length===6)for(const t of nodes){
  if(t.type==='mer')continue;const tStale=isStale(t);
  const bands=t.type==='cote'&&variantOf(t)==='falaise'&&GROUND_PATCHES.shoreCliff?.length===6?GROUND_PATCHES.shoreCliff:GROUND_PATCHES.shore;
  DIRS.forEach(([a,b],i)=>{const n=byPos.get(`${t.q+a},${t.r+b}`);if(n?.type==='mer'&&(tStale||baked.get(`${n.q},${n.r}`)!=='mer'))ground.push({t,rect:bands[i],pass:3});});
 }
 ground.sort((a,b)=>a.pass-b.pass);
 motifs.sort((a,b)=>a.t.y-b.t.y||a.t.x-b.t.x);
 return {ground,motifs};
}
export const staleCount=nodes=>{let n=0;for(const t of nodes)if(isStale(t))n++;return n;};
export const staleSignature=nodes=>nodes.filter(isStale).map(t=>`${t.q},${t.r}:${t.type}:${variantOf(t)}`).join('|');

// Aperçu d'une variante dans la fenêtre « Modifier cette case » : petit canvas, la case seule sur son décor.
export function drawVariantPreview(canvas,type,variant){
 const ImageCtor=canvas?.ownerDocument?.defaultView?.Image;const ctx=canvas?.getContext?.('2d');
 if(!ImageCtor||!ctx)return false;
 const img=new ImageCtor();
 img.onload=()=>{
  const w=canvas.width,h=canvas.height,k=w/31,cx=w/2,cy=h/2,t={q:0,r:0,type,variant};
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle=type==='mer'?'#2f78b8':type==='cote'?'#2f78b8':'#7aab4c';ctx.fillRect(0,0,w,h);
  const draw=([sx,sy,sw,sh,ox,oy,wu,hu],filter)=>{ctx.filter=filter||'none';ctx.drawImage(img,sx,sy,sw,sh,cx+ox*k,cy+oy*k,wu*k,hu*k);ctx.filter='none';};
  const st=stylesFor(t,{depth:type==='mer'?9:0,landSides:0,was:''});
  for(const g of st.ground.sort((a,b)=>a.pass-b.pass))draw(g.rect);
  if(type==='cote'&&GROUND_PATCHES.shore?.length===6){const bands=variant==='falaise'&&GROUND_PATCHES.shoreCliff?.length===6?GROUND_PATCHES.shoreCliff:GROUND_PATCHES.shore;bands.forEach(rect=>draw(rect));}
  if(st.motif)draw(st.motif,type==='col'?'brightness(1.32) saturate(.35)':'none');
 };
 img.src=PATCHES_SRC;return true;
}

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
  const sig=staleSignature(nodes);
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

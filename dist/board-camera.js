// Caméra du plateau (étape 3) : glisser à la souris et au doigt, pincement, molette, légère inertie,
// limites de la carte, double-clic / double-tape pour zoomer, recentrage animé.
// Elle ne fait que déplacer l'affichage : aucune donnée de partie n'est lue ni modifiée ici.
//
// Principe : le « monde » (image peinte + SVG) garde sa taille en unités de carte et la caméra lui applique
// une transformation CSS translate + scale. Le navigateur n'a donc rien à recalculer pendant un glisser.

const DRAG_MOUSE=5,DRAG_TOUCH=10,DOUBLE_TAP_MS=320,DOUBLE_TAP_PX=32;
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const now=()=>globalThis.performance?.now?.()??Date.now();
const raf=fn=>(globalThis.requestAnimationFrame||(f=>setTimeout(()=>f(now()),16)))(fn);
const caf=id=>(globalThis.cancelAnimationFrame||clearTimeout)(id);

export function createCamera(world,{width,height,minScale=.35,maxScale=6,margin=28,onChange=()=>{},reduced=()=>false}={}){
 let pending=null,viewport=null,vw=0,vh=0,s=1.05,tx=0,ty=0,ready=false,anim=0,inertia=0,settleTimer=0,observer=null;
 const pointers=new Map();
 let drag=null,pinch=null,suppressClick=false,lastTap=null,lastTouchZoom=0,samples=[];
 world.style.transformOrigin='0 0';
 world.style.width=width+'px';world.style.height=height+'px';

 const fitScale=()=>vw&&vh?Math.min(vw/width,vh/height):1;
 const lowest=()=>Math.max(minScale,Math.min(fitScale()*.92,1));
 const clampScale=v=>Math.min(maxScale,Math.max(lowest(),v));
 // Limites : la carte ne quitte jamais l'écran ; plus petite que l'écran, elle reste centrée.
 function bounds(scale=s){
  const w=width*scale,h=height*scale;
  const x=w+2*margin<=vw?[(vw-w)/2,(vw-w)/2]:[vw-w-margin,margin];
  const y=h+2*margin<=vh?[(vh-h)/2,(vh-h)/2]:[vh-h-margin,margin];
  return {x,y};
 }
 const clampTo=(v,[a,b])=>Math.min(b,Math.max(a,v));
 // Résistance élastique au-delà des limites pendant un glisser.
 const soft=(v,[a,b])=>v<a?a-(a-v)*.35:v>b?b+(v-b)*.35:v;
 function apply(settle=true){
  world.style.transform=`translate3d(${tx}px,${ty}px,0) scale(${s})`;
  onChange(view());
  if(settle){world.style.willChange='transform';clearTimeout(settleTimer);settleTimer=setTimeout(()=>{world.style.willChange='';onChange(view(),true);},160);}
 }
 function clampNow(){const b=bounds();tx=clampTo(tx,b.x);ty=clampTo(ty,b.y);}
 function view(){return {scale:s,x:tx,y:ty,width:vw,height:vh,left:-tx/s,top:-ty/s,right:(vw-tx)/s,bottom:(vh-ty)/s};}
 const stopMotion=()=>{if(anim){caf(anim);anim=0;}if(inertia){caf(inertia);inertia=0;}};

 // Zoom autour d'un point de l'écran (coordonnées relatives au cadre).
 function zoomAround(px,py,next){const n=clampScale(next),wx=(px-tx)/s,wy=(py-ty)/s;s=n;tx=px-wx*s;ty=py-wy*s;clampNow();apply();}
 function animateTo(target,duration=520){
  stopMotion();const from={s,tx,ty},to={s:clampScale(target.s??s),tx:target.tx,ty:target.ty};
  {const b=bounds(to.s);to.tx=clampTo(to.tx,b.x);to.ty=clampTo(to.ty,b.y);}
  if(reduced()||duration<=0){s=to.s;tx=to.tx;ty=to.ty;apply();return;}
  const start=now();
  const step=t=>{const k=Math.min(1,(t-start)/duration),e=ease(k);
   // Interpolation en échelle logarithmique : le zoom paraît régulier.
   s=from.s*Math.pow(to.s/from.s,e);
   const wx0=(vw/2-from.tx)/from.s,wy0=(vh/2-from.ty)/from.s,wx1=(vw/2-to.tx)/to.s,wy1=(vh/2-to.ty)/to.s;
   const wx=wx0+(wx1-wx0)*e,wy=wy0+(wy1-wy0)*e;tx=vw/2-wx*s;ty=vh/2-wy*s;
   apply();anim=k<1?raf(step):0;if(!anim){s=to.s;tx=to.tx;ty=to.ty;apply();}};
  anim=raf(step);
 }
 function focus(x,y,{scale,animate=true,duration=620}={}){
  const n=clampScale(scale??s);const target={s:n,tx:vw/2-x*n,ty:vh/2-y*n};
  if(!ready){preFocus(x,y,scale);return;}
  animate?animateTo(target,duration):animateTo(target,0);
 }
 function zoomBy(factor,{animate=true}={}){
  const n=clampScale(s*factor),wx=(vw/2-tx)/s,wy=(vh/2-ty)/s;
  animateTo({s:n,tx:vw/2-wx*n,ty:vh/2-wy*n},animate?260:0);
 }
 const isVisible=(x,y,pad=40)=>{const v=view(),p=pad/s;return x>v.left+p&&x<v.right-p&&y>v.top+p&&y<v.bottom-p;};

 // ---------- Événements ----------
 const local=e=>{const r=viewport.getBoundingClientRect?.()||{left:0,top:0};return {x:e.clientX-r.left,y:e.clientY-r.top};};
 function down(e){
  if(e.button>0&&e.pointerType==='mouse')return;
  if(e.target.closest?.('button,input,select,textarea,label,.board-minimap'))return;
  stopMotion();suppressClick=false;
  pointers.set(e.pointerId,{...local(e),type:e.pointerType});
  if(pointers.size===1){const p=pointers.get(e.pointerId);drag={id:e.pointerId,x0:p.x,y0:p.y,tx0:tx,ty0:ty,moved:false,type:e.pointerType};samples=[{x:p.x,y:p.y,t:now()}];}
  else if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={d0:Math.hypot(a.x-b.x,a.y-b.y)||1,s0:s,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,tx0:tx,ty0:ty};if(drag)drag.moved=true;capture(e);}
 }
 function capture(e){try{viewport.setPointerCapture(e.pointerId);}catch{/* rien */}}
 function move(e){
  const p=pointers.get(e.pointerId);if(!p)return;Object.assign(p,local(e));
  if(pinch&&pointers.size>=2){
   const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y)||1,mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
   const n=clampScale(pinch.s0*d/pinch.d0),wx=(pinch.mx-pinch.tx0)/pinch.s0,wy=(pinch.my-pinch.ty0)/pinch.s0;
   s=n;tx=mx-wx*s;ty=my-wy*s;const bb=bounds();tx=soft(tx,bb.x);ty=soft(ty,bb.y);apply();suppressClick=true;return;
  }
  if(!drag||drag.id!==e.pointerId)return;
  const dx=p.x-drag.x0,dy=p.y-drag.y0;
  if(!drag.moved){if(Math.hypot(dx,dy)<(drag.type==='mouse'?DRAG_MOUSE:DRAG_TOUCH))return;drag.moved=true;capture(e);viewport.classList?.add('is-dragging');}
  const b=bounds();tx=soft(drag.tx0+dx,b.x);ty=soft(drag.ty0+dy,b.y);apply();
  samples.push({x:p.x,y:p.y,t:now()});if(samples.length>6)samples.shift();
 }
 function up(e){
  const p=pointers.get(e.pointerId);if(!p)return;pointers.delete(e.pointerId);
  if(pinch){if(pointers.size<2)pinch=null;if(pointers.size===1){const [id,q]=[...pointers.entries()][0];drag={id,x0:q.x,y0:q.y,tx0:tx,ty0:ty,moved:true,type:q.type};samples=[];}else settle();return;}
  if(!drag||drag.id!==e.pointerId)return;
  const moved=drag.moved;viewport.classList?.remove('is-dragging');
  if(moved){suppressClick=true;fling();}
  else if(e.pointerType!=='mouse'){
   // Double tape au doigt : zoom sur le point touché, et ce second tape ne sélectionne pas de case.
   const t=now();if(lastTap&&t-lastTap.t<DOUBLE_TAP_MS&&Math.hypot(p.x-lastTap.x,p.y-lastTap.y)<DOUBLE_TAP_PX){lastTap=null;suppressClick=true;lastTouchZoom=t;zoomStep(p.x,p.y);}
   else lastTap={t,x:p.x,y:p.y};
  }
  drag=null;
 }
 function fling(){
  const last=samples.at(-1),first=samples.find(q=>last&&last.t-q.t<90)||samples[0];
  let vx=0,vy=0;if(last&&first&&last.t>first.t){vx=(last.x-first.x)/(last.t-first.t);vy=(last.y-first.y)/(last.t-first.t);}
  if(reduced()||Math.hypot(vx,vy)<.12){settle();return;}
  let t0=now();
  const step=t=>{const dt=Math.min(32,t-t0);t0=t;const k=Math.pow(.94,dt/16);vx*=k;vy*=k;tx+=vx*dt;ty+=vy*dt;
   const b=bounds();if(tx<b.x[0]||tx>b.x[1])vx*=.6;if(ty<b.y[0]||ty>b.y[1])vy*=.6;apply();
   inertia=Math.hypot(vx,vy)>.02?raf(step):0;if(!inertia)settle();};
  inertia=raf(step);
 }
 // Retour doux dans les limites après un glisser ou un pincement.
 function settle(){const b=bounds(),nx=clampTo(tx,b.x),ny=clampTo(ty,b.y);if(nx!==tx||ny!==ty)animateTo({s,tx:nx,ty:ny},220);}
 function zoomStep(px,py){const target=s*2.1>maxScale*.98&&s>=maxScale*.98?lowest():s*2.1,n=clampScale(target),wx=(px-tx)/s,wy=(py-ty)/s;animateTo({s:n,tx:px-wx*n,ty:py-wy*n},320);}
 function clickCapture(e){if(suppressClick){suppressClick=false;e.stopPropagation();e.preventDefault();}}
 function dblclick(e){if(now()-lastTouchZoom<600)return;if(e.target.closest?.('button,input,.board-minimap'))return;e.preventDefault();const p=local(e);zoomStep(p.x,p.y);}
 function wheel(e){
  if(e.target.closest?.('.board-minimap,.maptools'))return;
  e.preventDefault();stopMotion();
  const unit=e.deltaMode===1?16:e.deltaMode===2?vh:1,dy=e.deltaY*unit;
  // Pincement sur pavé tactile = molette + Ctrl : plus sensible.
  const p=local(e);zoomAround(p.x,p.y,s*Math.exp(-dy*(e.ctrlKey?.01:.0016)));
 }
 function keydown(e){
  if(e.target.closest?.('input,textarea,select'))return;
  const step=90;let handled=true;
  if(e.key==='ArrowLeft')animateTo({s,tx:tx+step,ty},180);else if(e.key==='ArrowRight')animateTo({s,tx:tx-step,ty},180);
  else if(e.key==='ArrowUp')animateTo({s,tx,ty:ty+step},180);else if(e.key==='ArrowDown')animateTo({s,tx,ty:ty-step},180);
  else if(e.key==='+'||e.key==='=')zoomBy(1.4);else if(e.key==='-'||e.key==='_')zoomBy(1/1.4);else handled=false;
  if(handled)e.preventDefault();
 }
 const listeners=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['click',clickCapture,true],['dblclick',dblclick],['wheel',wheel,{passive:false}],['keydown',keydown]];
 function measure(){if(!viewport)return;const r=viewport.getBoundingClientRect?.()||{};const w=r.width||viewport.clientWidth,h=r.height||viewport.clientHeight;if(!w||!h)return;
  if(ready){const cx=(vw/2-tx)/s,cy=(vh/2-ty)/s;vw=w;vh=h;s=clampScale(s);tx=vw/2-cx*s;ty=vh/2-cy*s;}
  else{vw=w;vh=h;if(pending){s=clampScale(pending.scale??s);tx=vw/2-pending.x*s;ty=vh/2-pending.y*s;pending=null;}else{s=lowest();tx=(vw-width*s)/2;ty=(vh-height*s)/2;}}
  ready=true;clampNow();apply(false);onChange(view(),true);}
 // Le cadre (.map) est recréé à chaque affichage de la page : on se rebranche sur le nouveau.
 let remeasure=0;
 function attach(next){
  if(next===viewport){if(remeasure)return;remeasure=raf(()=>{remeasure=0;measure();});return;}// lot 2 : même cadre, on remesure après l'affichage (évite un calcul de mise en page forcé)
  detach();viewport=next;if(!viewport)return;
  viewport.classList?.add('board-camera');
  for(const [type,fn,opt]of listeners)viewport.addEventListener(type,fn,opt);
  // Déjà mesuré : la taille du nouveau cadre est relue après l'affichage (ResizeObserver), sans forcer de mise en page.
  if(globalThis.ResizeObserver){observer=new ResizeObserver(()=>measure());observer.observe(viewport);}
  if(!ready||!globalThis.ResizeObserver)measure();else apply(false);
 }
 function detach(){if(!viewport)return;for(const [type,fn,opt]of listeners)viewport.removeEventListener(type,fn,opt);observer?.disconnect();observer=null;pointers.clear();drag=pinch=null;viewport=null;}
 // Avant le premier branchement : focus() mémorise un point à centrer (tx/ty provisoires = coordonnées monde × échelle).
 const preFocus=(x,y,scale)=>{pending={x,y,scale};};
 return {
  attach,detach,focus,zoomBy,animateTo,isVisible,view,
  setScale(v,{animate=false}={}){zoomBy(v/s,{animate});},
  center(x,y,scale){if(ready)focus(x,y,{scale});else preFocus(x,y,scale);},
  fit({animate=true}={}){const n=lowest();animateTo({s:n,tx:(vw-width*n)/2,ty:(vh-height*n)/2},animate?420:0);},
  get scale(){return s;},get ready(){return ready;},
  destroy(){stopMotion();clearTimeout(settleTimer);detach();}
 };
}

import {MAP_WIDTH,MAP_HEIGHT} from './europe.js';
import {tileArtwork,seaArtwork,seaPath,polygonPoints,mapContext,tilePresentation} from './europe-map.js';
import {createHexHitIndex} from './board-hit-test.js';
import {createTerrainLayer,isCellStale,readArtPreference,writeArtPreference,TERRAIN_ART_SRC} from './terrain-art.js';
import {createCamera} from './board-camera.js';
import {roadNetwork,chains,sinuousPath,smooth,ferryArc} from './board-roads.js';
import {DECOR} from './assets/europe/decor-data.js';
import {readDisplayPrefs,writeDisplayPref} from './display-prefs.js';

const NS='http://www.w3.org/2000/svg';
const clock=()=>globalThis.performance?.now?.()??Date.now();
const browser=()=>typeof globalThis.requestAnimationFrame==='function';
const raf=fn=>browser()?requestAnimationFrame(fn):0;
const f1=v=>Math.round(v*10)/10;
// Taille des symboles (jetons, numéros, noms) selon le zoom : ils grossissent un peu, sans devenir énormes.
const symbolScale=s=>Math.min(1.25,Math.max(.42,Math.pow(1.05/s,.65)));
const labelScale=s=>Math.min(1.3,Math.max(.36,Math.pow(1.05/s,.75)));
// Seuil à partir duquel le décor et les petits chemins apparaissent (vue rapprochée).
const DETAIL_SCALE=1.55;
const STEP_MS=260;

export function createSVGBoardRenderer(container,options={}){
 const doc=container.ownerDocument,make=(tag,attrs={})=>{const el=doc.createElementNS(NS,tag);attrsTo(el,attrs);return el;};
 const html=(tag,cls)=>{const el=doc.createElement(tag);if(cls)el.className=cls;return el;};
 function attrsTo(el,attrs){for(const [key,value]of Object.entries(attrs)){if(value===null){if(el.hasAttribute(key))el.removeAttribute(key);}else if(el.getAttribute(key)!==String(value))el.setAttribute(key,String(value));}}
 const setVar=(el,name,value)=>el.style?.setProperty?.(name,value);
 const svg=make('svg',{class:'playable-europe supplied-map',viewBox:`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`,'aria-label':'Plateau Europe sur grille régulière : chaque hexagone a la même taille'});
 svg.innerHTML=tileArtwork+seaArtwork;
 const ocean=make('rect',{class:'map-ocean',width:MAP_WIDTH,height:MAP_HEIGHT}),sea=make('path',{class:'board-sea-face',fill:'url(#board-sea-pattern)'});
 const lands=make('g',{class:'hex-cells'}),cities=make('g',{class:'city-names','aria-hidden':true}),numbers=make('g',{class:'route-numbers','aria-hidden':true}),tokens=make('g',{class:'map-symbols','aria-hidden':true}),seaCursor=make('g',{class:'board-sea-cursor','aria-hidden':true});
 // Étape 5 : décor (sous la grille), routes et ferries (au-dessus) ; étape 6 : tracé d'itinéraire et halos.
 const decor=make('g',{class:'board-decor','aria-hidden':true}),roads=make('g',{class:'board-roads','aria-hidden':true}),ferries=make('g',{class:'board-ferries'}),trail=make('g',{class:'route-trail','aria-hidden':true}),halos=make('g',{class:'board-halos','aria-hidden':true}),adventure=make('g',{class:'board-adventure'});
 const trailCase=make('path',{class:'route-trail-case'}),trailLine=make('path',{class:'route-trail-line'});trail.append(trailCase,trailLine);
 svg.append(ocean,sea,decor,lands,roads,ferries,trail,halos,adventure,cities,numbers,tokens,seaCursor);container.append(svg);
 let artWanted=options.art!==false&&readArtPreference(),artLayer=options.art===false?null:createTerrainLayer(container),artReady=false;
 const artOn=()=>Boolean(artLayer&&artWanted&&artReady);
 artLayer?.onStatus(ok=>{artReady=ok;if(state)update(state);});
 artLayer?.dynamic?.onChange(()=>{if(state&&!destroyed)update(state);});
 const cells=new Map(),cityNodes=new Map(),routeNodes=new Map(),playerNodes=new Map(),ferryNodes=new Map();
 let state=null,context=null,hit=null,geometry='',seaSignature='',hoverKey='',callback=null,destroyed=false;
 let prefs=readDisplayPrefs(),previous=null,sceneryKey='',sceneryTimer=0,firstView=true,glideTimer=0,symBucket='',detailOn=null,trailKeys=[];
 let diagnostics={updates:0,changedCells:0,createdCells:0,removedCells:0,seaRebuilt:false,lastUpdateMs:0};
 const reduced=()=>prefs.reduced;

 // ---------- Caméra (étape 3) ----------
 const camera=createCamera(container,{width:MAP_WIDTH,height:MAP_HEIGHT,onChange:onCamera,reduced});
 let cameraFrame=0,lastView=null;
 function onCamera(view){lastView=view;if(!browser()){applyZoomEffects(view);return;}if(!cameraFrame)cameraFrame=raf(()=>{cameraFrame=0;if(!destroyed&&lastView)applyZoomEffects(lastView);});}
 function applyZoomEffects(view){
  const sym=symbolScale(view.scale).toFixed(2),lab=labelScale(view.scale).toFixed(2),key=sym+'|'+lab;
  if(key!==symBucket){symBucket=key;for(const g of [tokens,numbers,halos,ferries,trail,adventure])setVar(g,'--sym',sym);setVar(cities,'--lab',lab);setVar(adventure,'--lab',lab);}
  const detail=view.scale>=DETAIL_SCALE;if(detail!==detailOn){detailOn=detail;attrsTo(decor,{'data-visible':detail});attrsTo(roads,{'data-detail':detail});}
  drawMinimapView(view);
 }

 // ---------- Mini-carte ----------
 const mini=html('div','board-minimap'),miniToggle=html('button','minimap-toggle'),miniBody=html('div','minimap-body'),miniImg=html('img','minimap-art');
 const miniSvg=make('svg',{viewBox:`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`,class:'minimap-overlay','aria-hidden':true}),miniView=make('rect',{class:'minimap-view'}),miniDots=make('g',{class:'minimap-dots'});
 miniSvg.append(miniDots,miniView);miniImg.alt='';miniImg.draggable=false;miniImg.setAttribute?.('aria-hidden','true');miniBody.append(miniImg,miniSvg);
 miniToggle.type='button';mini.append(miniToggle,miniBody);
 function drawMinimapState(){mini.classList?.toggle('collapsed',!prefs.minimap);miniToggle.textContent=prefs.minimap?'✕':'🗺';miniToggle.setAttribute('aria-label',prefs.minimap?'Replier la mini-carte':'Afficher la mini-carte');miniToggle.setAttribute('aria-expanded',String(prefs.minimap));miniBody.hidden=!prefs.minimap;}
 function drawMinimapView(v){if(!prefs.minimap||!v.width)return;const x=Math.max(0,v.left),y=Math.max(0,v.top);attrsTo(miniView,{x:f1(x),y:f1(y),width:f1(Math.max(8,Math.min(MAP_WIDTH,v.right)-x)),height:f1(Math.max(8,Math.min(MAP_HEIGHT,v.bottom)-y))});}
 let miniDrag=false;
 const miniPoint=e=>{const r=miniBody.getBoundingClientRect?.();if(!r?.width)return null;return {x:(e.clientX-r.left)/r.width*MAP_WIDTH,y:(e.clientY-r.top)/r.height*MAP_HEIGHT};};
 const miniDown=e=>{const p=miniPoint(e);if(!p)return;miniDrag=true;try{miniBody.setPointerCapture(e.pointerId);}catch{/* rien */}camera.focus(p.x,p.y,{animate:!reduced(),duration:300});e.preventDefault();};
 const miniMove=e=>{if(!miniDrag)return;const p=miniPoint(e);if(p)camera.focus(p.x,p.y,{animate:false});};
 const miniUp=()=>{miniDrag=false;};
 const miniClick=()=>{prefs=writeDisplayPref('minimap',!prefs.minimap);drawMinimapState();if(prefs.minimap&&lastView)drawMinimapView(lastView);};
 miniBody.addEventListener('pointerdown',miniDown);miniBody.addEventListener('pointermove',miniMove);miniBody.addEventListener('pointerup',miniUp);miniBody.addEventListener('pointercancel',miniUp);miniToggle.addEventListener('click',miniClick);
 drawMinimapState();

 // ---------- Météo légère (nuages) ----------
 const weather=html('div','board-weather');weather.setAttribute?.('aria-hidden','true');
 for(let i=0;i<4;i++){const cloud=html('span','cloud c'+i);weather.append(cloud);}
 const drawWeatherState=()=>{weather.hidden=!prefs.weather||prefs.reduced;};
 drawWeatherState();

 // ---------- Sélection de cases (inchangé) ----------
 const picker=doc.createElement('form'),qInput=doc.createElement('input'),rInput=doc.createElement('input'),openButton=doc.createElement('button'),notice=doc.createElement('output');
 picker.className='board-cell-picker';picker.setAttribute('aria-label','Sélectionner une case de l’éditeur');
 const heading=doc.createElement('strong');heading.textContent='Case de l’éditeur';
 for(const [input,name]of [[qInput,'q'],[rInput,'r']]){input.type='number';input.step='1';input.setAttribute('aria-label',`Coordonnée ${name}`);const label=doc.createElement('label');label.textContent=name;label.append(input);picker.append(label);}
 openButton.type='submit';openButton.textContent='Modifier';notice.setAttribute('aria-live','polite');picker.prepend(heading);picker.append(openButton,notice);
 const select=key=>{const t=state?.g.board[key];if(t&&(state.editMode||tilePresentation(context,t).canSelect))callback?.(key);};
 const pointFromEvent=e=>{const matrix=svg.getScreenCTM();if(!matrix)return null;const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(matrix.inverse());};
 const eventKey=e=>{const target=e.target.closest?.('[data-board-key]');if(target&&svg.contains(target))return target.getAttribute('data-board-key');const p=pointFromEvent(e);return p?hit?.atPoint(p.x,p.y)?.key:null;};
 function showSeaCursor(key){
  const t=state?.g.board[key];seaCursor.replaceChildren();
  if(!state?.editMode||t?.type!=='mer')return;
  seaCursor.append(make('polygon',{points:polygonPoints(t),class:'board-sea-outline'}));
 }
 const click=e=>{if(destroyed||!state)return;
  // Second clic d'un double-clic : il sert au zoom, il ne sélectionne pas une case.
  if(e.detail>1)return;
  const ferry=e.target.closest?.('[data-ferry-to]');if(ferry&&svg.contains(ferry)){const to=ferry.getAttribute('data-ferry-to');if(to){callback?.(to);return;}}
  const key=eventKey(e);if(key)select(key);};
 const keydown=e=>{if(!['Enter',' '].includes(e.key)||!state)return;const key=e.target.closest?.('[data-board-key]')?.getAttribute('data-board-key');if(key){e.preventDefault();select(key);}};
 const move=e=>{if(!state?.editMode)return;const key=eventKey(e)||'';if(key===hoverKey)return;hoverKey=key;const t=state.g.board[key];if(t){qInput.value=t.q;rInput.value=t.r;notice.textContent=t.name||t.type;}showSeaCursor(key);};
 const leave=()=>{hoverKey='';showSeaCursor('');};
 const submit=e=>{e.preventDefault();const q=Number(qInput.value),r=Number(rInput.value),t=qInput.value!==''&&rInput.value!==''&&Number.isInteger(q)&&Number.isInteger(r)?hit?.atAxial(q,r):null;if(!t){notice.textContent='Cette case est hors du plateau.';return;}select(t.key);};
 svg.addEventListener('click',click);svg.addEventListener('keydown',keydown);svg.addEventListener('pointermove',move);svg.addEventListener('pointerleave',leave);picker.addEventListener('submit',submit);
 function prune(records,keys){for(const [key,record]of records)if(!keys.has(key)){record.el.remove();records.delete(key);}}

 // ---------- Décor et routes (étape 5) : calculés une fois par carte, après l'affichage ----------
 function sceneryFor(g){
  const nodes=Object.values(g.board),key=nodes.length+':'+nodes.map(t=>t.type[0]+t.type.length).join('');
  if(key===sceneryKey)return;sceneryKey=key;
  if(!browser())return;// tests sans navigateur : pas de dessin coûteux
  clearTimeout(sceneryTimer);
  sceneryTimer=setTimeout(()=>{if(destroyed||!state)return;drawScenery(state.g.board);},firstView?60:220);
 }
 function drawScenery(board){
  const byAxial=new Map(Object.values(board).map(t=>[`${t.q},${t.r}`,t])),land=(q,r)=>{const t=byAxial.get(`${q},${r}`);return t&&t.type!=='mer'?t:null;};
  // Décor : rivières (coupées si une case est devenue mer), bosquets, lacs, hameaux.
  let river='',conifers='',leafy='',walls='',roofs='',lakes='';
  for(const r of DECOR.rivers){let run=[];const flush=()=>{if(run.length>1)river+=smooth(run);run=[];};for(const [x,y,q,rr]of r.points){if(land(q,rr))run.push([x,y]);else flush();}flush();}
  for(const [x,y,s,kind,q,r]of DECOR.forests){if(!land(q,r))continue;
   if(kind===0)conifers+=`M${x} ${f1(y-s*1.55)}L${f1(x-s*.75)} ${f1(y+s*.45)}L${f1(x+s*.75)} ${f1(y+s*.45)}Z`;
   else{const rr=f1(s*.72);leafy+=`M${f1(x-rr)} ${f1(y-s*.35)}a${rr} ${rr} 0 1 0 ${f1(rr*2)} 0a${rr} ${rr} 0 1 0 ${f1(-rr*2)} 0Z`;}}
  for(const [x,y,rx,ry,rot,q,r]of DECOR.lakes)if(land(q,r))lakes+=`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})"/>`;
  for(const [x,y,n,q,r]of DECOR.villages){if(!land(q,r))continue;for(let i=0;i<n;i++){const hx=f1(x+(i-(n-1)/2)*3.1),hy=f1(y+(i%2)*1.4);walls+=`M${f1(hx-1.2)} ${hy}h2.4v1.9h-2.4Z`;roofs+=`M${f1(hx-1.6)} ${hy}L${hx} ${f1(hy-1.6)}L${f1(hx+1.6)} ${hy}Z`;}}
  decor.innerHTML=`<path class="decor-river" d="${river}"/><g class="decor-lakes">${lakes}</g><path class="decor-conifers" d="${conifers}"/><path class="decor-leafy" d="${leafy}"/><path class="decor-walls" d="${walls}"/><path class="decor-roofs" d="${roofs}"/>`;
  // Routes : uniquement sur les liaisons existantes entre cases voisines.
  const t0=clock(),net=roadNetwork(board,{villages:DECOR.villages.filter(v=>land(v[3],v[4])).map(v=>[v[3],v[4]])});
  const main=chains(net.main).map(c=>sinuousPath(board,c)).join(''),minor=chains(net.minor).map(c=>sinuousPath(board,c,{wobble:3})).join('');
  roads.innerHTML=`<path class="road-minor" d="${minor}"/><path class="road-main-case" d="${main}"/><path class="road-main" d="${main}"/>`;
  diagnostics.roadsMs=Math.round(clock()-t0);
 }

 // ---------- Ferries (élément de jeu : toujours visibles) ----------
 function drawFerries(g,targets){
  const active=g.board[g.pos],seen=new Set(),targetSet=new Set(targets||[]);
  for(const e of (g.edges||[]).filter(e=>e.ferry)){const a=g.board[e.a],b=g.board[e.b];if(!a||!b)continue;const id=e.a+'|'+e.b;seen.add(id);
   let rec=ferryNodes.get(id);
   if(!rec){const el=make('g',{class:'ferry'}),arc=ferryArc(a,b),hitPath=make('path',{class:'ferry-hit',d:arc.d}),casing=make('path',{class:'ferry-case',d:arc.d}),line=make('path',{class:'ferry-line',d:arc.d});
    const p0=arc.point(.46),p1=arc.point(.54),angle=Math.atan2(p1.y-p0.y,p1.x-p0.x)*180/Math.PI,flip=Math.abs(angle)>90;
    const boat=make('g',{class:'ferry-boat',transform:`translate(${f1(arc.mid.x)} ${f1(arc.mid.y)})`}),boatInner=make('g',{class:'ferry-boat-inner'});
    boatInner.innerHTML=`<circle class="ferry-boat-bg" r="7.5"/><g transform="rotate(${f1(flip?angle+180:angle)})"><path class="ferry-hull" d="M-5 1.2h10l-2 2.6h-6Z"/><path class="ferry-cabin" d="M-2.6 -1.6h4.4v2.8h-4.4Z"/><path class="ferry-funnel" d="M0.4 -3.6h1.4v2h-1.4Z"/></g>`;
    const label=make('text',{class:'ferry-label',y:-11});boatInner.append(label);boat.append(boatInner);
    el.append(hitPath,casing,line,boat);ferries.append(el);rec={el,hitPath,label,a:e.a,b:e.b};ferryNodes.set(id,rec);}
   const to=active&&(active.key===rec.a?rec.b:active.key===rec.b?rec.a:'');const available=Boolean(to&&targetSet.has(to));
   attrsTo(rec.el,{class:`ferry${available?' available':''}`,'data-ferry-to':available?to:null,role:available?'button':null,tabindex:available?'0':null,'aria-label':available?`Traversée en ferry vers ${g.board[to]?.name||'le port'}`:null});
   const text=available?`⛴ ${g.board[to]?.name||''} · ${g.rules?.ferryPrice??''} 🪙`:'';if(rec.label.textContent!==text)rec.label.textContent=text;
  }
  for(const [id,rec]of ferryNodes)if(!seen.has(id)){rec.el.remove();ferryNodes.delete(id);}
 }

 // ---------- Tracé progressif de l'itinéraire choisi (étape 6) ----------
 function drawTrail(g,route){
  const keys=route.length&&g.board[g.pos]?[g.pos,...route]:[];
  const pts=keys.map(k=>g.board[k]).filter(Boolean).map(t=>[t.x,t.y]),d=pts.length>1?smooth(pts):'';
  const grew=keys.length>trailKeys.length&&trailKeys.length>0&&trailKeys.every((k,i)=>keys[i]===k);
  // Longueur estimée sur la ligne brisée (sans getTotalLength, qui forcerait un calcul de mise en page).
  const length=n=>{let l=0;for(let i=1;i<n;i++)l+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return l*1.04+2;};
  attrsTo(trailCase,{d});attrsTo(trailLine,{d});
  if(grew&&!reduced()&&typeof trailLine.animate==='function'){
   const total=length(pts.length),before=length(trailKeys.length),added=keys.length-trailKeys.length;
   for(const el of [trailLine,trailCase]){el.style.strokeDasharray=`${total} ${total}`;const a=el.animate([{strokeDashoffset:total-before},{strokeDashoffset:0}],{duration:STEP_MS*Math.max(1,added),easing:'ease-out'});a.onfinish=()=>{el.style.strokeDasharray='';};}
  }
  trailKeys=keys;
 }

 // ---------- Halos : sélection et ville d'arrivée ----------
 let haloKey='',destKey='';
 function drawHalos(g,selected,editMode){
  const sel=g.board[selected],dest=Object.values(g.board).find(t=>t.id===g.arrivalId&&t.id!==undefined);
  const nextSel=sel?sel.key:'',nextDest=!editMode&&dest?dest.key:'';
  if(nextSel===haloKey&&nextDest===destKey)return;haloKey=nextSel;destKey=nextDest;halos.replaceChildren();
  if(dest&&nextDest){const g2=make('g',{class:'dest-pulse',transform:`translate(${f1(dest.x)} ${f1(dest.y)})`}),inner=make('g',{class:'dest-pulse-inner'});inner.append(make('circle',{class:'pulse-ring',r:13}),make('circle',{class:'pulse-ring late',r:13}));g2.append(inner);halos.append(g2);}
  if(sel){const g1=make('g',{class:'sel-halo',transform:`translate(${f1(sel.x)} ${f1(sel.y)})`});g1.append(make('circle',{r:13.5}));halos.append(g1);}
 }

 // ---------- Aventure : cols mythiques nommés (drapeau + nom) et lieux cachés (jetons « ? ») ----------
 let adventureSig='';
 const esc=v=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 function drawAdventure(g,editMode){
  const cols=Object.values(g.board).filter(t=>t.type==='col'&&t.colName),marks=Object.entries(g.landmarks||{}),climbed=g.colsClimbed||{},colorOf=id=>(g.players||[]).find(p=>p.id===id)?.color||'';
  const sig=editMode+'|'+cols.map(t=>t.key+(climbed[t.key]||'')).join(',')+'|'+marks.map(([k,l])=>k+(l.found?'1':'0')).join(',');
  if(sig===adventureSig)return;adventureSig=sig;
  if(editMode){adventure.innerHTML='';return;}
  let out='';
  for(const t of cols){const who=climbed[t.key],color=colorOf(who),up=cols.some(o=>o!==t&&Math.hypot(o.x-t.x,o.y-t.y)<45&&(o.x>t.x||o.x===t.x&&o.y>t.y));
   out+=`<g class="col-flag${who?' claimed':''}" transform="translate(${f1(t.x)} ${f1(t.y)})"><title>${esc(t.colName)}${who?' · premier de cordée : '+esc((g.players||[]).find(p=>p.id===who)?.name||''):' · premier à passer : +3 points'}</title><g class="col-flag-inner"><path class="col-pole" d="M-2 6V-12"/><path class="col-cloth" d="M-2 -12l11 3.4-11 3.4Z"${color?` style="fill:${esc(color)}"`:''}/></g><text class="col-name${up?' up':''}">${esc(t.colName)}</text></g>`;}
  for(const [k,l]of marks){const t=g.board[k];if(!t)continue;
   out+=l.found?`<g class="landmark found" transform="translate(${f1(t.x)} ${f1(t.y)})"><title>${esc(l.name)} (+${l.value})</title><g class="landmark-inner"><circle r="5.5"/><text y="2.6">✦</text></g></g>`
    :`<g class="landmark" transform="translate(${f1(t.x)} ${f1(t.y)})"><title>Lieu remarquable caché</title><g class="landmark-inner"><circle r="7.5"/><text y="3.6">?</text></g></g>`;}
  adventure.innerHTML=out;
 }

 // ---------- Jetons des cyclistes, avec déplacement case par case ----------
 function tokenTarget(g,p){const t=g.board[p.pos];if(!t)return null;const same=(g.players||[]).filter(a=>a.pos===p.pos),offset=(same.indexOf(p)-(same.length-1)/2)*14;return {x:t.x+offset,y:t.y};}
 function animateToken(record,points,stepMs){
  record.anim&&(record.anim.cancelled=true);
  const anim={cancelled:false};record.anim=anim;
  const lens=[];let total=0;for(let i=1;i<points.length;i++){const l=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);lens.push(l);total+=l;}
  const duration=Math.min(2600,stepMs*(points.length-1)),start=clock();
  const step=()=>{if(anim.cancelled||destroyed)return;const k=Math.min(1,(clock()-start)/duration),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
   let dist=e*total,i=0;while(i<lens.length-1&&dist>lens[i]){dist-=lens[i];i++;}
   const a=points[i],b=points[i+1]||a,t=lens[i]?Math.min(1,dist/lens[i]):1;
   attrsTo(record.el,{transform:`translate(${f1(a.x+(b.x-a.x)*t)} ${f1(a.y+(b.y-a.y)*t)})`});
   if(k<1)raf(step);else{record.anim=null;record.el.classList?.remove('moving');}};
  record.el.classList?.add('moving');raf(step);
  return duration;
 }
 // Les cases réellement parcourues (historique du voyage) : de la position affichée jusqu'à la nouvelle.
 function travelTail(g,p,from){
  const tr=p.travel||[];if(tr.at(-1)!==p.pos)return null;const out=[];
  for(let i=tr.length-1;i>=0&&out.length<10;i--){if(tr[i]===from.key)break;const t=g.board[tr[i]];if(!t)return null;out.unshift(t);}
  if(!out.length||!(from.links||[]).includes(out[0].key))return null;
  for(let i=1;i<out.length;i++)if(!(out[i-1].links||[]).includes(out[i].key))return null;
  return out;
 }
 function drawTokens(g,prev){
  const playerKeys=new Set(),players=g.players||[];let longest=0;
  for(const p of players){const target=tokenTarget(g,p);if(!target)continue;playerKeys.add(p.id);
   let record=playerNodes.get(p.id);
   if(!record){record={el:make('g',{class:'rider-token'}),inner:make('g',{class:'rider-inner'}),shadow:make('ellipse',{class:'rider-shadow',cx:0,cy:9,rx:9,ry:3}),circle:make('circle',{class:'rider-base',r:11}),text:make('text',{class:'player-number',y:4}),pos:p.pos};record.inner.append(record.shadow,record.circle,record.text);record.el.append(record.inner);tokens.append(record.el);playerNodes.set(p.id,record);}
   attrsTo(record.el,{class:`rider-token${p.id===g.id?' active':''}${record.anim?' moving':''}`,'aria-label':p.name});
   attrsTo(record.circle,{style:`fill:${p.color};stroke:white`});if(record.text.textContent!==p.id.slice(1))record.text.textContent=p.id.slice(1);
   const moved=record.pos!==p.pos,from=g.board[record.pos];record.pos=p.pos;
   if(moved&&from&&prev&&!reduced()&&browser()){
    // Chemin affiché : l'itinéraire qui venait d'être choisi, sinon le ferry, sinon un glissement direct.
    const r=prev.route||[],ferry=(g.edges||[]).find(e=>e.ferry&&((e.a===from.key&&e.b===p.pos)||(e.b===from.key&&e.a===p.pos)));
    let pts,stepMs=STEP_MS;
    const steps=travelTail(g,p,from);
    if(steps)pts=[from,...steps].map(t=>({x:t.x,y:t.y}));
    else if(prev.activeId===p.id&&r.length&&r.at(-1)===p.pos)pts=[from,...r.map(k=>g.board[k]).filter(Boolean)].map(t=>({x:t.x,y:t.y}));
    else if(ferry){const arc=ferryArc(g.board[ferry.a],g.board[ferry.b]),fwd=ferry.a===from.key;pts=Array.from({length:17},(_,i)=>arc.point(fwd?i/16:1-i/16));stepMs=90;}
    else pts=[{x:from.x,y:from.y},{x:target.x,y:target.y}];
    pts[pts.length-1]={x:target.x,y:target.y};
    if(pts.length>1){longest=Math.max(longest,animateToken(record,pts,pts.length===2?Math.min(520,Math.max(STEP_MS,Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y)*6)):stepMs));continue;}
   }
   if(record.anim&&!moved)continue;// une animation en cours garde la main jusqu'au bout
   record.anim&&(record.anim.cancelled=true);record.anim=null;
   attrsTo(record.el,{transform:`translate(${f1(target.x)} ${f1(target.y)})`});
  }
  prune(playerNodes,playerKeys);
  return longest;
 }

 function update(next){
  if(destroyed)throw Error('Renderer SVG détruit.');const started=clock();state=next;
  const {g,reachable=[],cost=()=>0,selected='',route=[],nextSteps=[],editMode=false,ferryTargets=[]}=state;
  context=mapContext(g,reachable,cost,selected,route,nextSteps,editMode);diagnostics={...diagnostics,updates:diagnostics.updates+1,changedCells:0,createdCells:0,removedCells:0,seaRebuilt:false};
  attrsTo(svg,{class:`playable-europe supplied-map ${editMode?'map-edit-mode':''} ${artOn()?'art-on':''} ${prefs.reduced?'motion-reduced':''}`.replace(/\s+/g,' ').trim()});
  const nodes=Object.values(g.board),dyn=Boolean(artLayer?.dynamic?.sync(nodes,artOn()));
  if(artLayer)artLayer.el.hidden=!artOn()||dyn;
  const shape=nodes.map(t=>`${t.key}:${t.x}:${t.y}`).join('|');
  if(shape!==geometry){geometry=shape;hit=createHexHitIndex(g.board);}
  const art=artOn(),seaCells=nodes.filter(t=>t.type==='mer'&&(!art||(isCellStale(t)&&!dyn)));
  const seaKeys=`${art}:`+seaCells.map(t=>`${t.key}:${t.x}:${t.y}`).join('|');
  if(seaKeys!==seaSignature){seaSignature=seaKeys;attrsTo(sea,{d:seaPath(Object.fromEntries(seaCells.map(t=>[t.key,t])))});diagnostics.seaRebuilt=true;}
  const landKeys=new Set();
  for(const t of nodes){if(t.type==='mer')continue;landKeys.add(t.key);const p=tilePresentation(context,t),stale=art&&!dyn&&isCellStale(t),signature=JSON.stringify([p,t.type,t.x,t.y,art,stale]);let record=cells.get(t.key);
   if(!record){const el=make('g',{'data-board-key':t.key}),polygon=make('polygon',{class:'terrain-face'}),icon=make('use',{class:'terrain-icon',width:14,height:14,'aria-hidden':true});el.append(polygon,icon);lands.append(el);record={el,polygon,icon,signature:''};cells.set(t.key,record);diagnostics.createdCells++;}
   if(record.signature===signature)continue;record.signature=signature;diagnostics.changedCells++;
   attrsTo(record.el,{class:art&&!stale?`${p.className} art-cell`:p.className,'aria-label':p.label,'aria-pressed':p.pressed,'aria-disabled':p.canSelect?null:true,'data-move':p.canSelect?t.key:null,role:p.canSelect?'button':null,tabindex:p.canSelect?'0':null});
   attrsTo(record.polygon,{points:polygonPoints(t)});attrsTo(record.icon,{href:`#tile-icon-${t.type}`,x:t.x-7,y:t.y-7});
  }
  diagnostics.removedCells=[...cells.keys()].filter(k=>!landKeys.has(k)).length;prune(cells,landKeys);
  const cityKeys=new Set();
  for(const t of nodes.filter(t=>t.name)){cityKeys.add(t.key);let record=cityNodes.get(t.key);if(!record){record={el:make('text',{class:'city-name','data-city-key':t.key})};cities.append(record.el);cityNodes.set(t.key,record);}attrsTo(record.el,{x:f1(t.x),y:f1(t.y)});if(record.el.textContent!==t.name)record.el.textContent=t.name;}
  prune(cityNodes,cityKeys);
  const routeKeys=new Set();
  route.forEach((key,i)=>{const t=g.board[key];if(!t)return;routeKeys.add(key);let record=routeNodes.get(key);if(!record){record={el:make('g'),inner:make('g',{class:'route-number-inner'}),text:make('text',{y:3})};record.inner.append(make('circle',{r:9}),record.text);record.el.append(record.inner);numbers.append(record.el);routeNodes.set(key,record);}attrsTo(record.el,{transform:`translate(${t.x} ${t.y})`});if(record.text.textContent!==String(i+1))record.text.textContent=String(i+1);});
  prune(routeNodes,routeKeys);
  // Étapes 5 et 6 : décor/routes (différés), ferries, tracé, halos, jetons animés.
  sceneryFor(g);
  drawFerries(g,editMode?[]:ferryTargets);
  drawTrail(g,editMode?[]:route);
  drawHalos(g,selected,editMode);
  drawAdventure(g,editMode);
  const moveMs=drawTokens(g,previous);
  picker.hidden=!editMode;
  const owner=container.closest('.map-wrap')||container.parentElement;
  if(editMode){const wrap=container.closest('.map-wrap')||container;if(picker.parentElement!==wrap)wrap.append(picker);showSeaCursor(hoverKey);}else if(picker.parentElement)picker.remove();
  // Cadre de la caméra, mini-carte et météo suivent le cadre courant (recréé à chaque affichage de la page).
  if(container.parentElement)camera.attach(container.parentElement);
  if(owner&&owner!==container&&mini.parentElement!==owner)owner.append(mini);
  if(container.parentElement&&weather.parentElement!==container.parentElement)container.parentElement.append(weather);
  drawMiniDots(g);
  if(!miniImg.getAttribute('src'))miniImg.setAttribute('src',TERRAIN_ART_SRC);
  // Premier affichage : on cadre le cycliste actif ; ensuite on glisse vers le joueur suivant.
  const activePos=g.board[g.pos];
  if(firstView&&activePos){firstView=false;if(editMode)camera.fit({animate:false});else camera.center(activePos.x,activePos.y,1.7);}
  else if(previous&&previous.activeId!==g.id&&activePos&&!editMode){clearTimeout(glideTimer);glideTimer=setTimeout(()=>{if(!destroyed)camera.focus(activePos.x,activePos.y,{scale:Math.max(camera.scale,1.25),duration:700});},moveMs?moveMs+120:60);}
  else if(moveMs&&activePos&&!camera.isVisible(activePos.x,activePos.y,60)){clearTimeout(glideTimer);glideTimer=setTimeout(()=>{if(!destroyed)camera.focus(activePos.x,activePos.y,{duration:600});},Math.min(moveMs,500));}
  previous={activeId:g.id,route:[...route],pos:g.pos};
  diagnostics.lastUpdateMs=clock()-started;
 }
 function drawMiniDots(g){
  const players=g.players||[],sig=players.map(p=>p.id+p.pos+p.color).join('|');if(miniDots.getAttribute('data-sig')===sig)return;attrsTo(miniDots,{'data-sig':sig});miniDots.replaceChildren();
  for(const p of players){const t=g.board[p.pos];if(t)miniDots.append(make('circle',{cx:f1(t.x),cy:f1(t.y),r:p.id===g.id?16:12,style:`fill:${p.color}`,class:p.id===g.id?'active':''}));}
 }
 // Compatibilité avec l'ancienne interface : zoom = échelle, x/y = point à centrer.
 function setCamera(next={}){
  if(destroyed)return;
  const scale=Number.isFinite(next.zoom)&&next.zoom>0?next.zoom:undefined;
  if(Number.isFinite(next.x)&&Number.isFinite(next.y))camera.focus(next.x,next.y,{scale,animate:next.behavior==='smooth'});
  else if(scale)camera.setScale(scale);
 }
 return {
  update,onHexClick(fn){callback=fn;},setCamera,
  zoomBy(factor){camera.zoomBy(factor);},
  // Recentrage animé sur un point (le cycliste actif) ; on rapproche un peu la vue si elle est très éloignée.
  focusOn(x,y,{minScale=1.5,animate=true}={}){camera.focus(x,y,{scale:Math.max(camera.scale,minScale),animate});},
  fitView(){camera.fit();},
  getCamera(){return camera.view();},
  setDisplayPrefs(next={}){for(const [k,v]of Object.entries(next))prefs=writeDisplayPref(k,v);drawWeatherState();drawMinimapState();if(state&&!destroyed)update(state);return {...prefs};},
  getDisplayPrefs(){return {...prefs};},
  setArt(on){artWanted=Boolean(on);writeArtPreference(artWanted);if(state&&!destroyed)update(state);return artOn();},
  isArtOn:artOn,artAvailable:()=>Boolean(artLayer),
  getDiagnostics(){return {...diagnostics,landCells:cells.size,art:artOn()};},
  destroy(){if(destroyed)return;destroyed=true;clearTimeout(sceneryTimer);clearTimeout(glideTimer);camera.destroy();svg.removeEventListener('click',click);svg.removeEventListener('keydown',keydown);svg.removeEventListener('pointermove',move);svg.removeEventListener('pointerleave',leave);picker.removeEventListener('submit',submit);miniBody.removeEventListener('pointerdown',miniDown);miniBody.removeEventListener('pointermove',miniMove);miniBody.removeEventListener('pointerup',miniUp);miniBody.removeEventListener('pointercancel',miniUp);miniToggle.removeEventListener('click',miniClick);svg.remove();artLayer?.destroy();picker.remove();mini.remove();weather.remove();cells.clear();cityNodes.clear();routeNodes.clear();playerNodes.clear();ferryNodes.clear();state=context=hit=callback=null;}
 };
}

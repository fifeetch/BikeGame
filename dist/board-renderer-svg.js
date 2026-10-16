import {MAP_WIDTH,MAP_HEIGHT} from './europe.js';
import {tileArtwork,seaArtwork,seaPath,polygonPoints,mapContext,tilePresentation} from './europe-map.js';
import {createHexHitIndex} from './board-hit-test.js';
import {createTerrainLayer,isCellStale,readArtPreference,writeArtPreference,TERRAIN_ART_SRC} from './terrain-art.js';
import {createCamera} from './board-camera.js';
import {roadNetwork,chains,sinuousPath,smooth,ferryArc} from './board-roads.js';
import {roadEdges} from './routes.js';
import {forecast,REGIONS,WEATHER,REGION_CENTRES} from './weather.js';
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
const STEP_MS=650;// une case toutes les 0,65 s : on a le temps de voir le cycliste rouler

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
 const decor=make('g',{class:'board-decor','aria-hidden':true}),roads=make('g',{class:'board-roads','aria-hidden':true}),ferries=make('g',{class:'board-ferries'}),trail=make('g',{class:'route-trail','aria-hidden':true}),guide=make('g',{class:'board-guide','aria-hidden':true}),zones=make('g',{class:'board-zones','aria-hidden':true}),halos=make('g',{class:'board-halos','aria-hidden':true}),adventure=make('g',{class:'board-adventure'});
 const trailCase=make('path',{class:'route-trail-case'}),trailLine=make('path',{class:'route-trail-line'});trail.append(trailCase,trailLine);
 const fxLayer=make('g',{class:'board-fx','aria-hidden':true}),journeys=make('g',{class:'board-journeys','aria-hidden':true}),nightsLayer=make('g',{class:'board-nights'});
 svg.append(ocean,sea,decor,lands,zones,roads,ferries,guide,journeys,trail,halos,adventure,cities,nightsLayer,numbers,tokens,fxLayer,seaCursor);container.append(svg);
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
  const nodes=Object.values(g.board),key=nodes.length+':'+nodes.map(t=>t.type[0]+t.type.length+(t.roads?.length||'')).join('');
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
  // Routes jouables (figées dans routes-data.js) + petits chemins du décor vers les hameaux (ne comptent pas).
  const t0=clock(),net=roadNetwork(board,{main:roadEdges(board),villages:DECOR.villages.filter(v=>land(v[3],v[4])).map(v=>[v[3],v[4]])});
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

 // ---------- Partie guidée : chemin conseillé en pointillés et case à cliquer ----------
 let guideSig='';
 function drawGuide(g,path,focus){
  const sig=path.join('|')+'#'+focus;if(sig===guideSig)return;guideSig=sig;guide.replaceChildren();
  const pts=path.map(k=>g.board[k]).filter(Boolean).map(t=>[t.x,t.y]);
  if(pts.length>1)guide.append(make('path',{class:'guide-line-case',d:smooth(pts)}),make('path',{class:'guide-line',d:smooth(pts)}));
  const f=g.board[focus];if(f){const ring=make('g',{class:'guide-focus',transform:`translate(${f1(f.x)} ${f1(f.y)})`}),inner=make('g',{class:'guide-focus-inner'});inner.append(make('circle',{class:'guide-ring',r:14}),make('circle',{class:'guide-ring late',r:14}));ring.append(inner);guide.append(ring);}
 }

 // ---------- Mode Immersion : zones des imprévus qui durent (hachures) ----------
 let zonesSig='';
 function drawZones(g,list){
  const sig=list.map(z=>z.kind+':'+z.keys.join(',')).join('|');if(sig===zonesSig)return;zonesSig=sig;zones.replaceChildren();if(!list.length)return;
  const defs=make('defs');for(const [kind,a,b] of [['neg','#b74732','#f2a541'],['pos','#2c7a5b','#bfe3a8']]){const pat=make('pattern',{id:'imm-hatch-'+kind,width:6,height:6,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'});pat.append(make('rect',{width:6,height:6,fill:a,'fill-opacity':.42}),make('rect',{width:2.4,height:6,fill:b,'fill-opacity':.6}));defs.append(pat);}zones.append(defs);
  for(const z of list)for(const k of z.keys){const t=g.board[k];if(t)zones.append(make('polygon',{points:polygonPoints(t),class:'imm-zone '+z.kind,fill:`url(#imm-hatch-${z.kind})`}));}
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
  const sky=g.forecast&&g.mode==='plateau'&&!editMode?forecast(g.seed,g.round):null;
  const sig=JSON.stringify(sky)+editMode+'|'+cols.map(t=>t.key+(climbed[t.key]||'')).join(',')+'|'+marks.map(([k,l])=>k+(l.found?'1':'0')).join(',');
  if(sig===adventureSig)return;adventureSig=sig;
  if(editMode){adventure.innerHTML='';return;}
  let out='';
  for(const t of cols){const who=climbed[t.key],color=colorOf(who),up=cols.some(o=>o!==t&&Math.hypot(o.x-t.x,o.y-t.y)<45&&(o.x>t.x||o.x===t.x&&o.y>t.y));
   out+=`<g class="col-flag${who?' claimed':''}" transform="translate(${f1(t.x)} ${f1(t.y)})"><title>${esc(t.colName)}${who?' · premier passage : '+esc((g.players||[]).find(p=>p.id===who)?.name||''):' · col mythique : +2 points'}</title><g class="col-flag-inner"><path class="col-pole" d="M-2 6V-12"/><path class="col-cloth" d="M-2 -12l11 3.4-11 3.4Z"${color?` style="fill:${esc(color)}"`:''}/></g><text class="col-name${up?' up':''}">${esc(t.colName)}</text></g>`;}
  for(const [k,l]of marks){const t=g.board[k];if(!t)continue;
   out+=l.found?`<g class="landmark found" transform="translate(${f1(t.x)} ${f1(t.y)})"><title>${esc(l.name)} (+${l.value})</title><g class="landmark-inner"><circle r="5.5"/><text y="2.6">✦</text></g></g>`
    :`<g class="landmark" transform="translate(${f1(t.x)} ${f1(t.y)})"><title>Lieu remarquable caché</title><g class="landmark-inner"><circle r="7.5"/><text y="3.6">?</text></g></g>`;}
  // Météo annoncée : temps du jour posé au centre de chaque région.
  if(sky)for(const [id,w]of Object.entries(sky)){const c=REGION_CENTRES[id],label=`${REGIONS[id].name} · ${WEATHER[w].name}`;
   out+=`<g class="weather-badge w-${w}" transform="translate(${f1(c.x)} ${f1(c.y)})" aria-label="${esc(label)} : ${esc(WEATHER[w].effect)}"><g class="weather-badge-inner"><circle r="8"/><text class="weather-icon" y="3.4">${WEATHER[w].icon}</text></g></g>`;}
  adventure.innerHTML=out;
 }

 // ---------- Jetons des cyclistes, avec déplacement case par case ----------
 function tokenTarget(g,p){const t=g.board[p.pos];if(!t)return null;const same=(g.players||[]).filter(a=>a.pos===p.pos),offset=(same.indexOf(p)-(same.length-1)/2)*22;return {x:t.x+offset,y:t.y};}
 function animateToken(record,points,stepMs){
  record.anim&&(record.anim.cancelled=true);
  const anim={cancelled:false};record.anim=anim;
  // Pente : on monte lentement (danseuse), on descend vite ; fatigué, tout va plus lentement.
  const info=record.info||{},slope=points.slice(1).map((b,i)=>{const ra=MOUNT_RANK[points[i].type]||0,rb=MOUNT_RANK[b.type]||0;return rb>ra||(rb&&rb===ra)?'up':rb<ra?'down':'flat';});
  const lens=[];let total=0;for(let i=1;i<points.length;i++){const l=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y)*(slope[i-1]==='up'?1.6:slope[i-1]==='down'?.6:1);lens.push(l);total+=l;}
  const duration=Math.min(7000,stepMs*(points.length-1)*(info.tired?1.3:1)),start=clock();
  const follow=record.follow&&!reduced();let camS=camera.scale;const backTo=camera.scale;
  const step=()=>{if(anim.cancelled||destroyed)return;const k=Math.min(1,(clock()-start)/duration),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
   let dist=e*total,i=0;while(i<lens.length-1&&dist>lens[i]){dist-=lens[i];i++;}
   const a=points[i],b=points[i+1]||a,t=lens[i]?Math.min(1,dist/lens[i]):1;
   const bob=Math.abs(Math.sin(clock()*.012))*1.1;attrsTo(record.el,{transform:`translate(${f1(a.x+(b.x-a.x)*t)} ${f1(a.y+(b.y-a.y)*t-bob)})`});
   if(record.flip&&Math.abs(b.x-a.x)>1){const face=b.x<a.x?-1:1;if(face!==record.facing){record.facing=face;attrsTo(record.flip,{transform:face<0?'scale(-1 1)':''});}}
   const sl=slope[i]||'flat',speed=(sl==='down'?0:sl==='up'?.007:.012)*(info.tired?.55:1);record.crank=(record.crank||0)+speed*16;
   if(record.flip)record.flip.innerHTML=record.vehicle==='train'?trainArt(clock()/1000):(record.vehicle==='boat'?boatArt(clock()/1000):'')+riderFree(record.vehicle==='boat'?.6:record.crank,{stand:sl==='up'&&!record.vehicle,tuck:sl==='down'&&!record.vehicle,low:info.tired,sweat:info.tired?1:0,cape:info.cape});
   if(record.flag)attrsTo(record.flag,{d:flagPath(sl==='down'||info.windy?2.4:.7,clock()/1000)});
   if(follow){camS+=(ZOOM_FOLLOW-camS)*.08;camera.focus(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,{scale:Math.max(backTo,camS),animate:false});}
   if(k<1)raf(step);else{record.anim=null;record.vehicle='';record.el.classList?.remove('moving');record.follow=false;if(follow){clearTimeout(glideTimer);glideTimer=setTimeout(()=>{if(!destroyed)camera.focus(b.x,b.y,{scale:backTo,duration:1100});},1400);}idleDraw(record,clock()/1000);}};
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
// Pion B : cycliste chargé vu de profil (vers la droite) ; a = angle du pédalier (les roues et les jambes tournent).
 const MOUNT_RANK={moyenne_montagne:1,montagne:2,col:3},ZOOM_FOLLOW=2.6;
 // Pion B : cycliste chargé vu de profil (vers la droite). a = angle du pédalier ; o = pose (danseuse, descente, tête basse, cape, sueur).
 function riderFree(a,o={}){const f=(x,y)=>`${x.toFixed(2)} ${y.toFixed(2)}`;
  const W=cx=>{let s=`<circle class="rider-wheel" cx="${cx}" cy="5.6" r="5.4"/>`;for(let i=0;i<2;i++){const t=a+i*Math.PI/2,dx=Math.cos(t)*5.4,dy=Math.sin(t)*5.4;s+=`<line class="rider-spoke" x1="${(cx+dx).toFixed(2)}" y1="${(5.6+dy).toFixed(2)}" x2="${(cx-dx).toFixed(2)}" y2="${(5.6-dy).toFixed(2)}"/>`;}return s;};
  const stand=o.stand?1:0,tuck=o.tuck?1:0,low=o.low?1:0,hipX=-2.6+stand*2.4+tuck*.5,hipY=-3.5-stand*3.2+tuck,p1=f(Math.cos(a)*2.8,2+Math.sin(a)*2.8),p2=f(-Math.cos(a)*2.8,2-Math.sin(a)*2.8);
  const shX=2+stand*2.6+tuck*3,shY=-10-stand*2.2+tuck*4+low*1.2,hx=shX+2+tuck*1.6+low*1.4,hy=shY-2.6+low*2.4;
  let s=W(-8)+W(8)+'<path class="rider-frame" d="M-8 5.6 L-3 -1 L6 -1 L8 5.6 M-3 -1 L0 5.6 L6 -1 M0 5.6 L-8 5.6 M6 -1 L7 -5 L9.4 -5.3"/>'
   +'<rect class="rider-pannier" x="-13.4" y="-1.6" width="6.2" height="6.2" rx="1.3"/><rect class="rider-tent" x="-12.8" y="-5.2" width="9" height="3.6" rx="1.8"/>';
  if(o.noRider)return s;
  s+=`<path class="rider-leg back" d="M${f(hipX,hipY)} L${p2}"/><path class="rider-leg" d="M${f(hipX,hipY)} L${p1}"/>`;
  s+=o.cape?`<path class="rider-cape" d="M${f(hipX-3,hipY+1)} Q${f(shX-4,shY-1)} ${f(shX+1,shY-1)} L${f(shX+2,shY+3)} Q${f(hipX+2,hipY)} ${f(hipX-3,hipY+1)}Z"/>`:`<path class="rider-body" d="M${f(hipX-.4,hipY)} L${f(shX,shY)}"/>`;
  if(o.cheer){const w=Math.sin(o.cheer*10)*1.2;s+=`<path class="rider-arm" d="M${f(shX,shY+.5)} L${f(shX-2+w,shY-6)} M${f(shX,shY+.5)} L${f(shX+3-w,shY-6)}"/>`;}
  else if(o.eat){const up=(Math.sin(o.eat*5)+1)/2;s+=`<path class="rider-arm" d="M${f(shX,shY+.5)} L${f(shX+6,shY-1-up*1.5)}"/><circle class="rider-apple" cx="${(shX+7.6).toFixed(2)}" cy="${(shY-2-up*1.5).toFixed(2)}" r="2.2"/>`;}
  else s+=`<path class="rider-arm" d="M${f(shX,shY+.5)} L7.6 -5"/>`;
  s+=`<circle class="rider-head" cx="${hx.toFixed(2)}" cy="${hy.toFixed(2)}" r="2.6"/><path class="rider-helmet${o.cape?' cape':''}" d="M${f(hx-2.7,hy-.2)} A2.8 2.8 0 0 1 ${f(hx+2.7,hy-.4)} Z"/>`;
  if(o.sweat)s+=`<path class="rider-sweat" d="M${f(hx+3.6,hy-1)} q1 2 0 2.6 q-1 -.6 0 -2.6Z" style="opacity:${o.sweat}"/>`;
  return s;}
 // Pose au repos : le vélo debout, le cycliste assis à côté ; le soir, la tente montée.
 function riderSitting(t,o={}){const b=Math.sin(t*2)*.3,f=(x,y)=>`${x.toFixed(2)} ${y.toFixed(2)}`;
  let s=riderFree(.6,{noRider:true});
  s+=`<g transform="translate(15 4)"><path class="rider-leg" d="M-3 4 L3 4 L5 8"/><path class="rider-body" d="M-3 ${(3.6+b).toFixed(2)} L-2 -3"/><path class="rider-arm" d="M-2 -2 L3 1"/><circle class="rider-head" cx="-1.4" cy="${(-5.6+b).toFixed(2)}" r="2.6"/><path class="rider-helmet" d="M${f(-4.1,-5.8+b)} A2.8 2.8 0 0 1 ${f(1.3,-6+b)} Z"/>${o.sweat?`<path class="rider-sweat" d="M2 -7 q1 2 0 2.6 q-1 -.6 0 -2.6Z" style="opacity:${o.sweat}"/>`:''}</g>`;
  if(o.tent)s=`<g class="rider-camp" transform="translate(-24 8)"><path class="camp-tent" d="M-12 0 L0 -13 L12 0Z"/><path class="camp-door" d="M-3 0 L0 -6 L3 0Z"/></g>`+s;
  return s;}
 // Ferry : une coque sous le vélo et une petite vague derrière. Voyage rapide : un petit train à la place du vélo.
 function boatArt(t){const w=Math.sin(t*6)*.8;return `<path class="fx-wake" d="M-26 ${(12+w).toFixed(2)} q4 -2 8 0 t8 0 M-30 ${(15-w).toFixed(2)} q4 -2 8 0 t8 0"/><path class="fx-hull" d="M-17 8 L17 8 L13 14 L-13 14Z"/>`;}
 function trainArt(t){const b=Math.sin(t*20)*.3,puff=(t*1.5)%1;
  return `<g transform="translate(0 ${b.toFixed(2)})"><rect class="fx-wagon" x="-24" y="-6" width="16" height="11" rx="2"/><rect class="fx-loco" x="-6" y="-9" width="20" height="14" rx="2.5"/><rect class="fx-window" x="-2" y="-6" width="5" height="4" rx="1"/><rect class="fx-window" x="5" y="-6" width="5" height="4" rx="1"/><rect class="fx-window" x="-21" y="-3" width="4" height="3" rx="1"/><rect class="fx-window" x="-14" y="-3" width="4" height="3" rx="1"/><rect class="fx-chimney" x="9" y="-14" width="3.5" height="5"/>
   <circle class="fx-wheel" cx="-20" cy="6" r="2.4"/><circle class="fx-wheel" cx="-12" cy="6" r="2.4"/><circle class="fx-wheel" cx="-1" cy="6" r="2.8"/><circle class="fx-wheel" cx="9" cy="6" r="2.8"/></g>
   <circle class="fx-puff" cx="${(10-puff*8).toFixed(1)}" cy="${(-17-puff*6).toFixed(1)}" r="${(1.6+puff*2.4).toFixed(2)}" style="opacity:${(1-puff).toFixed(2)}"/>`;}
 // Bulle au-dessus du cycliste pendant une scène en route : clé (panne), gouttes (météo), cœur (belle rencontre), « ! » (autre galère).
 function bubbleArt(kind,t){const y=-38+Math.sin(t*3)*1.2;const icon={cle:'<path d="M-3.4 2.6 L1.6 -2.4 M1 -4.6 a2.4 2.4 0 1 0 3.4 3.4 l-1.4 -1.4 l-0.8 0.8 l-1 -1 l0.8 -0.8 Z" class="bub-ink"/>',pluie:'<path d="M-2.6 -3.4 q1.4 2.6 0 3.6 q-1.4 -1 0 -3.6Z M2.4 -1 q1.4 2.6 0 3.6 q-1.4 -1 0 -3.6Z" class="bub-rain"/>',coeur:'<path d="M0 3.6 C-5 0 -4.4 -4.4 -1.6 -4 C-.6 -3.8 0 -3 0 -2.4 C0 -3 .6 -3.8 1.6 -4 C4.4 -4.4 5 0 0 3.6Z" class="bub-heart"/>',alerte:'<path d="M0 -4.4 L0 1" class="bub-ink"/><circle cx="0" cy="3.2" r=".9" class="bub-dot"/>'}[kind]||'';
  return `<g class="rider-bubble" transform="translate(4 ${y.toFixed(2)})"><path class="bub-bg" d="M-8 -7 h16 a3 3 0 0 1 3 3 v8 a3 3 0 0 1 -3 3 h-5 l-3 4 l-1 -4 h-7 a3 3 0 0 1 -3 -3 v-8 a3 3 0 0 1 3 -3Z"/>${icon}</g>`;}
 // Effets ponctuels : drapeau planté + « +2 » doré (col), jeton qui se retourne (lieu caché), confettis (voyage réussi).
 function playFx(kind,x,y,o){const g=make('g',{class:'fx fx-'+kind,transform:`translate(${f1(x)} ${f1(y)})`});let html='',life=2600;
  if(kind==='col'){html=`<g class="fx-flag"><path class="fx-pole" d="M0 2 L0 -26"/><path class="fx-cloth" d="M0 -26 L12 -22 L0 -18Z"/></g><text class="fx-gain" x="6" y="-30">${esc(o.text||'+2')}</text>`;life=2800;}
  else if(kind==='landmark'){html=`<g class="fx-card"><rect x="-14" y="-12" width="28" height="22" rx="3"/><text class="fx-card-star" y="-1">✦</text><text class="fx-card-gain" y="7">${esc(o.text||'')}</text></g>${[0,1,2,3,4,5].map(i=>`<circle class="fx-spark" style="--a:${i*60}deg" r="1.4"/>`).join('')}${o.label?`<text class="fx-label" y="22">${esc(o.label)}</text>`:''}`;life=3200;}
  else if(kind==='voyage'){const cols=['#f2a541','#b8432e','#5f8a6a','#f6e7c1','#7fc0e8'];html=Array.from({length:22},(_,i)=>`<rect class="fx-confetti" x="-1.5" y="-1" width="3" height="2" style="fill:${cols[i%5]};--a:${(i*360/22+Math.random()*12).toFixed(0)}deg;--d:${(22+Math.random()*22).toFixed(0)}px;--r:${(Math.random()*540-270).toFixed(0)}deg;animation-delay:${(Math.random()*.25).toFixed(2)}s"/>`).join('')+(o.text?`<text class="fx-gain big" y="-34">${esc(o.text)}</text>`:'');life=3400;}
  g.innerHTML=html;fxLayer.append(g);setTimeout(()=>g.remove(),life);}
 function flagPath(amp,t){const w=Math.sin(t*(amp>1?14:4))*amp;return `M-12 -2 L-12 -25 M-12 -25 Q-6 ${(-24+w).toFixed(2)} ${(Math.abs(w)*.3).toFixed(2)} ${(-21.5+w*.6).toFixed(2)} Q-6 ${(-19+w).toFixed(2)} -12 -17.5 Z`;}
 // Animation au repos (environ 12 images par seconde) : fanion, respiration, sueur, pluie et neige autour du cycliste.
 function idleDraw(record,t){const o=record.info||{};if(!record.flip||record.anim)return;
  const sweat=o.tired?((Math.sin(t*1.6)+1)/2).toFixed(2):0;
  const now=clock(),cheer=(record.cheerUntil||0)>now,eat=(record.eatUntil||0)>now;
  record.flip.innerHTML=o.sit&&!cheer&&!eat?riderSitting(t,{tent:o.tent,sweat}):riderFree(.6,{low:o.tired&&!cheer,cape:o.cape,sweat:cheer?0:sweat,cheer:cheer?t:0,eat:eat?t:0});
  if(record.flag)attrsTo(record.flag,{d:flagPath(o.windy?2.4:o.tired?.25:.6,t)});
  if(record.fx){let fx='';
   if(o.cape)for(let i=0;i<5;i++){const x=-16+i*8,y=((t*40+i*13)%30)-22;fx+=`<path class="fx-rain" d="M${x} ${y.toFixed(1)} l-1.4 4"/>`;}
   if(o.weather==='neige')for(let i=0;i<5;i++){const x=-16+i*8+Math.sin(t+i)*2,y=((t*8+i*9)%30)-22;fx+=`<circle class="fx-snow" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1"/>`;}
   if(o.tired>1&&!o.sit){const k=(t*1.2)%1;fx+=`<circle class="fx-puff" cx="${(12+k*5).toFixed(1)}" cy="${(-10-k*2).toFixed(1)}" r="${(1+k*1.6).toFixed(2)}" style="opacity:${(1-k).toFixed(2)}"/>`;}
   if(o.bubble)fx+=bubbleArt(o.bubble,t);
   record.fx.innerHTML=fx;}}
 let idleRaf=0,idleLast=0,spotSaved=null,animEnd=0;
 function startIdle(){if(idleRaf||destroyed||!browser())return;const loop=()=>{idleRaf=0;if(destroyed)return;const t=clock();if(!reduced()&&t-idleLast>80){idleLast=t;for(const r of playerNodes.values())idleDraw(r,t/1000);}idleRaf=raf(loop);};idleRaf=raf(loop);}
 const followingNow=()=>[...playerNodes.values()].some(r=>r.anim&&r.follow);
 // Trace du voyage : pointillés crème d'une case à l'autre (les jours passés plus pâles), et les nuits posées sur la carte.
 let journeySig='';
 const NIGHT_MARKS={bivouac:['Bivouac','<path d="M-4 3 L0 -4 L4 3Z" class="nm-tent"/>'],camping:['Camping','<path d="M0 -4.5 L-3.6 0.6 L3.6 0.6Z M0 -1.8 L-4.4 3.4 L4.4 3.4Z" class="nm-tree"/>'],hotel:['Hôtel','<rect x="-4.4" y="-0.6" width="8.8" height="3.2" class="nm-bed"/><rect x="-4.4" y="-3.4" width="3" height="2.6" class="nm-pillow"/>'],demander:['Chez l’habitant','<rect x="-3.2" y="-1" width="6.4" height="4.4" class="nm-bed"/><path d="M-4.4 -1 L0 -4.8 L4.4 -1Z" class="nm-roof"/>'],dehors:['Nuit dehors','<path d="M1.8 -3.6 A3.6 3.6 0 1 0 2.6 2.8 A2.8 2.8 0 1 1 1.8 -3.6Z" class="nm-moon"/>']};
 function drawJourneys(g,list,today){const sig=today+'|'+list.map(j=>j.color+':'+(j.steps||[]).length+':'+(j.nights||[]).length+':'+(j.start||'')).join('|');if(sig===journeySig)return;journeySig=sig;
  journeys.replaceChildren();nightsLayer.replaceChildren();
  for(const j of list){const steps=j.steps||[];let prev=j.start&&g.board[j.start]?{key:j.start,day:0}:null;let segs=[];
   for(const h of steps){const t=g.board[h.key];if(!t)continue;const pt=g.board[prev?.key];if(prev&&pt&&(pt.links||[]).includes(h.key))segs.push({a:pt,b:t,old:(h.day||0)<today});prev=h;}
   const line=(old)=>{const d=segs.filter(s=>s.old===old).map(s=>`M${f1(s.a.x)} ${f1(s.a.y)} L${f1(s.b.x)} ${f1(s.b.y)}`).join(' ');if(d)journeys.append(make('path',{class:'journey-case'+(old?' old':''),d}),make('path',{class:'journey-line'+(old?' old':''),d}));};
   line(true);line(false);
   const last=new Map();for(const n of j.nights||[])last.set(n.key,n);
   for(const n of last.values()){const t=g.board[n.key],mk=NIGHT_MARKS[n.kind];if(!t||!mk)continue;const el=make('g',{class:'night-mark nm-'+n.kind,transform:`translate(${f1(t.x+11)} ${f1(t.y+9)})`});el.innerHTML=`<title>Jour ${n.day} · ${mk[0]}</title><circle r="6.6"/>`+mk[1];nightsLayer.append(el);}}}
 // Cycliste vu de profil, centré sur la case : roues, cadre et maillot à la couleur du joueur (--rider).
 const RIDER_SVG='<circle class="rider-wheel" cx="-6.6" cy="5" r="4.6"/><circle class="rider-wheel" cx="6.6" cy="5" r="4.6"/>'
  +'<path class="rider-frame" d="M-6.6 5 L-2.4 -1.6 L5 -1.6 L6.6 5 M-2.4 -1.6 L0.6 5 L5 -1.6 M0.6 5 L-6.6 5 M5 -1.6 L5.8 -4.2 L7.6 -4.4"/>'
  +'<path class="rider-leg" d="M-2.6 -3.4 L1.6 0.2 L0.6 5"/><path class="rider-body" d="M-2.8 -3.6 L1.4 -9"/><path class="rider-arm" d="M1.4 -8.6 L5.6 -4.6"/>'
  +'<circle class="rider-head" cx="3.2" cy="-11.4" r="2.5"/><path class="rider-helmet" d="M0.6 -11.6 A2.7 2.7 0 0 1 5.8 -11.8 Z"/><path class="rider-bag" d="M-7.6 -2.2 h4 v3 h-4 Z"/>';
 function drawTokens(g,prev){
  const playerKeys=new Set(),players=g.players||[];let longest=0;
  for(const p of players){const target=tokenTarget(g,p);if(!target)continue;playerKeys.add(p.id);
   let record=playerNodes.get(p.id);
   if(!record){
    // Pion : un médaillon crème avec un cycliste sur son vélo (couleur du joueur), et le numéro du joueur dans une pastille.
    // Pion « cycliste libre » (planche « Le pion du cycliste », choix B) : le cycliste chargé posé sur la carte, avec un fanion à sa couleur.
    record={el:make('g',{class:'rider-token free'}),inner:make('g',{class:'rider-inner'}),shadow:make('ellipse',{class:'rider-shadow',cx:0,cy:10,rx:13,ry:3.4}),dust:make('g',{class:'rider-dust'}),flip:make('g',{class:'rider-flip'}),flag:make('path',{class:'rider-flag',d:'M-12 -2 L-12 -25 M-12 -25 Q-5 -24 0 -21.5 Q-5 -19 -12 -17.5 Z'}),text:make('text',{class:'player-number',x:-6.6,y:-19}),pos:p.pos,facing:1};
    record.dust.innerHTML='<circle cx="-14" cy="8" r="2.2"/><circle cx="-19" cy="6" r="1.4"/>';record.flip.innerHTML=riderFree(.6);record.fx=make('g',{class:'rider-fx'});record.inner.append(record.shadow,record.dust,record.flip,record.flag,record.text,record.fx);record.el.append(record.inner);tokens.append(record.el);playerNodes.set(p.id,record);}
   attrsTo(record.el,{class:`rider-token free${p.id===g.id?' active':''}${record.anim?' moving':''}`,'aria-label':p.name});
   attrsTo(record.flip,{style:`--rider:${p.color}`});attrsTo(record.flag,{style:`fill:${p.color}`});record.info=(state?.riders||{})[p.id]||{};if(record.text.textContent!==p.id.slice(1))record.text.textContent=p.id.slice(1);
   const moved=record.pos!==p.pos,from=g.board[record.pos];record.pos=p.pos;
   if(moved&&from&&Math.abs(target.x-from.x)>1){record.facing=target.x<from.x?-1:1;attrsTo(record.flip,{transform:record.facing<0?'scale(-1 1)':''});}// le cycliste regarde dans le sens de la route
   if(moved&&from&&prev&&!reduced()&&browser()){
    // Chemin affiché : l'itinéraire qui venait d'être choisi, sinon le ferry, sinon un glissement direct.
    const r=prev.route||[],ferry=(g.edges||[]).find(e=>e.ferry&&((e.a===from.key&&e.b===p.pos)||(e.b===from.key&&e.a===p.pos)));
    let pts,stepMs=STEP_MS;
    const steps=travelTail(g,p,from);
    if(steps)pts=[from,...steps].map(t=>({x:t.x,y:t.y,type:t.type}));
    else if(prev.activeId===p.id&&r.length&&r.at(-1)===p.pos)pts=[from,...r.map(k=>g.board[k]).filter(Boolean)].map(t=>({x:t.x,y:t.y,type:t.type}));
    else if(ferry){const arc=ferryArc(g.board[ferry.a],g.board[ferry.b]),fwd=ferry.a===from.key;pts=Array.from({length:17},(_,i)=>arc.point(fwd?i/16:1-i/16));stepMs=130;record.vehicle='boat';}
    else{pts=[{x:from.x,y:from.y},{x:target.x,y:target.y}];if(record.info?.train){record.vehicle='train';stepMs=2600;}}
    pts[pts.length-1]={x:target.x,y:target.y,type:pts[pts.length-1].type};record.follow=p.id===g.id&&!ferry&&pts.length>2;
    if(pts.length>1){longest=Math.max(longest,animateToken(record,pts,pts.length===2&&record.vehicle!=='train'?Math.min(1100,Math.max(STEP_MS,Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y)*6)):stepMs));continue;}
   }
   if(record.anim&&!moved)continue;// une animation en cours garde la main jusqu'au bout
   record.anim&&(record.anim.cancelled=true);record.anim=null;
   attrsTo(record.el,{transform:`translate(${f1(target.x)} ${f1(target.y)})`});idleDraw(record,clock()/1000);
  }
  prune(playerNodes,playerKeys);startIdle();
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
  drawGuide(g,editMode?[]:(state.guidePath||[]),editMode?'':(state.guideFocus||''));
  drawZones(g,editMode?[]:(state.zones||[]));
  drawJourneys(g,editMode?[]:(state.journeys||[]),state.today||0);
  drawHalos(g,selected,editMode);
  drawAdventure(g,editMode);
  const moveMs=drawTokens(g,previous);if(moveMs)animEnd=Math.max(animEnd,clock()+moveMs);
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
  else if(moveMs&&activePos&&!followingNow()&&!camera.isVisible(activePos.x,activePos.y,60)){clearTimeout(glideTimer);glideTimer=setTimeout(()=>{if(!destroyed)camera.focus(activePos.x,activePos.y,{duration:600});},Math.min(moveMs,500));}
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
  // Effets ponctuels sur la carte (col franchi, jeton révélé, voyage réussi) et gestes du cycliste (bras levés, pomme).
  effect(kind,key,opts={}){if(reduced()||!state)return;const t=state.g?.board?.[key];if(!t)return;playFx(kind,t.x,t.y,opts);},
  gesture(playerId,kind,ms=1800){const r=playerNodes.get(playerId);if(!r||reduced())return;r[kind==='cheer'?'cheerUntil':'eatUntil']=clock()+ms;startIdle();},
  // Temps restant de l'animation du pion (ms) : les fenêtres attendent la fin pour s'ouvrir.
  busyFor(){return Math.max(0,animEnd-clock());},
  // Zoom sur le cycliste pendant une action (le soir, la nuit) puis retour à la vue d'avant.
  spotlight(on){if(reduced()||!state)return;const g=state.g,t=g?.board?.[g.pos];if(!t)return;
   if(on&&spotSaved==null){spotSaved=camera.scale;camera.focus(t.x,t.y,{scale:Math.max(camera.scale,2.4),duration:750});}
   else if(!on&&spotSaved!=null){const back=spotSaved;spotSaved=null;camera.focus(t.x,t.y,{scale:back,duration:750});}},
  getCamera(){return camera.view();},
  setDisplayPrefs(next={}){for(const [k,v]of Object.entries(next))prefs=writeDisplayPref(k,v);drawWeatherState();drawMinimapState();if(state&&!destroyed)update(state);return {...prefs};},
  getDisplayPrefs(){return {...prefs};},
  setArt(on){artWanted=Boolean(on);writeArtPreference(artWanted);if(state&&!destroyed)update(state);return artOn();},
  isArtOn:artOn,artAvailable:()=>Boolean(artLayer),
  getDiagnostics(){return {...diagnostics,landCells:cells.size,art:artOn()};},
  destroy(){if(destroyed)return;destroyed=true;clearTimeout(sceneryTimer);clearTimeout(glideTimer);camera.destroy();svg.removeEventListener('click',click);svg.removeEventListener('keydown',keydown);svg.removeEventListener('pointermove',move);svg.removeEventListener('pointerleave',leave);picker.removeEventListener('submit',submit);miniBody.removeEventListener('pointerdown',miniDown);miniBody.removeEventListener('pointermove',miniMove);miniBody.removeEventListener('pointerup',miniUp);miniBody.removeEventListener('pointercancel',miniUp);miniToggle.removeEventListener('click',miniClick);svg.remove();artLayer?.destroy();picker.remove();mini.remove();weather.remove();cells.clear();cityNodes.clear();routeNodes.clear();playerNodes.clear();ferryNodes.clear();state=context=hit=callback=null;}
 };
}

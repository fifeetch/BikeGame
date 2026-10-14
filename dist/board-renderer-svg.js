import {MAP_WIDTH,MAP_HEIGHT} from './europe.js';
import {tileArtwork,seaArtwork,seaPath,polygonPoints,mapContext,tilePresentation} from './europe-map.js';
import {createHexHitIndex} from './board-hit-test.js';

const NS='http://www.w3.org/2000/svg';
const clock=()=>globalThis.performance?.now?.()??Date.now();
export function createSVGBoardRenderer(container){
 const doc=container.ownerDocument,make=(tag,attrs={})=>{const el=doc.createElementNS(NS,tag);attrsTo(el,attrs);return el;};
 function attrsTo(el,attrs){for(const [key,value]of Object.entries(attrs)){if(value===null){if(el.hasAttribute(key))el.removeAttribute(key);}else if(el.getAttribute(key)!==String(value))el.setAttribute(key,String(value));}}
 const svg=make('svg',{class:'playable-europe supplied-map',viewBox:`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`,'aria-label':'Plateau Europe sur grille régulière : chaque hexagone a la même taille'});
 svg.innerHTML=tileArtwork+seaArtwork;
 const ocean=make('rect',{class:'map-ocean',width:MAP_WIDTH,height:MAP_HEIGHT}),sea=make('path',{class:'board-sea-face',fill:'url(#board-sea-pattern)'});
 const lands=make('g',{class:'hex-cells'}),cities=make('g',{class:'city-names','aria-hidden':true}),numbers=make('g',{class:'route-numbers','aria-hidden':true}),tokens=make('g',{class:'map-symbols','aria-hidden':true}),seaCursor=make('g',{class:'board-sea-cursor','aria-hidden':true});
 svg.append(ocean,sea,lands,cities,numbers,tokens,seaCursor);container.append(svg);
 const cells=new Map(),cityNodes=new Map(),routeNodes=new Map(),playerNodes=new Map();
 let state=null,context=null,hit=null,geometry='',seaSignature='',hoverKey='',callback=null,destroyed=false,camera={zoom:1.05};
 let diagnostics={updates:0,changedCells:0,createdCells:0,removedCells:0,seaRebuilt:false,lastUpdateMs:0};
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
 const click=e=>{if(destroyed||!state)return;const key=eventKey(e);if(key)select(key);};
 const keydown=e=>{if(!['Enter',' '].includes(e.key)||!state)return;const key=e.target.closest?.('[data-board-key]')?.getAttribute('data-board-key');if(key){e.preventDefault();select(key);}};
 const move=e=>{if(!state?.editMode)return;const key=eventKey(e)||'';if(key===hoverKey)return;hoverKey=key;const t=state.g.board[key];if(t){qInput.value=t.q;rInput.value=t.r;notice.textContent=t.name||t.type;}showSeaCursor(key);};
 const leave=()=>{hoverKey='';showSeaCursor('');};
 const submit=e=>{e.preventDefault();const q=Number(qInput.value),r=Number(rInput.value),t=qInput.value!==''&&rInput.value!==''&&Number.isInteger(q)&&Number.isInteger(r)?hit?.atAxial(q,r):null;if(!t){notice.textContent='Cette case est hors du plateau.';return;}select(t.key);};
 svg.addEventListener('click',click);svg.addEventListener('keydown',keydown);svg.addEventListener('pointermove',move);svg.addEventListener('pointerleave',leave);picker.addEventListener('submit',submit);
 function prune(records,keys){for(const [key,record]of records)if(!keys.has(key)){record.el.remove();records.delete(key);}}
 function update(next){
  if(destroyed)throw Error('Renderer SVG détruit.');const started=clock();state=next;
  const {g,reachable=[],cost=()=>0,selected='',route=[],nextSteps=[],editMode=false}=state;
  context=mapContext(g,reachable,cost,selected,route,nextSteps,editMode);diagnostics={...diagnostics,updates:diagnostics.updates+1,changedCells:0,createdCells:0,removedCells:0,seaRebuilt:false};
  attrsTo(svg,{class:`playable-europe supplied-map ${editMode?'map-edit-mode':''}`});
  const nodes=Object.values(g.board),shape=nodes.map(t=>`${t.key}:${t.x}:${t.y}`).join('|');
  if(shape!==geometry){geometry=shape;hit=createHexHitIndex(g.board);}
  const seaKeys=nodes.filter(t=>t.type==='mer').map(t=>`${t.key}:${t.x}:${t.y}`).join('|');
  if(seaKeys!==seaSignature){seaSignature=seaKeys;attrsTo(sea,{d:seaPath(g.board)});diagnostics.seaRebuilt=true;}
  const landKeys=new Set();
  for(const t of nodes){if(t.type==='mer')continue;landKeys.add(t.key);const p=tilePresentation(context,t),signature=JSON.stringify([p,t.type,t.x,t.y]);let record=cells.get(t.key);
   if(!record){const el=make('g',{'data-board-key':t.key}),polygon=make('polygon',{class:'terrain-face'}),icon=make('use',{class:'terrain-icon',width:14,height:14,'aria-hidden':true});el.append(polygon,icon);lands.append(el);record={el,polygon,icon,signature:''};cells.set(t.key,record);diagnostics.createdCells++;}
   if(record.signature===signature)continue;record.signature=signature;diagnostics.changedCells++;
   attrsTo(record.el,{class:p.className,'aria-label':p.label,'aria-pressed':p.pressed,'aria-disabled':p.canSelect?null:true,'data-move':p.canSelect?t.key:null,role:p.canSelect?'button':null,tabindex:p.canSelect?'0':null});
   attrsTo(record.polygon,{points:polygonPoints(t)});attrsTo(record.icon,{href:`#tile-icon-${t.type}`,x:t.x-7,y:t.y-7});
  }
  diagnostics.removedCells=[...cells.keys()].filter(k=>!landKeys.has(k)).length;prune(cells,landKeys);
  const cityKeys=new Set();
  for(const t of nodes.filter(t=>t.name)){cityKeys.add(t.key);let record=cityNodes.get(t.key);if(!record){record={el:make('text',{class:'city-name','data-city-key':t.key})};cities.append(record.el);cityNodes.set(t.key,record);}attrsTo(record.el,{x:t.x,y:t.y+25});if(record.el.textContent!==t.name)record.el.textContent=t.name;}
  prune(cityNodes,cityKeys);
  const routeKeys=new Set();
  route.forEach((key,i)=>{const t=g.board[key];if(!t)return;routeKeys.add(key);let record=routeNodes.get(key);if(!record){record={el:make('g'),text:make('text',{y:3})};record.el.append(make('circle',{r:9}),record.text);numbers.append(record.el);routeNodes.set(key,record);}attrsTo(record.el,{transform:`translate(${t.x} ${t.y})`});if(record.text.textContent!==String(i+1))record.text.textContent=String(i+1);});
  prune(routeNodes,routeKeys);
  const playerKeys=new Set(),players=g.players||[];
  for(const p of players){const t=g.board[p.pos];if(!t)continue;playerKeys.add(p.id);let record=playerNodes.get(p.id);if(!record){record={el:make('g',{class:'rider-token'}),circle:make('circle',{class:'rider-base',r:11}),text:make('text',{class:'player-number',y:4})};record.el.append(record.circle,record.text);tokens.append(record.el);playerNodes.set(p.id,record);}const same=players.filter(a=>a.pos===p.pos),offset=(same.indexOf(p)-(same.length-1)/2)*14;attrsTo(record.el,{transform:`translate(${t.x+offset} ${t.y})`,'aria-label':p.name});attrsTo(record.circle,{style:`fill:${p.color};stroke:white`});if(record.text.textContent!==p.id.slice(1))record.text.textContent=p.id.slice(1);}
  prune(playerNodes,playerKeys);
  picker.hidden=!editMode;
  if(editMode){const owner=container.closest('.map-wrap')||container;if(picker.parentElement!==owner)owner.append(picker);showSeaCursor(hoverKey);}else if(picker.parentElement)picker.remove();
  diagnostics.lastUpdateMs=clock()-started;
 }
 function setCamera(next={}){
  if(destroyed)return;
  if(Number.isFinite(next.zoom)&&next.zoom>0)camera.zoom=next.zoom;
  container.style.width=MAP_WIDTH*camera.zoom+'px';container.style.height=MAP_HEIGHT*camera.zoom+'px';
  const viewport=container.parentElement;
  if(viewport&&(Number.isFinite(next.x)||Number.isFinite(next.y))){camera={...camera,...next};viewport.scrollTo({left:Number.isFinite(next.x)?Math.max(0,container.offsetLeft+next.x*camera.zoom-viewport.clientWidth/2):viewport.scrollLeft,top:Number.isFinite(next.y)?Math.max(0,container.offsetTop+next.y*camera.zoom-viewport.clientHeight/2):viewport.scrollTop,behavior:next.behavior||'auto'});}
 }
 return {
  update,onHexClick(fn){callback=fn;},setCamera,
  getDiagnostics(){return {...diagnostics,landCells:cells.size};},
  destroy(){if(destroyed)return;destroyed=true;svg.removeEventListener('click',click);svg.removeEventListener('keydown',keydown);svg.removeEventListener('pointermove',move);svg.removeEventListener('pointerleave',leave);picker.removeEventListener('submit',submit);svg.remove();picker.remove();cells.clear();cityNodes.clear();routeNodes.clear();playerNodes.clear();state=context=hit=callback=null;}
 };
}

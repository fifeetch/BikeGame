import * as E from './engine.js';
import * as S from './simulator.js';
import {CLASSIC,COLORS,clone,validateRules,upgradeStoredRules,setPath,energyCap,isExhausted} from './rules.js';
import {drawVoyages,progress,voyages,voyageTier,findVoyage,TUTORIAL_VOYAGE} from './voyages.js';
import {createBoardRenderer,boardSnapshotMarkup} from './board-renderer.js';
import {artFor} from './tile-art.js';
import {MAP_WIDTH,MAP_HEIGHT,FERRY_ROUTES} from './europe.js';
import {CARD_PRESETS,cardById as findCard,effectiveCards,makeCustomCard,normalizeCustomCards} from './cards.js';
import {renderCardEditor} from './card-editor.js';
import {readArtPreference} from './terrain-art.js';
import {readDisplayPrefs,writeDisplayPref} from './display-prefs.js';
import {titleScreen,plateauScreen,playersScreen,garageScreen,voyagesScreen,onlineScreen} from './menus.js';
import {rulesIntro,rulesHelp,HELP_TABS} from './rules-help.js';
import * as SAVES from './saves.js';
import {partiesScreen} from './menus.js';
import * as NET from './online.js';
import {europeBoard} from './europe.js';
import {EVENT_CARDS,eventCardById as resolveEventCard,normalizeEventEdits} from './event-cards.js';
import {eventFace} from './event-card-ui.js';
import {EDITABLE_TERRAINS,normalizeMap,applyMap} from './map-library.js';
import {WEATHER,REGIONS} from './weather.js';
import * as CARNET from './carnet-data.js';
import {variantsFor,validVariant} from './terrain-variants.js';
import * as TUTO from './tutorial.js';
import {drawVariantPreview} from './terrain-dynamic.js';
const app=document.querySelector('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let artPref=readArtPreference(),displayPrefs=readDisplayPrefs(),sheetDrawer=false;
const btn=(text,action,cls='',disabled=false)=>action==='mapedit'?'':`<button class="${cls}" data-action="${action}" ${disabled?'disabled':''}>${text}</button>`;
const equipmentIcons={tente:'⛺',rechaud:'🍳',chambre:'🛞',kit:'🧰',gps:'🧭',duvet:'🛏️',secours:'🩹',sacoches:'🎒'};
const equipmentDescriptions={tente:'Permet le bivouac',rechaud:'Manger hors ville ou auberge',chambre:'Pièce de rechange pour le vélo',kit:'Répare les crevaisons',gps:'Quitter la route sans pénalité',duvet:'Améliore le repos',secours:'Soigne les blessures',sacoches:'Offre des provisions'};
let m=null,screen='home',modal='',mode='plateau',roster=[{name:'Joueur 1',bike:'gravel'}],choosing=0,drawn=[],setupRules=clone(CLASSIC),draft=null,message='',zoom=1,selected=0,mapSelection='',route=[],cardIndex=-1,ferryTarget='',sheetTab='velo',auto=localStorage.getItem('velo-auto')!=='false',profiles={};
const eventCardById=id=>resolveEventCard(id,m);
const cardById=id=>m?.cardVersion===3?eventCardById(id):findCard(id,m);
let eventActorId='',eventTargetId='',privacyCover=false;
try{setupRules=validateRules(upgradeStoredRules(JSON.parse(localStorage.getItem('velo-setup-rules')||'null')));}catch{message='Profil de départ illisible : règles classiques chargées.';}
let splitView=localStorage.getItem('velo-split-view')!=='false';
let splitWidth=Math.max(30,Math.min(50,Number(localStorage.getItem('velo-split-width'))||40));
let renderedSheetTurn='';
let mapEditMode=false,mapEditKey='',customMap={},maps=[],editingMapId='',selectedMapId='',editorGame=null,editorName='Ma carte',editorColEffort=CLASSIC.terrain.col;
const liveBoardSupported=typeof document.createElementNS==='function';
const artButton=()=>liveBoardSupported?btn('🖼️<span class="tool-label"> Illustrations</span>','art',artPref?'active':''):'';
let boardRenderer=null,boardElement=null,boardRenderState=null;
function boardSurfaceMarkup(state){
 boardRenderState=state;
 return `<div class="europe-world" data-board-host="svg" style="width:${MAP_WIDTH*1.05*zoom}px;height:${MAP_HEIGHT*1.05*zoom}px">${liveBoardSupported?'':boardSnapshotMarkup(state)}</div>`;
}
function mountBoard(){
 if(!liveBoardSupported)return;
 const placeholder=document.querySelector('[data-board-host]');
 if(!placeholder||!boardRenderState){boardRenderer?.destroy();boardRenderer=null;boardElement=null;return;}
 if(!boardElement){boardElement=placeholder;boardRenderer=createBoardRenderer(boardElement,{kind:'svg'});boardRenderer.onHexClick(handleBoardHex);}
 else placeholder.replaceWith(boardElement);
 boardRenderer.update(boardRenderState);
}
function handleBoardHex(key){
 if(screen==='map-editor'){editorName=(document.querySelector('#editor-map-name')?.value||editorName).trim()||'Ma carte';mapEditKey=key;modal='map-editor';render();return;}
 if(m?.phase==='move'){
  if(m.mode==='plateau'&&S.ferryOptions(m).some(t=>t.key===key)&&!route.length){ferryTarget=key;modal='ferry';}
  else if(route.includes(key)){const index=route.indexOf(key);route=route.slice(0,index);mapSelection=route.at(-1)||'';}
  else{const candidate=[...route,key],check=S.routeCheck(m,candidate);if(check.ok){route=candidate;mapSelection=key;}else{mapSelection=key;message=check.reason;}}
 }else mapSelection=key;
 render();
}
let customCards=[],cardDraft={id:'',title:'',template:CARD_PRESETS[0].id};
try{customCards=normalizeCustomCards(JSON.parse(localStorage.getItem('velo-custom-cards')||'[]'));}catch{message='Bibliothèque de cartes illisible : les données locales ont été conservées sans être chargées.';}
function storeCustomCards(cards){localStorage.setItem('velo-custom-cards',JSON.stringify(cards.map(({id,title,template})=>({id,title,template}))));customCards=cards;}
function resetCardDraft(){cardDraft={id:'',title:'',template:CARD_PRESETS[0].id};}
function saveCustomCard(){const title=(document.querySelector('#card-editor-title')?.value||'').trim(),template=document.querySelector('#card-editor-preset')?.value||cardDraft.template,id=cardDraft.id||('custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));const card=makeCustomCard({id,title,template}),next=customCards.filter(c=>c.id!==id);next.push(card);storeCustomCards(normalizeCustomCards(next));cardDraft={id:card.id,title:card.title,template:card.template};return card;}
function downloadCardLibrary(){const data={version:1,cards:customCards.map(({id,title,template})=>({id,title,template}))},blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='cartes-velo.json';link.click();URL.revokeObjectURL(url);}
let eventEdits=[],eventDraft={slotId:'evt-01',templateId:'evt-01',name:'',description:''};
try{eventEdits=normalizeEventEdits(JSON.parse(localStorage.getItem('velo-event-card-edits')||'[]'));}catch{message='Variantes Événement illisibles : les données locales ont été conservées sans être chargées.';}
function resetEventDraft(slotId='evt-01'){const base=EVENT_CARDS.find(c=>c.id===slotId)||EVENT_CARDS[0],edit=eventEdits.find(c=>c.slotId===base.id);eventDraft={slotId:base.id,templateId:edit?.templateId||base.id,name:edit?.name||base.name,description:edit?.description||base.description};}
resetEventDraft();
function storeEventEdits(edits){const clean=normalizeEventEdits(edits);localStorage.setItem('velo-event-card-edits',JSON.stringify(clean));eventEdits=clean;}
function saveEventEdit(){const slotId=document.querySelector('#event-editor-slot')?.value||eventDraft.slotId,templateId=document.querySelector('#event-editor-effect')?.value||eventDraft.templateId,name=document.querySelector('#event-editor-name')?.value||'',description=document.querySelector('#event-editor-description')?.value||'',base=EVENT_CARDS.find(c=>c.id===slotId);const candidate={slotId,templateId,name,description},next=eventEdits.filter(edit=>edit.slotId!==slotId);if(!base)throw Error('Choisis une carte officielle.');if(templateId!==base.id||name.trim()!==base.name||description.trim()!==base.description)next.push(candidate);storeEventEdits(next);resetEventDraft(slotId);return base;}
function downloadEventEdits(){const blob=new Blob([JSON.stringify({version:2,eventCardEdits:eventEdits},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='variantes-evenement-velo.json';link.click();URL.revokeObjectURL(url);}
// Carte n° 11 : le plateau a été reconstruit sur la vraie géographie. Les cartes créées dans l'éditeur visaient
// l'ancienne grille : elles sont supprimées une seule fois (une copie de secours est gardée dans ce navigateur).
try{if(localStorage.getItem('velo-maps-grille')!=='11'){for(const k of ['velo-maps','velo-custom-map']){const old=localStorage.getItem(k);if(old)localStorage.setItem(k+'-ancienne-grille',old);localStorage.removeItem(k);}localStorage.setItem('velo-maps-grille','11');}}catch{/* stockage indisponible */}
try{maps=JSON.parse(localStorage.getItem('velo-maps')||'[]').map(entry=>({id:String(entry.id),...normalizeMap(entry)}));}catch{maps=[];}
try{const legacy=JSON.parse(localStorage.getItem('velo-custom-map')||'{}');if(!maps.length&&Object.keys(legacy).length){const cells=Object.fromEntries(Object.entries(legacy).filter(([key])=>/^[-\d]+,[-\d]+$/.test(key)));maps=[{id:'legacy',...normalizeMap({name:'Ma carte',cells})}];localStorage.setItem('velo-maps',JSON.stringify(maps));}}catch{}
const findMap=id=>maps.find(map=>map.id===id);
function storeMaps(){localStorage.setItem('velo-maps',JSON.stringify(maps));}
function rebuildMapLinks(game){const dirs=[[1,0],[1,1],[0,1],[-1,0],[-1,-1],[0,-1]],nodes=Object.values(game.board),byAxial=new Map(nodes.map(t=>[`${t.q},${t.r}`,t])),edges=[];for(const t of nodes)t.links=[];const link=(a,b,ferry=false)=>{if(!a||!b||a===b||a.links.includes(b.key))return;a.links.push(b.key);b.links.push(a.key);edges.push({a:a.key,b:b.key,ferry});};for(const t of nodes)if(t.type!=='mer')for(const [dq,dr]of dirs){const n=byAxial.get(`${t.q+dq},${t.r+dr}`);if(n&&n.type!=='mer')link(t,n);}for(const [a,b]of FERRY_ROUTES)link(nodes.find(t=>t.name===a),nodes.find(t=>t.name===b),true);game.edges=edges;}
function applyCustomMap(game,definition){if(game?.mode!=='plateau'||!definition)return;applyMap(game,definition);rebuildMapLinks(game);}
function editorDefinition(){return normalizeMap({name:editorName,cells:customMap,terrain:{col:editorColEffort}});}
function buildEditorGame(cells=customMap){const game=E.makeGame('gravel',1,'traversee','plateau');applyCustomMap(game,{name:editorName,cells,terrain:{col:editorColEffort}});return game;}
function mapIsPlayable(game){const start=game.board['city-Paris'];if(!start)return false;const seen=new Set([start.key]),pending=[start.key];while(pending.length)for(const key of game.board[pending.shift()].links)if(!seen.has(key)){seen.add(key);pending.push(key);}return Object.values(game.board).filter(t=>t.name).every(t=>seen.has(t.key));}
function openEditor(id=''){const chosen=findMap(id);editingMapId=chosen?.id||'';customMap=clone(chosen?.cells||{});editorName=chosen?.name||'Ma carte';editorColEffort=chosen?.terrain.col??CLASSIC.terrain.col;editorGame=buildEditorGame();mapEditKey='';mapSelection='';zoom=1;screen='map-editor';modal='';}
function saveEditedMap(){const definition=editorDefinition();if(!mapIsPlayable(editorGame))throw Error('La carte isole une ville du réseau : corrige les cases de mer avant d’enregistrer.');const id=editingMapId||('map-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));const entry={id,...definition};const index=maps.findIndex(map=>map.id===id);if(index<0)maps.push(entry);else maps[index]=entry;storeMaps();editingMapId=id;selectedMapId=id;return entry;}
function downloadMap(map){const blob=new Blob([JSON.stringify(map,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=(map.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'carte-velo')+'.json';link.click();URL.revokeObjectURL(url);}
try{profiles=JSON.parse(localStorage.getItem('velo-rule-profiles'))||{};}catch{}
try{const raw=localStorage.getItem('velo-save');if(raw){const saved=JSON.parse(raw);if(saved.version===1)localStorage.setItem('velo-save-before-multiplayer',raw);if(saved.mode==='plateau'&&saved.mapVersion<7)localStorage.setItem('velo-save-before-new-map',raw);m=S.load(raw);}}catch{message='Sauvegarde illisible : le fichier existant reste conservé.';}
function persist(force=false){if(m&&(auto||force))try{localStorage.setItem('velo-save',S.serialize(m));return true;}catch{message='Stockage indisponible : utilise Exporter la partie.';return false;}}
function render(){
 const scroll=document.querySelector('.map'),sx=scroll?.scrollLeft,sy=scroll?.scrollTop;
 const boardFocusKey=document.activeElement?.getAttribute?.('data-board-key');
 if(boardElement?.parentElement)boardElement.remove();boardRenderState=null;
 const sheetTurn=screen==='game'&&m?S.player(m).id+':'+m.turn:'';
 const sheetScroll=sheetTurn===renderedSheetTurn?document.querySelector('.player-sheet-mount')?.scrollTop:0;
 let page=screen==='card-editor'?renderCardEditor(customCards,cardDraft,message,eventEdits,eventDraft):screen==='map-editor'?editorScreen():screen==='game'&&m?game():screen==='voyages'?choices():screen==='equipment'?equipmentSetup():screen==='setup'?setup():screen==='modes'?modes():screen==='online'?onlineView():screen==='parties'?partiesView():home();
 if(screen==='game'&&splitView)page=page.replace('<main class="game">',`<main class="game game-split" style="--sheet-width:${splitWidth}%">`);
 const splitControls=screen==='game'&&m?`<button type="button" class="light split-toggle" data-action="split-view" aria-pressed="${splitView}">${splitView?'▤ Vue verticale':'◧ Vue côte à côte'}</button>${splitView?`<label class="split-size" for="split-width">Fiche <output id="split-width-value">${splitWidth}%</output><input id="split-width" type="range" min="30" max="50" step="5" value="${splitWidth}" aria-label="Largeur de la fiche joueur"/></label>`:''}`:'';
  app.innerHTML=`<header class="${screen==='game'?'in-game':''}"><div class="brand"><b>🚲 L’Aventure à Vélo</b>${screen==='game'&&m?`<span class="active-player" style="--player-color:${S.player(m).color}"><i aria-hidden="true"></i>${esc(S.player(m).name)}</span>`:''}</div>${screen==='game'&&m?.cardVersion===3?eventPiles():''}<nav>${splitControls}${btn('📖 Règles','help','light help-btn')+btn('⚙️ Réglages','rules','light')}${btn('Paramètres','settings','light')}${['game','map-editor','card-editor'].includes(screen)?btn('Accueil','home','light'):''}</nav></header>`+page+overlay();
 mountBoard();bind();if(scroll){const map=document.querySelector('.map');if(map){map.scrollLeft=sx;map.scrollTop=sy;}}
 if(boardFocusKey&&boardElement){const target=[...boardElement.querySelectorAll('[data-board-key][tabindex]')].find(el=>el.getAttribute('data-board-key')===boardFocusKey);target?.focus({preventScroll:true});}
 const sheet=document.querySelector('.player-sheet-mount');if(sheet)sheet.scrollTop=sheetScroll||0;
 renderedSheetTurn=sheetTurn;persist();
}
function journeySteps(active){return `<nav class="journey-steps" aria-label="Étapes de préparation"><span class="${active==='map'?'current':''}"><i>1</i> Plateau</span><b aria-hidden="true"></b><span class="${active==='players'?'current':''}"><i>2</i> Cyclistes</span><b aria-hidden="true"></b><span class="${active==='gear'?'current':''}"><i>3</i> Équipement</span><b aria-hidden="true"></b><span class="${active==='goal'?'current':''}"><i>4</i> Voyages</span></nav>`;}
function home(){const n=typeof partiesList!=='undefined'?partiesList.length:0;return titleScreen({btn,hasSave:Boolean(m)||n>0,saveLine:n>1?`${n} parties enregistrées`:m?`Jour ${m.round} · ${S.player(m).name}`:'',message,reduced:Boolean(displayPrefs.reduced),maps});}
function modes(){return plateauScreen({btn,maps,message});}
function editorScreen(){return `<main class="game map-editor-page"><div class="topbar"><div><span class="eyebrow">ÉDITEUR DE CARTE</span><h1>Créer une carte Europe</h1><p>Choisis une case pour changer son terrain. Les villes des voyages restent fixes.</p></div></div><div class="editor-controls"><label>Nom de la carte <input id="editor-map-name" maxlength="60" value="${esc(editorName)}"/></label><span>Col mythique : ${editorColEffort} énergie</span>${btn('💾 Enregistrer la carte','map-save-project')}${btn('⬇️ Enregistrer en fichier','map-export-file','light')}${btn('Choisir ce plateau','map-play','light')}</div><div class="map-wrap"><div class="map">${boardSurfaceMarkup({g:editorGame,reachable:[],cost:()=>editorColEffort,selected:mapEditKey,route:[],nextSteps:[],editMode:true})}</div><div class="maptools">${btn('−','zoomout')}${btn('+','zoomin')}${btn('◎','center')}${artButton()}</div></div><p class="muted">Les changements sont conservés sur cet appareil après « Enregistrer la carte ». Le fichier .json permet de les garder ou de les importer ailleurs.</p><p class="toast" role="status">${esc(message)}</p>${btn('Retour au menu','home','light')}</main>`;}
function setup(){return playersScreen({btn,roster,colors:COLORS,rules:setupRules});}
function equipmentSetup(){
 const p=roster[choosing],items=p.items||[],spent=items.reduce((n,id)=>n+setupRules.equipment[id].price,0);
 const descriptions=equipmentDescriptions;
 return garageScreen({btn,player:p,index:choosing,total:roster.length,rules:setupRules,coinsLeft:setupRules.startMoney-(setupRules.bikes[p.bike]?.price||0)-spent,descriptions});
}
// Voyages sans illustration : une petite carte « d'aventure » du trajet le plus court, dessinée à partir du plateau.
const MINI_MAPS={},LEGACY_ART=['traversee','soleil','alpes','campagne','nord'];
function voyageMiniMap(v){
 if(MINI_MAPS[v.id])return MINI_MAPS[v.id];
 let svg='';try{
  const b=europeBoard(v.from,v.to),tiles=Object.values(b.board),arr=tiles.find(t=>t.id===b.arrivalId),prev=new Map([[b.start,null]]),q=[b.start];
  while(q.length){const k=q.shift();for(const n of b.board[k].links){if(prev.has(n)||b.board[n].type==='mer')continue;prev.set(n,k);q.push(n);}}
  const path=[];for(let k=arr?.key;k;k=prev.get(k))path.unshift(b.board[k]);
  const xs=path.map(t=>t.x),ys=path.map(t=>t.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
  const step=Math.hypot(path[1].x-path[0].x,path[1].y-path[0].y)||20,w=Math.max((Math.max(...xs)-Math.min(...xs))*1.45,(Math.max(...ys)-Math.min(...ys))*1.45*1.6,step*10),h=w/1.6,x0=cx-w/2,y0=cy-h/2;
  const inBox=tiles.filter(t=>t.x>x0-step&&t.x<x0+w+step&&t.y>y0-step&&t.y<y0+h+step),r=(step*.6).toFixed(1),f=n=>n.toFixed(1);
  const land=inBox.filter(t=>t.type!=='mer').map(t=>`<circle cx="${f(t.x)}" cy="${f(t.y)}" r="${r}" fill="${E.terrains[t.type]?.color||'#a6bf78'}"/>`).join('');
  const towns=inBox.filter(t=>t.type==='ville').map(t=>`<circle cx="${f(t.x)}" cy="${f(t.y)}" r="${f(step*.28)}" fill="#1b1406" stroke="#f6e7c1" stroke-width="${f(step*.08)}"/>`).join('');
  const line=path.map(t=>f(t.x)+','+f(t.y)).join(' '),a=path[0],z=path.at(-1);
  svg=`<svg class="voyage-minimap" viewBox="${f(x0)} ${f(y0)} ${f(w)} ${f(h)}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect x="${f(x0-step*2)}" y="${f(y0-step*2)}" width="${f(w+step*4)}" height="${f(h+step*4)}" fill="#2c6f86"/>${land}${towns}
   <polyline points="${line}" fill="none" stroke="#fff3cf" stroke-width="${f(step*.42)}" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/><polyline points="${line}" fill="none" stroke="${v.color}" stroke-width="${f(step*.22)}" stroke-dasharray="${f(step*.5)} ${f(step*.35)}" stroke-linecap="round" stroke-linejoin="round"/>
   <circle cx="${f(a.x)}" cy="${f(a.y)}" r="${f(step*.55)}" fill="#f6e7c1" stroke="${v.color}" stroke-width="${f(step*.22)}"/><circle cx="${f(z.x)}" cy="${f(z.y)}" r="${f(step*.65)}" fill="#f2a541" stroke="#1b1406" stroke-width="${f(step*.18)}"/></svg>`;
 }catch{svg='';}
 return MINI_MAPS[v.id]=svg;
}
function artwork(v,full=false){
 if(!v.art&&!LEGACY_ART.includes(v.id))return `<div class="voyage-art voyage-art-map${full?' full-card':''}" role="img" aria-label="Carte du voyage ${esc(v.from)} → ${esc(v.to)}">${voyageMiniMap(v)}</div>`;
 if(v.art&&full){const rows=progress({voyage:v.id,travelHistory:[],mode:'plateau'}).rows;return `<div class="voyage-card-new" style="--card-art:url('assets/voyages/${esc(v.art)}')"><div class="voyage-card-new-art" role="img" aria-label="Illustration de ${esc(v.title)}"></div><div class="voyage-card-new-content"><span class="voyage-card-new-kicker">CARTE VOYAGE</span><h2>${esc(v.title)}</h2><strong class="voyage-card-new-route">${esc(v.from)} → ${esc(v.to)}</strong><div class="voyage-card-new-rule"></div><p>Pour accomplir ce voyage :</p><ul>${rows.map(r=>`<li>${r.target} ${esc(r.label.toLowerCase())}</li>`).join('')}</ul><small>Termine les étapes, puis rejoins ${esc(v.to)}.</small></div></div>`;}
 return `<div class="voyage-art ${full?'full-card ':''}${v.art?'art-generated':'art-'+v.id}" ${v.art?`style="background-image:url('assets/voyages/${esc(v.art)}')"`:''} role="img" aria-label="${esc(v.title)}"></div>`;
}
function choices(){
 const lengths={};for(const v of drawn){try{const b=europeBoard(v.from,v.to),arrival=Object.values(b.board).find(t=>t.id===b.arrivalId),dist=new Map([[b.start,0]]),queue=[b.start];while(queue.length){const k=queue.shift();for(const n of b.board[k].links){if(dist.has(n)||b.edges.some(e=>e.ferry&&((e.a===k&&e.b===n)||(e.b===k&&e.a===n))))continue;dist.set(n,dist.get(k)+1);queue.push(n);}}lengths[v.id]=dist.get(arrival?.key);}catch{/* carte personnalisée : longueur inconnue */}}
 return voyagesScreen({player:roster[choosing],index:choosing,total:roster.length,drawn:drawn.map(v=>({...v,tier:voyageTier(v),rows:progress({voyage:v.id,travelHistory:[],mode:'plateau'}).rows})),lengths,artwork:v=>artwork(v),message});
}
function objective(g){const p=progress(g);return p?`<section class="objective" style="--voyage-color:${p.v.color}">${artwork(p.v)}<div class="objective-title"><span class="eyebrow">CARTE VOYAGE · ${esc(g.name)}</span><h3>${p.v.title}</h3><strong>${p.v.from} → ${p.v.to} · +${voyageTier(p.v).points} pts</strong><small>${g.completed?'✓ Objectif accompli':p.ready?'Rejoins '+p.v.to:'Remplis les étapes puis rejoins '+p.v.to}</small></div><div class="objective-checks">${p.rows.map(r=>`<div class="${r.done?'checked':''}">${r.done?'✓':'○'} ${r.label} <b>${r.value}/${r.target}</b></div>`).join('')}</div></section>`:'';}
function tile(t){const a=artFor(t),c=E.terrains[t.type];return a?`<img class="tile-art" src="${a.src}" alt="${c.name}" draggable="false" style="transform:rotate(${a.rotation*90}deg)"/>`:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="${c.color}"/>${E.roads(t).map(d=>`<path d="M50 50 L${[[50,0],[100,50],[50,100],[0,50]][d].join(' ')}" stroke="#fff1ce" stroke-width="10"/>`).join('')}</svg>`;}
function tileMap(g,reachable){S.rescueHand(m);const tiles=Object.values(g.board),spots=g.phase==='place'&&m.hand[selected]?E.spots(g,m.hand[selected]):[],all=[...tiles,...spots],minX=Math.min(...all.map(t=>t.x))-1,minY=Math.min(...all.map(t=>t.y))-1,maxX=Math.max(...all.map(t=>t.x))+1,maxY=Math.max(...all.map(t=>t.y))+1,size=132*zoom;return `<div class="world" style="width:${(maxX-minX+1)*size}px;height:${(maxY-minY+1)*size}px">${tiles.map(t=>{const k=E.key(t.x,t.y);return `<div class="tile ${reachable.some(n=>n.x===t.x&&n.y===t.y)?'reachable':''}" data-move="${k}" role="button" tabindex="0" aria-label="${esc(t.name||E.terrains[t.type].name)} · ${S.cost(m,t)} énergie" style="left:${(t.x-minX)*size}px;top:${(t.y-minY)*size}px;width:${size}px;height:${size}px">${tile(t)}<label>${esc(t.name||E.terrains[t.type].name)}</label><div class="tile-tokens">${m.players.filter(p=>p.pos===k).map(p=>`<span data-token="${p.id}" title="${esc(p.name)}" style="background:${p.color}">${p.id.slice(1)}</span>`).join('')}</div></div>`;}).join('')}${spots.map(t=>`<button class="spot" data-place="${t.x},${t.y}" aria-label="Poser en ${t.x},${t.y}" style="left:${(t.x-minX)*size}px;top:${(t.y-minY)*size}px;width:${size}px;height:${size}px">+</button>`).join('')}</div>`;}
function game(){const p=S.player(m),g=S.view(m),reachable=S.moves(m),r=m.rules,scale=.8*zoom;return `<main class="game"><div class="player-order" aria-label="Ordre des joueurs">${m.players.map((p,i)=>`<button data-player="${i}" class="${i===m.activeIndex?'active':''}" style="--player-color:${p.color}"><span>●</span> ${esc(p.name)} · ${p.points} ✨ <small>Jour ${p.availableDay}${i===m.activeIndex?' · joue maintenant':''}</small></button>`).join('')}</div><div class="topbar"><div><span class="eyebrow">${m.mode==='plateau'?'PLATEAU EUROPE':'TUILES'} · JOUR ${m.round}</span><h2>${esc(p.name)} <small class="muted">${m.moved}/${S.distance(m)} cases aujourd’hui</small></h2></div><div class="stats">${[['⚡','Énergie',p.energy+'/'+energyCap(m,p)],...(r.fatigue.enabled?[['😴',isExhausted(m,p)?'Fourbu':'Fatigue',(p.fatigue||0)+'/'+r.fatigue.days]]:[]),['🍎','Nourriture',p.food],['🪙','Argent',p.money],['✨','Aventure',p.points]].map(([i,n,v])=>`<div class="stat">${i} ${n}<strong>${v}</strong></div>`).join('')}</div></div><div class="hint">${mapEditMode?'Mode édition actif : clique une case pour modifier son terrain.':m.done?'Partie terminée.':m.phase==='event'?'Résous la carte pour passer au joueur suivant.':m.phase==='place'?'Pose une tuile, ou consacre cette journée au repos.':m.moved>=S.distance(m)?'Limite atteinte. Termine ta journée pour tirer une carte.':'Itinéraire libre : jusqu’à '+S.distance(m)+' cases aujourd’hui. Un hébergement occupe une journée sans rouler.'}</div>${objective(g)}<div class="layout"><section><div class="map-wrap"><div class="map">${m.mode==='plateau'?`${boardSurfaceMarkup({g,reachable,cost:(_,t)=>S.cost(m,t),selected:mapSelection,route,nextSteps:[],editMode:mapEditMode})}`:tileMap(g,reachable)}</div><div class="maptools">${btn('−','zoomout')}${btn('+','zoomin')}${btn('◎','center')}${artButton()}${m.mode==='plateau'?btn(mapEditMode?'✓ Fini':'✏️ Éditer','mapedit',mapEditMode?'active':''):''}</div></div>${m.mode==='tuiles'?`<div class="hand">${m.hand.map((t,i)=>`<button data-select="${i}" class="${i===selected?'active':''}" ${m.phase!=='place'?'disabled':''}>${tile(t)}<small>${E.terrains[t.type].name}</small></button>`).join('')}${btn('↻ Tourner','rotate','light',m.phase!=='place')}</div>`:''}${details(reachable)}<div class="board-legend">${['plaine','montagne','ville','cote'].map(id=>`<span>${E.terrains[id].icon} ${E.terrains[id].name} : ${r.terrain[id]} ⚡</span>`).join('')}<span>🚩 Départ · 🏁 Arrivée du joueur actif</span></div><div class="toast" role="status">${esc(message)}</div>${leaderboard()}</section>${sidebar()}</div></main>`;}
function details(reachable){const t=m.board[mapSelection];if(!t)return '<div class="cell-details placeholder">Clique sur une case pour consulter son coût puis choisir le déplacement.</div>';const cost=S.cost(m,t),p=S.player(m),neighbor=reachable.some(n=>m.mode==='plateau'?n.key===mapSelection:E.key(n.x,n.y)===mapSelection),allowed=neighbor&&p.energy>=cost;const status=m.done?'Partie terminée.':m.phase==='event'?'Résous la carte.':m.phase==='place'?'Pose d’abord une tuile.':m.moved>=S.distance(m)?'Maximum de cases atteint pour cette journée.':!neighbor?'Choisis une case voisine accessible.':p.energy<cost?'Énergie insuffisante.':'Case accessible.';return `<div class="cell-details"><div><strong>${E.terrains[t.type].icon} ${esc(t.name||E.terrains[t.type].name)}</strong><small>${cost} énergie · ${status}</small></div>${btn('🚴 Rouler ici','move','',!allowed)}</div>`;}
function sidebar(){const p=S.player(m),r=m.rules,blocked=m.done||m.phase==='event',dayBlocked=blocked||m.moved>0||m.placed,city=m.board[p.pos].type==='ville';return `<aside class="panel"><h3>La journée de ${esc(p.name)}</h3><p>${esc(r.bikes[p.bike].name)} · inventaire ${S.inventorySpace(m)}/${r.bikes[p.bike].capacity}</p><div class="actions">${btn('🍎 Manger · +'+(r.food.energy+(p.items.includes('rechaud')?r.food.stoveBonus:0))+' énergie','eat','',blocked||!p.food||m.ate>=r.food.maxPerTurn||p.energy>=energyCap(m,p))}${btn('🥕 Acheter '+r.food.quantity+' provisions · '+r.food.price+' pièces','food','',blocked||p.money<r.food.price||(r.food.cityOnly&&!city))}${btn('🍽 Restaurant · '+r.food.restaurantPrice+' pièces · +'+r.food.restaurantEnergy+' énergie','restaurant','',blocked||!city||p.money<r.food.restaurantPrice||p.energy>=energyCap(m,p)||m.ate>=r.food.maxPerTurn)}${r.workEnabled?btn('🔧 Travailler · +'+r.salary+' pièces · '+r.workDays+' jour(s)','work','',dayBlocked||(r.workCityOnly&&!city)):''}${Object.entries(r.rest).map(([id,a])=>btn(`${id==='bivouac'?'⛺':id==='camping'?'🏕':'🏨'} ${a.name} · ${a.price} pièces · +${a.energy} énergie · ${a.days} jour(s)`,'rest-'+id,'',dayBlocked||p.money<a.price||(a.tent&&!p.items.includes('tente'))||(a.cityOnly&&!city))).join('')}${btn('🎒 Équipements','shop','',blocked)}${btn('Terminer ma journée →','endturn','',blocked)}${btn('Sauvegarder','save','light')}${btn('Historique et statistiques','stats','light')}${btn('Terminer la partie','finish','light')}</div><p class="muted">Repos : avant tout déplacement ou pose de tuile. Bivouac : tente requise si activée dans les règles.</p><h4>Inventaire personnel</h4><p>${p.items.map(i=>esc(r.equipment[i].name)).join(' · ')||'Aucun équipement'}</p><h4>Journal personnel</h4><div class="log">${p.log.map(l=>`<div>• ${esc(l)}</div>`).join('')}</div></aside>`;}
// Résumé de la fin de partie (mode « multi »).
function earlyFinishButton(html){if(!m||!S.canFinishVoyageEarly(m))return html;return html.replace('<div class="dock-day">',`<div class="dock-finish-row">${btn('🏁 Terminer le voyage ici · +'+S.earlyVoyagePoints(m)+' points (−40 %)','finish-voyage-early','dock-finish')}</div><div class="dock-day">`);}
function victoryLine(r){const v=r.victory||{},parts=[];if(v.points)parts.push(`${v.points} points`);if(v.voyages)parts.push(`${v.voyages} voyages`);if(v.days)parts.push(`${v.days} jours`);return parts.join(' ou ')||'—';}
function leaderboard(){return `<section class="panel standings"><h3>Classement</h3><ol>${S.ranking(m).map(p=>`<li><span style="color:${p.color}">●</span> ${esc(p.name)} <b>${p.points} points Aventure</b> · ${S.multiVictory(m)?`${(p.voyagesDone||[]).length} voyage${(p.voyagesDone||[]).length>1?'s':''} réussi${(p.voyagesDone||[]).length>1?'s':''}`:p.completed?'✓ Objectif accompli':'Objectif en cours'}</li>`).join('')}</ol><p class="muted">Victoire : ${S.multiVictory(m)?victoryLine(m.rules):m.rules.victory.mode==='points'?m.rules.victory.points+' points':m.rules.victory.mode==='turns'?m.rules.victory.turns+' jours':m.rules.victory.allObjectives?'tous les objectifs':'premier objectif accompli'}. À égalité, classement partagé.</p></section>`;}
function rulesForm(){
 const field=(path,label,type='number',options=null)=>{const value=path.split('.').reduce((o,k)=>o[k],draft);return `<label class="rule-field">${label}${type==='boolean'?`<input type="checkbox" data-rule="${path}" ${value?'checked':''}/>`:options?`<select data-rule="${path}">${options.map(([id,text])=>`<option value="${id}" ${id===value?'selected':''}>${esc(text)}</option>`).join('')}</select>`:`<input type="${type}" data-rule="${path}" value="${esc(value)}" ${type==='number'?'step="1"':''}/>`}</label>`;};
 const group=(title,body,open=false)=>`<details ${open?'open':''}><summary>${title}</summary><div class="rule-grid">${body}${title==='Repos, hébergement et nourriture'?field('food.restaurantPrice','Prix du restaurant')+field('food.restaurantEnergy','Énergie du restaurant'):''}</div></details>`;
 let body=group('Journées, déplacements et départ',field('distance','Distance de référence (chaque vélo se règle dans « Vélos et inventaires »)')+Object.keys(draft.terrain).map(k=>field('terrain.'+k,E.terrains[k].name+' : énergie')).join('')+field('ferryPrice','Prix du bateau (pièces)')+field('startEnergy','Énergie de départ')+field('maxEnergy','Énergie maximale')+field('startMoney','Argent de départ (vélo compris)')+Object.keys(draft.bikes).map(k=>field('bikes.'+k+'.price','Prix du vélo '+draft.bikes[k].name)).join('')+field('startFood','Nourriture de départ'),true)+group('Budget du voyage',field('budget.startBonus','Pièces reçues après l’achat du matériel')+field('budget.every','Versement tous les … tours')+field('budget.amount','Pièces par versement'))+group('Lieux cachés et cols',field('adventure.landmarks','Nombre de jetons « ? » (nouvelle partie)')+field('adventure.landmarkOdds.one','Jetons à 1 point (%)')+field('adventure.landmarkOdds.two','Jetons à 2 points (%)')+field('adventure.landmarkOdds.three','Jetons à 3 points (%)')+field('adventure.colFirstBonus','Premier de cordée : bonus')+field('adventure.climberCols','Grimpeur : nombre de cols')+field('adventure.climberBonus','Grimpeur : bonus'))+group('Fatigue',field('fatigue.enabled','Fatigue activée','boolean')+field('fatigue.days','Jours de route avant d’être fourbu')+field('fatigue.colExtra','Fatigue en plus le jour d’un col')+field('fatigue.maxEnergyPenalty','Fourbu : énergie maximale en moins'))+group('Hors route (plateau)',field('offroad.enabled','Règle hors route activée','boolean')+field('offroad.item','Objet qui évite la pénalité','text',Object.entries(draft.equipment).map(([id,e])=>[id,e.name]))+field('offroad.maxDistance.gravel','Gravel : cases max par jour hors route')+field('offroad.maxDistance.randonneur','Randonneuse : cases max par jour hors route'));
 body=group('Cartes Événement : pioche, main et bonus',field('eventCards.startingHand','Cartes piochées au départ par joueur (0 à 10)')+field('eventCards.handLimit','Cartes maximum en main (1 à 10)')+field('eventCards.drawPerTurn','Cartes piochées en fin de tour (1 à 5), en garder une')+field('eventCards.bonusLimit','Bonus permanents posables (0 à 10)')+field('eventCards.shuffle','Mélanger aléatoirement la pioche','boolean')+Object.entries({positive:'10 cartes positives',negative:'10 cartes négatives',climatic:'10 cartes climatiques',permanent:'10 bonus permanents'}).map(([id,label])=>field('eventCards.categories.'+id,label,'boolean')).join('')+'<p class="muted">Toutes les catégories sont actives par défaut. La composition et la distribution de départ concernent les nouvelles parties. En solo, les négatives et la météo piochées sont subies automatiquement ; les cartes de trajet concernent le prochain déplacement.</p>',true)+body;
 body+=group('Repos, hébergement et nourriture',Object.entries(draft.rest).map(([id,a])=>`<h4>${a.name}</h4>`+field('rest.'+id+'.price','Prix')+field('rest.'+id+'.energy','Énergie récupérée')+field('rest.'+id+'.days','Jours consommés')+field('rest.'+id+'.tent','Tente obligatoire','boolean')+field('rest.'+id+'.cityOnly','Uniquement en ville','boolean')).join('')+Object.entries({energy:'Énergie par repas',stoveBonus:'Bonus réchaud',price:'Prix nourriture',quantity:'Quantité achetée',maxPerTurn:'Repas maximum par jour',cityOnly:'Achat uniquement en ville'}).map(([k,label])=>field('food.'+k,label,typeof draft.food[k]==='boolean'?'boolean':'number')).join(''));
 body+=group('Vélos et inventaires',Object.entries(draft.bikes).map(([id,b])=>`<h4>${b.name}</h4>`+field('bikes.'+id+'.capacity','Capacité')+field('bikes.'+id+'.mountainDiscount','Réduction montagne / col')+`<label class="rule-field">Cases par jour (1 à 5)<input type="number" min="1" max="5" step="1" data-bike-distance="${id}" value="${Math.min(5,Math.max(1,draft.distance+(b.extraDistance||0)))}"/></label>`+field('bikes.'+id+'.extraFood','Nourriture de départ supplémentaire')).join('')+Object.entries(draft.equipment).map(([id,e])=>`<h4>${e.name}</h4>`+field('equipment.'+id+'.price','Prix')+field('equipment.'+id+'.space','Encombrement')+field('equipment.'+id+'.energyBonus','Bonus énergie au repos')+('foodBonus'in e?field('equipment.'+id+'.foodBonus','Provisions offertes à l’achat'):'')).join(''));
 body+=group('Points et victoire',Object.keys(draft.points).map(k=>field('points.'+k,k==='objective'?'Objectif accompli':E.terrains[k].name+' : première visite')).join('')+field('victory.mode','Victoire','text',[['multi','Points, voyages ou jours (standard)'],['objectives','Ancien : premier objectif'],['points','Ancien : points'],['turns','Ancien : nombre de jours']])+field('victory.points','Points pour gagner (0 = sans)')+field('victory.voyages','Voyages réussis pour gagner (0 = sans)')+field('victory.days','Fin après ce nombre de jours (0 = sans)')+field('victory.turns','Nombre de jours (ancien mode)')+field('victory.allObjectives','Attendre tous les objectifs','boolean'));
 return `<h2>⚙️ Règles — mode Créateur</h2><p>Application immédiate aux prochaines actions de tous les joueurs, sans recommencer. Les ressources déjà détenues sont conservées ; les valeurs de départ concernent les nouvelles parties.</p><div class="profile-bar"><select id="rule-profile" aria-label="Profil de règles"><option value="Classique">Classique</option>${Object.keys(profiles).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}</select>${btn('Charger le profil','loadprofile','light')}</div>${field('name','Nom du profil','text')}${body}<p class="toast" role="alert">${esc(message)}</p><div class="sticky-actions">${btn('Appliquer maintenant','applyrules')}${btn('Enregistrer ce profil','saveprofile','light')}${btn('Fermer','close','light')}</div>`;
}
function prepareDraft(source){draft=validateRules(source||(m&&screen==='game'?m.rules:setupRules));for(const e of draft.events){e.effect={energy:0,money:0,food:0,points:0,...e.effect};e.cost={energy:0,money:0,food:0,...e.cost};}}
function overlay(){let content='',wide=false;
 if(modal==='map-editor'){const t=editorGame?.board[mapEditKey];content=t?t.key.startsWith('city-')?`<h2>${esc(t.name)}</h2><p>Cette ville sert aux voyages et aux ferries. Son emplacement et son nom sont conservés pour garder les parcours jouables.</p>${btn('Fermer','close','light')}`:`<h2>Modifier cette case</h2><p>Hexagone ${t.q}, ${t.r} · ${esc(E.terrains[t.type]?.name||t.type)}</p><label>Type de terrain <select id="map-tile-type">${[['mer','Mer'],['cote','Côte'],['plaine','Plaine'],['moyenne_montagne','Moyenne montagne'],['montagne','Haute montagne'],['col','Col mythique'],['ville','Ville']].map(([id,label])=>`<option value="${id}" ${t.type===id?'selected':''}>${label}</option>`).join('')}</select></label><label class="tile-variant-field">Apparence <select id="map-tile-variant" data-current="${esc(t.variant||'')}"></select></label><canvas id="map-tile-preview" class="variant-preview" width="96" height="96" role="img" aria-label="Aperçu de la case"></canvas><label>Nom si c’est une ville <input id="map-tile-name" maxlength="40" value="${esc(t.type==='ville'?t.name:'')}" placeholder="Ex. Village du col"/></label><p id="map-tile-cost" class="tile-cost" role="status"></p><div id="col-effort-box"><label>Effort des cols mythiques <span class="rule-input-unit"><input id="map-col-effort" type="number" min="0" max="10" step="1" value="${editorColEffort}"/> énergie</span></label><p class="muted">Ce coût s’applique à tous les cols de cette carte et sera enregistré dans le fichier.</p></div><p role="alert">${esc(message)}</p>${btn('Enregistrer la case','map-save')}${btn('Annuler','close','light')}`:'<p>Case introuvable.</p>';}
 if(modal==='rules'){content=rulesForm();wide=true;}
 else if(modal==='settings')content=`<h2>Paramètres</h2><p>Un tour = une journée. Bivouac, camping et hôtel consomment au moins une journée. Budget : 5 pièces après l’achat du matériel, puis 5 pièces tous les 5 tours. Maximum : 5 cases par jour.</p>${btn('Modifier les journées et les règles','rules')}<p>Sauvegarde automatique : ${auto?'activée':'désactivée'}.</p>${btn('Activer / désactiver','autosave','light')}${m?btn('Exporter la partie (.json)','export','light'):''}<h3>Affichage du plateau</h3><p>Animations : ${displayPrefs.reduced?'réduites (déplacements et caméra instantanés)':'normales'}.</p>${btn(displayPrefs.reduced?'Remettre les animations':'Réduire les animations','motion-toggle','light')}<p>Météo légère (nuages qui passent) : ${displayPrefs.weather&&!displayPrefs.reduced?'affichée':'masquée'}${displayPrefs.reduced?' — elle reste masquée tant que les animations sont réduites':''}.</p>${btn(displayPrefs.weather?'Masquer la météo':'Afficher la météo','weather-toggle','light')}<label class="file-import">Importer une partie <input id="import-save" type="file" accept="application/json,.json"/></label><p class="muted">Stockage dans ce navigateur. Exporte le fichier pour le conserver dans ton dossier sur D: ou sur un autre ordinateur.</p><p role="alert">${esc(message)}</p>${btn('Fermer','close','light')}`;
 else if(modal==='shop'){const p=S.player(m);content=`<h2>Inventaire de ${esc(p.name)}</h2><p>${S.inventorySpace(m)}/${m.rules.bikes[p.bike].capacity} emplacements · achats en ville.</p><div class="shop">${Object.entries(m.rules.equipment).map(([id,e])=>`<button data-buy="${id}" ${p.items.includes(id)||p.money<e.price||S.inventorySpace(m)+e.space>m.rules.bikes[p.bike].capacity||m.board[p.pos].type!=='ville'?'disabled':''}>${esc(e.name)} · ${e.price} pièces · ${e.space} place(s)${p.items.includes(id)?' · acquis':''}</button>${p.items.includes(id)?`<button class="light" data-discard="${id}">Déposer ${esc(e.name)} (sans remboursement)</button>`:''}`).join('')}</div><p role="status">${esc(message)}</p>${btn('Fermer','close','light')}`;}
 else if(modal==='stats'){wide=true;content=`<h2>Équilibrage de la partie</h2><p>${m.stats.turns} tours terminés · ${m.stats.events} événements · ${m.stats.energySpent} énergie dépensée · ${m.stats.moneySpent} pièces dépensées.</p><p>Cartes observées : ${Object.entries(m.stats.categories).map(([k,v])=>k+' '+v).join(' · ')}. Un petit échantillon peut s’écarter des probabilités.</p><div class="table-scroll"><table><thead><tr><th>Joueur</th><th>Déplacements</th><th>Travail</th><th>Repos</th><th>Événements</th><th>Points</th></tr></thead><tbody>${m.players.map(p=>`<tr><td>${esc(p.name)}</td><td>${p.stats.steps}</td><td>${p.stats.work}</td><td>${p.stats.rest}</td><td>${p.stats.events}</td><td>${p.points}</td></tr>`).join('')}</tbody></table></div><details><summary>Historique complet (${m.history.length})</summary><ol class="history">${[...m.history].reverse().map(h=>`<li>Jour ${h.round} · ${esc(h.name)} : ${esc(h.text)}</li>`).join('')}</ol></details>${btn('Exporter la partie et ses statistiques','export','light')}${btn('Fermer','close','light')}`;}
 else if(modal.startsWith('player-')){const p=m.players[+modal.slice(7)];content=`<h2 style="color:${p.color}">${esc(p.name)}</h2><p>${p.energy} énergie · ${p.food} nourriture · ${p.money} pièces · ${p.points} points.</p>${objective(S.view(m,p))}<p>Inventaire : ${p.items.map(i=>esc(m.rules.equipment[i].name)).join(' · ')||'vide'}</p>${btn('Fermer','close','light')}`;}
 else if(modal==='confirm'){const v=m?findVoyage(S.player(m).voyage):null;content=`<span class="modal-eyebrow">Nouveau carnet de route</span><h2>Nouvelle partie ?</h2>${m?`<div class="modal-save"><span aria-hidden="true">📔</span><div><small>Partie en cours</small><b>Jour ${m.round} · ${m.players.map(p=>esc(p.name)).join(' et ')}${v?' · '+esc(v.from)+' → '+esc(v.to):''}</b></div></div>`:''}<p>Cette partie sera remplacée quand la nouvelle commencera. Exporte-la d’abord si tu veux la garder.</p><div class="modal-actions">${btn('Choisir le plateau →','selectbike','modal-primary')}<div class="modal-pair">${btn('Exporter','export','light')}${btn('Règles du jeu','rules','light')}</div>${btn('Annuler, je reprends la route','close','modal-link')}</div>`;}
 else if(modal==='finish')content=`<h2>Terminer la partie ?</h2><p>Afficher le classement final et conserver l’historique.</p>${btn('Terminer','finish-confirm')}${btn('Annuler','close','light')}`;
 else if(m?.event&&screen==='game'){const e=m.event,p=S.player(m);content=`<span class="eyebrow">FIN DE JOURNÉE · ${esc(p.name)} · ${e.category==='negative'?'NÉGATIF':e.category==='positive'?'POSITIF':'DÉFI'}</span><h2>${esc(e.title)}</h2><p>${esc(e.text)}</p><p>Effets : ${Object.entries(e.effect).filter(([,v])=>v!==0).map(([k,v])=>(v>0?'+':'')+v+' '+({energy:'énergie',food:'nourriture',money:'pièces',points:'points Aventure'}[k])).join(' · ')||'aucun'}.</p>${e.protect?`<p>Équipement utile : ${esc(m.rules.equipment[e.protect]?.name||e.protect)}${e.consume?' (consommé)':''}.</p>`:''}${e.category==='challenge'?`<p>Coût sans équipement : ${Object.entries(e.cost||{}).filter(([,v])=>v>0).map(([k,v])=>v+' '+k).join(' · ')||'gratuit'}. Aucun dé.</p>${btn('Relever le défi','resolve','',!S.canChallenge(m))}${btn('Refuser le défi','decline','light')}`:btn('Résoudre et passer au joueur suivant →','resolve')}`;}
 else if(m?.done&&screen==='game')content=`<h2>🏆 Partie terminée</h2>${m.winner?`<p class="win-line"><b>${esc(m.players.find(p=>p.id===m.winner)?.name||'')}</b> gagne : ${esc(m.winReason||'')}.</p>`:''}${leaderboard()}${btn('Historique et statistiques','stats')}${btn('Retour à l’accueil','home','light')}`;
 if(content&&modal!=='rules'&&modal!=='map-editor'&&modal!=='confirm')content+=`<p>${btn('⚙️ Modifier les règles','rules','light')}</p>`;
 return content?`<div class="modal-back"><section class="modal ${wide?'wide':''} ${modal==='confirm'?'modal-confirm':''}" role="dialog" aria-modal="true">${content}</section></div>`:'';
}
function readRoster(){document.querySelectorAll('[data-roster]').forEach(el=>{roster[+el.dataset.roster][el.dataset.field]=el.value;});readVictory();}
// Fin de partie choisie avant la partie (écran des cyclistes ou création en ligne).
function readVictory(){const els=[...document.querySelectorAll('[data-victory]')];if(!els.length)return;const v={...setupRules.victory,mode:'multi'};
 for(const el of els){const n=Math.max(0,Math.min(999,Math.round(Number(el.value)||0)));v[el.dataset.victory]=n;}
 if(!v.points&&!v.voyages&&!v.days){message='Fin de partie : garde au moins une condition. Standard remis.';Object.assign(v,{points:35,voyages:3,days:40});}
 setupRules.victory=v;try{localStorage.setItem('velo-setup-rules',JSON.stringify(setupRules));}catch{}}
function captureRules(){document.querySelectorAll('[data-rule]').forEach(el=>setPath(draft,el.dataset.rule,el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value));
 // Cases par jour de chaque vélo (nombre réel affiché ; enregistré comme écart avec la distance de référence).
 document.querySelectorAll('[data-bike-distance]').forEach(el=>{const n=Math.min(5,Math.max(1,Math.round(Number(el.value)||1)));draft.bikes[el.dataset.bikeDistance].extraDistance=n-draft.distance;});
 return validateRules(draft);}
function center(){const map=document.querySelector('.map');if(!map)return;const editing=screen==='map-editor',game=editing?editorGame:m;if(!game)return;const t=editing?game.board['city-Paris']:game.board[S.player(game).pos];if(editing||game.mode==='plateau'){if(boardRenderer)boardRenderer.focusOn(t.x,t.y);else{const world=document.querySelector('.europe-world'),scale=1.05*zoom;map.scrollTo({left:Math.max(0,(world?.offsetLeft||0)+t.x*scale-map.clientWidth/2),top:Math.max(0,(world?.offsetTop||0)+t.y*scale-map.clientHeight/2),behavior:'smooth'});}}else document.querySelector('[data-token="'+S.player(game).id+'"]')?.closest('.tile')?.scrollIntoView?.({block:'center',inline:'center'});}
// Étapes 3 et 6 : caméra, fiche joueur repliable et préférences d'affichage, sans redessiner toute la page.
function narrowScreen(){return Boolean(globalThis.matchMedia?.('(max-width: 979px)').matches);}
function displayAction(a){
 displayPrefs=readDisplayPrefs();
 const plateau=screen==='map-editor'||(screen==='game'&&m?.mode==='plateau');
 if(boardRenderer&&plateau&&(a==='zoomin'||a==='zoomout')){boardRenderer.zoomBy(a==='zoomin'?1.45:1/1.45);return true;}
 if(boardRenderer&&plateau&&a==='center'){center();return true;}
 if(a==='sheet-toggle'){if(narrowScreen())sheetDrawer=!sheetDrawer;else displayPrefs=writeDisplayPref('sheet',!displayPrefs.sheet);applySheetLayout();return true;}
 if(a==='sheet-close'){sheetDrawer=false;applySheetLayout();return true;}
 if(a==='motion-toggle'||a==='weather-toggle'){const key=a==='motion-toggle'?'reduced':'weather';displayPrefs=boardRenderer?boardRenderer.setDisplayPrefs({[key]:!displayPrefs[key]}):writeDisplayPref(key,!displayPrefs[key]);render();return true;}
 return false;
}
function applySheetLayout(){
 const root=document.querySelector('main.game');if(!root)return;
 root.classList?.toggle('sheet-collapsed',!displayPrefs.sheet);root.classList?.toggle('sheet-open',sheetDrawer);
 const shown=narrowScreen()?sheetDrawer:displayPrefs.sheet;
 for(const b of document.querySelectorAll('[data-action="sheet-toggle"]')){b.setAttribute('aria-pressed',String(shown));b.classList?.toggle('active',shown);b.title=shown?'Replier la fiche joueur':'Afficher la fiche joueur';}
 const mount=root.querySelector('.player-sheet-mount');
 if(mount&&!mount.querySelector('.sheet-drawer-close')){const close=document.createElement('button');close.type='button';close.className='sheet-drawer-close light';close.textContent='✕ Fermer la fiche';close.onclick=()=>{sheetDrawer=false;applySheetLayout();};mount.prepend(close);}
 if(!root.querySelector('.sheet-backdrop')){const back=document.createElement('div');back.className='sheet-backdrop';back.onclick=()=>{sheetDrawer=false;applySheetLayout();};root.append(back);}
}
function applyMotionClass(){document.documentElement?.classList?.toggle('reduce-motion',Boolean(displayPrefs.reduced));}
function download(){const blob=new Blob([S.serialize(m)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='aventure-velo-jour-'+m.round+'.json';a.click();URL.revokeObjectURL(url);}
function act(a){
 if(displayAction(a))return;
 message='';const historyMark=m?.history?.length||0;
 if(a==='new'){if(m&&!m.done)modal='confirm';else screen='modes';}
 else if(a==='selectbike'||a==='modes'){modal='';screen='modes';}
 else if(a==='weather-cards'||a==='weather-forecast'){readRoster();setupRules.weather={...(setupRules.weather||{}),forecast:a==='weather-forecast'};localStorage.setItem('velo-setup-rules',JSON.stringify(setupRules));}
 else if(a==='victory-standard'){readRoster();setupRules.victory={...setupRules.victory,mode:'multi',points:35,voyages:3,days:40};try{localStorage.setItem('velo-setup-rules',JSON.stringify(setupRules));}catch{}}
 else if(a==='start'){readRoster();choosing=0;for(const p of roster)p.items=[];screen='equipment';}
 else if(a==='setup'){screen='setup';choosing=0;}
 else if(a==='equipment-next'){choosing++;if(choosing>=roster.length){choosing=0;drawn=drawVoyages();screen='voyages';}}
 else if(a==='continue'){screen='game';modal='';}
 else if(a==='home'){screen='home';modal='';}
 else if(a==='card-editor-open'){resetCardDraft();resetEventDraft();screen='card-editor';modal='';}
 else if(a==='card-editor-new'){resetCardDraft();}
 else if(a==='card-editor-save')try{const card=saveCustomCard();message='Ancienne variante « '+card.title+' » archivée. Elle ne change pas la nouvelle pioche de 40 cartes.';}catch(e){message=e.message;}
 else if(a==='card-editor-export')try{downloadCardLibrary();message='Fichier de cartes téléchargé.';}catch(e){message='Export impossible : '+e.message;}
 else if(a==='event-editor-save')try{const card=saveEventEdit();message='Carte n° '+card.number+' enregistrée pour les prochaines parties. La pioche conserve 40 cartes.';}catch(e){message=e.message;}
 else if(a==='event-editor-reset')try{const slotId=document.querySelector('#event-editor-slot')?.value||eventDraft.slotId;storeEventEdits(eventEdits.filter(edit=>edit.slotId!==slotId));resetEventDraft(slotId);message='Carte officielle rétablie pour les prochaines parties.';}catch(e){message=e.message;}
 else if(a==='event-editor-export')try{downloadEventEdits();message='Variantes Événement téléchargées.';}catch(e){message='Export impossible : '+e.message;}
 else if(a==='editor-new'){openEditor();}
 else if(a==='mapedit'){openEditor(m?.mapChoice||'');}
 else if(a==='map-save'){
  const t=editorGame?.board[mapEditKey],type=document.querySelector('#map-tile-type')?.value,name=(document.querySelector('#map-tile-name')?.value||'').trim(),effort=Number(document.querySelector('#map-col-effort')?.value);
  if(t&&!t.key.startsWith('city-')&&EDITABLE_TERRAINS.has(type))try{
   if(!Number.isInteger(effort)||effort<0||effort>10)throw Error('L’effort du col doit être un entier de 0 à 10.');
   const variant=document.querySelector('#map-tile-variant')?.value||'';
   const cells={...customMap,[`${t.q},${t.r}`]:{type,name:type==='ville'?(name||'Ville personnalisée'):'',...(validVariant(type,variant)?{variant}:{})}};
   const candidate=buildEditorGame(cells);
   if(!mapIsPlayable(candidate))throw Error('Cette modification isole une ville. Garde un passage terrestre vers les autres villes.');
   customMap=cells;editorGame=candidate;editorColEffort=effort;modal='';mapEditKey='';message='Case modifiée. Enregistre la carte pour la retrouver au menu.';
  }catch(e){message=e.message;}
 }
 else if(['map-save-project','map-export-file','map-play'].includes(a))try{editorName=(document.querySelector('#editor-map-name')?.value||editorName).trim()||'Ma carte';const saved=saveEditedMap();if(a==='map-export-file'){downloadMap(saved);message='Carte enregistrée et fichier téléchargé.';}else{message='Carte « '+saved.name+' » enregistrée.';if(a==='map-play')screen='modes';}}catch(e){message=e.message;}
 else if(a==='rules'){prepareDraft();modal='rules';}
 else if(a==='split-view'){splitView=!splitView;localStorage.setItem('velo-split-view',String(splitView));if(splitView)globalThis.scrollTo?.(0,0);}
 else if(['settings','shop','stats','finish'].includes(a))modal=a;
 else if(a==='close')modal='';
 else if(a==='reveal-close')revealCard=null;
 else if(a==='applyrules'||a==='saveprofile'){try{const r=captureRules();if(a==='saveprofile'){let name=r.name.trim();if(!name||name==='Classique')name='Personnalisé';r.name=name;profiles[name]=clone(r);localStorage.setItem('velo-rule-profiles',JSON.stringify(profiles));draft=r;message='Profil « '+name+' » enregistré. Clique sur Appliquer pour modifier la partie.';}else{if(m&&screen==='game')S.updateRules(m,r);setupRules=r;localStorage.setItem('velo-setup-rules',JSON.stringify(r));modal='';message='Règles appliquées aux prochaines actions.';}}catch(e){message=e.message;}}
 else if(a==='loadprofile'){const name=document.querySelector('#rule-profile').value;prepareDraft(name==='Classique'?CLASSIC:profiles[name]);}
 else if(a==='autosave'){auto=!auto;localStorage.setItem('velo-auto',auto);}
 else if(a==='save'){message=persist(true)?'Partie sauvegardée sur cet appareil.':message;}
 else if(a==='export'){if(m)download();}
 else if(a==='finish-confirm'){m.done=true;m.phase='finished';modal='';}
 else if(a==='rotate'&&m.phase==='place'){const t=m.hand[selected];if(t)t.rotation=(t.rotation+1)%4;}
 else if(a==='move'){if(m.cardVersion===3){const result=S.beginEventRoute(m,[mapSelection]);if(!result.ok)message=result.reason;else mapSelection='';}else if(!S.move(m,mapSelection))message='Déplacement impossible : énergie, voisins ou limite quotidienne.';else mapSelection='';}
 else if(a==='route-clear'){route=[];mapSelection='';}
 else if(a==='route-go'){const check=S.routeCheck(m,route);if(!check.ok)message=check.reason;else if(m.cardVersion===3){const result=S.beginEventRoute(m,route);if(!result.ok)message=result.reason;else{route=[];mapSelection='';modal='';}}else{S.executeRoute(m,route);route=[];mapSelection='';}}
 else if(a==='ferry-confirm'){if(!S.travelFerry(m,ferryTarget))message='Traversée indisponible : port ou argent insuffisant.';else{modal='';route=[];mapSelection='';}}
 else if(a==='ferry-cancel')modal='';
 else if(a==='repair'){if(!S.repairPuncture(m))message='Réparation indisponible.';}
 else if(a==='finish-voyage-early'){if(!S.finishVoyageEarly(m))message='Impossible de terminer le voyage ici.';else message='Voyage terminé (−40 %). Au début de ton prochain tour, tu choisiras un nouveau voyage.';}
 else if(a.startsWith('fasttravel-')){if(!S.fastTravel(m,a.slice(11)))message='Voyage rapide impossible.';else{mapSelection='';route=[];message='En train jusqu’au départ du nouveau voyage : ta journée est passée.';}}
 else if(a.startsWith('newvoyage-')){if(!S.chooseNewVoyage(m,a.slice(10)))message='Choix du voyage impossible.';else{mapSelection='';route=[];}}
 else if(a==='cards')modal='cards';
 else if(a==='meteo'){modal='meteo';meteoDay='today';}
 else if(a.startsWith('meteo-day-')){modal='meteo';meteoDay=a.slice(10);}
 else if(a==='player-sheet'){sheetTab='velo';modal='player-sheet';}
 else if(a.startsWith('sheet-tab-'))sheetTab=a.slice(10);
 else if(a.startsWith('choose-')){const full=m.cardVersion!==3&&S.player(m).cardHand.length>=5,prior=S.player(m).id;S.chooseCard(m,Number(a.slice(7)));if(m.cardVersion===3&&m.players.length>1&&S.player(m).id!==prior&&!m.done)privacyCover=true;modal='';route=[];if(full)message='Main limitée à 5 cartes : la plus ancienne a été défaussée.';}
 else if(a==='event-reveal-hand'){privacyCover=false;modal='';}
 else if(a==='event-intervene'){modal='event-intervene';}
 else if(a.startsWith('event-climate-from-')){eventActorId=a.slice('event-climate-from-'.length);modal='event-climate-hand';}
 else if(a.startsWith('event-climateplay-')){const index=Number(a.slice('event-climateplay-'.length));if(!S.playEventClimate(m,eventActorId,index))message='Intervention indisponible : terrain, fenêtre ou cible invalide.';modal='';}
 else if(a==='event-pass'){S.passEventIntervention(m);modal='';}
 else if(a==='event-attack-defend'){if(!S.defendEventAttack(m))message='Coup de pouce indisponible.';else if(m.cardWindow)S.finishEventRoute(m);modal='';}
 else if(a==='event-attack-accept'||a.startsWith('event-attack-bonus-')||a==='event-attack-food'||a==='event-attack-energy'){
  const choice=a.startsWith('event-attack-bonus-')?{bonusIndex:Number(a.slice('event-attack-bonus-'.length))}:a==='event-attack-food'?{resource:'food'}:a==='event-attack-energy'?{resource:'energy'}:{};
  if(!S.resolveEventAttack(m,choice))message='Choisis une résolution valide pour cette carte.';else if(m.cardWindow)S.finishEventRoute(m);modal='';
 }
 else if(a.startsWith('event-discard-')){const prior=S.player(m).id;if(!S.discardEventHand(m,Number(a.slice('event-discard-'.length))))message='Défausse impossible.';else if(m.players.length>1&&S.player(m).id!==prior&&!m.done)privacyCover=true;modal='';}
 else if(a.startsWith('event-view-')){cardIndex=Number(a.slice('event-view-'.length));modal='event-card-view';}
 else if(a.startsWith('event-play-')){cardIndex=Number(a.slice('event-play-'.length));const c=eventCardById(S.player(m).cardHand[cardIndex]);if(!c||!S.canPlayCard(m,cardIndex))message='Cette carte ne peut pas être jouée maintenant.';else if(c.category==='negative')modal='event-target';else if(c.category==='permanent'&&S.player(m).bonusCards.length>=m.rules.eventCards.bonusLimit)modal='event-replace';else{if(!S.playCard(m,cardIndex,S.player(m).id))message='Effet indisponible.';modal='';}}
 else if(a.startsWith('event-target-')){eventTargetId=a.slice('event-target-'.length);modal='event-confirm';}
 else if(a==='event-confirm-attack'){if(!S.playCard(m,cardIndex,eventTargetId))message='Cette cible est invalide ou la carte ne peut plus être jouée.';modal='';}
 else if(a.startsWith('event-replace-')){const index=Number(a.slice('event-replace-'.length));if(!S.playCard(m,cardIndex,S.player(m).id,index))message='Remplacement impossible.';modal='';}
 else if(a.startsWith('card-')){cardIndex=Number(a.slice(5));const card=cardById(S.player(m).cardHand[cardIndex]);if(card?.choice==='food-energy')modal='card-effect-choice';else if(card?.target==='self'){if(S.playCard(m,cardIndex,S.player(m).id))modal='';}else modal='card-target';}
 else if(a==='ravito-food'||a==='ravito-energy'){if(S.playCard(m,cardIndex,S.player(m).id,a==='ravito-food'?'food':'energy'))modal='';}
 else if(a.startsWith('target-')){if(!S.playCard(m,cardIndex,a.slice(7)))message='Cette carte ne peut pas être jouée sur cette cible.';else modal='';}
 else if(/^enc-\d$/.test(a)){if(!S.resolveEncounter(m,+a.slice(4)))message='Choix impossible : il te manque de quoi le payer.';}
 else if(a==='events-cards'||a==='events-encounters'){readRoster();setupRules.encounters={...(setupRules.encounters||{}),enabled:a==='events-encounters'};localStorage.setItem('velo-setup-rules',JSON.stringify(setupRules));}
 else if(a.startsWith('pending-')){const choice={ 'pending-tube':'tube','pending-lose':'lose','pending-kit':'kit','pending-energy':'energy','pending-food':'food','pending-auto':'auto'}[a];if(!S.resolvePendingCard(m,choice))message='Cette résolution n’est pas disponible.';}
 else if(a==='eat'){if(!S.eat(m))message='Repas indisponible.';}
 else if(a==='food'){if(!S.buyFood(m))message='Achat indisponible.';}
 else if(a==='restaurant'){if(!S.restaurant(m))message='Restaurant indisponible : ville, argent ou repas quotidien.';}
 else if(a==='work'){if(!S.work(m))message='Le travail demande une journée sans déplacement ni pose de tuile.';mapSelection='';}
 else if(a.startsWith('rest-')){if(!S.rest(m,a.slice(5)))message='Repos indisponible : journée commencée, argent, lieu ou équipement requis.';mapSelection='';}
 else if(a==='endturn'){modal='';S.endTurn(m);mapSelection='';route=[];}
 else if(a==='endturn-ask'){const left=Math.max(0,S.distance(m)-m.moved);if(!m.moved||left&&S.moves(m).length)modal='end-confirm';else{S.endTurn(m);mapSelection='';route=[];}}
 else if(a==='rest-open'){modal='';sheetTab='journee';if(narrowScreen())sheetDrawer=true;else if(!displayPrefs.sheet)displayPrefs=writeDisplayPref('sheet',true);setTimeout(()=>document.querySelector('.fiche-journee .fiche-label:nth-of-type(2)')?.scrollIntoView({behavior:'smooth',block:'center'}),80);}
 else if(a==='resolve'||a==='decline'){S.resolve(m,a==='decline'?'decline':'accept');mapSelection='';}
 else if(a==='art'){artPref=!artPref;boardRenderer?.setArt(artPref);}
 else if(a==='zoomin')zoom=Math.min(2,zoom+.2);
 else if(a==='zoomout')zoom=Math.max(.6,zoom-.2);
 if(m?.history){const news=m.history.slice(historyMark);const found=news.find(h=>h.kind==='landmark');if(found){const l=m.landmarks?.[found.key];revealCard={name:l?.name||'Lieu remarquable',value:found.value||l?.value||1,player:found.name};}
  routeNews=news.filter(h=>['col','col-first','climber','fatigue','budget'].includes(h.kind)).map(h=>({kind:h.kind,text:h.text}));}
 render();if(['continue','center','split-view','zoomin','zoomout','resolve','decline','work','rest-bivouac','rest-camping','rest-hotel'].includes(a))center();
}
function bindCardEditor(){
  const eventSlot=document.querySelector('#event-editor-slot'),eventEffect=document.querySelector('#event-editor-effect'),eventName=document.querySelector('#event-editor-name'),eventDescription=document.querySelector('#event-editor-description');
  if(eventSlot)eventSlot.onchange=()=>{resetEventDraft(eventSlot.value);message='';render();};
  if(eventEffect)eventEffect.onchange=()=>{eventDraft={slotId:eventDraft.slotId,templateId:eventEffect.value,name:eventName?.value||'',description:eventDescription?.value||''};render();};
  if(eventName)eventName.oninput=()=>{eventDraft.name=eventName.value;const title=document.querySelector('#event-editor-preview .event-face h3');if(title)title.textContent=eventName.value;};
  if(eventDescription)eventDescription.oninput=()=>{eventDraft.description=eventDescription.value;const flavor=document.querySelector('#event-editor-preview .event-face-flavour');if(flavor)flavor.textContent=eventDescription.value;};
  document.querySelectorAll('[data-event-card-edit]').forEach(el=>el.onclick=()=>{resetEventDraft(el.dataset.eventCardEdit);message='Carte sélectionnée : choisis son effet et modifie son texte.';render();document.querySelector('.event-editor-layout .card-editor-form')?.scrollIntoView?.({block:'start',behavior:'smooth'});});
  const eventImport=document.querySelector('#import-event-cards');if(eventImport)eventImport.onchange=async()=>{try{const file=eventImport.files?.[0];if(!file||file.size>1_000_000)throw Error('Choisis un fichier JSON de moins de 1 Mo.');const raw=JSON.parse(await file.text()),incoming=normalizeEventEdits(raw?.version===2?raw.eventCardEdits:null),merged=new Map([...eventEdits,...incoming].map(edit=>[edit.slotId,edit]));storeEventEdits([...merged.values()]);resetEventDraft(eventDraft.slotId);message=incoming.length+' variante(s) Événement importée(s) pour les prochaines parties.';render();}catch(e){message='Import refusé : '+e.message;render();}};
 const kind=document.querySelector('#card-editor-kind'),preset=document.querySelector('#card-editor-preset'),title=document.querySelector('#card-editor-title');
 if(title)title.oninput=()=>{cardDraft.title=title.value;const preview=document.querySelector('.card-editor-preview strong');if(preview)preview.textContent=title.value||cardById(cardDraft.template)?.title||'';};
 if(kind)kind.onchange=()=>{cardDraft.title=title?.value??cardDraft.title;cardDraft.template=CARD_PRESETS.find(c=>c.type===kind.value)?.id||CARD_PRESETS[0].id;render();};
 if(preset)preset.onchange=()=>{cardDraft.title=title?.value??cardDraft.title;cardDraft.template=preset.value;render();};
 document.querySelectorAll('[data-card-copy]').forEach(el=>el.onclick=()=>{const source=cardById(el.dataset.cardCopy);if(!source)return;cardDraft={id:'',title:(source.title+' — variante').slice(0,50),template:source.id};message='Variante prête à personnaliser.';render();});
 document.querySelectorAll('[data-card-edit]').forEach(el=>el.onclick=()=>{const card=customCards.find(c=>c.id===el.dataset.cardEdit);if(!card)return;cardDraft={id:card.id,title:card.title,template:card.template};message='Modification de « '+card.title+' ».';render();});
 document.querySelectorAll('[data-card-remove]').forEach(el=>el.onclick=()=>{const card=customCards.find(c=>c.id===el.dataset.cardRemove);if(!card||globalThis.confirm?.('Supprimer « '+card.title+' » des futures parties ?')===false)return;try{storeCustomCards(customCards.filter(c=>c.id!==card.id));if(cardDraft.id===card.id)resetCardDraft();message='Carte personnalisée supprimée. Les parties commencées ne changent pas.';}catch(e){message=e.message;}render();});
 const importInput=document.querySelector('#import-cards');if(importInput)importInput.onchange=async()=>{try{const file=importInput.files?.[0];if(!file||file.size>1_000_000)throw Error('Choisis un fichier JSON de moins de 1 Mo.');const raw=JSON.parse(await file.text()),incoming=normalizeCustomCards(Array.isArray(raw)?raw:raw?.version===1?raw.cards:null),merged=new Map([...customCards,...incoming].map(card=>[card.id,card]));storeCustomCards(normalizeCustomCards([...merged.values()]));message=incoming.length+' ancienne(s) variante(s) importée(s) en archive.';render();}catch(e){message='Import refusé : '+e.message;render();}};
}
function bind(){
 const tileType=document.querySelector('#map-tile-type'),tileVariant=document.querySelector('#map-tile-variant'),tilePreview=document.querySelector('#map-tile-preview');
 if(tileType&&tileVariant){
  const draw=()=>{if(tilePreview)drawVariantPreview(tilePreview,tileType.value,tileVariant.value);};
  const costBox=document.querySelector('#map-tile-cost'),colBox=document.querySelector('#col-effort-box');
  const showCost=()=>{const type=tileType.value,c=CLASSIC.terrain[type];if(colBox)colBox.hidden=type!=='col';if(costBox)costBox.textContent=type==='col'?'Le col mythique n’a pas de coût fixe : choisis-le ci-dessous (il s’applique à tous les cols de la carte).':type==='mer'?'Mer : on ne peut pas rouler dessus (seuls les ferries la traversent).':`Coût de déplacement : ${c} énergie. Il est fixé automatiquement par les règles du jeu pour ce terrain.`;};
  const fill=keep=>{const list=variantsFor(tileType.value);tileVariant.innerHTML='<option value="">Classique</option>'+list.map(([id,label])=>`<option value="${id}">${label}</option>`).join('');tileVariant.value=list.some(([id])=>id===keep)?keep:'';tileVariant.closest('label').hidden=!list.length;showCost();draw();};
  tileType.onchange=()=>fill('');tileVariant.onchange=draw;fill(tileVariant.dataset.current||'');
 }
 const editorNameInput=document.querySelector('#editor-map-name');if(editorNameInput)editorNameInput.oninput=()=>{editorName=editorNameInput.value;};
 document.querySelectorAll('[data-action]').forEach(el=>el.onclick=()=>act(el.dataset.action));
 bindCardEditor();
 document.querySelectorAll('[data-mode]').forEach(el=>el.onclick=()=>{mode=el.dataset.mode;selectedMapId='';screen='setup';render();});
 document.querySelectorAll('[data-map-choice]').forEach(el=>el.onclick=()=>{const id=el.dataset.mapChoice;if(id&&!findMap(id))return;selectedMapId=id;mode='plateau';const chosen=findMap(id);if(chosen)setupRules.terrain.col=chosen.terrain.col;screen='setup';render();});
 document.querySelectorAll('[data-edit-map]').forEach(el=>el.onclick=()=>{openEditor(el.dataset.editMap);render();center();});
 const count=document.querySelector('#player-count');if(count)count.onchange=()=>{readRoster();const n=+count.value;roster=Array.from({length:n},(_,i)=>roster[i]||{name:'Joueur '+(i+1),bike:'gravel'});render();};
  document.querySelectorAll('[data-voyage]').forEach(el=>el.onclick=()=>{const id=el.dataset.voyage;if(!drawn.some(v=>v.id===id))return;roster[choosing].voyage=id;choosing++;if(choosing<roster.length)drawn=drawVoyages();else{try{m=S.createMatch(roster,mode,setupRules,undefined,customCards,eventEdits);}catch(e){choosing--;message=e.message;render();return;}const chosen=findMap(selectedMapId);if(chosen){applyCustomMap(m,chosen);m.mapChoice=chosen.id;m.mapName=chosen.name;}else{m.mapChoice='';m.mapName='Europe standard';}screen='game';zoom=1;mapSelection='';selected=0;}render();if(screen==='game')center();});
 document.querySelectorAll('[data-select]').forEach(el=>el.onclick=()=>{selected=+el.dataset.select;render();});
 document.querySelectorAll('[data-place]').forEach(el=>el.onclick=()=>{const [x,y]=el.dataset.place.split(',').map(Number);S.place(m,selected,x,y);selected=0;render();});
 document.querySelectorAll('[data-move]').forEach(el=>{if(el.closest?.('[data-board-host]')&&liveBoardSupported)return;el.onclick=()=>handleBoardHex(el.dataset.move);el.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();el.onclick();}};});
 document.querySelectorAll('[data-equipment]').forEach(el=>el.onclick=()=>{const id=el.dataset.equipment,p=roster[choosing];p.items||=[];p.items=p.items.includes(id)?p.items.filter(i=>i!==id):[...p.items,id];render();});
 document.querySelectorAll('[data-buy]').forEach(el=>el.onclick=()=>{if(!S.buy(m,el.dataset.buy))message='Achat impossible : lieu, argent ou capacité.';render();});
 document.querySelectorAll('[data-discard]').forEach(el=>el.onclick=()=>{S.discard(m,el.dataset.discard);render();});
 document.querySelectorAll('[data-player]').forEach(el=>el.onclick=()=>{modal='player-'+el.dataset.player;render();});
 const widthControl=document.querySelector('#split-width');if(widthControl)widthControl.oninput=()=>{splitWidth=Math.max(30,Math.min(50,Number(widthControl.value)||40));localStorage.setItem('velo-split-width',String(splitWidth));document.querySelector('.game')?.style?.setProperty('--sheet-width',splitWidth+'%');const output=document.querySelector('#split-width-value');if(output)output.textContent=splitWidth+'%';};
 const file=document.querySelector('#import-save');if(file)file.onchange=async()=>{try{const imported=S.load(await file.files[0].text());if(m)localStorage.setItem('velo-save-before-import',S.serialize(m));m=imported;screen='game';modal='';mapSelection='';persist(true);render();center();}catch(e){message='Import refusé : '+e.message;render();}};
}
const previousGame=game,previousOverlay=overlay;
game=()=>{
 if(m.mode==='tuiles')return previousGame();
 const p=S.player(m),g=S.view(m),reachable=S.moves(m),r=m.rules,scale=1.05*zoom;
 const nextSteps=Object.keys(m.board).filter(key=>S.routeCheck(m,[...route,key]).ok);
 return `<main class="game"><div class="player-order">${m.players.map((q,i)=>`<button data-player="${i}" class="${i===m.activeIndex?'active':''}" style="--player-color:${q.color}"><span>●</span> ${esc(q.name)} · ${q.points} ✨ <small>Jour ${q.availableDay}${i===m.activeIndex?' · à jouer':''}</small></button>`).join('')}</div><div class="topbar"><div><span class="eyebrow">NOUVEAU PLATEAU EUROPE · JOUR ${m.round}</span><h2>${esc(p.name)} <small class="muted">${m.moved}/${S.distance(m)} cases aujourd’hui</small></h2>${btn(mapEditMode?'✓ Terminer l’édition':'✏️ Modifier la carte','mapedit',mapEditMode?'active':'light')}</div><div class="stats">${[['⚡','Énergie',p.energy+'/'+energyCap(m,p)],...(r.fatigue.enabled?[['😴',isExhausted(m,p)?'Fourbu':'Fatigue',(p.fatigue||0)+'/'+r.fatigue.days]]:[]),['🍎','Nourriture',p.food],['🪙','Argent',p.money],['✨','Aventure',p.points]].map(([i,n,v])=>`<div class="stat">${i} ${n}<strong>${v}</strong></div>`).join('')}</div></div><div class="hint">${mapEditMode?'Mode édition actif : clique une case pour corriger son terrain ou son nom.':m.phase==='card-choice'?'Choisis une carte à garder pour terminer ton tour.':m.phase==='card-resolution'?'Une carte négative doit être résolue avant de commencer ta journée.':m.phase==='puncture'?'Crevaison ! Répare ou retourne à la dernière ville.':route.length?'Étape '+(route.length+1)+' : seules les cases entourées en jaune sont accessibles depuis la dernière case sélectionnée. Vérifie le coût avant d’effectuer le parcours.':'Choisis une case entourée en jaune pour commencer, puis poursuis de proche en proche. Jusqu’à '+Math.max(0,S.distance(m)-m.moved)+' cases; les bateaux se prennent séparément.'}</div>${objective(g)}<div class="layout"><section><div class="map-wrap"><div class="map">${boardSurfaceMarkup({g,reachable,cost:(_,t)=>S.cost(m,t),selected:mapSelection,route,nextSteps,editMode:mapEditMode,ferryTargets:!mapEditMode&&!route.length?S.ferryOptions(m).map(t=>t.key):[]})}</div><div class="maptools">${btn('−','zoomout')}${btn('+','zoomin')}${btn('◎','center')}${artButton()}${btn(mapEditMode?'✓ Finir':'✏️ Éditer','mapedit',mapEditMode?'active':'')}${btn('📋<span class="tool-label"> Fiche</span>','sheet-toggle','sheet-toggle')}</div></div>${details(reachable)}<div class="board-legend">${['plaine','moyenne_montagne','montagne','col','cote','ville'].map(id=>`<span>${E.terrains[id].icon} ${E.terrains[id].name} : ${r.terrain[id]} ⚡</span>`).join('')}</div><div class="toast" role="status">${esc(message)}</div>${leaderboard()}</section>${sidebar()}</div></main>`;
};
details=reachable=>{const t=m.board[mapSelection],check=S.routeCheck(m,route),ferries=S.ferryOptions(m),p=S.player(m),tags=routeTags(),picked=route.map((k,i)=>`${i+1}. ${m.board[k].name||E.terrains[m.board[k].type].name} (${tags[i]?'route':'hors route'})`).join(' → ');return `<div class="cell-details route-planner"><div><strong>${t?esc(t.name||E.terrains[t.type].name):'Planifier l’étape'}</strong><small>${route.length?esc(picked):'Sélectionne les cases accessibles, dans l’ordre.'}</small><small>${route.length?'Coût total : '+check.energyUsed+' ⚡ · énergie restante : '+(p.energy-check.energyUsed)+' · '+route.length+' case(s)':`Disponible : ${p.energy} ⚡ · ${Math.max(0,S.distance(m)-m.moved)} case(s) maximum`}</small>${t&&!route.includes(mapSelection)&&m.board[p.pos].links.includes(mapSelection)?`<small>${S.roadStep(m,p.pos,t)?'🛣 Sur la route depuis ta position':'🌾 Hors route depuis ta position'}</small>`:''}${offroadPlannerLine(tags)}${meteoPlannerLine()}${ferries.length?`<small>⛴ Bateau : ${ferries.map(f=>esc(f.name||f.key)).join(', ')} · ${m.rules.ferryPrice} 🪙 · termine la journée.</small>`:''}</div></div>`;};
sidebar=()=>{const blocked=m.done||!['move','place'].includes(m.phase);return `<aside class="player-sheet-dock dock-v1" aria-label="Actions de la journée">${dayAction(blocked)}</aside>`;};
// Barre « road-book » : les 3 étapes de la journée (Tracer → Rouler → Finir), un seul gros bouton orange, des boutons ronds pour le reste.
const dockIcon=(sym,label,action,disabled=false,cls='')=>action==='mapedit'?'':`<button type="button" class="dock-ico ${cls}" data-action="${action}" ${disabled?'disabled':''}><span aria-hidden="true">${sym}</span><small>${label}</small></button>`;
function daySteps(active){return `<ol class="dock-steps" aria-label="Étapes de la journée">${['Tracer','Rouler','Finir'].map((n,i)=>`<li class="${i<active?'done':i===active?'now':''}"><span>${i<active?'✓':i+1}</span><small>${n}</small></li>`).join('')}</ol>`;}
const dayMain=(sym,label,tag,action,disabled=false)=>`<button type="button" class="dock-main" data-action="${action}" ${disabled?'disabled':''}><span class="dm-ico" aria-hidden="true">${sym}</span><b>${label}</b>${tag?`<span class="dm-tag">${tag}</span>`:''}</button>`;
function dayAction(blocked){const p=S.player(m),left=Math.max(0,S.distance(m)-m.moved),hand=p.cardHand.length;
 const cards=S.encountersOn(m)?'':dockIcon('🃏','Cartes '+hand,'cards',m.phase==='card-choice'||m.phase==='card-resolution'||m.phase==='puncture');
 let step,center,icons;
 if(blocked||(typeof onlineGame==='function'&&onlineGame()&&!myTurn())){step=m.moved?2:0;
  if(typeof onlineGame==='function'&&onlineGame()&&!myTurn()){const a=m.players.find(q=>q.id===NET.actorId(m));center=`<div class="dock-wait"><span aria-hidden="true">⏳</span><span><b>${esc(a?.name||'L’autre joueur')} ${m.pendingAttack?'répond à une carte…':'roule…'}</b><br>Tes boutons se réveillent dès que c’est ton tour. En attendant, regarde ta fiche.</span></div>`;icons=dockIcon('🔄','Recharger','net-resync');}
  else{center=dayMain('⏳','Patiente…','','endturn',true);icons=cards;}}
 else if(route.length){const c=S.routeCheck(m,route),n=route.length;step=1;
  center=dayMain('🚴',c.ok?`Rouler ${n} case${n>1?'s':''}`:'Parcours impossible',c.ok?`−${c.energyUsed} ⚡`:'','route-go',!c.ok)+(c.ok?'':`<p class="dock-why">${esc(c.reason||'')}</p>`);
  icons=dockIcon('✕','Effacer','route-clear')+cards;}
 else if(!m.moved&&p.turnModifiers?.skipMove){step=2;center=dayMain('⏭','Finir ma journée','pas de déplacement aujourd’hui','endturn');icons=dockIcon('🌙','Me reposer','rest-open')+cards;}
 else if(!m.moved){step=0;center=`<div class="dock-hint"><span aria-hidden="true">🗺️</span><span><b>Trace ton étape</b><br>Clique les cases entourées sur la carte · ${left} case${left>1?'s':''} · ${p.energy} ⚡</span></div>`;
  icons=dockIcon('🌙','Me reposer','rest-open')+dockIcon('⏭','Passer','endturn-ask','','dim')+cards;}
 else{step=2;center=dayMain('🌙','Finir ma journée',left&&S.moves(m).length?`${left} case${left>1?'s':''} restante${left>1?'s':''}`:'','endturn-ask');
  const eat=S.eatGain(m,p);icons=dockIcon('🍎','Manger','eat',!(p.food>0&&m.ate<m.rules.food.maxPerTurn&&p.energy<energyCap(m,p)&&(p.items.includes('rechaud')||['ville','auberge'].includes(m.board[p.pos]?.type))))+cards;}
 return `<div class="dock-day">${daySteps(step)}<div class="dock-center">${center}</div><div class="dock-icons">${icons}<!--icons--></div></div>`;}
function playedCardPanel(p){
 const placed=m.history.filter(entry=>entry.kind==='card'&&entry.player===p.id).map(entry=>{
  const card=cardById(entry.cardId)||(!entry.cardId?effectiveCards(m).find(c=>entry.text===c.title+' jouée.'||entry.text.startsWith(c.title+' donnée à ')):null);
  return card?{card,entry}:null;
 }).filter(Boolean).reverse();
 return `<section class="sheet-card sheet-played-zone"><div class="sheet-section-heading"><h3>🎴 Cartes posées</h3><span>${placed.length} jouée${placed.length===1?'':'s'}</span></div><p class="sheet-zone-note">Séparées de ta main : leurs effets ont été appliqués ou transmis.</p><div class="sheet-played-cards">${placed.map(({card,entry})=>{const target=m.players.find(q=>q.id===entry.targetId),label=card.target==='other'?`Donnée à ${esc(target?.name||entry.text.split(' donnée à ')[1]?.replace(/\.$/,'')||'un adversaire')}`:'Jouée';return `<article class="played-card ${card.type}"><span class="played-card-icon">${card.icon||'🃏'}</span><div><small>${label} · jour ${entry.round}</small><strong>${esc(card.title)}</strong><p>${esc(card.text)}</p></div></article>`;}).join('')||'<p class="sheet-empty-played">Aucune carte posée pour le moment.</p>'}</div></section>`;
}
function playerSheetPanel(){const p=S.player(m),r=m.rules,g=S.view(m),v=progress(g),city=m.board[p.pos]?.name||E.terrains[m.board[p.pos]?.type]?.name||'Plateau',blocked=m.done||!['move','place'].includes(m.phase),dayBlocked=blocked||m.moved>0||m.placed,atCity=m.board[p.pos]?.type==='ville',canEat=p.items.includes('rechaud')||atCity||m.board[p.pos]?.type==='auberge';let panel='';
 if(sheetTab==='velo')panel=`<div class="sheet-overview"><section class="sheet-bike"><span class="sheet-bike-icon">🚴</span><div><span class="eyebrow">MON VÉLO</span><h3>${esc(r.bikes[p.bike].name)}</h3><p>${S.inventorySpace(m)}/${r.bikes[p.bike].capacity} emplacements utilisés · ${esc(city)}</p></div><div class="sheet-day">JOUR<strong>${p.availableDay}</strong></div></section><div class="sheet-resource-grid">${[['energy','⚡','Énergie',p.energy,energyCap(m,p),isExhausted(m,p)?'Fourbu : énergie maximale réduite':'Énergie disponible'],...(r.fatigue.enabled?[['fatigue','😴',isExhausted(m,p)?'Fourbu':'Fatigue',p.fatigue||0,r.fatigue.days,isExhausted(m,p)?'Camping ou hôtel pour récupérer':'Jours de route sans vraie nuit']]:[]),['food','🍎','Nourriture',p.food,null,'Provisions dans les sacoches'],['money','🪙','Argent',p.money,null,'Pièces pour achats et hébergements'],['points','✨','Points aventure',p.points,null,'Premières visites et objectifs']].map(([id,icon,label,value,max,note])=>`<article class="sheet-resource ${id}"><div><span>${icon}</span><small>${label}</small></div><strong>${value}${max?`<small> / ${max}</small>`:''}</strong>${max?`<div class="resource-track"><i style="width:${Math.max(0,Math.min(100,value/max*100))}%"></i></div>`:''}<p>${note}</p></article>`).join('')}</div><section class="sheet-card"><div class="sheet-section-heading"><h3>🎒 Équipement à bord</h3><span>${S.inventorySpace(m)}/${r.bikes[p.bike].capacity} places</span></div><div class="sheet-equipment">${Object.entries(r.equipment).map(([id,e])=>`<div class="sheet-item ${p.items.includes(id)?'owned':''}"><span>${equipmentIcons[id]||'🎒'}</span><div><strong>${esc(e.name)}</strong><small>${e.space} place${e.space>1?'s':''}</small></div><b>${p.items.includes(id)?'✓':'—'}</b></div>`).join('')}</div>${btn('Gérer / acheter le matériel','shop','light',blocked||!atCity)}</section><section class="sheet-card sheet-objective"><div class="sheet-section-heading"><h3>🧭 Objectif de voyage</h3><span>${p.completed?'Terminé':'En cours'}</span></div>${v?`<div class="sheet-voyage"><div class="voyage-title"><strong>${esc(v.v.title)}</strong><span>${esc(v.v.from)} → ${esc(v.v.to)}</span></div><div class="objective-checks">${v.rows.map(row=>`<div class="${row.done?'checked':''}">${row.done?'✓':'○'} ${esc(row.label)} <b>${row.value}/${row.target}</b></div>`).join('')}</div></div>`:'<p>Objectif indisponible.</p>'}</section><div class="sheet-card sheet-movement"><strong>🚴 Progression du jour</strong><span>${m.moved} / ${S.distance(m)} cases</span><small>${m.phase==='card-resolution'?'Résous d’abord ta carte reçue.':m.turnModifiers?.distancePenalty?'−'+m.turnModifiers.distancePenalty+' déplacement par effet de carte.':'Maximum absolu : 5 cases.'}</small></div></div>`;
 else if(sheetTab==='tour')panel=`<div class="sheet-actions"><section class="sheet-card"><span class="eyebrow">JOUR ${p.availableDay} · ${esc(city)}</span><h3>Que fais-tu aujourd’hui ?</h3><p>Rouler, manger ou dormir : dormir au camping ou à l’hôtel efface la fatigue.</p><div class="sheet-action-grid">${btn('🍎 Manger · +'+(r.food.energy+(p.items.includes('rechaud')?r.food.stoveBonus:0))+' énergie','eat','',blocked||!canEat||!p.food||m.ate>=r.food.maxPerTurn||p.energy>=energyCap(m,p))}${btn('🥕 Acheter '+r.food.quantity+' provisions · '+r.food.price+' pièces','food','',blocked||p.money<r.food.price||(r.food.cityOnly&&!atCity))}${btn('🍽 Restaurant · '+r.food.restaurantPrice+' pièces','restaurant','',blocked||!atCity||p.money<r.food.restaurantPrice||p.energy>=energyCap(m,p)||m.ate>=r.food.maxPerTurn)}${r.workEnabled?btn('🔧 Travailler · +'+r.salary+' pièces · '+r.workDays+' jour(s)','work','',dayBlocked||(r.workCityOnly&&!atCity)):''}${Object.entries(r.rest).map(([id,a])=>{const free=id==='bivouac'&&p.turnModifiers?.freeBivouac;return btn(`${id==='bivouac'?'⛺':id==='camping'?'🏕':'🏨'} ${a.name} · ${free?'gratuit':a.price+' pièces'} · ${a.days} jour(s)`,'rest-'+id,'',dayBlocked||(!free&&(p.money<a.price||(a.tent&&!p.items.includes('tente'))))||(a.cityOnly&&!atCity));}).join('')}${S.ferryOptions(m).map(t=>`<button data-ferry="${esc(t.key)}" ${blocked||p.money<r.ferryPrice?'disabled':''}>⛴ Bateau vers ${esc(t.name||t.key)} · ${r.ferryPrice} pièces, fin de journée</button>`).join('')}${btn('🎒 Gérer mes équipements','shop','light',blocked||!atCity)}${btn('Terminer ma journée →','endturn','sheet-end-day',blocked)}${btn('💾 Sauvegarder','save','light')}${btn('📊 Historique et statistiques','stats','light')}${btn('🏁 Terminer la partie','finish','light')}</div><div class="sheet-rule-note"><strong>🧭 Rappel du tour</strong><span>Jusqu’à ${S.distance(m)} cases · au plus 5 par jour. Dormir termine la journée. Sans réchaud, mange uniquement en ville ou à l’auberge ; bivouac normalement avec une tente.</span></div></section></div>`;
 else panel=`<div class="sheet-journal"><section class="sheet-card"><div class="sheet-section-heading"><h3>🃏 Cartes en main</h3><span>${p.cardHand.length}/5 cartes · main limitée</span></div><div class="sheet-hand">${p.cardHand.map((id,i)=>{const c=cardById(id);return `<article class="game-card ${c.type}"><div class="card-title"><span>${c.icon||'🃏'}</span><div><small>${c.type==='negative'?'À donner':'Positive'}</small><h4>${esc(c.title)}</h4></div></div><p>${esc(c.text)}</p>${btn(c.target==='other'?'Donner à un adversaire':'Jouer','card-'+i,'',c.target==='other'&&m.players.length<2||!S.canPlayCard(m,i))}</article>`;}).join('')||'<p>Aucune carte en main.</p>'}</div><p class="muted">Quand ta main est pleine, garder une carte défausse automatiquement la plus ancienne.</p></section>${p.pendingCards?.length?`<section class="sheet-card sheet-pending-zone"><div class="sheet-section-heading"><h3>⚠️ Cartes spéciales à résoudre</h3><span>${p.pendingCards.length}</span></div><div class="sheet-pending">${p.pendingCards.map(id=>{const c=cardById(id);return `<div><span>${c?.icon||'⚠️'}</span><strong>${esc(c?.title||'Carte')}</strong><small>${esc(c?.text||'À résoudre à ton prochain tour')}</small></div>`;}).join('')}</div></section>`:''}<details class="sheet-extras"><summary>📓 Journal & aide des terrains</summary><div class="sheet-extras-content"><section class="sheet-card"><h3>Statut & notes</h3><div class="log sheet-log">${p.log.map(l=>`<div>• ${esc(l)}</div>`).join('')||'Aucune action pour l’instant.'}</div></section><section class="sheet-card"><h3>🗺️ Coût des terrains</h3><div class="sheet-terrain-help">${Object.entries(r.terrain).map(([id,cost])=>`<div><span>${E.terrains[id]?.icon||'◉'}</span><strong>${esc(E.terrains[id]?.name||id)}</strong><small>Coût : ${cost} énergie</small></div>`).join('')}</div><p class="muted">Les villes permettent les achats et le restaurant. La côte peut mener à une liaison par bateau.</p></section></div></details></div>`;
 if(sheetTab==='cartes')panel+=playedCardPanel(p);
 return panel;
}
function playerSheet(inline=false){const p=S.player(m),previous=sheetTab,sections=[['velo','Vélo, mission & équipement'],['cartes',inline?'Cartes posées & carnet':'Ma main & carnet'],['tour','Actions du tour']].map(([id,label])=>{sheetTab=id;return `<section class="sheet-page-section sheet-page-${id}" aria-label="${label}"><h3 class="sheet-page-heading">${label}</h3>${playerSheetPanel()}</section>`;}).join('');sheetTab=previous;const body=`<div class="player-sheet-head"><div><span class="eyebrow">PLATEAU DU CYCLISTE</span><h2 style="--player-color:${p.color}"><i></i>${esc(p.name)}</h2></div><span class="mat-day">JOUR ${p.availableDay}</span></div><div class="sheet-one-page">${sections}</div>`;return inline?`<section class="player-sheet-inline player-mat">${body}</section>`:body;}
overlay=()=>{let content='';if(!modal&&m&&screen==='game'&&m.phase==='card-choice')content=`<span class="eyebrow">FIN DE JOURNÉE · ${esc(S.player(m).name)}</span><h2>Pioche deux cartes, garde-en une</h2><div class="card-choice-list">${m.cardChoices.map((id,i)=>{const c=cardById(id);return `<article class="${c.type}"><div class="card-title"><span>${c.icon||'🃏'}</span><div><small>${c.type==='negative'?'À donner':'Positive'}</small><h3>${esc(c.title)}</h3></div></div><p>${esc(c.text)}</p>${btn('Garder cette carte','choose-'+i)}</article>`;}).join('')}</div><p>L’autre carte est défaussée. Ton tour se termine après ton choix.</p>`;
 else if(!modal&&m&&screen==='game'&&m.phase==='card-resolution'){const p=S.player(m),c=cardById(p.pendingCards[0]);let choices='';if(c?.resolution==='tube')choices=(p.items.includes('chambre')?btn('Utiliser ma chambre à air','pending-tube'):'')+btn('Perdre 1 déplacement','pending-lose','light');else if(c?.resolution==='kit-energy')choices=(p.items.includes('kit')?btn('Utiliser mon kit (sans le consommer)','pending-kit'):'')+btn('Perdre 2 énergie','pending-energy','light');else if(c?.resolution==='hunger')choices=(p.food?btn('Dépenser 1 nourriture','pending-food'):'')+btn('Perdre 2 énergie','pending-energy','light');else choices=btn('Résoudre','pending-auto');content=`<span class="eyebrow">CARTE À RÉSOUDRE · DÉBUT DE JOURNÉE</span><h2>${c?.icon||'🃏'} ${esc(c?.title||'Carte')}</h2><p>${esc(c?.text||'')}</p><div class="card-resolution-choices">${choices}</div>`;}
 else if(!modal&&m&&screen==='game'&&m.phase==='encounter')content=encounterModal();
 else if(!modal&&m&&screen==='game'&&m.phase==='voyage-choice'){const p=S.player(m),done=(p.voyagesDone||[]).length,r=m.rules.victory;
  content=`<span class="eyebrow">VOYAGE ACCOMPLI · ${esc(p.name)}</span><h2>🎉 Choisis ton prochain voyage</h2><p>${done} voyage${done>1?'s':''} réussi${done>1?'s':''}${r?.voyages?` sur ${r.voyages}`:''} · ${p.points} points d’aventure. </p><p>Choisis ta prochaine carte. Tu pars de la ville où tu es : seules les cases que tu parcours <b>à partir de maintenant</b> comptent pour les objectifs de la nouvelle carte. Ensuite, rejoins sa ville d’arrivée.</p><p class="muted">Si tu arrives sans avoir rempli tous les objectifs, tu peux quand même terminer le voyage, mais il rapporte 40 % de points en moins.</p>
  <div class="newvoyage-grid">${(p.voyageChoices||[]).map(id=>{const v=findVoyage(id),t=voyageTier(v),rows=progress({voyage:id,travelHistory:[],mode:'plateau'}).rows;return `<article class="newvoyage" style="--voyage-color:${v.color}"><div class="newvoyage-art"><div class="voyage-art voyage-art-map">${voyageMiniMap(v)}</div></div><div class="newvoyage-copy"><small>${esc(v.from)} → ${esc(v.to)}</small><h3>${esc(v.title)}</h3><ul>${rows.map(r=>`<li>${r.target} ${esc(r.label.toLowerCase())}</li>`).join('')}</ul><b class="mc-tier">${esc(t.name)} · +${t.points} points</b>${btn('Prendre ce voyage','newvoyage-'+id)}${(()=>{const f=S.fastTravelInfo(m,id,p);return f?btn(`🚆 Train jusqu’à ${esc(f.name)} · ${f.price} pièces`,'fasttravel-'+id,'light nv-train',!f.affordable||p.flat)+`<small class="nv-train-note">${f.cases} cases · prend la journée${f.affordable?'':' · pas assez de pièces'}</small>`:'';})()}</div></article>`;}).join('')}</div>`;}
 else if(!modal&&m&&screen==='game'&&m.phase==='puncture'){const b=S.breakdownOf(S.player(m)),has=S.player(m).items.includes(b.item);content=`<h2>${b.item==='secours'?'🩹':'🚲'} ${esc(b.title)}</h2><p>${has?b.fix:b.none}</p>${btn(has?b.ok:'Retourner à la ville','repair')}`;}
 else if(modal==='cards'){const p=S.player(m);content=`<h2>🃏 Cartes de jeu de ${esc(p.name)}</h2><p>Les positives se jouent pendant ton tour. Une carte négative se donne à un adversaire et sera résolue au début de son prochain tour.</p><div class="card-choice-list">${p.cardHand.map((id,i)=>{const c=cardById(id);return `<article class="game-card ${c.type||'positive'}"><div class="card-title"><span>${c.icon||'🃏'}</span><div><small>${c.type==='negative'?'Négative · à donner':'Positive · pour toi'}</small><h3>${esc(c.title)}</h3></div></div><p>${esc(c.text)}</p>${btn(c.target==='other'?'Donner à un adversaire':'Jouer','card-'+i,'',c.target==='other'&&m.players.length<2||!S.canPlayCard(m,i))}</article>`;}).join('')||'<p>Aucune carte en main.</p>'}</div>${btn('Fermer','close','light')}`;}
 else if(modal==='card-effect-choice'){const c=cardById(S.player(m).cardHand[cardIndex]);content=`<h2>${c?.icon||'🍎'} ${esc(c?.title||'Bon ravito')}</h2><p>Choisis ton ravitaillement.</p>${btn('+1 nourriture','ravito-food')}${btn('+1 énergie','ravito-energy','',S.player(m).energy>=m.rules.maxEnergy)}${btn('Annuler','cards','light')}`;}
 else if(modal==='card-target'){const c=cardById(S.player(m).cardHand[cardIndex]);content=`<h2>${esc(c.title)} : choisir la cible</h2><p>${esc(c.text)}</p>${m.players.filter(p=>p.id!==S.player(m).id).map(p=>btn(esc(p.name),'target-'+p.id,'',c.id==='crevaison'&&p.flat)).join('')}${btn('Annuler','cards','light')}`;}
 else if(modal==='ferry'){const t=m.board[ferryTarget];content=`<h2>⛴ Traversée vers ${esc(t?.name||'le port')}</h2><p>Coût : ${m.rules.ferryPrice} pièces. Tu débarques sur la case de destination et ta journée se termine. Tu pioches ensuite ${m.rules.eventCards.drawPerTurn} carte(s) et en gardes une. En solo, les événements révélés sont subis.</p>${btn('Confirmer la traversée','ferry-confirm','',S.player(m).money<m.rules.ferryPrice)}${btn('Annuler','ferry-cancel','light')}`;}
 else if(modal==='meteo')content=meteoModal();
 else if(modal==='end-confirm'){const left=Math.max(0,S.distance(m)-m.moved);content=m.moved?`<h2>⏭ Finir ta journée ?</h2><p>Tu peux encore rouler ${left} case${left>1?'s':''} aujourd’hui.</p>${btn('Oui, finir ma journée','endturn')}${btn('Continuer à rouler','close','light')}`:`<h2>⏭ Passer la journée sans rouler ?</h2><p>Tu ne rouleras pas et tu ne dormiras pas : la journée passe sans récupérer d’énergie. Pour récupérer, choisis plutôt « Me reposer aujourd’hui » (bivouac, camping ou hôtel).</p>${btn('Oui, passer la journée','endturn')}${btn('Me reposer','rest-open','light')}${btn('Annuler','close','light')}`;}
 if(modal==='player-sheet')content=playerSheet();
 if(!content)return previousOverlay();return `<div class="modal-back"><section class="modal ${modal==='player-sheet'?'wide player-sheet-modal':modal==='cards'?'wide card-hand-modal':modal==='meteo'?'meteo-modal':(!modal&&m?.phase==='encounter'?'encounter-modal':'')}" role="dialog" aria-modal="true">${content}</section></div>`;};
const previousBind=bind;bind=()=>{const dock=document.querySelector('.player-sheet-dock'),mapWrap=document.querySelector('.map-wrap');if(dock&&mapWrap)mapWrap.after(dock);const gameRoot=screen==='game'?document.querySelector('.game'):null;if(gameRoot&&!gameRoot.querySelector('.player-sheet-mount')){const sheet=document.createElement('div');sheet.className='player-sheet-mount';sheet.innerHTML=playerSheet(true);if(dock)dock.after(sheet);else gameRoot.append(sheet);}previousBind();document.querySelectorAll('[data-ferry]').forEach(el=>el.onclick=()=>{ferryTarget=el.dataset.ferry;modal='ferry';render();});const mapFile=document.querySelector('#import-map');if(mapFile)mapFile.onchange=async()=>{try{const file=mapFile.files?.[0];if(!file||file.size>5_000_000)throw Error('Choisis un fichier JSON de moins de 5 Mo.');const definition=normalizeMap(JSON.parse(await file.text())),candidate=E.makeGame('gravel',1,'traversee','plateau');applyCustomMap(candidate,definition);if(!mapIsPlayable(candidate))throw Error('Une ville est isolée du réseau.');const id='map-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);maps.push({id,...definition});storeMaps();selectedMapId=id;openEditor(id);message='Carte « '+definition.name+' » importée. Tu peux la modifier ou la choisir au démarrage.';render();center();}catch(e){message='Import de carte refusé : '+e.message;render();}};};
function eventPiles(){return `<div class="event-piles" aria-label="Pioche et défausse communes"><div class="event-pile deck"><strong>Cartes Événement</strong><span class="event-pile-count">${m.eventDeck.length}</span><small>dans la pioche</small></div><div class="event-pile discard"><strong>Défausse</strong><span class="event-pile-count">${m.eventDiscard.length}</span><small>cartes jouées ou écartées</small></div></div>`;}
function eventBonusSlots(p){return `<p class="muted">${p.bonusCards.length}/${m.rules.eventCards.bonusLimit} bonus permanent(s) posé(s).</p><div class="event-bonus-zone">${Array.from({length:m.rules.eventCards.bonusLimit},(_,i)=>i).map(i=>{const c=eventCardById(p.bonusCards?.[i]);return `<div class="event-bonus-slot"><small>EMPLACEMENT ${i+1} · ${c?'ACTIF':'LIBRE'}</small>${c?`<strong>${esc(c.icon)} ${esc(c.name)}</strong><p>${esc(c.effectText)}</p>${c.effectType==='travel_journal'?`<small>${p.journalCities?.length||0} ville(s) comptée(s) · ${(p.journalCities?.length||0)%3}/3 vers le prochain bonus</small>`:''}`:'<p>Joue une carte Bonus permanent pour l’équiper.</p>'}</div>`;}).join('')}</div>`;}
function eventTemporary(p){const effects=[...(p.pendingEffects||[]).map(e=>eventCardById(e.cardId)?.name||e.kind),...(p.turnModifiers?.skipMove?['Déplacement interdit ce tour']:[]),...(p.turnModifiers?.distancePenalty?[`Distance −${p.turnModifiers.distancePenalty}`]:[]),...(p.shortcutActive?['Raccourci actif pour le prochain trajet']:[]),...(p.freeSteps?[`${p.freeSteps} case(s) gratuites disponibles`]:[])];return `<div class="event-effect-list">${effects.map(e=>`<span>${esc(e)}</span>`).join('')||'<span>Aucun effet en attente</span>'}</div>`;}
function eventHand(p){return `<section class="sheet-card"><div class="sheet-section-heading"><h3>🃏 Cartes en main · Événement</h3><span>${p.cardHand.length}/${m.rules.eventCards.handLimit}</span></div><div class="event-faces">${p.cardHand.map((id,i)=>{const c=eventCardById(id);return eventFace(c,btn('Voir','event-view-'+i,'light')+btn('Jouer','event-play-'+i,'',!S.canPlayCard(m,i)),true);}).join('')||'<p>Aucune carte en main.</p>'}</div><p class="muted">${m.players.length===1?'Les négatives et les climatiques piochées sont des événements subis automatiquement.':'La main de chaque adversaire reste cachée ; seuls ses bonus posés sont publics.'}</p></section><section class="sheet-card"><h3>⭐ Bonus permanents</h3>${eventBonusSlots(p)}</section><section class="sheet-card"><h3>⏳ Effets en attente</h3>${eventTemporary(p)}</section><section class="sheet-card"><h3>📓 Historique des cartes</h3><div class="log sheet-log">${m.history.filter(h=>h.kind.startsWith('card')&&h.player===p.id).slice(-8).reverse().map(h=>`<div>• ${esc(h.text)}</div>`).join('')||'Aucune carte jouée.'}</div></section>`;}
const eventHandBase=eventHand;eventHand=p=>eventHandBase(p).replace('Aucune carte jouée.','Aucune carte posée pour le moment.')+`<p class="muted">Une carte pendant ton tour : ${p.cardPlayedTurn===m.turn?'déjà jouée':'encore disponible'}. Les réactions hors tour restent possibles.</p><details class="sheet-extras"><summary>📓 Journal & aide des terrains</summary><div class="sheet-extras-content"><section class="sheet-card"><h3>Statut & notes</h3><div class="log sheet-log">${p.log.map(line=>`<div>• ${esc(line)}</div>`).join('')||'Aucune note.'}</div></section><section class="sheet-card"><h3>🗺️ Coût des terrains</h3><div class="sheet-terrain-help">${Object.entries(m.rules.terrain).map(([id,value])=>`<div><span>${E.terrains[id]?.icon||'◉'}</span><strong>${esc(E.terrains[id]?.name||id)}</strong><small>Coût : ${value} énergie</small></div>`).join('')}</div></section></div></details>`;
const priorPlayerSheetPanel=playerSheetPanel;playerSheetPanel=()=>{if(m?.cardVersion!==3)return priorPlayerSheetPanel();if(sheetTab==='cartes')return eventHand(S.player(m));const html=priorPlayerSheetPanel();return sheetTab==='velo'?html+`<section class="sheet-card"><h3>⭐ Bonus permanents actifs</h3>${eventBonusSlots(S.player(m))}<h3>⏳ Effets temporaires</h3>${eventTemporary(S.player(m))}</section>`:html;};
const priorHome=home;home=()=>priorHome().replace('Découvre toutes les cartes et compose un paquet avec des effets positifs ou négatifs.','Découvre les 40 cartes Événement, personnalise leur nom et choisis leur effet pour les prochaines parties.');
const priorSidebar=sidebar;sidebar=()=>{const html=earlyFinishButton(priorSidebar());if(m?.cardVersion!==3||S.forecastOn(m)||S.encountersOn(m))return html;const available=m.players.some(p=>p!==S.player(m)&&S.eventClimateOptions(m,p.id).length);return html.replace('<!--icons-->',dockIcon('🌦','Météo','event-intervene',!available)+'<!--icons-->');};
function eventDialog(content,wide=false,privateView=false){return `<div class="modal-back${privateView?' event-private':''}"><section class="modal ${wide?'wide event-hand-modal':''}" role="dialog" aria-modal="true">${content}</section></div>`;}
const priorEventOverlay=overlay;overlay=()=>{
 if(!m||m.cardVersion!==3||screen!=='game')return priorEventOverlay();
 const active=S.player(m);
 if(privacyCover)return `<div class="event-handoff" role="dialog" aria-modal="true"><div><span class="eyebrow">PASSAGE DE MAIN</span><h2>À ${esc(active.name)} de jouer</h2><p>Les cartes de ${esc(active.name)} restent cachées jusqu’à ce qu’il ou elle prenne la main.</p>${btn('Je suis '+esc(active.name)+' · voir ma main','event-reveal-hand')}</div></div>`;
 if(m.pendingAttack){const attack=m.pendingAttack,c=eventCardById(attack.cardId),target=m.players.find(p=>p.id===attack.targetId),defend=target.cardHand.some(id=>eventCardById(id)?.effectType==='cancel_attack');let actions='';
  if(defend)actions+=btn('🛡️ Jouer Coup de pouce · annuler','event-attack-defend');
  if(['damage_bonus'].includes(c.effectType)&&target.bonusCards.length)actions+=target.bonusCards.map((id,i)=>btn('Perdre '+esc(eventCardById(id)?.name||id),'event-attack-bonus-'+i,'light')).join('');
  else if(c.effectType==='freezing_cold'&&target.food>0)actions+=btn('Dépenser 1 nourriture','event-attack-food','light')+btn('Perdre 2 énergies','event-attack-energy','light');
  else actions+=btn('Subir l’effet','event-attack-accept','light');
  return eventDialog(`<span class="eyebrow">RÉACTION · ${esc(target.name)}</span><h2>${attack.solo?'Événement solo pioché':esc(m.players.find(p=>p.id===attack.actorId)?.name||'Un joueur')+' joue une carte contre toi'}</h2>${eventFace(c)}<div class="event-action-row">${actions}</div><p class="muted">${attack.solo&&c.category==='climatic'&&!['heatwave','freezing_cold'].includes(c.effectType)?'Cette météo s’appliquera au prochain parcours, sur le terrain concerné.':'L’effet est appliqué après ce choix.'}</p>`,true,true);
 }
 if(m.phase==='card-intervention'){const id=m.cardWindow?.responders[m.cardWindow.responderIndex];if(!id){S.finishEventRoute(m);return '';}const responder=m.players.find(p=>p.id===id),options=S.eventClimateOptions(m,id);eventActorId=id;
  return eventDialog(`<span class="eyebrow">FENÊTRE D’INTERVENTION</span><h2>À ${esc(responder.name)} de répondre</h2><p class="event-intervention-note">${esc(active.name)} va valider son parcours. Tu peux jouer une carte climatique admissible maintenant, ou passer. Une seule carte climatique peut toucher ce déplacement.</p><div class="event-faces">${options.map(({card,index})=>eventFace(card,btn('Jouer contre '+esc(active.name),'event-climateplay-'+index),true)).join('')||'<p>Aucune carte climatique jouable dans ta main pour ce trajet.</p>'}</div><div class="event-action-row">${btn('Passer · laisser continuer','event-pass','light')}</div>`,true,true);
 }
 if(m.phase==='card-choice')return eventDialog(`<span class="eyebrow">FIN DU TOUR · ${esc(active.name)}</span><h2>${m.cardChoices.length} carte(s) disponible(s), garde-en une</h2><div class="event-faces">${m.cardChoices.map((id,i)=>eventFace(eventCardById(id),btn('Garder cette carte','choose-'+i))).join('')}</div><p>Pioche de fin de tour : ${m.rules.eventCards.drawPerTurn} carte(s). Les cartes non gardées rejoignent la défausse.${m.players.length===1?' Les événements négatifs et climatiques révélés doivent être résolus avant ce choix.':''}</p>`,true);
 if(m.phase==='card-discard')return eventDialog(`<span class="eyebrow">MAIN LIMITÉE À ${m.rules.eventCards.handLimit}</span><h2>${esc(active.name)}, choisis une carte à défausser</h2><div class="event-faces">${active.cardHand.map((id,i)=>eventFace(eventCardById(id),btn('Défausser','event-discard-'+i),true)).join('')}</div>`,true);
 if(modal==='cards')return eventDialog(`<h2>🃏 Main de ${esc(active.name)}</h2><p>${active.cardHand.length}/${m.rules.eventCards.handLimit} cartes · une seule carte à jouer pendant ton tour (${active.cardPlayedTurn===m.turn?'déjà jouée':'disponible'}). ${m.players.length===1?'Les négatives et la météo sont activées dès la pioche. Coup de pouce peut les annuler.':'Les cartes climatiques et Coup de pouce servent de réactions hors tour.'}</p><div class="event-faces">${active.cardHand.map((id,i)=>eventFace(eventCardById(id),btn('Jouer','event-play-'+i,'',!S.canPlayCard(m,i)))).join('')||'<p>Aucune carte en main.</p>'}</div>${btn('Fermer','close','light')}`,true);
 if(modal==='event-card-view'){const c=eventCardById(active.cardHand[cardIndex]);return eventDialog(`<h2>Consulter la carte</h2>${eventFace(c,btn('Jouer','event-play-'+cardIndex,'',!S.canPlayCard(m,cardIndex)))}${btn('Retour à la main','cards','light')}`);}
 if(modal==='event-target'){const c=eventCardById(active.cardHand[cardIndex]);return eventDialog(`<h2>Choisir la cible</h2>${eventFace(c)}<div class="event-action-row">${m.players.filter(p=>p!==active).map(p=>btn(esc(p.name),'event-target-'+p.id)).join('')}</div>${btn('Annuler','cards','light')}`);}
 if(modal==='event-confirm'){const c=eventCardById(active.cardHand[cardIndex]),target=m.players.find(p=>p.id===eventTargetId);return eventDialog(`<h2>Confirmer l’attaque</h2><p>${esc(active.name)} joue <strong>${esc(c?.name||'Carte')}</strong> contre <strong>${esc(target?.name||'cible')}</strong>.</p>${btn('Confirmer','event-confirm-attack')}${btn('Retour','event-play-'+cardIndex,'light')}`);}
 if(modal==='event-replace')return eventDialog(`<h2>Limite de ${m.rules.eventCards.bonusLimit} bonus atteinte</h2><p>Choisis le bonus à remplacer ; il rejoindra la défausse.</p>${eventBonusSlots(active)}<div class="event-action-row">${active.bonusCards.map((id,i)=>btn('Remplacer '+esc(eventCardById(id)?.name||id),'event-replace-'+i)).join('')}</div>${btn('Annuler','cards','light')}`);
 if(modal==='event-intervene')return eventDialog(`<h2>Intervention météo</h2><p>Un adversaire du joueur actif peut jouer une carte climatique admissible avant son action. La main reste privée.</p><div class="event-action-row">${m.players.filter(p=>p!==active).map(p=>btn(esc(p.name)+' · '+S.eventClimateOptions(m,p.id).length+' jouable(s)','event-climate-from-'+p.id,'',!S.eventClimateOptions(m,p.id).length)).join('')}</div>${btn('Fermer','close','light')}`);
 if(modal==='event-climate-hand'){const p=m.players.find(q=>q.id===eventActorId);return eventDialog(`<h2>Cartes météo de ${esc(p?.name||'joueur')}</h2><div class="event-faces">${S.eventClimateOptions(m,eventActorId).map(({card,index})=>eventFace(card,btn('Jouer contre '+esc(active.name),'event-climateplay-'+index))).join('')||'<p>Aucune carte admissible.</p>'}</div>${btn('Retour','event-intervene','light')}`,true);}
 if(modal.startsWith('player-')){const p=m.players[Number(modal.slice(7))];if(p)return eventDialog(`<h2 style="color:${p.color}">${esc(p.name)}</h2><p>${p.energy} énergie · ${p.food} nourriture · ${p.money} pièces · ${p.points} points · ${p.cardHand.length} carte(s) en main.</p><h3>Bonus publics</h3>${eventBonusSlots(p)}<h3>Effets en attente</h3>${eventTemporary(p)}${btn('Fermer','close','light')}`,true);}
 return priorEventOverlay();
};
// Lieu caché révélé : une carte qui s'ouvre ; cols, fatigue et budget : messages de route qui s'effacent seuls.
let revealCard=null,routeNews=[];
const LANDMARK_FLAVOR={'Belvédère':'Un balcon sur la vallée, rien que pour toi.','Vieux pont de pierre':'Trois arches moussues au-dessus de l’eau claire.','Chapelle isolée':'Une petite chapelle au bout d’un chemin de terre.','Lavoir ancien':'L’eau fraîche du lavoir, une pause à l’ombre.','Moulin à eau':'La roue tourne encore et le meunier te salue.','Source fraîche':'Une source glacée au bord de la route.','Village perché':'Des ruelles en pente et une vue à couper le souffle.','Cascade':'Tu entends l’eau bien avant de la voir.','Gorges sauvages':'La route se faufile entre deux murs de roche.','Château en ruine':'Des tours écroulées et des siècles d’histoire.','Forêt ancienne':'Des arbres immenses et un grand silence.','Panorama grandiose':'Toute la région à tes pieds.','Lac secret':'Un petit chemin sous les sapins, et l’eau la plus claire du voyage.','Abbaye oubliée':'Des pierres dorées et un cloître silencieux.','Grotte ornée':'Des peintures très anciennes sur la roche.'};
const STAR='<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6Z" fill="#f2a541" stroke="#8a5a14" stroke-width="1"/></svg>';
const SCENE='<svg viewBox="0 0 400 230" role="img" aria-label="Paysage découvert au bord de la route" preserveAspectRatio="xMidYMid slice"><rect width="400" height="230" fill="#9fc7c0"/><path d="M0 150 L70 60 L120 115 L190 30 L270 125 L320 80 L400 140 L400 230 L0 230 Z" fill="#5f7f84"/><path d="M150 78 L190 30 L226 74 L206 68 L190 82 L172 70 Z" fill="#f6e7c1"/><path d="M0 168 C 90 150, 300 152, 400 174 L400 230 L0 230 Z" fill="#2d7fa8"/><path d="M60 188 C 140 178, 260 180, 340 192" fill="none" stroke="#bfe3ef" stroke-width="3" stroke-linecap="round"/><g fill="#24463a"><path d="M24 176 L40 120 L56 176 Z"/><path d="M48 180 L66 108 L84 180 Z"/><path d="M330 180 L348 112 L366 180 Z"/><path d="M356 184 L372 130 L388 184 Z"/></g></svg>';
function revealMarkup(){const c=revealCard;return `<div class="modal-back reveal-back"><section class="reveal-card" role="dialog" aria-modal="true" aria-labelledby="reveal-title"><div class="reveal-art">${SCENE}<span>Lieu remarquable</span></div><div class="reveal-body"><h2 id="reveal-title">${esc(c.name)}</h2><p class="reveal-flavor">${esc(LANDMARK_FLAVOR[c.name]||'Un détour qui valait le coup.')}</p><div class="reveal-points"><span aria-hidden="true">${STAR.repeat(c.value)}</span><b>+${c.value} point${c.value>1?'s':''} d’aventure</b></div><p class="reveal-who">Découvert par ${esc(c.player||'')} · le jeton quitte la carte</p>${btn('Continuer la route →','reveal-close','reveal-go')}</div></section></div>`;}
{const overlayBeforeReveal=overlay;overlay=()=>{const html=overlayBeforeReveal();if(html||!revealCard||screen!=='game')return html;return revealMarkup();};}
const NEWS_ICON={col:'<path d="M5 21V4"/><path d="M5 4l12 3.5L5 11"/>','col-first':'<path d="M5 21V4"/><path d="M5 4l12 3.5L5 11"/>',climber:'<path d="M3 20l6-10 4 6 3-4 5 8Z"/>',fatigue:'<path d="M4 18h16"/><path d="M6 18v-5a6 6 0 0 1 12 0v5"/><path d="M14 5h4l-4 4h4"/>',budget:'<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>'};
{const bindBeforeNews=bind;bind=()=>{bindBeforeNews();const wrap=document.querySelector('.map-wrap');if(!wrap||!routeNews.length||!wrap.append||!document.createElement)return;const list=document.createElement('ul');list.className='route-news';list.setAttribute('aria-live','polite');list.innerHTML=routeNews.map(n=>`<li class="news-${n.kind}"><svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${NEWS_ICON[n.kind]||''}</svg><span>${esc(n.text)}</span></li>`).join('');wrap.append(list);routeNews=[];setTimeout(()=>list.remove(),7000);};}
// Fiche du cycliste « carte d'aventure » (style C) : jauges, 4 onglets, actions en tuiles.
const FICHE_TABS=[['journee','Journée'],['sacoches','Sacoches'],['voyage','Voyage'],['cartes','Cartes'],['carnet','Carnet']];
const ficheTabs=()=>FICHE_TABS.filter(([id])=>id!=='cartes'||!(m&&S.encountersOn(m)));// mode Rencontres : pas de cartes en main
// ---------- Carnet de voyage (5e onglet) : trajet, chiffres, souvenirs datés, mot du voyageur ----------
function carnetSouvenirs(p){const out=[],pick=(list,key)=>list[[...String(key)].reduce((n,c)=>n+c.charCodeAt(0),0)%list.length];
 for(const h of m.history.filter(h=>h.player===p.id)){const t=m.board[h.key];
  if(h.kind==='landmark'){const l=m.landmarks?.[h.key];out.push({day:h.round,tag:'Lieu caché · +'+(h.value||l?.value||1),title:l?.name||'Lieu remarquable',text:CARNET.LIEU_CACHE,kind:'lieu'});}
  else if(h.kind==='col')out.push({day:h.round,tag:'Col mythique',title:t?.colName||'Col',text:CARNET.COL,kind:'col'});
  else if(h.kind==='col-first'){const last=out.findLast(s=>s.kind==='col');if(last){last.tag+=' · premier de cordée';last.text=CARNET.PREMIER_DE_CORDEE;}}
  else if(h.kind==='climber')out.push({day:h.round,tag:'Bonus',title:'Trois cols franchis',text:CARNET.GRIMPEUR,kind:'titre'});
  else if(h.kind==='encounter'){const [title,...rest]=h.text.split(' : ');out.push({day:h.round,tag:'Rencontre',title,text:rest.join(' : '),kind:'rencontre'});}}
 const seen=new Set();for(const step of p.travelHistory||[]){const t=m.board[step.boardKey||step.key];if(!t?.name||t.type!=='ville'||seen.has(t.key))continue;seen.add(t.key);
  out.push({day:step.day,tag:'Ville',title:t.name,text:CARNET.VILLES[t.name]||pick(CARNET.VILLE_GENERIQUE,t.name),kind:'ville'});}
 return out.sort((a,b)=>(a.day??0)-(b.day??0));}
function carnetMap(p){const v=findVoyage(p.voyage),from=m.board['city-'+v?.from];
 const pts=[from,...(p.travel||[]).map(k=>m.board[k])].filter(Boolean),all=[...pts,m.board['city-'+v?.to]].filter(Boolean);if(!pts.length)return '';
 const xs=all.map(t=>t.x),ys=all.map(t=>t.y),pad=18,x0=Math.min(...xs)-pad,y0=Math.min(...ys)-pad,w=Math.max(60,Math.max(...xs)-x0+pad),h=Math.max(40,Math.max(...ys)-y0+pad),f=n=>Math.round(n*10)/10;
 const fs=f(Math.max(10,w/16)),rr=f(Math.max(4,w/45)),line=pts.map((t,i)=>(i?'L':'M')+f(t.x)+' '+f(t.y)).join(''),to=m.board['city-'+v?.to],now=m.board[p.pos];
 const found=Object.entries(m.landmarks||{}).filter(([,l])=>l.found===p.id).map(([k])=>m.board[k]).filter(Boolean),cols=[...new Set(m.history.filter(h=>h.player===p.id&&h.kind==='col').map(h=>h.key))].map(k=>m.board[k]).filter(Boolean);
 return `<svg class="carnet-map" style="--fs:${fs}px" viewBox="${f(x0)} ${f(y0)} ${f(w)} ${f(h)}" role="img" aria-label="Trajet de ${esc(p.name)} depuis ${esc(v?.from||'')}"><path class="carnet-line" d="${line}"/>${found.map(t=>`<circle class="carnet-lieu" cx="${f(t.x)}" cy="${f(t.y)}" r="${rr}"/>`).join('')}${cols.map(t=>`<path class="carnet-col" d="M${f(t.x)} ${f(t.y-6)}l5 9h-10Z"/>`).join('')}${to?`<circle class="carnet-goal" cx="${f(to.x)}" cy="${f(to.y)}" r="${rr}"/><text x="${f(to.x)}" y="${f(to.y-rr*1.8)}">${esc(to.name)}</text>`:''}<circle class="carnet-start" cx="${f(from.x)}" cy="${f(from.y)}" r="${rr}"/><text x="${f(from.x)}" y="${f(from.y-rr*1.8)}">${esc(from.name)}</text>${now&&now!==from?`<circle class="carnet-now" cx="${f(now.x)}" cy="${f(now.y)}" r="${rr}" style="fill:${p.color}"/>`:''}</svg>`;}
function ficheCarnet(p){const v=findVoyage(p.voyage),souvenirs=carnetSouvenirs(p),steps=p.stats?.steps||0,mot=CARNET.MOTS_DU_VOYAGEUR[Math.floor(steps/8)%CARNET.MOTS_DU_VOYAGEUR.length];
 const stat=(n,label)=>`<div><b>${n}</b><small>${label}</small></div>`;
 return `<div class="carnet"><p class="carnet-kicker">${esc(v?v.from+' → '+v.to+' · '+v.title:'Mon voyage')}</p>${carnetMap(p)}
 <div class="carnet-stats">${stat(steps,'cases roulées')}${stat(p.stats?.offroad||0,'hors route')}${stat(p.cols||0,'cols mythiques')}${stat(p.points,'points d’aventure')}</div>
 <p class="carnet-label">Souvenirs de la route</p>${souvenirs.length?`<ol class="carnet-souvenirs">${souvenirs.map(s=>`<li class="carnet-${s.kind}"><span>${s.day?'Jour '+s.day+' · ':''}${esc(s.tag)}</span><b>${esc(s.title)}</b><small>${esc(s.text)}</small></li>`).join('')}</ol>`:'<p class="carnet-empty">Le carnet est encore vierge : la route commence.</p>'}
 <blockquote class="carnet-mot"><span>Le mot du voyageur</span><p>${esc(mot)}</p></blockquote></div>`;}
const ficheTab=()=>ficheTabs().some(([id])=>id===sheetTab)?sheetTab:'journee';
// ---------- Fiche « carnet crème » : icônes dessinées (pas d'émoji) ----------
const svgI=(d,size=22)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const TAB_SVG={journee:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',sacoches:'<path d="M5 8h14l-1 12H6Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',voyage:'<path d="M4 19l5-14 5 9 3-5 3 10"/>',cartes:'<rect x="6" y="4" width="12" height="16" rx="2"/>',carnet:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3Z"/>'};
const ITEM_SVG={tente:'<path d="M3 20L12 4l9 16Z"/><path d="M9 20l3-5 3 5"/>',rechaud:'<path d="M5 14h14M7 14v5M17 14v5"/><path d="M12 11c-2-2 0-4 0-6 2 2 3 4 0 6Z"/>',chambre:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',kit:'<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V5h6v3"/>',gps:'<path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11Z"/><circle cx="12" cy="10" r="2"/>',duvet:'<path d="M3 17h18M5 17v-4a3 3 0 0 1 3-3h11v7"/><circle cx="7.5" cy="12" r="1.5"/>',secours:'<rect x="4" y="6" width="16" height="13" rx="2"/><path d="M12 9v7M8.5 12.5h7"/>',sacoches:'<path d="M6 8h12l-1 12H7Z"/><path d="M9 8a3 3 0 0 1 6 0"/>'};
const WEATHER_SVG={beau:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',vent:'<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',pluie:'<path d="M7 15a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.6 1.6A3.5 3.5 0 0 1 17 15Z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',orage:'<path d="M7 14a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.6 1.6A3.5 3.5 0 0 1 17 14Z"/><path d="M13 14l-3 4h4l-3 4"/>',neige:'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>'};
function ficheTile(label,sub,action,disabled,cls='',attrs=''){return `<button class="fiche-tile ${cls}" ${action?`data-action="${action}"`:''} ${attrs} ${disabled?'disabled':''}><b>${label}</b><small class="${!disabled&&/^\+/.test(sub)?'gain':''}">${sub}</small></button>`;}
// ---------- Rencontres : fenêtre du soir ----------
const ENCOUNTER_SCENES={
 montagne:'<rect width="520" height="180" fill="#9fc7c0"/><path d="M0 120 L90 40 L160 100 L250 30 L350 110 L430 60 L520 120 L520 180 L0 180 Z" fill="#7a8f78"/><path d="M225 52 L250 30 L272 50 L258 48 L250 56 Z" fill="#f6e7c1"/><path d="M0 145 C 120 128, 380 130, 520 150 L520 180 L0 180 Z" fill="#8fb36a"/>',
 plaine:'<rect width="520" height="180" fill="#bfe0e8"/><circle cx="420" cy="50" r="24" fill="#f6d36a"/><path d="M0 120 C 140 100, 360 104, 520 118 L520 180 L0 180 Z" fill="#a9c97a"/><path d="M0 145 C 160 130, 360 134, 520 148 L520 180 L0 180 Z" fill="#7fae5a"/><g fill="#3f6b3a"><circle cx="90" cy="112" r="14"/><circle cx="118" cy="116" r="10"/><circle cx="370" cy="110" r="12"/></g>',
 ville:'<rect width="520" height="180" fill="#f2c9a0"/><g fill="#e8dcbc" stroke="#8a5a14" stroke-width="2"><rect x="60" y="70" width="80" height="90"/><rect x="160" y="50" width="70" height="110"/><rect x="250" y="80" width="90" height="80"/><rect x="360" y="60" width="70" height="100"/></g><g fill="#b74732"><path d="M54 72 L100 40 L146 72Z"/><path d="M154 52 L195 22 L236 52Z"/><path d="M244 82 L295 52 L346 82Z"/><path d="M354 62 L395 32 L436 62Z"/></g><rect y="160" width="520" height="20" fill="#c9b88d"/>',
 cote:'<rect width="520" height="180" fill="#f6d9a8"/><circle cx="260" cy="110" r="36" fill="#f2a541"/><path d="M0 110 L520 110 L520 180 L0 180 Z" fill="#2d7fa8"/><path d="M60 135 C 140 128, 220 128, 300 136 M240 158 C 320 150, 400 150, 480 160" stroke="#bfe3ef" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M380 110 L380 60 L398 60 L398 110Z" fill="#f6e7c1" stroke="#1b1406" stroke-width="2"/><path d="M372 60 L389 42 L406 60Z" fill="#b74732"/>'};
function encounterEffectText(c){const fx=c.effect||{},out=[],sign=n=>(n>0?'+':'−')+Math.abs(n);
 if(fx.tomorrow)out.push(fx.tomorrow>0?'+'+fx.tomorrow+' case demain':'−'+(-fx.tomorrow)+' case demain');
 if(fx.energy)out.push(sign(fx.energy)+' énergie');if(fx.food)out.push(sign(fx.food)+' repas');if(fx.money)out.push(sign(fx.money)+' pièce'+(Math.abs(fx.money)>1?'s':''));
 if(fx.points)out.push(sign(fx.points)+' point'+(Math.abs(fx.points)>1?'s':'')+' d’aventure');if(fx.fatigue)out.push(fx.fatigue<0?'repose (fatigue −1)':'fatigue +1');
 return out.join(' · ')||'rien ne change';}
function encounterModal(){const e=S.currentEncounter(m),p=S.player(m);if(!e)return '';const region=REGIONS[S.regionAt(m,p.pos)]?.name||'';
 return `<div class="encounter"><div class="encounter-art"><svg viewBox="0 0 520 180" role="img" aria-label="${esc(e.title)}">${ENCOUNTER_SCENES[e.scene]||ENCOUNTER_SCENES.plaine}</svg><span>Rencontre · ${esc(region)}</span></div>
 <div class="encounter-body"><span class="eyebrow">LE SOIR · ${esc(p.name)}</span><h2>${esc(e.title)}</h2><p class="encounter-quote">${esc(e.quote)}</p>
 <div class="encounter-choices">${e.choices.map((c,i)=>{const ok=S.canChooseEncounter(m,i),need=Object.entries(c.need||{}).map(([k,v])=>v+' '+({money:'pièce',food:'repas',energy:'énergie'}[k]||k)+(k==='money'&&v>1?'s':'')).join(', ');
  return `<button type="button" class="encounter-choice${Object.keys(c.effect||{}).length?'':' quiet'}" data-action="enc-${i}" ${ok?'':'disabled'}><b>${esc(c.label)}</b><small>${esc(encounterEffectText(c))}</small>${!ok?`<em>Il faut ${esc(need)}</em>`:''}</button>`;}).join('')}</div></div></div>`;}
// ---------- Météo annoncée : bloc de la fiche Journée et bulletin du lendemain ----------
const regionPhrase=name=>({Ouest:'l’Ouest',Est:'l’Est',Nord:'le Nord'}[name]||'les '+name);
function meteoHere(p){if(!S.forecastOn(m))return '';const w=S.weatherToday(m,p.pos),info=WEATHER[w],id=S.regionAt(m,p.pos),region=REGIONS[id].name,next=WEATHER[S.weatherBulletin(m,m.round+1).find(b=>b.region===id)?.weather||'beau'];
 return `<div class="fiche-meteo w-${w}"><span class="fiche-meteo-icon">${svgI(WEATHER_SVG[w],46)}</span><div><span class="fiche-kicker">Aujourd’hui · zone ${esc(region)}</span><b>${esc(info.name)}${w==='beau'?'':' : '+esc(info.effect)}</b><small>Demain : ${esc(next.name.toLowerCase())}</small></div>${btn('Bulletin','meteo','fiche-meteo-btn')}</div>`;}
// Bulletin météo : la carte des 5 zones (le temps de chaque zone, et toi) + les informations du jour et du lendemain.
const ZONE_COLORS={ouest:'#e7c27a',alpes:'#b9d1e6',nord:'#cfe0c6',est:'#e5b9a8',balkans:'#d9c3e3'};
let meteoDay='today',zoneMapCache=null;
function zoneMapBase(){const key=m.seed+':'+(m.mapChoice||'');if(zoneMapCache?.key===key)return zoneMapCache;
 const land=Object.values(m.board).filter(t=>t.type!=='mer'),xs=land.map(t=>t.x),ys=land.map(t=>t.y),x0=Math.min(...xs)-14,y0=Math.min(...ys)-14,w=Math.max(...xs)-x0+14,h=Math.max(...ys)-y0+14;
 const sums={};let dots='';for(const t of land){const r=S.regionAt(m,t.key);(sums[r]||=[0,0,0]);sums[r][0]+=t.x;sums[r][1]+=t.y;sums[r][2]++;dots+=`<circle cx="${t.x.toFixed(0)}" cy="${t.y.toFixed(0)}" r="11.5" fill="${ZONE_COLORS[r]||'#ddd'}"/>`;}
 const centres=Object.fromEntries(Object.entries(sums).map(([r,[x,y,n]])=>[r,{x:x/n,y:y/n}]));
 return zoneMapCache={key,box:[x0,y0,w,h],dots,centres};}
function zoneMap(list,mine,pos){const z=zoneMapBase(),[x0,y0,w,h]=z.box,me=m.board[pos];
 const icons=list.map(b=>{const c=z.centres[b.region];if(!c)return '';return `<g transform="translate(${c.x.toFixed(0)} ${c.y.toFixed(0)})"><circle r="44" fill="#f6e7c1" stroke="${b.region===mine?'#f2a541':'#1b3b38'}" stroke-width="${b.region===mine?10:6}"/><text y="16" text-anchor="middle" font-size="44">${b.icon}</text><text y="86" text-anchor="middle" class="zm-name">${esc(b.regionName)}</text></g>`;}).join('');
 const meMark=me?`<g transform="translate(${me.x.toFixed(0)} ${me.y.toFixed(0)})"><circle r="26" fill="#b74732" stroke="#fff3cf" stroke-width="8"/><text y="-40" text-anchor="middle" class="zm-me">📍 toi</text></g>`:'';
 return `<svg class="zone-map" viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" role="img" aria-label="Carte des zones météo"><rect x="${x0-40}" y="${y0-40}" width="${w+80}" height="${h+80}" fill="#2c6f86"/>${z.dots}${icons}${meMark}</svg>`;}
function meteoModal(){const p=S.player(m),mine=S.regionAt(m,p.pos),today=S.weatherBulletin(m,m.round),tomorrow=S.weatherBulletin(m,m.round+1),list=meteoDay==='tomorrow'?tomorrow:today;
 const hereToday=today.find(b=>b.region===mine),hereTomorrow=tomorrow.find(b=>b.region===mine),zone=REGIONS[mine];
 const row=b=>`<li class="w-${b.weather}${b.region===mine?' mine':''}"><span aria-hidden="true">${b.icon}</span><b>${esc(b.regionName)} · ${esc(b.name)}</b><small>${esc(b.effect)}</small></li>`;
 const tab=(id,label)=>`<button type="button" data-action="meteo-day-${id}" class="${meteoDay===id?'on':''}" aria-pressed="${meteoDay===id}">${label}</button>`;
 return `<span class="eyebrow">BULLETIN MÉTÉO · JOUR ${m.round}</span><h2>Tu es dans la zone ${esc(zone.name)}</h2>
 <div class="meteo-grid"><div class="meteo-map"><div class="meteo-tabs">${tab('today','Aujourd’hui')}${tab('tomorrow','Demain')}</div>${zoneMap(list,mine,p.pos)}</div>
 <div class="meteo-info"><div class="meteo-now"><span aria-hidden="true">${hereToday.icon}</span><div><small>AUJOURD’HUI ICI</small><b>${esc(hereToday.name)}</b><p>${esc(hereToday.effect)}</p></div></div>
 <div class="meteo-now next"><span aria-hidden="true">${hereTomorrow.icon}</span><div><small>DEMAIN ICI</small><b>${esc(hereTomorrow.name)}</b><p>${esc(hereTomorrow.effect)}</p></div></div>
 <p class="meteo-zone">Zone ${esc(zone.name)} : ${esc(zone.cities.slice(0,6).join(', '))}…</p>
 <ul class="meteo-list">${list.map(row).join('')}</ul></div></div>${btn('Fermer','close','light')}`;}
// ---------- Règle hors route : textes communs (fiche Journée, planificateur) ----------
function routeTags(){let pos=S.player(m).pos;return route.map(k=>{const on=S.roadStep(m,pos,m.board[k]);pos=k;return on;});}
function offroadTag(){const s=S.offroadStatus(m);return !s.enabled||!s.off?'':s.gps?' · hors route avec '+esc(s.item):' · hors route sans '+esc(s.item);}
function offroadHint(){const s=S.offroadStatus(m);if(!s.enabled||s.gps||s.off)return '';return `<p class="fiche-note offroad-hint">Sans ${esc(s.item)}, quitter la route limite la journée à ${s.max} case${s.max>1?'s':''}.</p>`;}
function meteoPlannerLine(){if(!S.forecastOn(m))return '';const p=S.player(m),keys=[p.pos,...route],seen=new Set(),out=[];for(const k of keys){const id=S.regionAt(m,k);if(seen.has(id))continue;seen.add(id);const w=S.weatherToday(m,k);if(w!=='beau')out.push(`${WEATHER[w].icon} ${REGIONS[id].name} : ${WEATHER[w].name.toLowerCase()} (${WEATHER[w].effect})`);}return out.length?`<small class="offroad-note meteo-note">${esc(out.join(' · '))}</small>`:'';}
function offroadPlannerLine(tags=[]){const s=S.offroadStatus(m);if(!s.enabled)return '';const off=s.off||tags.some(on=>!on);
 if(!off)return s.gps?'':`<small class="offroad-note muted">Sans ${esc(s.item)} : quitter la route limite la journée à ${s.max} case${s.max>1?'s':''}.</small>`;
 return s.gps?`<small class="offroad-note gps">Hors route · ${esc(s.item)} à bord : déplacement normal.</small>`:`<small class="offroad-note warn">Hors route sans ${esc(s.item)} : ${s.max} case${s.max>1?'s':''} maximum aujourd’hui.</small>`;}
function ficheJournee(p){const r=m.rules,here=m.board[p.pos],atCity=here?.type==='ville',canEat=p.items.includes('rechaud')||atCity||here?.type==='auberge',blocked=m.done||!['move','place'].includes(m.phase),rode=m.moved>0||m.placed,cap=energyCap(m,p),tired=r.fatigue.enabled&&(p.fatigue||0)>=r.fatigue.days-1;
 const eatGain=S.eatGain(m,p),dist=S.distance(m);
 const why=(...checks)=>checks.find(([bad])=>bad)?.[1]||'';
 const eatWhy=why([!p.food,'plus de nourriture'],[!canEat,'réchaud, ville ou auberge'],[p.energy>=cap,'énergie pleine'],[m.ate>=r.food.maxPerTurn,'déjà mangé']);
 const foodWhy=why([r.food.cityOnly&&!atCity,'en ville seulement'],[p.money<r.food.price,'pas assez de pièces']);
 const restoWhy=why([!atCity,'en ville seulement'],[p.money<r.food.restaurantPrice,'pas assez de pièces'],[p.energy>=cap,'énergie pleine'],[m.ate>=r.food.maxPerTurn,'déjà mangé']);
 const sleep=Object.entries(r.rest).map(([id,a])=>{const free=id==='bivouac'&&p.turnModifiers?.freeBivouac,no=why([rode,'déjà roulé aujourd’hui'],[a.cityOnly&&!atCity,'en ville seulement'],[!free&&a.tent&&!p.items.includes('tente'),'tente nécessaire'],[!free&&p.money<a.price,'pas assez de pièces']);
  const sub=no||(free?'gratuit':(a.price?a.price+' pièce'+(a.price>1?'s':''):'gratuit')+(a.tent?' · tente':'')+(id!=='bivouac'&&r.fatigue.enabled?' · repose':''));
  return ficheTile(a.name,sub,'rest-'+id,blocked||Boolean(no),id!=='bivouac'&&tired&&!no?'conseil':'');}).join('');
 const ferries=S.ferryOptions(m).map(t=>ficheTile('Bateau · '+esc(t.name||t.key),r.ferryPrice+' pièces · fin de journée','',blocked||p.money<r.ferryPrice,'ferry',`data-ferry="${esc(t.key)}"`)).join('');
 const work=r.workEnabled?ficheTile('Travailler','+'+r.salary+' pièces','work',blocked||rode||(r.workCityOnly&&!atCity)):'';
 const note=m.phase==='card-resolution'?'Résous d’abord la carte reçue.':m.phase==='puncture'?'Crevaison : répare ou retourne en ville.':m.phase==='voyage-choice'?'Choisis d’abord ton nouveau voyage.':'';
 const here2=m.board[p.pos],place=here2?.name||E.terrains[here2?.type]?.name||'',off=S.offroadStatus(m,p),normal=Math.min(5,r.distance+r.bikes[p.bike].extraDistance),lost=Math.max(0,normal-dist);
 const reasons=[S.stormToday(m,p)&&'l’orage',off.limited&&'hors route sans '+off.item,p.turnModifiers?.distancePenalty&&'une carte'].filter(Boolean);
 const rings=Array.from({length:Math.max(dist,0)},(_,i)=>`<i class="${i<m.moved?'on':''}"></i>`).join('')+Array.from({length:lost},()=>'<i class="lost"></i>').join('');
 const explain=lost?`Les ${lost} case${lost>1?'s':''} en pointillés ${lost>1?'sont perdues':'est perdue'}${reasons.length?' à cause de '+reasons.join(' et de '):''}.`:'';
 const hint=off.enabled&&!off.gps&&!off.off?`Sans ${esc(off.item)}, quitter la route limite la journée à ${off.max} case${off.max>1?'s':''}.`:off.enabled&&off.gps&&off.off?`Hors route avec ${esc(off.item)} : aucune limite.`:'';
 return `${meteoHere(p)}<section class="fiche-route-card"><div class="fiche-route-head"><b>Route du jour</b><span>${place?'depuis '+esc(place):''}</span></div><div class="fiche-rings"><span aria-hidden="true">${rings}</span><b>${m.moved} / ${dist} case${dist>1?'s':''}</b></div>${explain||hint?`<p>${esc(explain)}${explain&&hint?' ':''}${hint}</p>`:''}</section>${note?`<p class="fiche-note">${esc(note)}</p>`:''}
 <p class="fiche-label">Se ravitailler</p><div class="fiche-tiles">${ficheTile('Manger',eatWhy||'+'+eatGain+' énergie','eat',blocked||Boolean(eatWhy))}${ficheTile('Provisions',foodWhy||r.food.quantity+' repas · '+r.food.price+' pièce'+(r.food.price>1?'s':''),'food',blocked||Boolean(foodWhy))}${ficheTile('Restaurant',restoWhy||'+'+r.food.restaurantEnergy+' énergie · '+r.food.restaurantPrice+' pièce'+(r.food.restaurantPrice>1?'s':''),'restaurant',blocked||Boolean(restoWhy))}${work}</div>
 <p class="fiche-label">Dormir · termine la journée</p><div class="fiche-tiles">${sleep}</div>${ferries?`<p class="fiche-label">Traversée</p><div class="fiche-tiles">${ferries}</div>`:''}
`;}
function ficheSacoches(p){const r=m.rules,b=r.bikes[p.bike],used=S.inventorySpace(m),atCity=m.board[p.pos]?.type==='ville',blocked=m.done||!['move','place'].includes(m.phase),free=Math.max(0,b.capacity-used),off=S.offroadStatus(m,p);
 const owned=p.items.filter(id=>r.equipment[id]),shop=Object.keys(r.equipment).filter(id=>!owned.includes(id)),cols=Math.min(b.capacity,4);
 const slots=owned.map(id=>{const e=r.equipment[id],span=Math.min(e.space,cols);return `<div class="fiche-slot${span>1?' wide':''}" style="grid-column:span ${span}">${svgI(ITEM_SVG[id]||ITEM_SVG.sacoches,span>1?40:32)}<span><b>${esc(e.name)}</b>${span>1?`<small>${e.space} places · ${esc(equipmentDescriptions[id]||'')}</small>`:''}</span></div>`;}).join('')+Array.from({length:free},()=>'<div class="fiche-slot free"><small>place libre</small></div>').join('');
 const gives=owned.map(id=>equipmentDescriptions[id]).filter(Boolean),warn=off.enabled&&!off.gps?`Pas de ${esc(off.item)} : quitter la route limite la journée à ${off.max} case${off.max>1?'s':''}.`:'';
 return `<div class="fiche-bag-title"><b>Mes sacoches</b><span>${esc(b.name)} · <b>${used} / ${b.capacity} places</b></span></div>
 <div class="fiche-slots" style="grid-template-columns:repeat(${cols},minmax(0,1fr))" aria-label="${b.capacity} places dans les sacoches">${slots}</div>
 <div class="fiche-gives"><b>Ce que ça t’apporte</b><span>${gives.length?esc(gives.join(' · '))+'.':'Sacoches vides : rien pour l’instant.'}</span>${warn?`<span class="warn">${warn}</span>`:''}</div>
 <div class="fiche-shop-head"><span class="fiche-label">Boutique · ${atCity?'ouverte, tu es en ville':'en ville seulement'}</span><span>${p.money} pièce${p.money>1?'s':''}</span></div>
 <ul class="fiche-shop">${shop.map(id=>{const e=r.equipment[id];return `<li><span class="fiche-shop-icon">${svgI(ITEM_SVG[id]||ITEM_SVG.sacoches,22)}</span><b>${esc(e.name)}</b><small>${esc(equipmentDescriptions[id]||'')}</small><em>${e.price} pièce${e.price>1?'s':''} · ${e.space} place${e.space>1?'s':''}</em></li>`;}).join('')}</ul>
 ${!free?'<p class="fiche-shop-note">Sacoches pleines : dépose un objet en ville pour en acheter un autre.</p>':''}
 ${btn(atCity?'Acheter ou déposer du matériel':'Boutique : en ville seulement','shop','fiche-secondary',blocked||!atCity)}`;}
function ficheVoyage(p){const v=progress(S.view(m)),extra=m.cardVersion===3?`<h4 class="fiche-label">Bonus permanents</h4>${eventBonusSlots(p)}<h4 class="fiche-label">Effets en attente</h4>${eventTemporary(p)}`:'';
 return v?`<div class="fiche-voyage"><span class="fiche-label">${esc(v.v.from)} → ${esc(v.v.to)} · ${esc(voyageTier(v.v).name)} · +${voyageTier(v.v).points} points</span><h3>${esc(v.v.title)}</h3><ul>${v.rows.map(row=>`<li class="${row.done?'done':''}"><span aria-hidden="true">${row.done?'✓':'○'}</span>${esc(row.label)}<b>${row.value} / ${row.target}</b></li>`).join('')}</ul><p>${p.completed?'Objectif accompli !':v.ready?'Étapes remplies : rejoins '+esc(v.v.to)+'.':'Remplis les étapes puis rejoins '+esc(v.v.to)+'.'}</p></div>${extra}`:'<p>Objectif indisponible.</p>'+extra;}
function ficheCartes(){const previous=sheetTab;sheetTab='cartes';const html=playerSheetPanel();sheetTab=previous;return html.replace('📓 Historique des cartes','📓 Cartes posées');}
function ficheGauges(p){const r=m.rules,cap=energyCap(m,p),fourbu=isExhausted(m,p),days=r.fatigue.days,f=p.fatigue||0;
 const cells=Array.from({length:r.maxEnergy},(_,i)=>`<i class="${i<p.energy?'on':i>=cap?'lock':''}"></i>`).join('');
 const fatigue=r.fatigue.enabled?(fourbu?`<small class="fourbu">Fourbu : énergie max −${r.fatigue.maxEnergyPenalty} jusqu’au camping ou à l’hôtel</small>`:`<small>Fatigue ${f} / ${days} · ${f===0?'en forme':days-f===1?'encore 1 jour avant d’être fourbu':'ça tire un peu'}</small>`):'';
 const box=(cls,icon,n,label)=>`<div class="fiche-count ${cls}">${svgI(icon,26)}<b>${n}</b><small>${label}</small></div>`;
 return `<section class="fiche-gauges" aria-label="Jauges de ${esc(p.name)}"><div class="fiche-energy-box"><div class="fiche-gauge-head"><span>Énergie</span><b>${p.energy}<small> / ${cap}</small></b></div><div class="fiche-energy" style="--cells:${r.maxEnergy}" aria-hidden="true">${cells}</div>${fatigue}</div>
 ${box('food','<path d="M12 7c-4 0-6 3-6 7s3 7 6 7 6-3 6-7-2-7-6-7Z"/><path d="M12 7c0-2 1-4 3-4"/>',p.food,'repas')}${box('money','<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>',p.money,'pièces')}${box('points','<path d="M12 3l2.6 5.6 6 .7-4.5 4 1.3 6L12 16.4 6.6 19.3l1.3-6-4.5-4 6-.7Z"/>',p.points,'aventure')}</section>`;}
playerSheet=(inline=false)=>{const p=S.player(m),r=m.rules,v=findVoyage(p.voyage),here=m.board[p.pos],tab=ficheTab(),place=here?.name||E.terrains[here?.type]?.name||'';
 const panels={journee:ficheJournee(p),sacoches:ficheSacoches(p),voyage:ficheVoyage(p),cartes:ficheCartes(),carnet:ficheCarnet(p)};
 const body=`<div class="player-sheet-head fiche-head"><span class="fiche-num" style="background:${p.color}" aria-hidden="true">${esc(p.id.slice(1))}</span><div><span class="eyebrow">PLATEAU DU CYCLISTE</span><h2>${esc(p.name)}</h2><small>${esc(r.bikes[p.bike].name)}${v?' · '+esc(v.from)+' → '+esc(v.to):''}</small></div><span class="mat-day">Jour ${p.availableDay}</span></div>
 ${ficheGauges(p)}
 <div class="fiche-tabs" role="tablist" aria-label="Fiche du cycliste">${ficheTabs().map(([id,label])=>`<button type="button" role="tab" data-sheet-tab="${id}" aria-selected="${id===tab}" class="${id===tab?'on':''}">${svgI(TAB_SVG[id],20)}<span>${label}${id==='cartes'?' '+p.cardHand.length:''}</span></button>`).join('')}</div>
 ${ficheTabs().map(([id,label])=>`<section class="fiche-panel fiche-${id}" role="tabpanel" aria-label="${label}" data-sheet-panel="${id}" ${id===tab?'':'hidden'}>${panels[id]}</section>`).join('')}
 <div class="fiche-footer">${btn('Sauvegarder','save','fiche-link')}${btn('Journal de route','stats','fiche-link')}${btn('Fin de partie','finish','fiche-link')}</div>`;
 return inline?`<section class="player-sheet-inline player-mat fiche">${body}</section>`:`<div class="player-mat fiche">${body}</div>`;};
{const bindBeforeFiche=bind;bind=()=>{bindBeforeFiche();document.body?.classList?.toggle('en-partie',screen==='game');document.querySelectorAll('[data-sheet-tab]').forEach(el=>el.onclick=()=>{sheetTab=el.dataset.sheetTab;const root=el.closest('.fiche')||document;root.querySelectorAll('[data-sheet-tab]').forEach(t=>{const on=t.dataset.sheetTab===sheetTab;t.classList.toggle('on',on);t.setAttribute('aria-selected',String(on));});root.querySelectorAll('[data-sheet-panel]').forEach(panel=>{panel.hidden=panel.dataset.sheetPanel!==sheetTab;});});};}
render();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
// Fiche repliable et animations réduites : appliquées après chaque affichage de la page.
{const bindBeforeDisplay=bind;bind=()=>{bindBeforeDisplay();applySheetLayout();applyMotionClass();
 // Garage : choix de la monture. Si le nouveau vélo a moins de place, on garde les objets dans l'ordre tant qu'ils tiennent.
 document.querySelectorAll('[data-bike-choice]').forEach(el=>el.onclick=()=>{const p=roster[choosing],id=el.dataset.bikeChoice;if(!p||!setupRules.bikes[id])return;p.bike=id;let room=setupRules.bikes[id].capacity,purse=setupRules.startMoney-(setupRules.bikes[id].price||0);p.items=(p.items||[]).filter(item=>{const e=setupRules.equipment[item],space=e?.space||0,price=e?.price||0;if(space>room||price>purse)return false;room-=space;purse-=price;return true;});render();});
};applySheetLayout();applyMotionClass();}

// ==========================================================================
// Partie en ligne (Firebase) : chacun joue son cycliste sur son appareil.
// La partie préparée sur un appareil est mise en ligne avec un code ; les autres la rejoignent et choisissent leur cycliste.
// Hors de son tour, on peut regarder la carte mais pas agir ; la main de cartes des autres n'est jamais affichée.
// ==========================================================================
// En test local (deux onglets), chaque onglet garde sa propre place.
const netStore=()=>NET.isLocalTest()?sessionStorage:localStorage;
let lobby=(()=>{try{return JSON.parse(netStore().getItem('velo-lobby')||'null');}catch{return null;}})(),lobbyUnlisten=null,lobbyPrep=false,lobbyRulesBackup=null;
let online=(()=>{try{return JSON.parse(netStore().getItem('velo-online')||'null');}catch{return null;}})();
let netDirty=false,net={view:'home'},netUnlisten=null,netLight='',netPushing=false,netAgain=false,netDeferred=null,netWasMyTurn=null;
const saveOnline=()=>{try{online?netStore().setItem('velo-online',JSON.stringify(online)):netStore().removeItem('velo-online');}catch{}};
const lightOf=g=>{if(!g)return '';const {board,edges,...l}=g;return JSON.stringify(l);};
const onlineGame=()=>Boolean(online&&m&&m.mode==='plateau');
const myTurn=()=>!onlineGame()||NET.actorId(m)===online.seat;
const seatName=id=>m?.players.find(p=>p.id===id)?.name||'un cycliste';
function onlineView(){
 const local=m&&m.mode==='plateau'&&!m.done&&!online?{title:`Jour ${m.round} · ${m.players.length} cycliste${m.players.length>1?'s':''}`,players:m.players.map(p=>({id:p.id,name:p.name,detail:`${m.rules.bikes[p.bike]?.name||p.bike} · ${findVoyage(p.voyage)?.title||''}`}))}:null;
 return onlineScreen({btn,net,local,current:online&&m?{code:online.code,name:seatName(online.seat)}:null,message,rules:setupRules,lobbyBack:lobby&&net.view!=='lobby'?lobby.code:null});}
function applyRemote(text,rev,force=false){
 if(online&&rev<online.rev)return;// jamais revenir à un état plus ancien (réponse lente du serveur)
 let next;try{next=S.load(text);}catch(e){message='Partie en ligne illisible : '+e.message;return;}
 m=next;online.rev=rev;saveOnline();netLight=lightOf(m);mapSelection='';route=[];
 if(net.joining){net={view:'home'};screen='game';modal='';message='La partie commence !';}
 if(screen==='game'||screen==='online')render();
}
async function startListening(){
 netUnlisten?.();netUnlisten=null;if(!online)return;
 try{netUnlisten=await NET.listenOnline(online.code,(text,rev,g)=>{
  if(net.view==='created'&&g?.names)net.players=Object.entries(g.names).map(([id,name])=>({id,name,taken:Boolean(g.seats?.[id]),mine:id===online.seat}));
  if(rev<=online.rev&&!net.joining){if(screen==='online')render();return;}
  if(netPushing){netDeferred={text,rev};return;}
  applyRemote(text,rev);});}
 catch(e){message='Connexion impossible à la partie en ligne : '+e.message;render();}
}
// Recharge l'état exact de la partie en ligne (après un conflit, ou à la demande du joueur).
async function resyncOnline(note=''){if(!online)return;try{const g=await NET.getGame(online.code);if(g?.state&&g?.board){netDeferred=null;applyRemote(NET.joinGame(g.state,g.board),g.rev,true);if(note)message=note;render();}}catch(e){message='Connexion impossible : '+e.message;render();}}
async function pushNow(){
 if(!onlineGame())return;if(netPushing){netAgain=true;return;}
 netPushing=true;const sent=lightOf(m);
 try{const rev=await NET.pushState(online.code,m,online.rev);
  if(rev){online.rev=rev;saveOnline();if(lightOf(m)===sent)netDirty=false;}else{netPushing=false;netDirty=false;await resyncOnline('La partie a été resynchronisée avec l’autre joueur.');return;}}
 catch(e){message='Envoi impossible (connexion ?) : nouvel essai dans 4 secondes.';netPushing=false;setTimeout(()=>{if(onlineGame()&&netDirty)pushNow();},4000);render();return;}
 netPushing=false;
 if(netAgain&&lightOf(m)!==sent){netAgain=false;netLight=lightOf(m);pushNow();return;}netAgain=false;
 if(netDeferred){const d=netDeferred;netDeferred=null;if(d.rev>online.rev)applyRemote(d.text,d.rev);}
}
function leaveOnline(){netUnlisten?.();netUnlisten=null;online=null;saveOnline();net={view:'home'};}
async function netAction(a){
 try{
  if(a.startsWith('net-create-')){const seat=a.slice(11);net={view:'home',busy:true};render();
   const r=await NET.createOnline(m,seat);online={code:r.code,seat,rev:r.rev};saveOnline();netLight=lightOf(m);
   net={view:'created',code:r.code,players:m.players.map(p=>({id:p.id,name:p.name,taken:p.id===seat,mine:p.id===seat}))};startListening();}
  else if(a==='net-peek'){const code=NET.cleanCode(document.querySelector('#net-code')?.value);if(!code)throw Error('Tape le code reçu, par exemple VELO-4821.');
   const name=(document.querySelector('#net-join-name')?.value||'').trim();net={view:'home',busy:true,code,name};render();
   const g=await NET.getGame(code);if(!g)throw Error('Aucune partie avec ce code.');
   if(g.status==='lobby'){if(!name)throw Error('Écris ton nom avant de rejoindre.');const r=await NET.joinLobby(code,name);enterLobby(r.code,r.seat);return;}
   if(g.status==='closed')throw Error('Cette partie a été annulée.');
   const r=await NET.peekOnline(code);net={view:'seats',code,players:r.players};}
  else if(a.startsWith('net-seat-')){const seat=a.slice(9),code=net.code;net={...net,busy:true};render();
   await NET.takeSeat(code,seat);leaveOnline();online={code,seat,rev:0};saveOnline();net={view:'home',joining:true};startListening();return;}
  else if(a==='net-copy'||a==='net-copy-link'){const text=a==='net-copy'?net.code:location.origin+location.pathname+'?partie='+net.code;
   try{await navigator.clipboard.writeText(text);message=a==='net-copy'?'Code copié.':'Lien copié : envoie-le à ton ami.';}catch{message=text;}}
 }catch(e){net={...net,busy:false,error:e.message};}
 render();
}
{const priorAct=act;act=a=>{
 if(a==='online'){net={view:'home',code:new URLSearchParams(location.search).get('partie')||''};screen='online';modal='';render();return;}
 if(a==='net-back'){net={view:'home'};render();return;}
 if(a==='net-play'){if(online&&m){screen='game';modal='';net={view:'home'};render();center?.();}return;}
 if(a==='net-leave'){leaveOnline();message='Tu as quitté la partie en ligne sur cet appareil (elle reste en ligne pour les autres).';render();return;}
 if(a.startsWith('net-'))return netAction(a);
 if(a==='net-resync'){resyncOnline('Partie rechargée depuis le serveur.');return;}
 if(onlineGame()&&screen==='game'&&!['zoomin','zoomout','center','art','sheet-toggle','split-view','meteo','close','help','stats','settings'].includes(a)&&!/^(help-tab-|meteo-day-|intro-close|chat-|net-)/.test(a))netDirty=true;
 if(onlineGame()&&a==='new'){leaveOnline();}
 if(onlineGame()&&(a==='mapedit'||a==='rules')&&screen==='game'){message=a==='mapedit'?'Pas de modification de carte pendant une partie en ligne.':'Les règles ne se changent pas pendant une partie en ligne.';render();return;}
 return priorAct(a);};}
// Après chaque affichage : envoyer ses coups, cacher ce qui n'est pas à soi, bandeau « à toi de jouer ».
{const priorRender=render;render=()=>{
 globalThis.document?.querySelectorAll?.('.net-banner').forEach(e=>e.remove());
 if(onlineGame())privacyCover=false;// chacun son écran : pas besoin de « passage de main »
 priorRender();
 if(!onlineGame()||screen!=='game')return;
 const mine=myTurn(),actor=seatName(NET.actorId(m)),brand=document.querySelector('header .brand');
 brand?.insertAdjacentHTML('beforeend',`<span class="net-pill ${mine?'mine':''}" role="status">${mine?'À toi de jouer':esc(actor)+' joue…'} · ${esc(online.code)}</span>`);
 document.body?.classList?.toggle('net-waiting',!mine);if(mine)document.querySelectorAll('.net-banner').forEach(e=>e.remove());
 if(!mine){const a=m.players.find(p=>p.id===NET.actorId(m)),what=m.pendingAttack?'répond à une carte…':m.phase==='card-intervention'?'peut jouer une carte météo…':'roule…';
  document.querySelectorAll('.net-banner').forEach(e=>e.remove());document.body?.insertAdjacentHTML('beforeend',`<div class="net-banner" role="status"><span class="nb-dot" style="background:${esc(a?.color||'#267b91')}"></span><b>C’est à ${esc(a?.name||'l’autre joueur')} de jouer</b><span>· jour ${m.round} · ${esc(a?.name||'')} ${what}</span><button type="button" data-action="net-resync" class="nb-btn">🔄 Recharger</button></div>`);}
 if(netWasMyTurn===false&&mine)message='À toi de jouer !';netWasMyTurn=mine;
 try{document.title=(mine?'● À toi — ':'')+'L’Aventure à Vélo';}catch{}
 // Toute différence vient d'une action faite ici (hors de son tour, les actions sont bloquées) : on l'envoie.
 const light=lightOf(m);if(light!==netLight&&netDirty){netLight=light;pushNow();}else if(light!==netLight&&!netDirty&&!netPushing){/* changement fait par l'affichage seul : on attend l'état en ligne */}
};}
// Pendant le tour de l'autre : ta fiche complète (tous les onglets), affichée comme si c'était toi ; les actions restent bloquées.
{const priorSheet=playerSheet;playerSheet=(inline=false)=>{
 if(!onlineGame()||myTurn())return priorSheet(inline);
 const mine=m.players.findIndex(p=>p.id===online.seat);if(mine<0)return priorSheet(inline);
 const keep=m.activeIndex;m.activeIndex=mine;try{return priorSheet(inline).replace('class="player-mat fiche','class="player-mat fiche net-mine-sheet').replace('class="player-sheet-inline player-mat fiche','class="player-sheet-inline player-mat fiche net-mine-sheet');}finally{m.activeIndex=keep;}};}
{const priorOverlay=overlay;overlay=()=>{if(onlineGame()&&screen==='game'&&!myTurn()&&!['meteo','stats'].includes(modal))return '';return priorOverlay();};}
// Hors de son tour : seuls les boutons « pour regarder » marchent.
const NET_VIEW_ACTIONS=new Set(['net-resync','zoomin','zoomout','center','art','sheet-toggle','split-view','meteo','close','home','settings','stats','online','net-play','net-leave','reveal-close']);
globalThis.document?.addEventListener?.('click',e=>{
 if(!onlineGame()||screen!=='game'||myTurn())return;
 const el=e.target.closest?.('[data-action],[data-sheet-tab],button,a,input,select,[data-board-key],svg,.map-wrap');if(!el)return;
 if(el.closest('[data-sheet-tab]')||NET_VIEW_ACTIONS.has(el.dataset?.action)||/^(help|intro-close|help-tab-|meteo-day-|chat-)/.test(el.dataset?.action||'')||el.closest('.chat-drawer')||el.closest('.chat-toast')||el.closest('.maptools')||el.closest('header')||el.closest('.split-size'))return;
 e.stopPropagation();e.preventDefault();message=`C’est au tour de ${seatName(NET.actorId(m))}.`;const toast=document.querySelector('.toast');if(toast)toast.textContent=message;
},true);
// Au démarrage : reprendre l'écoute de la partie en ligne, ou ouvrir l'écran « Rejoindre » si le lien contient un code.
if(online){netLight=lightOf(m);startListening();}
{const code=(()=>{try{return NET.cleanCode(new URLSearchParams(location.search).get('partie'));}catch{return '';}})();if(code&&!online){net={view:'home',code};screen='online';render();}}
// Test local (?reseau=local) : accès à l'état pour vérifier la synchronisation.
if(NET.isLocalTest())globalThis.__velo={get m(){return m;},get modal(){return modal;},get overlayHtml(){return overlay();},get online(){return online;},get net(){return {pushing:netPushing,again:netAgain,deferred:Boolean(netDeferred)};}};

// ==========================================================================
// Salle d'attente en ligne : la partie est créée en ligne dès le départ, chacun prépare son cycliste sur son appareil.
// ==========================================================================
const saveLobby=()=>{try{lobby?netStore().setItem('velo-lobby',JSON.stringify(lobby)):netStore().removeItem('velo-lobby');}catch{}};
function lobbyRules(g){try{return validateRules(JSON.parse(g.rules));}catch{return clone(CLASSIC);}}
function lobbySeats(g){const r=lobbyRules(g),me=NET.clientId();
 return NET.seatIds(g.count||2).map((id,i)=>{const s=g.lobby?.[id];if(!s?.client)return {id,num:i+1,state:'free'};
  const v=findVoyage(s.voyage);return {id,num:i+1,name:s.name||'Cycliste',mine:s.client===me,state:s.ready?'ready':'prep',detail:s.ready?`${r.bikes[s.bike]?.name||s.bike} · ${v?v.title+' ('+v.from+' → '+v.to+')':''}`:''};});}
function lobbyRulesLine(g){const r=lobbyRules(g);return `Météo : ${r.weather?.forecast?'annoncée':'cartes météo'} · Événements : ${r.encounters?.enabled?'rencontres':'cartes'} · ${r.distance} cases/jour · ${r.startMoney} pièces`;}
function showLobby(g){net={...net,view:'lobby',code:lobby.code,game:g,seats:lobbySeats(g),host:g.host===NET.clientId(),rulesLine:lobbyRulesLine(g),busy:false};}
async function enterLobby(code,seat){
 lobby={code,seat};saveLobby();lobbyUnlisten?.();lobbyUnlisten=null;net={view:'lobby',code,seats:[],busy:true};screen='online';render();
 lobbyUnlisten=await NET.listenRaw(code,g=>{
  if(!lobby||lobby.code!==code)return;
  if(!g||g.status==='closed'){leaveLobbyLocal();message='La partie '+code+' a été annulée par l’hôte.';if(screen==='online')render();return;}
  if(g.status==='playing'){// la partie est lancée : chacun rejoint sa place
   const seat=lobby.seat;leaveLobbyLocal();if(online?.code===code)return;
   leaveOnline();online={code,seat,rev:0};saveOnline();net={view:'home',joining:true};screen='online';render();startListening();return;}
  if(!g.lobby?.[lobby.seat]||g.lobby[lobby.seat].client!==NET.clientId()){leaveLobbyLocal();message='Tu n’as plus de place dans cette partie.';if(screen==='online')render();return;}
  if(lobbyPrep)return;// on prépare son vélo : on ne change pas d'écran
  showLobby(g);if(screen==='online')render();});
}
function leaveLobbyLocal(){lobbyUnlisten?.();lobbyUnlisten=null;lobby=null;saveLobby();endPrep();if(net.view==='lobby')net={view:'home'};}
function endPrep(){if(lobbyPrep&&lobbyRulesBackup)setupRules=lobbyRulesBackup;lobbyPrep=false;lobbyRulesBackup=null;}
function readNetForm(){readVictory();const name=document.querySelector('#net-name')?.value??document.querySelector('#net-join-name')?.value,count=document.querySelector('#net-count')?.value,code=document.querySelector('#net-code')?.value;
 if(name!==undefined)net.name=name;if(count)net.count=+count;if(code!==undefined)net.code=code;}
async function lobbyAction(a){
 try{
  if(a==='net-lobby-create'){readNetForm();const name=(net.name||'').trim();if(!name)throw Error('Écris ton nom pour créer la partie.');
   net={...net,busy:true,error:''};render();const r=await NET.createLobby({count:net.count||2,rules:setupRules,name});await enterLobby(r.code,r.seat);return;}
  if(a==='net-lobby-back'){if(lobby)await enterLobby(lobby.code,lobby.seat);return;}
  if(a==='net-lobby-leave'){const l=lobby;leaveLobbyLocal();if(l)await NET.leaveLobby(l.code,l.seat).catch(()=>{});net={view:'home'};message='Tu as quitté la salle d’attente.';render();return;}
  if(a==='net-lobby-prep'){const g=net.game,s=g?.lobby?.[lobby.seat];if(!s)return;
   lobbyRulesBackup=lobbyRulesBackup||setupRules;setupRules=lobbyRules(g);lobbyPrep=true;
   if(s.ready)NET.setLobbySeat(lobby.code,lobby.seat,{ready:false}).catch(()=>{});
   roster=[{name:s.name||'Cycliste',bike:s.bike&&setupRules.bikes[s.bike]?s.bike:'gravel',items:[...(s.items||[])]}];choosing=0;screen='equipment';modal='';message='';render();return;}
  if(a==='net-lobby-start'){const g=await NET.getGame(lobby.code);if(!g||g.status!=='lobby')throw Error('La partie n’est plus en attente.');
   const seats=NET.seatIds(g.count);if(!seats.every(id=>g.lobby?.[id]?.ready))throw Error('Tout le monde n’est pas encore prêt.');
   const list=seats.map(id=>{const s=g.lobby[id];return {name:s.name,bike:s.bike,items:s.items||[],voyage:s.voyage};});
   net={...net,busy:true};render();
   const game=S.createMatch(list,'plateau',lobbyRules(g),undefined,customCards,eventEdits);
   const chosen=findMap(selectedMapId);if(chosen){applyCustomMap(game,chosen);game.mapChoice=chosen.id;game.mapName=chosen.name;}else{game.mapChoice='';game.mapName='Europe standard';}
   const seat=lobby.seat,code=lobby.code;leaveLobbyLocal();leaveOnline();
   await NET.startLobby(code,game);m=game;online={code,seat,rev:1};saveOnline();netLight=lightOf(m);net={view:'home'};
   screen='game';zoom=1;mapSelection='';selected=0;modal='';message='C’est parti ! La partie est lancée chez tout le monde.';render();center?.();startListening();return;}
 }catch(e){net={...net,busy:false,error:e.message};}
 render();
}
{const priorAct=act;act=a=>{
 if(a.startsWith('net-lobby-'))return lobbyAction(a);
 if(screen==='online'){readNetForm();if(a==='victory-standard'){setupRules.victory={...setupRules.victory,mode:'multi',points:35,voyages:3,days:40};try{localStorage.setItem('velo-setup-rules',JSON.stringify(setupRules));}catch{}render();return;}
  if(['weather-cards','weather-forecast','events-cards','events-encounters'].includes(a)){
  if(a.startsWith('weather'))setupRules.weather={...(setupRules.weather||{}),forecast:a==='weather-forecast'};else setupRules.encounters={...(setupRules.encounters||{}),enabled:a==='events-encounters'};
  try{localStorage.setItem('velo-setup-rules',JSON.stringify(setupRules));}catch{}render();return;}}
 // Pendant la préparation en ligne : « ← Cyclistes » ramène à la salle d'attente.
 if(lobbyPrep&&(a==='setup'||a==='home'||a==='online')){endPrep();if(lobby){showLobbyAgain();return;}}
 return priorAct(a);};}
async function showLobbyAgain(){try{const g=await NET.getGame(lobby.code);if(g&&g.status==='lobby')showLobby(g);}catch{}screen='online';render();}
// Choix du voyage pendant la préparation en ligne : on enregistre son cycliste au lieu de lancer une partie sur cet appareil.
globalThis.document?.addEventListener?.('click',async e=>{
 if(!lobbyPrep||screen!=='voyages')return;const el=e.target.closest?.('[data-voyage]');if(!el)return;
 e.stopPropagation();e.preventDefault();const id=el.dataset.voyage;if(!drawn.some(v=>v.id===id))return;
 const p=roster[0];try{await NET.setLobbySeat(lobby.code,lobby.seat,{name:p.name,bike:p.bike,items:p.items||[],voyage:id,ready:true});
  endPrep();message='Ton cycliste est prêt !';await showLobbyAgain();}
 catch(e2){message=e2.message;render();}
},true);
// Au démarrage : revenir dans la salle d'attente si on l'avait quittée en fermant le jeu.
if(lobby&&!online){enterLobby(lobby.code,lobby.seat).catch(()=>{});}
if(NET.isLocalTest())Object.defineProperty(globalThis.__velo,'lobby',{get:()=>({lobby,prep:lobbyPrep,net})});

// ==========================================================================
// Règles : résumé « Comment on joue » avant le jour 1, et règles détaillées (bouton « 📖 Règles »).
// ==========================================================================
let helpTab='route';
const helpRules=()=>m&&screen==='game'?m.rules:setupRules,helpEvent=()=>m&&screen==='game'?m.cardVersion===3:true;
{const priorAct=act;act=a=>{
 if(a==='help'){modal='help';render();return;}
 if(a.startsWith('help-tab-')){helpTab=a.slice(9);modal='help';render();return;}
 if(a==='intro-close'){try{if(document.querySelector('#intro-hide')?.checked)localStorage.setItem('velo-hide-intro','1');}catch{}modal='';render();return;}
 return priorAct(a);};}
{const priorOverlay=overlay;overlay=()=>{
 if(modal==='help')return `<div class="modal-back"><section class="modal wide help-modal" role="dialog" aria-modal="true" aria-label="Règles détaillées">${rulesHelp(helpRules(),helpTab,{btn,eventGame:helpEvent()})}</section></div>`;
 if(modal==='rules-intro')return `<div class="modal-back"><section class="modal wide help-modal" role="dialog" aria-modal="true" aria-label="Comment on joue">${rulesIntro(helpRules(),{btn,eventGame:helpEvent()})}</section></div>`;
 return priorOverlay();};}
// Le résumé s'affiche une fois par partie, au premier jour (en ligne : sur chaque appareil).
{const priorRender=render;render=()=>{
 try{if(screen==='game'&&m&&!m.done&&!m.tutorial&&!modal&&m.round===1&&localStorage.getItem('velo-hide-intro')!=='1'){const seen=JSON.parse(localStorage.getItem('velo-intro-seen')||'[]'),id=String(m.seed);
  if(!seen.includes(id)){localStorage.setItem('velo-intro-seen',JSON.stringify([...seen.slice(-20),id]));modal='rules-intro';}}}catch{}
 priorRender();};}

// ==========================================================================
// Mes parties : plusieurs parties enregistrées (IndexedDB), reprises depuis une liste.
// ==========================================================================
var partiesList=[];let partiesFilter='all',partiesRenaming='',partySaveTimer=null,partyDelete='';const partyLastData=new Map();
async function refreshParties(){partiesList=await SAVES.allSaves();if(screen==='parties'||screen==='home')render();}
function partiesView(){return partiesScreen({btn,list:partiesList,filter:partiesFilter,currentId:m?SAVES.saveIdOf(m):'',message,miniMap:id=>{const v=findVoyage(id);return v?`<div class="voyage-art voyage-art-map">${voyageMiniMap(v)}</div>`:'';},renaming:partiesRenaming});}
function saveParty(){clearTimeout(partySaveTimer);partySaveTimer=setTimeout(async()=>{if(!m)return;try{
 const id=SAVES.saveIdOf(m),data=S.serialize(m);if(partyLastData.get(id)===data)return;
 const old=await SAVES.getSave(id).catch(()=>null),summary=SAVES.summarize(m,{voyages:[...voyages,TUTORIAL_VOYAGE],online:typeof onlineGame==='function'&&onlineGame()?online:null});
 await SAVES.putSave({id,name:old?.customName?old.name:SAVES.autoName(summary),customName:Boolean(old?.customName),createdAt:old?.createdAt||Date.now(),updatedAt:Date.now(),summary,data});
 partyLastData.set(id,data);if(!old){await SAVES.trimSaves(id);}partiesList=await SAVES.allSaves();if(screen==='parties')render();}catch{/* pas de réserve : la sauvegarde simple suffit */}},1200);}
{const p0=persist;persist=(force=false)=>{const r=p0(force);if(m&&(auto||force))saveParty();return r;};}
function downloadText(text,name){const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
const slug=t=>String(t||'partie').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'partie';
async function openParty(id){const rec=await SAVES.getSave(id);if(!rec){message='Partie introuvable.';render();return;}
 let next;try{next=S.load(rec.data);}catch(e){message='Partie illisible : '+e.message;render();return;}
 if(typeof onlineGame==='function'&&onlineGame()&&!(rec.summary?.online&&online?.code===rec.summary.online.code))leaveOnline();
 m=next;partyLastData.set(id,rec.data);route=[];mapSelection='';modal='';zoom=1;selected=0;
 if(rec.summary?.online&&!online){online={code:rec.summary.online.code,seat:rec.summary.online.seat,rev:0};saveOnline();netLight=lightOf(m);net={view:'home',joining:true};startListening();}
 screen='game';try{localStorage.setItem('velo-save',rec.data);}catch{}render();center?.();}
{const priorAct=act;act=a=>{
 if(a==='continue'&&!(m&&partiesList.length<=1)){screen='parties';modal='';partiesRenaming='';render();refreshParties();return;}// une seule partie : on la reprend directement
 if(a==='new'&&m&&!m.done){persist(true);if(typeof onlineGame==='function'&&onlineGame())leaveOnline();screen='modes';modal='';render();return;}// la partie en cours reste dans « Mes parties »
 if(a==='new-game')return act('new');
 if(a.startsWith('parties-filter-')){partiesFilter=a.slice(15);render();return;}
 if(a.startsWith('party-open-')){openParty(a.slice(11));return;}
 if(a.startsWith('party-rename-ok-')){const id=a.slice(16),name=(document.querySelector('#party-name')?.value||'').trim().slice(0,60);partiesRenaming='';
  SAVES.getSave(id).then(rec=>rec&&name?SAVES.putSave({...rec,name,customName:true}):null).then(refreshParties);return;}
 if(a.startsWith('party-rename-')){partiesRenaming=a.slice(13);render();setTimeout(()=>document.querySelector('#party-name')?.focus(),30);return;}
 if(a.startsWith('party-export-')){SAVES.getSave(a.slice(13)).then(rec=>{if(rec)downloadText(rec.data,slug(rec.name)+'-jour-'+(rec.summary?.round||1)+'.json');});return;}
 if(a.startsWith('party-delete-')&&a!=='party-delete-ok'){partyDelete=a.slice(13);modal='party-delete';render();return;}
 if(a==='party-delete-ok'){const id=partyDelete;partyDelete='';modal='';
  if(m&&SAVES.saveIdOf(m)===id){if(typeof onlineGame==='function'&&onlineGame())leaveOnline();m=null;try{localStorage.removeItem('velo-save');}catch{}}
  SAVES.deleteSave(id).catch(()=>{}).then(()=>{message='Partie supprimée.';return refreshParties();});return;}
 return priorAct(a);};}
{const priorOverlay=overlay;overlay=()=>{if(modal==='party-delete'){const rec=partiesList.find(r=>r.id===partyDelete);
 return `<div class="modal-back"><section class="modal" role="dialog" aria-modal="true"><h2>🗑 Supprimer cette partie ?</h2><p>« ${esc(rec?.name||'Partie')} » sera effacée de cet appareil. ${rec?.summary?.online?'La partie en ligne continue pour les autres joueurs.':'Pense à « ⬇️ Fichier » si tu veux la garder.'}</p>${btn('Oui, supprimer','party-delete-ok')}${btn('Annuler','close','light')}</section></div>`;}
 return priorOverlay();};}
// Importer une partie depuis un fichier : elle s'ajoute à la liste.
globalThis.document?.addEventListener?.('change',async e=>{if(e.target?.id!=='import-party')return;const file=e.target.files?.[0];if(!file)return;
 try{const text=await file.text(),game=S.load(text),summary=SAVES.summarize(game,{voyages:[...voyages,TUTORIAL_VOYAGE]});let id=SAVES.saveIdOf(game);if(await SAVES.getSave(id).catch(()=>null))id+='-import-'+Date.now().toString(36);
  await SAVES.putSave({id,name:SAVES.autoName(summary)+' (importée)',customName:false,createdAt:Date.now(),updatedAt:Date.now(),summary,data:text});message='Partie importée : elle est dans la liste.';}
 catch(err){message='Fichier illisible : '+err.message;}refreshParties();});
refreshParties();

// ==========================================================================
// Cartes négatives reçues : rappel au début de son tour + pastilles des pénalités en cours sur la barre.
// ==========================================================================
function penaltyPills(p){const t=p.turnModifiers||{},out=[];
 if(t.skipMove)out.push('🚫 Pas de déplacement aujourd’hui');
 if(t.distancePenalty)out.push(`➖ ${t.distancePenalty} case${t.distancePenalty>1?'s':''} de moins aujourd’hui`);
 if(t.noMountain)out.push('❄️ Montagne et cols interdits aujourd’hui');
 const extra=(p.pendingEffects||[]).filter(e=>e.kind==='extra_energy').reduce((n,e)=>n+(e.value||0),0);if(extra)out.push(`💨 +${extra} ⚡ au prochain déplacement`);
 return out;}
{const priorSidebar=sidebar;sidebar=()=>{const html=priorSidebar();if(!m||m.done)return html;const pills=penaltyPills(S.player(m));
 return pills.length?html.replace('<div class="dock-day">',`<div class="dock-penalties" role="status">${pills.map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="dock-day">`):html;};}
const receivedFor=()=>{if(!m||m.done||screen!=='game'||m.pendingAttack)return null;const p=S.player(m);if(typeof onlineGame==='function'&&onlineGame()&&!myTurn())return null;return p.receivedCards?.length?p:null;};
{const priorOverlay=overlay;overlay=()=>{const p=receivedFor();
 if(p&&(!modal||modal==='received')&&['move','place','puncture'].includes(m.phase)){const list=p.receivedCards;
  const faces=list.map(r=>{const c=eventCardById(r.cardId,m),who=r.from?m.players.find(q=>q.id===r.from)?.name:'';return `<div class="recv-card"><small>${who?esc(who)+' t’a joué':'La route t’a réservé'} · jour ${r.round}</small>${c?eventFace(c,'',true):''}</div>`;}).join('');
  const pills=penaltyPills(p);
  return `<div class="modal-back"><section class="modal wide recv-modal" role="dialog" aria-modal="true"><span class="eyebrow">AU DÉBUT DE TON TOUR · ${esc(p.name)}</span><h2>${list.length>1?'Des cartes ont été jouées contre toi':'Une carte a été jouée contre toi'}</h2><div class="recv-faces">${faces}</div>${pills.length?`<p class="recv-now"><b>En ce moment :</b> ${pills.map(esc).join(' · ')}</p>`:''}${p.flat?'<p class="recv-now">Il faut d’abord réparer (ou te soigner) : la fenêtre suivante te le propose.</p>':''}${btn('J’ai compris','received-ok')}</section></div>`;}
 return priorOverlay();};}
{const priorAct=act;act=a=>{if(a==='received-ok'){const p=S.player(m);if(p)p.receivedCards=[];modal='';render();return;}return priorAct(a);};}

// ==========================================================================
// Petits messages en partie en ligne : bouton 💬 avec pastille, petit tiroir, phrases rapides, bandeau à l'arrivée.
// ==========================================================================
let chat=[],chatOpen=false,chatUnlisten=null,chatCode='',chatSeenAt=0,chatToastTimer=null;
const CHAT_QUICK=['À toi !','Bien joué 👏','Je reviens dans 5 min','😅','🚴💨'];
const chatSeenKey=()=>'velo-chat-seen-'+(online?.code||'');
const chatUnread=()=>chat.filter(c=>c.from!==online?.seat&&c.at>chatSeenAt).length;
function chatMarkSeen(){chatSeenAt=Math.max(chatSeenAt,...chat.map(c=>c.at||0),0);try{localStorage.setItem(chatSeenKey(),String(chatSeenAt));}catch{}}
async function chatListen(){if(!online||chatCode===online.code)return;chatUnlisten?.();chatCode=online.code;chat=[];try{chatSeenAt=Number(localStorage.getItem(chatSeenKey())||0);}catch{chatSeenAt=0;}
 if(typeof NET.listenChat!=='function'){message='Messages indisponibles : recharge la page (Ctrl + Maj + R) pour avoir la dernière version du jeu.';chatCode='';return;}
 try{chatUnlisten=await NET.listenChat(online.code,list=>{const before=chat.length;chat=Array.isArray(list)?list.filter(c=>c&&c.text):[];
  const fresh=chat.slice(before).filter(c=>c.from!==online?.seat&&c.at>chatSeenAt);
  if(chatOpen)chatMarkSeen();else if(fresh.length)chatToast(fresh.at(-1));
  if(screen==='game')chatRefresh();});}catch(e){chatCode='';message='Messages : connexion impossible ('+e.message+').';}}
const chatBind=()=>document.querySelectorAll('.chat-drawer [data-action],.chat-toast,.chat-btn').forEach(el=>el.onclick=()=>act(el.dataset.action));
function chatToast(c){const old=document.querySelector('.chat-toast');old?.remove();clearTimeout(chatToastTimer);
 document.body?.insertAdjacentHTML('beforeend',`<button type="button" class="chat-toast" data-action="chat-toggle">💬 <b>${esc(c.name||'')}</b> : ${esc(c.text)}</button>`);chatBind();
 chatToastTimer=setTimeout(()=>document.querySelector('.chat-toast')?.remove(),4000);}
function chatDrawer(){const me=online?.seat;return `<aside class="chat-drawer" aria-label="Messages"><div class="cd-head"><b>💬 Messages</b><button type="button" data-action="chat-toggle" aria-label="Fermer">✕</button></div>
 <div class="cd-list">${chat.length?chat.slice(-30).map(c=>`<p class="${c.from===me?'me':''}"><small>${esc(c.from===me?'Toi':c.name||'')}</small>${esc(c.text)}</p>`).join(''):'<p class="cd-empty">Pas encore de message.</p>'}</div>
 <div class="cd-quick">${CHAT_QUICK.map((t,i)=>`<button type="button" data-action="chat-quick-${i}">${esc(t)}</button>`).join('')}</div>
 <div class="cd-send"><input id="chat-input" maxlength="200" autocomplete="off" placeholder="Écris un message…"/><button type="button" data-action="chat-send">Envoyer</button></div></aside>`;}
// Mise à jour légère (sans redessiner la partie) : pastille et tiroir.
function chatRefresh(){const n=chatUnread(),b=document.querySelector('.chat-btn');if(b)b.innerHTML=`💬<span class="chat-label"> Messages</span>${n?` <span class="chat-badge">${n}</span>`:''}`;
 const d=document.querySelector('.chat-drawer');if(d){const list=d.querySelector('.cd-list'),html=document.createElement('div');html.innerHTML=chatDrawer();d.querySelector('.cd-list').replaceWith(html.querySelector('.cd-list'));d.querySelector('.cd-list').scrollTop=1e6;}}
async function chatSend(text){text=String(text||'').trim();if(!text||!online)return;const me=m?.players.find(p=>p.id===online.seat);
 try{await NET.sendChat(online.code,{from:online.seat,name:me?.name||'',text});}catch(e){message='Message non envoyé : '+e.message;render();}}
{const priorAct=act;act=a=>{
 if(a==='chat-toggle'){chatOpen=!chatOpen;if(chatOpen)chatMarkSeen();document.querySelector('.chat-toast')?.remove();render();if(chatOpen)setTimeout(()=>{document.querySelector('.cd-list')&&(document.querySelector('.cd-list').scrollTop=1e6);document.querySelector('#chat-input')?.focus();},30);return;}
 if(a==='chat-send'){const i=document.querySelector('#chat-input');chatSend(i?.value);if(i)i.value='';return;}
 if(a.startsWith('chat-quick-')){chatSend(CHAT_QUICK[+a.slice(11)]);return;}
 return priorAct(a);};}
{const priorRender=render;render=()=>{const typed=document.querySelector('#chat-input')?.value||'';priorRender();
 if(!onlineGame()||screen!=='game'){return;}chatListen();
 // Dans la zone libre du haut, juste après la pioche et la défausse (sinon après le nom du jeu).
 const slot=document.querySelector('header .event-piles'),brand=document.querySelector('header .brand')||document.querySelector('header');
 if(slot)slot.insertAdjacentHTML('afterend',`<button type="button" class="chat-btn chat-top" data-action="chat-toggle"></button>`);else brand?.insertAdjacentHTML('beforeend',`<button type="button" class="chat-btn" data-action="chat-toggle"></button>`);chatRefresh();
 if(chatOpen){document.body.insertAdjacentHTML('beforeend',chatDrawer());const i=document.querySelector('#chat-input');if(i)i.value=typed;const l=document.querySelector('.cd-list');if(l)l.scrollTop=1e6;}
 else document.querySelectorAll('.chat-drawer').forEach(e=>e.remove());chatBind();};}
globalThis.document?.addEventListener?.('keydown',e=>{if(e.target?.id==='chat-input'&&e.key==='Enter'){e.preventDefault();act('chat-send');}});

// ---------- Partie guidée « Apprendre à jouer » (bouton de l'écran titre) ----------
// Une bulle crème pointe l'endroit concerné et attend que le joueur fasse la chose demandée.
let tutoTimer=null,tutoFocusStep=-1;
const tutoUi=()=>({route});
const tutoKeyOf=sel=>sel==='hex:next'?TUTO.nextGuideKey(m,route):sel.slice(4);
function tutoFocusKey(){const s=TUTO.currentStep(m);for(const sel of s?.target||[])if(sel.startsWith('hex:')){const k=tutoKeyOf(sel);if(k)return k;}return '';}
function tutoTargetEl(s){for(const sel of s.target||[]){if(sel.startsWith('hex:')){const key=tutoKeyOf(sel);const el=key&&document.querySelector(`.playable-europe [data-board-key="${key}"]`);if(el)return {el,key};continue;}const el=[...document.querySelectorAll(sel)].find(e=>e.getClientRects().length&&!e.closest('[hidden]'));if(el)return {el};}return null;}
function tutoEffect(e){if(e==='meteo'){modal='meteo';meteoDay='today';}
 // Sur petit écran, la fiche ne s'ouvre que pour les bulles qui la montrent ; sinon on laisse voir le plateau.
 if(e.startsWith('tab:')){const [,tab,open]=e.split(':');sheetTab=tab;if(narrowScreen())sheetDrawer=open==='open';else if(!displayPrefs.sheet)displayPrefs=writeDisplayPref('sheet',true);}}
function tutoBubble(s){const i=m.tutorial.step,n=TUTO.STEPS.length-1;
 const actions=s.final?btn('Continuer la partie →','tuto-continue','tuto-primary')+btn('Retour au menu','tuto-menu','tuto-light')
  :(s.wait?`<span class="tuto-wait">${esc(s.waiting||'')}</span>`:btn(s.next||'Compris →','tuto-next','tuto-primary'))+(s.button&&!document.querySelector('.fiche-journee')?btn(esc(s.button.label),s.button.action,'tuto-light'):'')+btn('Passer le guide','tuto-skip','tuto-skip');
 return `<div class="tuto-layer${s.center?' tuto-centered':''}"><aside class="tuto-bubble" role="dialog" aria-live="polite" aria-label="Guide : ${esc(s.title)}"><span class="tuto-arrow" aria-hidden="true"></span><small class="tuto-eyebrow">🎓 ${s.final?'Fin du guide':`Étape ${i+1} sur ${n}`} · Jour ${m.round}</small><b class="tuto-title">${esc(s.title)}</b><p>${s.text(m)}</p><div class="tuto-actions">${actions}</div></aside></div>`;}
function tutoPlace(){const b=document.querySelector('.tuto-layer .tuto-bubble');if(!b||!m)return;const s=TUTO.currentStep(m);
 document.querySelectorAll('.tuto-target').forEach(e=>e.classList.remove('tuto-target'));
 if(!s){b.hidden=true;return;}
 if(s.center){b.hidden=false;b.dataset.side='center';b.style.left='';b.style.top='';return;}
 const t=tutoTargetEl(s),back=document.querySelector('.modal-back');
 // Une autre fenêtre est ouverte (découverte, choix…) : la bulle attend qu'on la ferme.
 b.hidden=Boolean(back&&!(t&&back.contains(t.el)));if(b.hidden)return;
 if(t&&!t.key)t.el.classList.add('tuto-target');
 const W=innerWidth,H=innerHeight,bw=b.offsetWidth,bh=b.offsetHeight,gap=16,dock=()=>{b.dataset.side='dock';b.style.left='';b.style.top='';};
 if(!t||W<720)return dock();
 const r=t.el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
 if(r.bottom<0||r.top>H||r.right<0||r.left>W)return dock();
 let side,x,y;
 if(r.bottom+gap+bh<H-8){side='below';y=r.bottom+gap;x=cx-bw/2;}
 else if(r.top-gap-bh>8){side='above';y=r.top-gap-bh;x=cx-bw/2;}
 else if(r.right+gap+bw<W-8){side='right';x=r.right+gap;y=cy-bh/2;}
 else if(r.left-gap-bw>8){side='left';x=r.left-gap-bw;y=cy-bh/2;}
 else return dock();
 x=Math.max(8,Math.min(W-bw-8,x));y=Math.max(8,Math.min(H-bh-8,y));
 b.dataset.side=side;b.style.left=Math.round(x)+'px';b.style.top=Math.round(y)+'px';
 const arrow=b.querySelector('.tuto-arrow');
 if(side==='below'||side==='above'){arrow.style.left=Math.round(Math.max(20,Math.min(bw-20,cx-x)))+'px';arrow.style.top='';}
 else{arrow.style.top=Math.round(Math.max(20,Math.min(bh-20,cy-y)))+'px';arrow.style.left='';}}
// Le plateau reçoit le chemin conseillé et la case à cliquer.
{const prior=boardSurfaceMarkup;boardSurfaceMarkup=state=>prior(screen==='game'&&TUTO.tutorialOn(m)?{...state,guidePath:TUTO.guidePath(m),guideFocus:tutoFocusKey()}:state);}
{const priorRender=render;render=()=>{
 if(screen==='game'&&m&&TUTO.tutorialOn(m))for(const e of TUTO.tutorialTick(m,tutoUi()))tutoEffect(e);
 priorRender();
 document.querySelectorAll('.tuto-layer').forEach(e=>e.remove());document.querySelectorAll('.tuto-target').forEach(e=>e.classList.remove('tuto-target'));
 clearInterval(tutoTimer);tutoTimer=null;
 if(screen!=='game'||!m||!TUTO.tutorialOn(m)||!TUTO.currentStep(m))return;
 const s=TUTO.currentStep(m);document.body.insertAdjacentHTML('beforeend',tutoBubble(s));
 document.querySelectorAll('.tuto-layer [data-action]').forEach(el=>el.onclick=()=>act(el.dataset.action));
 if(tutoFocusStep!==m.tutorial.step){tutoFocusStep=m.tutorial.step;const t=m.board[tutoFocusKey()];if(t&&boardRenderer)boardRenderer.focusOn(t.x,t.y,{minScale:1.7});}
 tutoPlace();tutoTimer=setInterval(tutoPlace,250);};}
{const priorAct=act;act=a=>{
 if(a==='tuto-start'){if(onlineGame())leaveOnline();try{m=TUTO.createTutorialMatch(customCards,eventEdits);}catch(e){message=e.message;render();return;}
  screen='game';zoom=1;modal='';route=[];mapSelection='';selected=0;message='';tutoFocusStep=-1;render();center();return;}
 if(m&&a==='tuto-next'){const was=TUTO.currentStep(m)?.id;for(const e of TUTO.tutorialNext(m,tutoUi()))tutoEffect(e);if(was==='meteo'&&modal==='meteo')modal='';render();return;}
 if(m&&a==='tuto-skip'){TUTO.endTutorial(m);message='Guide arrêté : la partie continue normalement, avec la météo et les cartes.';render();return;}
 if(m&&a==='tuto-continue'){TUTO.endTutorial(m);message='À toi de jouer : finis ta journée, puis choisis ton prochain voyage !';render();return;}
 if(m&&a==='tuto-menu'){TUTO.endTutorial(m);modal='';screen='home';render();return;}
 return priorAct(a);};}

// Menus « carte d'aventure » (style C) : écran titre vivant, plateau, cyclistes, garage (monture + chargement), voyages.
// Ce module ne fait que produire du HTML : les règles, la sauvegarde et les clics restent dans app.js.
// Les attributs data-action, data-map-choice, data-mode, data-equipment, data-voyage… sont ceux qu'app.js écoute déjà.
import {MAP_CELLS} from './assets/europe/board-data.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MAP_IMG='assets/terrain/europe-terrain.webp';
const city=n=>MAP_CELLS.find(c=>c.name===n);
const plural=(n,one,many)=>n+' '+(n>1?many:one);

// ---------- Icônes (traits, sans emoji) ----------
export const GEAR_ICONS={
 tente:'M3 25 L15 5 L27 25 Z M15 5 L15 25',
 rechaud:'M6 12 H24 V20 C24 23 21 25 18 25 H12 C9 25 6 23 6 20 Z M10 8 C10 6 12 6 12 4 M16 8 C16 6 18 6 18 4',
 chambre:'M5 15 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M10 15 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0',
 kit:'M7 23 L17 13 M17 13 C15 9 17 5 21 5 L19 9 L21 11 L25 9 C25 13 21 15 17 13',
 gps:'M4 15 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 M15 8 L18 15 L15 22 L12 15 Z',
 duvet:'M4 11 H26 V21 H4 Z M9 11 V21 M15 11 V21',
 secours:'M5 8 H25 V24 H5 Z M15 12 V20 M11 16 H19',
 sacoches:'M8 10 H22 L24 25 H6 Z M11 10 C11 6 19 6 19 10'
};
const icon=(d,size=28)=>`<svg class="mc-icon" width="${size}" height="${size}" viewBox="0 0 30 30" aria-hidden="true"><path d="${d}"/></svg>`;
// Poids indicatifs (ambiance uniquement : les règles du jeu ne lisent pas ces valeurs).
const GEAR_KG={tente:2.4,rechaud:0.8,chambre:0.3,kit:0.5,gps:0.2,duvet:1.8,secours:0.4,sacoches:1.5};

// ---------- Sacoches dessinées sur chaque vélo ----------
// x, y : position de l'étiquette sur le dessin (en % de la zone du vélo).
const BAG_LAYOUT={
 gravel:[{id:'seat',label:'Sacoche de selle',cap:2,x:6,y:8},{id:'frame',label:'Sacoche de cadre',cap:1,x:40,y:22},{id:'roll',label:'Rouleau de cintre',cap:1,x:70,y:4}],
 randonneur:[{id:'rack',label:'Porte-bagages',cap:2,x:8,y:4},{id:'rear',label:'Sacoche arrière',cap:2,x:2,y:86},{id:'frame',label:'Sacoche de cadre',cap:1,x:38,y:26},{id:'bar',label:'Sacoche de guidon',cap:1,x:70,y:0},{id:'front',label:'Sacoches avant',cap:2,x:68,y:86}]
};
// Répartit la capacité du vélo (réglable dans les règles) entre ses sacoches dessinées.
export function bagsFor(bikeId,capacity){
 const layout=BAG_LAYOUT[bikeId]||BAG_LAYOUT[capacity>5?'randonneur':'gravel'];let left=capacity;
 const bags=layout.map((b,i)=>{const cap=i===layout.length-1?Math.max(0,left):Math.min(b.cap,left);left-=cap;return {...b,cap};});
 return bags.filter(b=>b.cap>0||b===bags[0]);
}
// Range chaque objet dans la première sacoche où il tient (même ordre que les achats).
export function packBags(bags,items,equipment){
 const free=Object.fromEntries(bags.map(b=>[b.id,b.cap])),content=Object.fromEntries(bags.map(b=>[b.id,[]]));
 for(const id of items){const e=equipment[id];if(!e)continue;const bag=bags.find(b=>free[b.id]>=e.space)||bags.find(b=>free[b.id]>0)||bags.at(-1);free[bag.id]-=e.space;content[bag.id].push(e.name);}
 return {free,content};
}

function bikeSvg(bikeId,content,cls=''){
 const filled=id=>content?.[id]?.length?'is-full':'is-empty';
 const common=`<g class="mc-wheels"><circle cx="100" cy="180" r="64"/><circle cx="320" cy="180" r="64"/></g>`;
 const parts=`<g class="mc-parts"><path d="M182 92 L178 80"/><path class="mc-saddle" d="M164 77 L202 77"/><path d="M292 98 L306 88 L322 88 C338 88 338 112 324 114"/><path d="M205 184 L222 204"/></g>`;
 if(bikeId==='randonneur')return `<svg class="mc-bike ${cls}" viewBox="0 0 420 250" role="img" aria-label="Randonneuse avec porte-bagages et sacoches"><ellipse class="mc-shadow" cx="210" cy="248" rx="196" ry="6"/>${common}<g class="mc-frame rando"><path d="M100 180 L205 184 L182 92 L100 180"/><path d="M182 92 L292 98 L300 124 L205 184"/><path d="M300 124 L314 160 L320 180"/></g>${parts}<g class="mc-parts thin"><path d="M100 124 L178 120 M108 124 L100 180 M170 120 L182 104"/><path d="M44 158 A64 64 0 0 1 150 130 M282 134 A64 64 0 0 1 372 150"/></g>
  <rect class="mc-bag ${filled('rear')}" x="82" y="118" width="76" height="64" rx="10"/><rect class="mc-bag ${filled('rack')}" x="94" y="100" width="76" height="20" rx="10"/><rect class="mc-bag ${filled('front')}" x="296" y="134" width="40" height="46" rx="8"/><rect class="mc-bag ${filled('bar')}" x="306" y="62" width="40" height="30" rx="6"/><path class="mc-bag ${filled('frame')}" d="M196 104 L280 107 L286 120 L218 160 L204 142 Z"/></svg>`;
 return `<svg class="mc-bike ${cls}" viewBox="0 0 420 250" role="img" aria-label="Gravel de bikepacking avec sacoches de selle, de cadre et de cintre"><ellipse class="mc-shadow" cx="210" cy="248" rx="196" ry="6"/>${common}<g class="mc-frame gravel"><path d="M100 180 L205 184 L182 92 L100 180"/><path d="M182 92 L292 98 L300 124 L205 184"/><path d="M300 124 L314 160 L320 180"/></g>${parts}
  <path class="mc-bag ${filled('frame')}" d="M192 102 L284 105 L292 122 L214 168 L200 148 Z"/><path class="mc-bag ${filled('seat')}" d="M176 82 L128 70 L112 80 L128 96 L176 94 Z"/><ellipse class="mc-bag ${filled('roll')}" cx="334" cy="96" rx="14" ry="22"/></svg>`;
}

// ---------- Fond commun : la carte peinte ----------
const backdrop=(mode='blur')=>`<div class="mc-backdrop mc-${mode}" aria-hidden="true"><img src="${MAP_IMG}" alt=""/></div>`;
export function steps(active){
 const list=[['map','Plateau'],['players','Cyclistes'],['gear','Garage'],['goal','Voyage']],at=list.findIndex(s=>s[0]===active);
 return `<ol class="mc-steps" aria-label="Étapes du départ">${list.map(([id,label],i)=>`<li class="${i<at?'done':i===at?'current':''}" ${i===at?'aria-current="step"':''}>${i<at?'✓':i+1} · ${label}</li>`).join('')}</ol>`;
}

// ---------- Écran titre vivant ----------
export function titleScreen({btn,saveLine='',hasSave=false,message='',reduced=false,maps=[]}){
 const way=['Paris','Zurich','Vienne','Budapest','Belgrade','Sofia','Istanbul'].map(city).filter(Boolean);
 const d=way.map((c,i)=>{if(!i)return `M${c.x} ${c.y}`;const p=way[i-1],mx=(p.x+c.x)/2,my=(p.y+c.y)/2-12;return `Q${mx} ${my} ${c.x} ${c.y}`;}).join(' ');
 const start=way[0],end=way.at(-1);
 return `<main class="menu-c mc-title">
  <div class="mc-world ${reduced?'still':''}" aria-hidden="true"><img src="${MAP_IMG}" alt=""/>
   <svg viewBox="0 0 1261 842" preserveAspectRatio="xMidYMid slice"><path id="mc-route" class="mc-route" d="${d}"/><circle class="mc-start" cx="${start.x}" cy="${start.y}" r="6"/><circle class="mc-end" cx="${end.x}" cy="${end.y}" r="9"/><circle class="mc-end halo" cx="${end.x}" cy="${end.y}" r="16"/>
    <g class="mc-rider" ${reduced?`transform="translate(${way[3].x} ${way[3].y})"`:''}><circle r="13"/><path d="M-6 3 a3.4 3.4 0 1 0 0.1 0 M6 3 a3.4 3.4 0 1 0 0.1 0 M-6 3 L-1 -4 L4 -4 L6 3 M-1 -4 L1 3"/>${reduced?'':`<animateMotion dur="48s" repeatCount="indefinite" rotate="0"><mpath href="#mc-route"/></animateMotion>`}</g>
   </svg>
  </div>
  <div class="mc-clouds ${reduced?'still':''}" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
  <div class="mc-vignette" aria-hidden="true"></div>
  <section class="mc-title-copy">
   <p class="mc-kicker">Europe · Jeu de voyage à vélo</p>
   <h1>L’Aventure<br>à Vélo</h1>
   <p class="mc-lead">Paris → Istanbul, le Cap Nord, les Balkans… Choisis ta monture, charge tes sacoches et trace ta route.</p>
   <nav class="mc-signs" aria-label="Menu principal">
    ${btn('Nouveau voyage','new','mc-sign main')}
    ${hasSave?btn(`Reprendre${saveLine?` <small>${esc(saveLine)}</small>`:''}`,'continue','mc-sign'):''}
    ${btn('Cartes Événement','card-editor-open','mc-sign small')}
    ${btn('Créer une carte','editor-new','mc-sign small')}
   </nav>
   ${maps.length?`<div class="mc-mymaps"><span>Mes cartes</span>${maps.map(map=>`<button class="mc-ghost" data-edit-map="${esc(map.id)}">${esc(map.name)}</button>`).join('')}</div>`:''}
   <label class="mc-import">Importer une carte (.json) <input id="import-map" type="file" accept="application/json,.json"/></label>
   <p class="toast" role="status">${esc(message)}</p>
  </section>
 </main>`;
}

// ---------- 1. Plateau ----------
export function plateauScreen({btn,maps=[],message=''}){
 return `<main class="menu-c mc-page">${backdrop()}${steps('map')}
  <header class="mc-head"><div><p class="mc-kicker">Nouvelle aventure</p><h1>Où roulera-t-on ?</h1></div>${btn('← Accueil','home','mc-ghost')}</header>
  <div class="mc-plateau">
   <button class="mc-board-card" data-map-choice=""><img src="${MAP_IMG}" alt="Aperçu du plateau Europe"/><span class="mc-tag">Carte officielle</span><span class="mc-board-copy"><strong>Europe</strong><small>${MAP_CELLS.filter(c=>c.name).length} villes · 6 ferries · des Pyrénées à l’Oural</small></span><span class="mc-cta">Rouler ici →</span></button>
   <aside class="mc-side">
    <h2>Mes cartes</h2>
    ${maps.length?maps.map(map=>`<div class="mc-saved"><div><strong>${esc(map.name)}</strong><small>${Object.keys(map.cells).length} case(s) modifiée(s)</small></div><button data-map-choice="${esc(map.id)}">Jouer →</button><button class="mc-ghost" data-edit-map="${esc(map.id)}">Modifier</button></div>`).join(''):`<div class="mc-empty"><strong>Aucune carte pour l’instant</strong><p>Dessine ta propre Europe dans l’atelier : déplace les montagnes, ouvre un col, ajoute un port.</p></div>`}
    ${btn('Ouvrir l’atelier de carte','editor-new','mc-ghost wide')}
    <label class="mc-import">Importer une carte (.json) <input id="import-map" type="file" accept="application/json,.json"/></label>
    <button class="mc-ghost wide" data-mode="tuiles">Jouer avec les tuiles (mode libre)</button>
   </aside>
  </div>
  <p class="toast" role="status">${esc(message)}</p>
 </main>`;
}

// ---------- 2. Cyclistes ----------
export function playersScreen({btn,roster,colors,rules}){
 const cards=roster.map((p,i)=>`<section class="mc-player" style="--player-color:${colors[i]}" aria-label="Cycliste ${i+1}">
   <div class="mc-player-head"><span class="mc-token" aria-hidden="true">${i+1}</span><span>Cycliste ${i+1}</span></div>
   <label>Nom sur la fiche <input data-roster="${i}" data-field="name" value="${esc(p.name)}" maxlength="40"/></label>
   <p>Le garage vient ensuite : choix du vélo et chargement des sacoches.</p>
  </section>`).join('');
 return `<main class="menu-c mc-page">${backdrop()}${steps('players')}
  <header class="mc-head"><div><p class="mc-kicker">Autour de la table</p><h1>Qui part à l’aventure ?</h1></div>
   <label class="mc-count">Nombre de cyclistes <select id="player-count">${Array.from({length:6},(_,i)=>`<option value="${i+1}" ${roster.length===i+1?'selected':''}>${i+1}</option>`).join('')}</select></label></header>
  <div class="mc-players">${cards}</div>
  <section class="mc-weather" aria-label="Météo de la partie"><div><p class="mc-kicker">Météo de la partie</p><p>Choisis une seule des deux façons de jouer la météo.</p></div>
   <div class="mc-weather-choices" role="group" aria-label="Choix de la météo">
    <button type="button" data-action="weather-cards" aria-pressed="${!rules.weather?.forecast}" class="${!rules.weather?.forecast?'on':''}"><b>Cartes météo</b><small>Les cartes Événement climatiques (pluie, neige, vent…) se jouent entre cyclistes.</small></button>
    <button type="button" data-action="weather-forecast" aria-pressed="${!!rules.weather?.forecast}" class="${rules.weather?.forecast?'on':''}"><b>Météo annoncée</b><small>Chaque soir, le bulletin du lendemain pour 5 régions. Les cartes climatiques sont retirées.</small></button>
   </div></section>
  <section class="mc-weather" aria-label="Événements de la partie"><div><p class="mc-kicker">Événements de la route</p><p>Les cartes à se jouer entre cyclistes, ou des rencontres à vivre chaque soir.</p></div>
   <div class="mc-weather-choices" role="group" aria-label="Choix des événements">
    <button type="button" data-action="events-cards" aria-pressed="${!rules.encounters?.enabled}" class="${!rules.encounters?.enabled?'on':''}"><b>Cartes Événement</b><small>On pioche, on garde, on joue ses cartes et on en donne aux autres.</small></button>
    <button type="button" data-action="events-encounters" aria-pressed="${!!rules.encounters?.enabled}" class="${rules.encounters?.enabled?'on':''}"><b>Rencontres · idéal en solo</b><small>Plus de cartes : chaque soir, une rencontre liée à l’endroit propose un choix.</small></button>
   </div></section>
  <footer class="mc-foot">${btn('← Plateau','modes','mc-ghost')}<span>Règles : ${esc(rules.name)} · ${rules.distance} cases/jour · ${rules.startEnergy} énergie · ${rules.startMoney} pièces · ${btn('Modifier','rules','mc-link')}</span>${btn('Au garage →','start','mc-go')}</footer>
 </main>`;
}

// ---------- 3. Garage : monture + chargement ----------
function bikeFacts(rules,id){
 const b=rules.bikes[id],facts=[...(b.price?[`${b.price} pièces`]:[]),`${Math.min(5,rules.distance+(b.extraDistance||0))} cases/jour`,plural(b.capacity,'place','places')+' de sacoche'];
 if(b.mountainDiscount)facts.push(`montagne ${b.mountainDiscount>0?'−':'+'}${Math.abs(b.mountainDiscount)} énergie`);
 if(b.extraFood)facts.push(`+${b.extraFood} nourriture au départ`);
 return facts;
}
const FLAVOR={gravel:['Léger et rapide','On file, on grimpe… mais chaque objet compte.'],randonneur:['Lourd mais autonome','On porte tout, on dort bien, on tient la distance.']};
export function garageScreen({btn,player,index,total,rules,coinsLeft,descriptions}){
 const bikeIds=Object.keys(rules.bikes),current=player.bike,bike=rules.bikes[current],items=player.items||[];
 const bags=bagsFor(current,bike.capacity),{free,content}=packBags(bags,items,rules.equipment);
 const used=items.reduce((n,id)=>n+(rules.equipment[id]?.space||0),0);
 const kg=Math.round(((current==='randonneur'?17:9)+(current==='randonneur'?6:1.5)+items.reduce((n,id)=>n+(GEAR_KG[id]||1),0))*10)/10;
 const pct=Math.max(0,Math.min(100,(kg-8)/(36-8)*100)),feel=kg<16?'Léger : les montées passent bien':kg<26?'Chargé : rythme de croisière':'Lourd : chaque col se mérite';
 const chips=bags.map(b=>{const names=content[b.id]||[],left=free[b.id];return `<span class="mc-chip ${names.length?'full':''}" style="left:${b.x}%;top:${b.y}%">${esc(b.label)}${names.length?' · '+esc(names.join(', ')):''}${left>0?` · ${plural(left,'place libre','places libres')}`:''}</span>`;}).join('');
 const bikeCards=bikeIds.map(id=>{const b=rules.bikes[id],[tag,line]=FLAVOR[id]||[b.name,''];return `<button class="mc-bike-card ${id===current?'on':''}" data-bike-choice="${esc(id)}" aria-pressed="${id===current}">${bikeSvg(id,null,'mini')}<span class="mc-bike-copy"><strong>${esc(b.name)}</strong><em>${esc(tag)}</em><small>${esc(line)}</small><small class="facts">${bikeFacts(rules,id).map(esc).join(' · ')}</small></span></button>`;}).join('');
 const shop=Object.entries(rules.equipment).map(([id,e])=>{const owned=items.includes(id),tooPricey=e.price>coinsLeft,noRoom=used+e.space>bike.capacity,disabled=!owned&&(tooPricey||noRoom);
  return `<button class="mc-item ${owned?'owned':''}" data-equipment="${id}" aria-pressed="${owned}" ${disabled?'disabled':''}>${icon(GEAR_ICONS[id]||GEAR_ICONS.sacoches)}<span class="mc-item-name">${esc(e.name)}<small>${esc(descriptions[id]||'')}</small></span><span class="mc-item-meta">${plural(e.space,'place','places')} · ${plural(e.price,'pièce','pièces')}</span><span class="mc-item-state">${owned?'Chargé':tooPricey?'Trop cher':noRoom?'Plus de place':''}</span></button>`;}).join('');
 return `<main class="menu-c mc-page mc-garage">${backdrop('dim')}${steps('gear')}
  <header class="mc-head"><div><p class="mc-kicker">Le garage · Cycliste ${index+1}/${total}</p><h1>${esc(player.name)}, choisis ta monture</h1></div>${btn('← Cyclistes','setup','mc-ghost')}</header>
  <div class="mc-garage-grid">
   <div class="mc-bikes" role="group" aria-label="Vélo">${bikeCards}</div>
   <section class="mc-load" aria-label="Le vélo chargé">
    <div class="mc-hud"><div><span>Bourse · vélo compris</span><b>${coinsLeft} / ${rules.startMoney} pièces</b>${rules.budget?.startBonus?`<small>+${rules.budget.startBonus} au départ, puis +${rules.budget.amount} tous les ${rules.budget.every} tours</small>`:''}</div><div><span>Places</span><b>${used} / ${bike.capacity}</b></div><div class="mc-weight"><span>Poids chargé · ${String(kg).replace('.',',')} kg</span><i><em style="left:${pct}%"></em></i><small>${feel}</small></div></div>
    <div class="mc-stage">${bikeSvg(current,content)}${chips}</div>
   </section>
   <section class="mc-shop" aria-label="Matériel"><h2>L’étal du marchand</h2>${shop}<p>Clique un objet : il va dans la première sacoche où il tient. Tu pourras racheter du matériel dans les villes.</p></section>
  </div>
  <footer class="mc-foot">${btn('← Cyclistes','setup','mc-ghost')}<span></span>${btn(index<total-1?'Cycliste suivant →':'Choisir les voyages →','equipment-next','mc-go')}</footer>
 </main>`;
}

// ---------- 4. Voyages ----------
export function voyagesScreen({player,index,total,drawn,lengths,artwork,message=''}){
 return `<main class="menu-c mc-page">${backdrop()}${steps('goal')}
  <header class="mc-head"><div><p class="mc-kicker">${esc(player.name)} · ${index+1}/${total} · 3 cartes tirées</p><h1>Choisis ton voyage</h1></div></header>
  <div class="mc-voyages">${drawn.map((v,i)=>`<article class="mc-voyage ${i===1?'feature':''}" style="--voyage-color:${v.color}">
   <div class="mc-voyage-art">${artwork(v)}</div>
   <div class="mc-voyage-copy"><p class="mc-route-line">${esc(v.from)} → ${esc(v.to)}</p><h2>${esc(v.title)}</h2>
    <ul>${v.rows.map(r=>`<li>${r.target} ${esc(r.label.toLowerCase())}</li>`).join('')}</ul>
    <p class="mc-len">${lengths[v.id]?`${lengths[v.id]} cases de route`:''}</p>
    <button data-voyage="${v.id}">Prendre ce voyage →</button></div>
  </article>`).join('')}</div>
  <p class="toast" role="alert">${esc(message)}</p>
 </main>`;
}

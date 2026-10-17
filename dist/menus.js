// Menus « carte d'aventure » (style C) : écran titre vivant, plateau, cyclistes, garage (monture + chargement), voyages.
// Ce module ne fait que produire du HTML : les règles, la sauvegarde et les clics restent dans app.js.
// Les attributs data-action, data-map-choice, data-mode, data-equipment, data-voyage… sont ceux qu'app.js écoute déjà.
import {MAP_CELLS} from './assets/europe/board-data.js';
import {LEVELS,LEVEL_ORDER} from './immersion.js';

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
 const list=[['map','Plateau'],['kind','Jeu'],['players','Cyclistes'],['gear','Garage'],['goal','Voyage']],at=list.findIndex(s=>s[0]===active);
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
    ${btn('🎓 Apprendre à jouer','tuto-start','mc-sign tuto-sign')}
    ${hasSave?btn(`Reprendre${saveLine?` <small>${esc(saveLine)}</small>`:''}`,'continue','mc-sign'):''}
    ${btn('Jouer en ligne','online','mc-sign')}
    ${btn('Éditeur','editor-hub','mc-sign small')}
   </nav>
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
    ${maps.length?maps.map(map=>`<div class="mc-saved"><div><strong>${esc(map.name)}</strong><small>${Object.keys(map.cells).length} case(s) modifiée(s)</small></div><button data-map-choice="${esc(map.id)}">Jouer →</button></div>`).join(''):`<div class="mc-empty"><strong>Aucune carte perso pour l’instant</strong><p>Pour dessiner ta propre Europe, passe par le bouton « Éditeur » de l’accueil.</p></div>`}
   </aside>
  </div>
  <p class="toast" role="status">${esc(message)}</p>
 </main>`;
}

// ---------- 2. Cyclistes ----------
// Fin de partie : Standard (50 points, 3 voyages ou 40 jours) ou personnalisée. 0 = condition non utilisée.
export function victoryBlock(rules,btn){const v=rules.victory||{},multi=v.mode==='multi',std=multi&&v.points===35&&v.voyages===3&&v.days===40;
 const num=(k,label)=>`<label class="mc-vic-field"><input type="number" min="0" max="999" step="1" data-victory="${k}" value="${multi?Number(v[k]||0):''}"/> ${label}</label>`;
 return `<section class="mc-weather mc-victory" aria-label="Fin de partie"><div><p class="mc-kicker">Fin de partie</p><p>La partie s’arrête dès que l’une de ces conditions est atteinte (0 = pas utilisée). Après un voyage réussi, on en tire un nouveau. Le premier à finir ses voyages gagne +5 points ; à la fin, le plus de points gagne.</p></div>
  <div class="mc-vic-row">${num('points','points d’aventure')}${num('voyages','voyages réussis')}${num('days','jours (le plus de points gagne)')}
  <button type="button" data-action="victory-standard" class="${std?'on':''}" aria-pressed="${std}"><b>Standard</b><small>35 points · 3 voyages · 40 jours</small></button></div></section>`;}
// Départ simplifié (17 octobre, planche « Qui part à l'aventure — simplifié ») : écran 1 = type de jeu, écran 2 = cyclistes puis paramètres.
const KIND_ART={
 orig:`<svg viewBox="0 0 300 110" aria-hidden="true"><rect width="300" height="110" fill="#16353a"/><g stroke="#0b1a1c" stroke-width="2"><rect x="92" y="24" width="50" height="70" rx="6" fill="#f6e7c1" transform="rotate(-12 117 59)"/><rect x="125" y="18" width="50" height="70" rx="6" fill="#f6e7c1"/><rect x="158" y="24" width="50" height="70" rx="6" fill="#f2a541" transform="rotate(12 183 59)"/></g><circle cx="150" cy="46" r="10" fill="none" stroke="#c8483a" stroke-width="3"/><path d="M140 68h20" stroke="#0b1a1c" stroke-width="3"/></svg>`,
 imm:`<svg viewBox="0 0 300 110" aria-hidden="true"><rect width="300" height="110" fill="#1d3b3a"/><path d="M0 86 L60 50 L95 72 L150 26 L205 74 L240 54 L300 84 V110 H0Z" fill="#2c544a"/><path d="M150 26 L162 40 L138 40Z" fill="#f6e7c1"/><path d="M20 100 Q100 80 160 92 T300 88" stroke="#f2a541" stroke-width="3" stroke-dasharray="6 6" fill="none"/><circle cx="240" cy="22" r="10" fill="#f2a541"/></svg>`,
 coop:`<svg viewBox="0 0 300 110" aria-hidden="true"><rect width="300" height="110" fill="#17303f"/><path d="M0 94 Q150 64 300 94" stroke="#f2a541" stroke-width="3" stroke-dasharray="6 6" fill="none"/><g stroke="#0b1a1c" stroke-width="2"><circle cx="115" cy="72" r="13" fill="#f6e7c1"/><circle cx="150" cy="66" r="13" fill="#f2a541"/><circle cx="185" cy="72" r="13" fill="#7fa9c9"/></g><path d="M60 28 L80 16 L100 28 M200 28 l20-12 20 12" stroke="#c9bd9f" stroke-width="3" fill="none"/></svg>`};
export function kindChoices(rules){const imm=Boolean(rules.immersion?.enabled);
 const card=(on,action,art,who,title,text,soon=false)=>`<button type="button" class="mc-kind ${on?'on':''} ${soon?'soon':''}" ${action?`data-action="${action}"`:''} aria-pressed="${on}" ${soon?'disabled':''}>${art}<span class="mc-kind-text"><em>${who}</em><b>${title}</b><span>${text}</span>${soon?'<i class="mc-soon">Bientôt</i>':''}</span></button>`;
 return `<div class="mc-kinds" role="group" aria-label="Type de jeu">${card(!imm,'mode-original',KIND_ART.orig,'À plusieurs','Original','Le jeu de société : on pioche, on garde ses cartes, on en joue contre les autres. Le plus malin gagne.')}${card(imm,'mode-immersion',KIND_ART.imm,'Idéal en solo','Immersion','Le voyage comme si tu y étais : plus de cartes, la route, la météo et la fatigue décident. Rencontres et nuits à vivre.')}${card(false,'',KIND_ART.coop,'En équipe','Coopératif','On part ensemble contre la route : on partage repas et matériel, on gagne ou on perd tous ensemble.',true)}</div>`;}
export function kindScreen({btn,rules}){
 return `<main class="menu-c mc-page mc-start">${backdrop()}${steps('kind')}
  <header class="mc-head"><div><p class="mc-kicker">Autour de la table</p><h1>À quoi veux-tu jouer ?</h1><p class="mc-lead">Tu pourras changer les détails à l’écran suivant.</p></div></header>
  ${kindChoices(rules)}
  <footer class="mc-foot">${btn('← Plateau','modes','mc-ghost')}<span></span>${btn('Continuer →','kind-next','mc-go')}</footer>
 </main>`;}
const COUNT_WORD=['','Seul','À deux','À trois','À quatre','À cinq','À six'];
export function countPicker(n,list,prefix){return `<div class="mc-count-pick" role="group" aria-label="Nombre de cyclistes">${list.map(k=>`<button type="button" data-action="${prefix}${k}" aria-pressed="${k===n}" class="${k===n?'on':''}"><span>${k}</span>${COUNT_WORD[k]}</button>`).join('')}</div>`;}
export function paramsBlock(rules){
 const imm=Boolean(rules.immersion?.enabled),forecast=Boolean(rules.weather?.forecast),enc=Boolean(rules.encounters?.enabled),v=rules.victory||{},multi=v.mode==='multi',std=multi&&v.points===35&&v.voyages===3&&v.days===40;
 const opt=(on,action,title,small)=>`<button type="button" data-action="${action}" aria-pressed="${on}" class="${on?'on':''}"><b>${title}</b><small>${small}</small></button>`;
 const row=(name,hint,body)=>`<div class="mc-param"><div class="mc-param-name"><b>${name}</b><small>${hint}</small></div><div class="mc-param-body">${body}</div></div>`;
 const num=(k,label)=>`<label class="mc-end-field"><input type="number" min="0" max="999" step="1" data-victory="${k}" value="${multi?Number(v[k]||0):''}"/> ${label}</label>`;
 const rows=imm?[row('Le voyage','Comment la route se vit.','<p class="mc-param-note">Météo annoncée par zones, pas de cartes : ce qui arrive dépend du terrain, de la météo et de ta fatigue.</p>')]
  :[row('La météo','Comment le temps arrive sur la route.',opt(forecast,'weather-forecast','Annoncée','Le bulletin du lendemain chaque soir, par région.')+opt(!forecast,'weather-cards','En cartes','Pluie, neige, vent : des cartes qu’on se joue entre cyclistes.')),
    row('Les imprévus','Ce qui arrive en chemin.',opt(!enc,'events-cards','Cartes Événement','On pioche, on garde, on joue ses cartes.')+opt(enc,'events-encounters','Rencontres','Chaque soir, une rencontre et un choix.'))];
 rows.push(row('La fin de partie','La partie s’arrête dès qu’un cycliste atteint l’un de ces buts (0 = pas utilisé). Le premier à finir ses voyages gagne +5 points ; le plus de points gagne.',`<div class="mc-ends">${num('points','points')}${num('voyages','voyages')}${num('days','jours')}${std?'':'<button type="button" data-action="victory-standard" class="mc-link">Revenir à 35 · 3 · 40</button>'}</div>`));
 return `<div class="mc-params">${rows.join('')}</div>`;}
export function playersScreen({btn,roster,colors,rules}){
 const n=roster.length,imm=Boolean(rules.immersion?.enabled);
 const names=roster.map((p,i)=>`<label class="mc-name-field" style="--player-color:${colors[i]}"><span><i class="mc-token" aria-hidden="true">${i+1}</i>Cycliste ${i+1}</span><input data-roster="${i}" data-field="name" value="${esc(p.name)}" maxlength="40"/></label>`).join('');
 return `<main class="menu-c mc-page mc-start">${backdrop()}${steps('players')}
  <header class="mc-head"><div><p class="mc-kicker">Type de jeu : ${imm?'Immersion':'Original'} · ${btn('changer','kind','mc-link')}</p><h1>Qui part ?</h1></div></header>
  <section class="mc-block" aria-label="Cyclistes"><p class="mc-block-title">1 · Combien de cyclistes ?</p>${countPicker(n,[1,2,3,4,5,6],'count-')}<div class="mc-names">${names}</div></section>
  <section class="mc-block" aria-label="Paramètres"><p class="mc-block-title">2 · Les paramètres de la partie</p><p class="mc-block-hint">Déjà réglés pour une première partie. Touche un paramètre pour le changer.</p>${paramsBlock(rules)}</section>
  ${imm&&n===1?levelPicker(rules.immersion.level):''}
  <footer class="mc-foot">${btn('← Type de jeu','kind','mc-ghost')}<span>${btn('Règles avancées','rules','mc-link')}</span>${btn('Au garage →','start','mc-go')}</footer>
 </main>`;
}

// ---------- 3. Garage : monture + chargement ----------
function bikeFacts(rules,id){
 const b=rules.bikes[id],facts=[...(b.price?[`${b.price} pièces`]:[]),`${Math.min(5,rules.distance+(b.extraDistance||0))} cases/jour`,plural(b.capacity,'place','places')+' de sacoche',...(b.maxFood?[plural(b.maxFood,'repas','repas')+' au maximum']:[])];
 if(b.mountainDiscount)facts.push(`montagne ${b.mountainDiscount>0?'−':'+'}${Math.abs(b.mountainDiscount)} énergie`);
 if(b.extraFood)facts.push(`+${b.extraFood} nourriture au départ`);
 return facts;
}
const FLAVOR={gravel:['Léger et rapide','On file, on grimpe… mais chaque objet compte.'],randonneur:['Lourd mais autonome','On porte tout, on dort bien, on tient la distance.']};
export function garageScreen({btn,player,index,total,rules,coinsLeft,descriptions}){
 const bikeIds=Object.keys(rules.bikes),current=player.bike,bike=rules.bikes[current],items=player.items||[];
 const bags=bagsFor(current,(bike.capacity+items.reduce((n,k)=>n+(rules.equipment[k]?.capacityBonus||0),0))),{free,content}=packBags(bags,items,rules.equipment);
 const used=items.reduce((n,id)=>n+(rules.equipment[id]?.space||0),0);
 const kg=Math.round(((current==='randonneur'?17:9)+(current==='randonneur'?6:1.5)+items.reduce((n,id)=>n+(GEAR_KG[id]||1),0))*10)/10;
 const pct=Math.max(0,Math.min(100,(kg-8)/(36-8)*100)),feel=kg<16?'Léger : les montées passent bien':kg<26?'Chargé : rythme de croisière':'Lourd : chaque col se mérite';
 const chips=bags.map(b=>{const names=content[b.id]||[],left=free[b.id];return `<span class="mc-chip ${names.length?'full':''}" style="left:${b.x}%;top:${b.y}%">${esc(b.label)}${names.length?' · '+esc(names.join(', ')):''}${left>0?` · ${plural(left,'place libre','places libres')}`:''}</span>`;}).join('');
 const bikeCards=bikeIds.map(id=>{const b=rules.bikes[id],[tag,line]=FLAVOR[id]||[b.name,''];return `<button class="mc-bike-card ${id===current?'on':''}" data-bike-choice="${esc(id)}" aria-pressed="${id===current}">${bikeSvg(id,null,'mini')}<span class="mc-bike-copy"><strong>${esc(b.name)}</strong><em>${esc(tag)}</em><small>${esc(line)}</small><small class="facts">${bikeFacts(rules,id).map(esc).join(' · ')}</small></span></button>`;}).join('');
 const shop=Object.entries(rules.equipment).map(([id,e])=>{const owned=items.includes(id),tooPricey=e.price>coinsLeft,noRoom=used+e.space>(bike.capacity+items.reduce((n,k)=>n+(rules.equipment[k]?.capacityBonus||0),0))+(e.capacityBonus||0),disabled=!owned&&(tooPricey||noRoom);
  return `<button class="mc-item ${owned?'owned':''}" data-equipment="${id}" aria-pressed="${owned}" ${disabled?'disabled':''}>${icon(GEAR_ICONS[id]||GEAR_ICONS.sacoches)}<span class="mc-item-name">${esc(e.name)}<small>${esc(descriptions[id]||'')}</small></span><span class="mc-item-meta">${plural(e.space,'place','places')} · ${plural(e.price,'pièce','pièces')}</span><span class="mc-item-state">${owned?'Chargé':tooPricey?'Trop cher':noRoom?'Plus de place':''}</span></button>`;}).join('');
 return `<main class="menu-c mc-page mc-garage">${backdrop('dim')}${steps('gear')}
  <header class="mc-head"><div><p class="mc-kicker">Le garage · Cycliste ${index+1}/${total}</p><h1>${esc(player.name)}, choisis ta monture</h1></div>${btn('← Cyclistes','setup','mc-ghost')}</header>
  <div class="mc-garage-grid">
   <div class="mc-bikes" role="group" aria-label="Vélo">${bikeCards}</div>
   <section class="mc-load" aria-label="Le vélo chargé">
    <div class="mc-hud"><div><span>Bourse · vélo compris</span><b>${coinsLeft} / ${rules.startMoney} pièces</b>${rules.budget?.startBonus?`<small>+${rules.budget.startBonus} au départ, puis +${rules.budget.amount} tous les ${rules.budget.every} tours</small>`:''}</div><div><span>Places</span><b>${used} / ${(bike.capacity+items.reduce((n,k)=>n+(rules.equipment[k]?.capacityBonus||0),0))}</b></div><div class="mc-weight"><span>Poids chargé · ${String(kg).replace('.',',')} kg</span><i><em style="left:${pct}%"></em></i><small>${feel}</small></div></div>
    <div class="mc-stage">${bikeSvg(current,content)}${chips}</div>
   </section>
   <section class="mc-shop" aria-label="Matériel"><h2>L’étal du marchand</h2>${shop}<p>Clique un objet : il va dans la première sacoche où il tient. Tu pourras racheter du matériel dans les villes.</p></section>
  </div>
  <footer class="mc-foot">${btn('← Cyclistes','setup','mc-ghost')}<span></span>${btn(index<total-1?'Cycliste suivant →':'Choisir les voyages →','equipment-next','mc-go')}</footer>
 </main>`;
}

// ---------- 4. Voyages ----------
export function voyagesScreen({player,index,total,drawn,lengths,artwork,card,message=''}){
 return `<main class="menu-c mc-page">${backdrop()}${steps('goal')}
  <header class="mc-head"><div><p class="mc-kicker">${esc(player.name)} · ${index+1}/${total} · 3 cartes tirées</p><h1>Choisis ton voyage</h1></div></header>
  <div class="mc-voyages mc-vcards">${drawn.map((v,i)=>`<div class="mc-vcard ${i===1?'feature':''}">${card(v)}
    <button data-voyage="${v.id}">Prendre ce voyage →</button></div>`).join('')}</div>
  <p class="toast" role="alert">${esc(message)}</p>
 </main>`;
}

// ---------- Partie en ligne : créer (mettre sa partie en ligne), rejoindre avec un code, choisir son cycliste ----------
// net : {view:'home'|'seats'|'created', code, players:[{id,name,taken,mine}], busy, error}
// local : la partie préparée sur cet appareil (ou null) ; current : la partie en ligne en cours sur cet appareil (ou null).
export function onlineScreen({btn,net={},local=null,current=null,message='',rules={},lobbyBack=null}){
 const card=(content,cls='')=>`<section class="mc-online-card ${cls}">${content}</section>`;
 const head=`<header class="mc-head"><div><p class="mc-kicker">Partie en ligne</p><h1>Jouer à deux, chacun chez soi</h1><p class="mc-lead">La partie est gardée en ligne : chacun joue son tour quand il veut, sur son ordinateur ou son téléphone. Ta main de cartes reste sur ton écran.</p></div></header>`;
 let body='';
 const toggle=(on,action,title,small)=>`<button type="button" data-action="${action}" aria-pressed="${on}" class="${on?'on':''}"><b>${title}</b><small>${small}</small></button>`;
 if(net.view==='lobby'){const g=net.game||{},seats=net.seats||[],me=seats.find(s=>s.mine),all=seats.length&&seats.every(s=>s.state==='ready');
  body=card(`<p class="mc-kicker">Salle d’attente</p><h2>Donne ce code à tes amis</h2><b class="mc-online-code">${esc(net.code)}</b>
   <div class="mc-online-row">${btn('Copier le code','net-copy','mc-ghost')}${btn('Copier le lien','net-copy-link','mc-ghost')}</div>
   <ul class="mc-online-seats mc-lobby-seats">${seats.map(s=>`<li class="${s.state} ${s.mine?'mine':''}"><span class="mc-lobby-num">${s.num}</span><b>${s.state==='free'?'En attente d’un ami…':esc(s.name)+(s.mine?' (toi)':'')}${s.detail?`<small>${esc(s.detail)}</small>`:''}</b><span>${s.state==='ready'?'prêt':s.state==='prep'?'prépare son vélo…':'place libre'}</span></li>`).join('')}</ul>
   <p class="mc-lobby-rules">${esc(net.rulesLine||'')}</p>
   <p>Chacun, sur son appareil : ouvre le jeu, « Jouer en ligne », tape le code, puis passe au garage (vélo, sacoches) et choisit son voyage.</p>
   <div class="mc-online-row">${me&&me.state!=='ready'?btn('Préparer mon cycliste →','net-lobby-prep','mc-go'):me?btn('Modifier mon cycliste','net-lobby-prep','mc-ghost'):''}
   ${net.host?btn(net.starting?'⏳ Lancement… (envoi de la carte)':all?'Lancer la partie →':'Lancer quand tout le monde est prêt','net-lobby-start','mc-go',!all||Boolean(net.starting)):'<span class="mc-lobby-wait">L’hôte lance la partie quand tout le monde est prêt.</span>'}</div>
   ${btn(net.host?'Annuler la partie':'Quitter la salle d’attente','net-lobby-leave','mc-ghost')}`,'wide');}
 else if(net.view==='created')body=card(`<p class="mc-kicker">Donne ce code à ton ami</p><b class="mc-online-code">${esc(net.code)}</b>
   <div class="mc-online-row">${btn('Copier le code','net-copy','mc-ghost')}${btn('Copier le lien','net-copy-link','mc-ghost')}</div>
   <ul class="mc-online-seats">${(net.players||[]).map(p=>`<li class="${p.taken||p.mine?'on':''}"><b>${esc(p.name)}</b><span>${p.mine?'toi, sur cet appareil':p.taken?'connecté':'en attente…'}</span></li>`).join('')}</ul>
   <p>Ton ami ouvre le jeu, choisit « Jouer en ligne », tape le code puis choisit son cycliste. Tu peux commencer à jouer : il te rejoindra.</p>
   ${btn('Aller à la partie →','net-play','mc-go')}`,'wide');
 else if(net.view==='seats')body=card(`<p class="mc-kicker">Partie ${esc(net.code)}</p><h2>Quel cycliste es-tu ?</h2>
   <div class="mc-online-pick">${(net.players||[]).map(p=>`<button type="button" data-action="net-seat-${esc(p.id)}" ${p.taken?'disabled':''}><b>${esc(p.name)}</b><small>${p.mine?'déjà sur cet appareil':p.taken?'déjà pris':'libre'}</small></button>`).join('')}</div>
   ${btn('← Retour','net-back','mc-ghost')}`,'wide');
 else if(net.view==='create1')body=`<section class="mc-online-flow"><h2>À quoi voulez-vous jouer ?</h2>${kindChoices(rules)}<div class="mc-online-row">${btn('← Retour','net-back','mc-ghost')}${btn('Continuer →','net-create-next','mc-go')}</div></section>`;
 else if(net.view==='create2'){const n=net.count||2,imm=Boolean(rules.immersion?.enabled);
  body=`<section class="mc-online-flow"><p class="mc-kicker">Type de jeu : ${imm?'Immersion':'Original'} · ${btn('changer','net-create-open','mc-link')}</p><h2>Qui part ?</h2>
   <div class="mc-block"><p class="mc-block-title">1 · Combien de cyclistes ?</p>${countPicker(n,[2,3,4,5,6],'net-count-')}<input type="hidden" id="net-count" value="${n}"/>
   <label class="mc-name-field"><span>Ton nom</span><input id="net-name" maxlength="40" autocomplete="off" value="${esc(net.name||'')}" placeholder="Ton prénom"/></label></div>
   <div class="mc-block"><p class="mc-block-title">2 · Les paramètres de la partie</p><p class="mc-block-hint">Déjà réglés pour une première partie. Touche un paramètre pour le changer.</p>${paramsBlock(rules)}</div>
   <div class="mc-online-row">${btn('← Type de jeu','net-create-open','mc-ghost')}${btn('Créer la partie et avoir le code →','net-lobby-create','mc-go')}</div></section>`;}
 else{
  const forecast=Boolean(rules.weather?.forecast),enc=Boolean(rules.encounters?.enabled),imm=Boolean(rules.immersion?.enabled);
  const create=card(`<p class="mc-kicker">Créer</p><h2>Créer une partie</h2><p>Tu choisis le type de jeu et les paramètres, puis tu envoies le code à tes amis. Chacun prépare ensuite son vélo et son voyage sur son appareil.</p>
    ${btn('Créer une partie →','net-create-open','mc-go')}`);
  const upload=local?card(`<p class="mc-kicker">Ou bien</p><h2>Mettre ma partie en cours en ligne</h2><p>Partie préparée sur cet appareil : ${esc(local.title)}. Choisis le cycliste que tu joues ici ; les autres se joueront sur l’appareil de tes amis.</p>
    <div class="mc-online-pick">${local.players.map(p=>`<button type="button" data-action="net-create-${esc(p.id)}"><b>Je suis ${esc(p.name)}</b><small>${esc(p.detail)}</small></button>`).join('')}</div>`)
   :'';
  const join=card(`<p class="mc-kicker">Rejoindre</p><h2>J’ai reçu un code</h2><label class="mc-online-label">Code de la partie <input id="net-code" inputmode="numeric" autocomplete="off" placeholder="VELO-1234" value="${esc(net.code||'')}"/></label><label class="mc-online-label">Ton nom <input id="net-join-name" maxlength="40" autocomplete="off" value="${esc(net.name||'')}" placeholder="Ton prénom"/></label>${btn('Rejoindre la partie','net-peek','mc-go')}`);
  const now=current?card(`<p class="mc-kicker">Sur cet appareil</p><h2>Partie ${esc(current.code)}</h2><p>Tu joues ${esc(current.name)}.</p><div class="mc-online-row">${btn('Reprendre la partie →','net-play','mc-go')}${btn('Quitter cette partie en ligne','net-leave','mc-ghost')}</div>`,'wide'):'';
  const back=lobbyBack?card(`<p class="mc-kicker">Salle d’attente</p><h2>Partie ${esc(lobbyBack)}</h2><p>Une partie en préparation t’attend.</p>${btn('Retour à la salle d’attente →','net-lobby-back','mc-go')}`,'wide'):'';
  body=now+back+`<div class="mc-online-grid">${create}${join}</div>`+(upload?`<div class="mc-online-grid mc-online-upload">${upload}</div>`:'');
 }
 return `<main class="menu-c mc-page mc-online">${backdrop()}${head}${net.busy?'<p class="mc-online-busy" role="status">Connexion…</p>':''}${net.error?`<p class="mc-online-error" role="alert">${esc(net.error)}</p>`:''}${body}
  <footer class="mc-foot">${btn('← Accueil','home','mc-ghost')}</footer><p class="toast" role="status">${esc(message)}</p></main>`;
}

// ---------- Mes parties : plusieurs sauvegardes ----------
export function partiesScreen({btn,list=[],filter='all',currentId='',message='',miniMap=()=>'',renaming=''}){
 const when=t=>{const d=new Date(t),now=new Date(),day=86400000,h=d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  if(d.toDateString()===now.toDateString())return 'Joué aujourd’hui à '+h;if(d.toDateString()===new Date(now-day).toDateString())return 'Hier à '+h;return d.toLocaleDateString('fr-FR',{day:'numeric',month:'long'});};
 const counts={all:list.length,run:list.filter(r=>!r.summary?.done).length,done:list.filter(r=>r.summary?.done).length};
 const shown=list.filter(r=>filter==='run'?!r.summary?.done:filter==='done'?r.summary?.done:true);
 const tab=(id,label)=>`<button type="button" data-action="parties-filter-${id}" class="${filter===id?'on':''}" aria-pressed="${filter===id}">${label} (${counts[id]})</button>`;
 const card=r=>{const s=r.summary||{},ps=s.players||[],badge=(t,cls='')=>`<span class="pt-badge ${cls}">${t}</span>`;
  const badges=[s.online?badge('En ligne','online'):'',badge(ps.length>1?ps.length+' joueurs':'Solo','dark'),s.immersion?badge('Immersion','soft'):s.encounters?badge('Rencontres','soft'):'',s.forecast?badge('Météo annoncée','soft'):'',s.done?badge('Terminée 🏆','done'):badge('En cours','run')].join('');
  const voyages=[...new Set(ps.map(p=>p.from&&p.to?`${p.from} → ${p.to}`:''))].filter(Boolean).join(' · ');
  const name=r.id===renaming?`<label class="pt-rename"><input id="party-name" maxlength="60" value="${esc(r.name)}"/>${btn('OK','party-rename-ok-'+r.id,'pt-ok')}</label>`:`<h2>${esc(r.name)}</h2>`;
  return `<article class="pt-card ${r.id===currentId?'current':''}"><div class="pt-map">${miniMap(ps[0]?.voyage)}</div>
   <div class="pt-main"><div class="pt-badges">${badges}</div>${name}<p>${esc(voyages)}${s.online?` · code ${esc(s.online.code)}`:''}</p>
    <div class="pt-players">${ps.map(p=>`<span><i style="background:${esc(p.color)}"></i>${esc(p.name)} · ${p.points} pts${p.voyagesDone?` · ${p.voyagesDone} voyage${p.voyagesDone>1?'s':''}`:''}</span>`).join('')}</div></div>
   <div class="pt-side"><b>Jour ${s.round||1}</b><small>${when(r.updatedAt)}</small>${btn(s.done?'Revoir →':'Reprendre →','party-open-'+r.id,'pt-go')}
    <div class="pt-tools">${btn('✏️ Renommer','party-rename-'+r.id,'pt-tool')}${btn('⬇️ Fichier','party-export-'+r.id,'pt-tool')}${btn('🗑','party-delete-'+r.id,'pt-tool')}</div></div></article>`;};
 return `<main class="menu-c mc-page mc-parties">${backdrop()}
  <header class="mc-head"><div><p class="mc-kicker">Mes parties</p><h1>Reprendre un voyage</h1></div></header>
  <div class="pt-layout"><section class="pt-list"><div class="pt-tabs">${tab('all','Toutes')}${tab('run','En cours')}${tab('done','Terminées')}</div>
   ${shown.length?shown.map(card).join(''):`<p class="pt-empty">${list.length?'Aucune partie ici.':'Aucune partie enregistrée pour l’instant : commence un nouveau voyage !'}</p>`}</section>
   <aside class="pt-aside"><div class="pt-new"><h2>Nouvelle partie</h2><p>Elle s’ajoute à la liste : tes autres parties restent enregistrées.</p>${btn('Nouveau voyage','new-game','pt-new-btn')}</div>
    <div class="pt-help"><b>Comment ça marche</b><span>• Chaque partie s’enregistre <b>toute seule</b>, dans sa propre place.</span><span>• La dernière partie jouée est en haut, encadrée d’orange.</span><span>• Jusqu’à 20 parties sur cet appareil. « ⬇️ Fichier » pour en garder une ailleurs ou l’envoyer.</span><span>• Les parties en ligne apparaissent aussi : on peut aussi les reprendre sur un autre appareil avec leur code.</span></div>
    <label class="pt-import">⬆️ Importer une partie (fichier) <input id="import-party" type="file" accept="application/json,.json"/></label></aside></div>
  <footer class="mc-foot">${btn('← Accueil','home','mc-ghost')}</footer><p class="toast" role="status">${esc(message)}</p></main>`;
}

// ---------- Éditeur : le seul endroit pour créer ou modifier (cartes du plateau, cartes Événement) ----------
export function editorHubScreen({btn,maps=[],message=''}){
 return `<main class="menu-c mc-page">${backdrop()}
  <header class="mc-head"><div><p class="mc-kicker">Atelier</p><h1>Éditeur</h1><p class="mc-lead">Dessine tes plateaux et modifie les cartes Événement. Pour jouer, reviens à l’accueil.</p></div>${btn('← Accueil','home','mc-ghost')}</header>
  <div class="mc-editor">
   <section class="mc-editor-card"><p class="mc-kicker">Plateau</p><h2>Atelier de carte</h2><p>Dessine ta propre Europe : déplace les montagnes, ouvre un col, ajoute un port.</p>${btn('Créer une nouvelle carte','editor-new','mc-go')}</section>
   <section class="mc-editor-card"><p class="mc-kicker">Plateau</p><h2>Mes cartes</h2>
    ${maps.length?`<div class="mc-editor-maps">${maps.map(map=>`<div class="mc-saved"><div><strong>${esc(map.name)}</strong><small>${Object.keys(map.cells).length} case(s) modifiée(s)</small></div><button class="mc-ghost" data-edit-map="${esc(map.id)}">Modifier</button></div>`).join('')}</div>`:`<div class="mc-empty"><strong>Aucune carte pour l’instant</strong><p>Crée-en une avec l’atelier, ou importe un fichier.</p></div>`}
    <label class="mc-import">Importer une carte (.json) <input id="import-map" type="file" accept="application/json,.json"/></label></section>
   <section class="mc-editor-card"><p class="mc-kicker">Événements</p><h2>Cartes Événement</h2><p>Modifie les 40 cartes officielles ou crée tes propres cartes pour les prochaines parties.</p>${btn('Ouvrir l’éditeur de cartes','card-editor-open','mc-go')}</section>
  </div>
  <p class="toast" role="status">${esc(message)}</p>
 </main>`;
}

// Mode Immersion en solo : choix du niveau (planche « Difficulté Immersion »).
const LEVEL_TEXT={balade:['Pour découvrir l’Immersion sans stress.','Plus d’énergie et de pièces','Moins de galères, paris plus faciles','On t’ouvre volontiers la porte','50 jours'],
 voyage:['Le jeu tel qu’il est : belles surprises et galères.','Départ normal','Galères selon la fatigue','« Demander » : refus 1 sur 3','40 jours'],
 aventure:['La route ne fait pas de cadeau.','Moins d’énergie et de pièces','Plus de galères, paris plus durs','1 pièce = 1 repas, plus d’imprévus','35 jours'],
 expedition:['Pour les grands voyageurs.','Départ léger, 1 pièce = 1 repas','Un repas rend moitié moins','Chances cachées, météo du jour seulement','30 jours']};
function levelPicker(cur='voyage'){if(!LEVELS[cur])cur='voyage';
 return `<section class="mc-weather mc-level" aria-label="Niveau de difficulté"><div><p class="mc-kicker">Niveau · solo</p><p>Quel voyage veux-tu vivre ? Les règles restent les mêmes, seuls les réglages changent.</p></div>
 <div class="mc-level-cards" role="group" aria-label="Choix du niveau">${LEVEL_ORDER.map((id,i)=>{const lv=LEVELS[id],t=LEVEL_TEXT[id];return `<button type="button" data-action="level-${id}" aria-pressed="${id===cur}" class="mc-lvl lvl-${id}${id===cur?' on':''}"><span class="mc-lvl-top"><span class="mc-lvl-ico" aria-hidden="true">${lv.icon}</span><span><small>${lv.kind}</small><b>${lv.name}</b></span></span><span class="mc-lvl-pips" aria-hidden="true">${[0,1,2,3].map(k=>`<i class="${k<=i?'on':''}"></i>`).join('')}</span><em>${t[0]}</em><ul>${t.slice(1).map(x=>`<li>${x}</li>`).join('')}</ul><span class="mc-lvl-medal">médaille ${lv.medal}</span></button>`;}).join('')}</div></section>`;}

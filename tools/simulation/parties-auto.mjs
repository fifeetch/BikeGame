// Parties automatiques : des cyclistes « robots » jouent des parties entières (1, 2 ou 3 joueurs) avec le vrai moteur,
// et on vérifie à chaque action que rien d'anormal ne se produit.
// Usage (depuis la racine du dépôt) : node tools/simulation/parties-auto.mjs [nombre de parties par configuration]
// Le rapport (erreurs + statistiques) s'affiche et s'écrit dans tools/simulation/rapport.json.
import {writeFileSync} from 'node:fs';
import * as S from '../../dist/simulator.js';
import * as C from '../../dist/event-card-engine.js';
import {CLASSIC,energyCap} from '../../dist/rules.js';
import {voyages,progress} from '../../dist/voyages.js';

const GAMES=Number(process.argv[2]||20),MAX_ROUNDS=150;
// Options : FORECAST=1 (météo annoncée au lieu des cartes météo) ; RENCONTRES=1 (rencontres au lieu des cartes Événement) ; SAVE=fichier.json STOP_ROUND=8 (arrête la 1re partie au jour 8 et l'enregistre, pour la tester dans le navigateur).
const RULES=(()=>{const r=JSON.parse(JSON.stringify(CLASSIC));if(process.env.FORECAST==='1')r.weather.forecast=true;if(process.env.RENCONTRES==='1')r.encounters.enabled=true;if(process.env.IMMERSION==='1')r.immersion.enabled=true;return r;})();
const LOADOUTS=[
 {bike:'gravel',items:['tente','gps']},          // 5+2+3 = 10 pièces
 {bike:'randonneur',items:['tente','kit','rechaud']},// sans GPS
 {bike:'gravel',items:['tente','kit','rechaud']},   // sans GPS
 {bike:'randonneur',items:['tente','gps','kit']}];
const problems=[],seen=new Set();
function problem(kind,detail,ctx){const key=kind+'|'+detail;const entry=seen.has(key)?null:{kind,detail,...ctx};seen.add(key);if(entry)problems.push(entry);problems.count=(problems.count||0)+1;}
const rng=seed=>{let s=seed>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};

// ---------- Vérifications après chaque action ----------
function check(m,where,ctx){
 for(const p of m.players){
  for(const k of ['energy','food','money','points'])if(!Number.isFinite(p[k])||p[k]<0)problem('valeur négative',`${k} = ${p[k]}`,{...ctx,where,player:p.name});
  if(p.energy>energyCap(m,p))problem('énergie au-dessus du maximum',`${p.energy} > ${energyCap(m,p)}`,{...ctx,where,player:p.name});
  const t=m.board[p.pos];if(!t||t.type==='mer')problem('position impossible',`${p.pos} (${t?.type})`,{...ctx,where,player:p.name});
  if(S.inventorySpace(m,p)>m.rules.bikes[p.bike].capacity)problem('sacoches trop pleines',`${S.inventorySpace(m,p)} > ${m.rules.bikes[p.bike].capacity}`,{...ctx,where,player:p.name});
 }
 if(C.isEventGame(m)){const ids=[...m.eventDeck,...m.eventDiscard,...m.cardChoices,...(m.soloEventQueue||[]),...(m.pendingAttack?[m.pendingAttack.cardId]:[]),...m.players.flatMap(p=>[...p.cardHand,...p.bonusCards,...(p.pendingEffects||[]).map(e=>e.cardId)])];
  if(ids.length!==m.eventCardIds.length||new Set(ids).size!==ids.length)problem('cartes Événement perdues ou en double',`${ids.length} cartes pour ${m.eventCardIds.length}`,{...ctx,where});}
 const p=S.player(m),s=S.offroadStatus(m,p);if(s.limited&&m.moved>s.max)problem('limite hors route dépassée',`${m.moved} cases > ${s.max} (${p.bike})`,{...ctx,where,player:p.name});
}
function roundTrip(m,ctx){try{const back=S.load(S.serialize(m));if(S.serialize(back)!==S.serialize(m)){const a=JSON.parse(S.serialize(m)),b=JSON.parse(S.serialize(back));const diff=Object.keys(a).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k]));problem('sauvegarde modifiée au rechargement','champs : '+diff.join(', '),ctx);}}catch(e){problem('sauvegarde illisible',e.message,ctx);}}

// ---------- Cerveau du robot ----------
function goal(m,p){
 const pr=progress(S.view(m,p)),v=pr.v,dest='city-'+v.to;if(pr.ready)return {key:dest,why:'arrivée'};
 const need=new Set();for(const r of pr.rows)if(!r.done){if(/ville/i.test(r.label))need.add('ville');if(/montagne/i.test(r.label))need.add('montagne');if(/côt/i.test(r.label))need.add('cote');if(/plaine/i.test(r.label))need.add('plaine');}
 const d=dijkstra(m,p,p.pos),destD=dijkstra(m,p,dest);let best=null;
 for(const [k,dist]of d.dist){const t=m.board[k];if(!need.has(t.type)||p.visited.includes(k)||k===p.pos||t.name===v.to||t.name===v.from)continue;const score=dist+.5*(destD.dist.get(k)??99);if(!best||score<best.score)best={key:k,score};}
 return best?{key:best.key,why:[...need].join('+')}:{key:dest,why:'arrivée (rien trouvé)'};
}
function heap(){const a=[];return {get length(){return a.length;},push(x){a.push(x);let i=a.length-1;while(i){const j=(i-1)>>1;if(a[j][0]<=a[i][0])break;[a[i],a[j]]=[a[j],a[i]];i=j;}},shift(){const top=a[0],last=a.pop();if(a.length){a[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let k=i;if(l<a.length&&a[l][0]<a[k][0])k=l;if(r<a.length&&a[r][0]<a[k][0])k=r;if(k===i)break;[a[i],a[k]]=[a[k],a[i]];i=k;}}return top;}};}
function dijkstra(m,p,from){
 const gps=S.hasOffroadItem(m,p),dist=new Map([[from,0]]),prev=new Map(),open=heap();open.push([0,from]);
 while(open.length){const [d,k]=open.shift();if(d>dist.get(k))continue;const a=m.board[k];
  for(const n of a.links){const b=m.board[n],ferry=m.edges.some(e=>e.ferry&&(e.a===k&&e.b===n||e.b===k&&e.a===n));
   const step=ferry?4:(m.rules.terrain[b.type]??1)+.6+(gps||S.roadStep(m,k,b)?0:1.2);const nd=d+step;if(nd<(dist.get(n)??Infinity)){dist.set(n,nd);prev.set(n,k);open.push([nd,n]);}}}
 return {dist,prev};
}
function pathTo(m,p,target){const {prev}=dijkstra(m,p,p.pos),out=[target];if(target===p.pos)return [];while(out[0]!==p.pos){const k=prev.get(out[0]);if(!k)return [];out.unshift(k);}return out.slice(1);}

function handlePhases(m,rand,ctx,guard=0){
 while(guard++<60&&!m.done){const before=S.serialize(m);
  if(m.pendingAttack){const a=m.pendingAttack;if(!(rand()<.5&&S.defendEventAttack(m)))S.resolveEventAttack(m,{bonusIndex:0,resource:rand()<.5?'food':'energy'});}
  else if(m.phase==='card-intervention'){const opts=S.eventClimateOptions?.(m)||[];if(!(opts.length&&rand()<.3&&tryAny(()=>S.playEventClimate(m,opts[0]?.index??0))))S.passEventIntervention(m);}
  else if(m.phase==='card-choice')S.chooseCard(m,Math.floor(rand()*Math.max(1,m.cardChoices.length)));
  else if(m.phase==='card-discard')S.discardEventHand(m,0);
  else if(m.phase==='card-resolution'){for(const c of ['auto','tube','lose','kit','return'])if(S.resolvePendingCard(m,c))break;}
  else if(m.phase==='puncture')S.repairPuncture(m);
  else if(m.phase==='voyage-choice')S.chooseNewVoyage(m,S.player(m).voyageChoices[0]);
  else if(m.phase==='encounter'){const e=S.currentEncounter(m),options=e.choices.map((c,i)=>i).filter(i=>S.canChooseEncounter(m,i));S.resolveEncounter(m,options[Math.floor(rand()*options.length)]);ctx.encounters=(ctx.encounters||0)+1;}
  else if(m.phase==='event'){for(const c of ['accept','refuse'])if(S.resolve(m,c))break;}
  else return true;
  check(m,'phase',ctx);
  if(S.serialize(m)===before){problem('partie bloquée',`phase « ${m.phase} »${m.pendingAttack?' (attaque en attente)':''} : aucune action possible ne la fait avancer`,ctx);return false;}
 }
 return !m.done;
}
const tryAny=f=>{try{return f();}catch{return false;}};

function playTurn(m,rand,ctx,stat){
 const p=S.player(m),cap=energyCap(m,p),city=m.board[p.pos].type==='ville';
 // Jouer parfois une carte de sa main.
 if(C.isEventGame(m)&&p.cardHand.length&&rand()<.35){const i=Math.floor(rand()*p.cardHand.length);if(S.canPlayCard(m,i)){const other=m.players.find(q=>q.id!==p.id);try{S.playCard(m,i,other?.id,'auto');stat.cards++;}catch(e){problem('erreur en jouant une carte',`${C.card(p.cardHand[i],m)?.name} : ${e.message}`,ctx);}check(m,'carte',ctx);if(!handlePhases(m,rand,ctx))return;}}
 // Manger, acheter.
 if(p.energy<=cap-3)S.eat(m)||(city&&S.restaurant(m));
 if(city&&p.food<2)S.buyFood(m);
 // Repos si l'énergie est trop basse (ou si fourbu).
 if(p.energy<4||p.fatigue>=m.rules.fatigue.days){for(const id of [...(S.immersionOn(m)&&m.round%2?['demander']:[]),...(city?['hotel','camping','bivouac']:['camping','bivouac'])])if(S.rest(m,id)){stat.rests[id]=(stat.rests[id]||0)+1;check(m,'repos',ctx);return;}}
 // Route vers l'objectif (plusieurs objectifs à la suite tant qu'il reste des cases et de l'énergie).
 for(let leg=0;leg<5&&!m.done&&m.phase==='move'&&S.player(m)===p&&m.moved<S.distance(m);leg++){const movedBefore=m.moved,posBefore=p.pos;
 const g=goal(m,p),path=pathTo(m,p,g.key);
 if(path.length){const first=path[0];if(S.ferryOptions(m).some(t=>t.key===first)){if(S.travelFerry(m,first)){stat.ferries++;check(m,'bateau',ctx);return;}}
  const land=[];for(const k of path){if(m.edges.some(e=>e.ferry&&((e.a===(land.at(-1)||p.pos)&&e.b===k)||(e.b===(land.at(-1)||p.pos)&&e.a===k))))break;land.push(k);}
  for(let n=Math.min(land.length,S.distance(m)-m.moved);n>0;n--){const route=land.slice(0,n);if(S.routeCheck(m,route).ok){
   let pos=p.pos,off=0;for(const k of route){if(!S.roadStep(m,pos,m.board[k]))off++;pos=k;}stat.steps+=route.length;stat.offSteps+=off;
   try{if(C.isEventGame(m)){let r=S.beginEventRoute(m,route);if(r.ok===false&&/barrée/.test(r.reason||'')){stat.roadClosed=(stat.roadClosed||0)+1;const alt=S.moves(m).find(t=>t.key!==route[0]&&S.routeCheck(m,[t.key]).ok);r=alt?S.beginEventRoute(m,[alt.key]):{ok:true};}if(r.ok===false)problem('parcours validé puis refusé',r.reason||'',ctx);handlePhases(m,rand,ctx);}else S.executeRoute(m,route);}catch(e){problem('erreur pendant un déplacement',e.message,ctx);}
   check(m,'déplacement',ctx);break;}}
 }
 if(m.moved===movedBefore||p.pos===posBefore||S.player(m)!==p)break;}
 if(S.player(m)===p&&S.offroadStatus(m,p).limited)stat.limitedDays++;
}

function playGame(n,seed,rulesTweak){
 const rand=rng(seed),roster=Array.from({length:n},(_,i)=>{const l=LOADOUTS[(i+seed)%LOADOUTS.length];return {name:'Robot '+(i+1),...l,voyage:process.env.VOYAGE||voyages[(seed+i*3)%voyages.length].id};});
 const ctx={players:n,seed,roster:roster.map(r=>`${r.bike}/${r.voyage}${r.items.includes('gps')?'/GPS':''}`).join(' ; ')};
 const stat={players:n,seed,rounds:0,done:false,winner:'',steps:0,offSteps:0,limitedDays:0,ferries:0,cards:0,rests:{},finished:[]};
 let m;try{m=S.createMatch(roster,'plateau',rulesTweak||RULES,seed);}catch(e){problem('création de partie impossible',e.message,ctx);return stat;}
 check(m,'création',ctx);let lastProgress=0,lastKey='',stall=0;
 for(let guard=0;guard<MAX_ROUNDS*n*3&&!m.done&&m.round<=MAX_ROUNDS;guard++){
  ctx.round=m.round;ctx.active=S.player(m).name;
  if(!handlePhases(m,rand,ctx))break;
  if(process.env.SAVE&&m.round>=Number(process.env.STOP_ROUND||8)&&['move','place'].includes(m.phase)&&!m.pendingAttack){writeFileSync(process.env.SAVE,S.serialize(m));console.error('Partie enregistrée au jour '+m.round);process.exit(0);}
  try{playTurn(m,rand,ctx,stat);}catch(e){problem('erreur pendant un tour',e.stack.split('\n').slice(0,2).join(' '),ctx);break;}
  if(m.done)break;if(!handlePhases(m,rand,ctx))break;
  const p=S.player(m);stat.hist=stat.hist||{};const why=m.moved?'m'+m.moved:(p.turnModifiers?.skipMove?'skip':m.turnKind!=='travel'?m.turnKind:(S.distance(m)===0?'dist0':'other'));stat.hist[why]=(stat.hist[why]||0)+1;if(why==='other'&&!stat.sample){const g=goal(m,p),path=pathTo(m,p,g.key);stat.sample={phase:m.phase,energy:p.energy,goal:g,path:path.slice(0,4),check:S.routeCheck(m,path.slice(0,1)),moves:S.moves(m).length,pending:p.pendingEffects};}
  if(!S.endTurn(m)){if(!handlePhases(m,rand,ctx))break;if(!S.endTurn(m)&&!m.done){problem('impossible de terminer le tour',`phase « ${m.phase} »`,ctx);break;}}
  check(m,'fin de tour',ctx);if(guard%15===0)roundTrip(m,ctx);
  const key=m.players.map(q=>q.pos+q.energy).join();if(key===lastKey)stall++;else stall=0;lastKey=key;
  if(stall>12*n){const q=S.player(m),g=goal(m,q),path=pathTo(m,q,g.key);ctx.debug={goal:g,path:path.slice(0,5),check:S.routeCheck(m,path.slice(0,1)),moves:S.moves(m).map(t=>t.key),phase:m.phase,moved:m.moved,dist:S.distance(m),mods:q.turnModifiers,pending:q.pendingEffects,fatigue:q.fatigue,progress:progress(S.view(m,q)).rows.map(r=>r.label+' '+r.value+'/'+r.target).join(' ; ')};
   problem('cyclistes immobiles','aucun mouvement pendant 12 jours',{...ctx,positions:m.players.map(q=>q.pos+' ⚡'+q.energy+' 🪙'+q.money+' 🍎'+q.food).join(' | ')});break;}
 }
 handlePhases(m,rand,ctx);roundTrip(m,ctx);
 stat.encounters=ctx.encounters||0;stat.rounds=m.round;stat.done=m.done;stat.finished=m.players.filter(p=>p.completed).map(p=>p.name);stat.winner=S.ranking(m)[0]?.name;stat.winReason=m.winReason||'';
 stat.players_detail=m.players.map(p=>({name:p.name,bike:p.bike,gps:p.items.includes('gps'),voyage:p.voyage,completed:p.completed,voyagesDone:(p.voyagesDone||[]).length,points:p.points,cols:p.cols,money:p.money,fatigue:p.fatigue}));
 if(!m.done&&m.round>MAX_ROUNDS)problem('partie interminable',`pas finie après ${MAX_ROUNDS} jours`,ctx);
 return stat;
}

const results=[];
const ONLY=process.env.SEED?Number(process.env.SEED):null;
for(const n of (process.env.JOUEURS?[Number(process.env.JOUEURS)]:[1,2,3]))for(let g=0;g<GAMES;g++){if(ONLY!==null&&1000*n+g!==ONLY)continue;results.push(playGame(n,1000*n+g));}
// Statistiques
const by=n=>results.filter(r=>r.players===n),avg=(a,f)=>a.length?Math.round(a.reduce((s,x)=>s+f(x),0)/a.length*10)/10:0;
const summary=[1,2,3].map(n=>{const r=by(n),pl=r.flatMap(x=>x.players_detail||[]);return {joueurs:n,parties:r.length,terminees:r.filter(x=>x.done).length,jours_moyens:avg(r,x=>x.rounds),
 voyages_reussis:`${pl.filter(p=>p.completed).length}/${pl.length}`,avec_gps:`${pl.filter(p=>p.gps&&p.completed).length}/${pl.filter(p=>p.gps).length}`,sans_gps:`${pl.filter(p=>!p.gps&&p.completed).length}/${pl.filter(p=>!p.gps).length}`,
 pas_hors_route:`${Math.round(100*r.reduce((s,x)=>s+x.offSteps,0)/Math.max(1,r.reduce((s,x)=>s+x.steps,0)))} %`,jours_limites_hors_route:r.reduce((s,x)=>s+x.limitedDays,0),cartes_jouees:r.reduce((s,x)=>s+x.cards,0),bateaux:r.reduce((s,x)=>s+x.ferries,0)};});
const report={problemes:problems,nombre_total_alertes:problems.count||0,resume:summary};
writeFileSync(new URL('./rapport.json',import.meta.url),JSON.stringify({...report,parties:results},null,1));
console.log(JSON.stringify(report,null,1));

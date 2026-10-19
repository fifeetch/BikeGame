// « On apprend en jouant » (19 octobre, planche « Le guide en jouant, façon Half-Life ») :
// pendant une vraie partie, un bandeau d'une ligne apparaît au moment où on en a besoin, puis ne revient plus.
// Chaque conseil : quand il apparaît (when), quand il est compris (done, sinon dès que when redevient faux),
// ce qui brille (target), l'article du WikiBike (wiki), et une durée max (timeout, en ms).
// Rien ne change dans les règles : les conseils ne font que regarder la partie.
import {energyCap} from './rules.js';
import {progress} from './voyages.js';
import * as S from './simulator.js';

const T=(m,k)=>m.board[k]?.type;
const doneRows=m=>{try{return progress(S.view(m,S.player(m))).rows.filter(r=>r.done).length;}catch{return 0;}};

export const TIPS=[
 {id:'tracer',icon:'👆',text:()=>`Clique une <b>case voisine</b> qui brille pour tracer ta route.`,when:(m,p,ui)=>m.round===1&&m.moved===0&&!ui.route.length&&m.phase==='move'&&!ui.modal,done:(m,p,ui)=>ui.route.length>0||m.moved>0,wiki:'tracer'},
 {id:'rouler',icon:'🚴',text:()=>`Clique <b>Rouler</b> : chaque case coûte de l'énergie ⚡ selon son terrain.`,when:(m,p,ui)=>ui.route.length>0&&m.moved===0&&!ui.modal,done:m=>m.moved>0,target:'.dock-main',wiki:'cout-terrain'},
 {id:'montagne',icon:'⛰️',text:()=>`<b>Montagne</b> : 3 ⚡ la case. Elle compte pour les objectifs « montagne ».`,when:(m,p,ui)=>!ui.modal&&ui.route.some(k=>T(m,k)==='montagne'),wiki:'cout-terrain'},
 {id:'col',icon:'🚩',text:()=>`<b>Col mythique</b> : 3 ⚡, et <b>+2 points</b> d'aventure au premier passage.`,when:(m,p,ui)=>!ui.modal&&ui.route.some(k=>T(m,k)==='col'),wiki:'col'},
 {id:'ville',icon:'🏙️',text:()=>`Ta première ville ! La <b>supérette</b> vend tes repas pour la route.`,when:(m,p,ui)=>ui.modal==='market'&&!ui.view,target:'.tw-shop[data-shop="superette"]',wiki:'repas'},
 {id:'superette',icon:'🛒',text:()=>`<b>2 repas pour 1 pièce</b>, à manger plus tard, n'importe où.`,when:(m,p,ui)=>ui.modal==='market'&&ui.view==='superette',wiki:'provisions'},
 {id:'resto',icon:'🍽️',text:()=>`<b>Restaurant</b> : +4 ⚡ pour 1 pièce, sans toucher à tes repas.`,when:(m,p,ui)=>ui.modal==='market'&&ui.view==='resto',wiki:'restaurant'},
 {id:'velo',icon:'🔧',text:()=>`<b>Magasin de vélo</b> : réchaud, GPS, kit… chaque objet prend de la place.`,when:(m,p,ui)=>ui.modal==='market'&&ui.view==='velo',wiki:'equipement'},
 {id:'manger',icon:'🍎',text:()=>`Ton énergie baisse : <b>Manger</b> rend +2 ⚡. Un repas par jour.`,when:(m,p,ui)=>!ui.modal&&m.phase==='move'&&m.ate===0&&p.food>0&&p.energy<=energyCap(m,p)/2,done:m=>m.ate>0,target:'.dock-icons [data-action="eat-menu"]',wiki:'repas'},
 {id:'vide',icon:'🌙',text:()=>`Plus d'énergie : clique <b>Finir ma journée</b> pour dormir.`,when:(m,p,ui)=>!ui.modal&&m.phase==='move'&&p.energy<=0,target:'[data-action="night-open"]',wiki:'energie'},
 {id:'soir',icon:'🌙',text:()=>`<b>Bivouac</b> gratuit, <b>hôtel</b> plus reposant : plus c'est cher, mieux tu dors.`,when:(m,p,ui)=>ui.modal==='night',wiki:'bivouac'},
 {id:'scene',icon:'🎲',text:()=>`Une <b>scène</b> ! Chaque choix a un effet. S'il affiche « 2 sur 3 », c'est un <b>pari</b>.`,when:m=>m.phase==='encounter',wiki:'pari'},
 {id:'meteo',icon:'🌦️',text:()=>`La <b>météo</b> change le coût des cases : vent, pluie, orage, neige.`,when:(m,p,ui)=>ui.modal==='meteo',wiki:'meteo'},
 {id:'objectif',icon:'✅',text:()=>`Objectif rempli ! Regarde ta <b>carte Voyage</b> (onglet Voyage).`,when:(m,p,ui)=>!ui.modal&&doneRows(m)>0,target:'[data-action="sheet-tab-voyage"]',timeout:9000,wiki:'objectif'},
 {id:'fatigue',icon:'😮‍💨',text:()=>`Ta <b>fatigue</b> monte : un <b>camping</b> ou un <b>hôtel</b> la fera baisser.`,when:(m,p,ui)=>!ui.modal&&(p.fatigue||0)>=2,target:'.imm-fatl',timeout:12000,wiki:'fatigue'},
 {id:'pieces',icon:'🪙',text:()=>`Presque plus de pièces : la <b>banque</b> prête 5 pièces en ville.`,when:(m,p,ui)=>!ui.modal&&p.money<2,timeout:10000,wiki:'banque'},
 {id:'voyage',icon:'🃏',text:()=>`Voyage réussi ! Choisis une <b>nouvelle carte</b> ; le <b>train</b> peut t'emmener au départ.`,when:m=>m.phase==='voyage-choice',wiki:'nouveau-voyage'}
];

// Le conseil à montrer maintenant (ou null). state = {id, since} : le conseil affiché ; on le marque « vu » quand il est compris.
export function tipTick(m,ui,state,now=Date.now()){
 if(!m?.tips||m.tips.off||m.done)return null;const p=S.player(m),seen=m.tips.seen;
 if(state?.id){const t=TIPS.find(x=>x.id===state.id);let still=false;try{still=t.when(m,p,ui)&&!(t.done&&t.done(m,p,ui))&&!(t.timeout&&now-state.since>t.timeout);}catch{}
  if(still)return state;if(!seen.includes(t.id))seen.push(t.id);}
 for(const t of TIPS){if(seen.includes(t.id))continue;let ok=false;try{ok=t.when(m,p,ui);}catch{}if(ok)return {id:t.id,since:now};}
 return null;}
export const tipById=id=>TIPS.find(t=>t.id===id);

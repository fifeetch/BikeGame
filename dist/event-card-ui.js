// Face des cartes Événement, style « carte d'aventure » (planche « Carte Événement n° 1 », validée par Fi le 17 octobre).
// Bandeau de la famille, petite scène animée du jeu (carte du jeu en fond), nom, phrase, effet en une phrase.
// Dessin seulement : aucune règle ici (les textes courts reprennent l'effet officiel de event-cards.js).
import {cardScene,encounterSceneSvg,sceneHold} from './encounter-scenes.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const categoryLabel={positive:'Positive',negative:'Négative',climatic:'Climatique',permanent:'Bonus permanent'};
const FAMILY={positive:'POSITIVE',negative:'NÉGATIVE',climatic:'CLIMATIQUE',permanent:'BONUS'};
const WHO={positive:'Pour toi · pendant ton tour',negative:'Contre un adversaire · pendant ton tour',climatic:'Contre un adversaire · à tout moment',permanent:'Équipement · reste devant toi'};
// Effet en une phrase, par type d'effet (une variante de carte garde le texte de son effet).
// tags = terrains concernés ; prot = carte bonus qui protège.
const SHORT={
 free_steps:{text:'2 cases gratuites en plus.',tags:['Plaine','Côte','Moyenne montagne']},
 gain_food:{text:'+2 repas tout de suite.'},
 gain_energy:{text:v=>`+${v} énergie tout de suite.`},
 gain_money:{text:'+3 pièces tout de suite.'},
 market:{text:'+2 repas et +1 pièce.'},
 cancel_attack:{text:'Annule une carte négative ou climatique jouée contre toi.'},
 gain_points:{text:'+2 points Aventure.'},
 terrain_shortcut:{text:'Aucun surcoût de terrain pendant ton prochain trajet.'},
 free_road_steps:{text:'Jusqu’à 3 cases gratuites en suivant une route.'},
 puncture:{text:'Il répare avec son kit. Sans kit : retour à la dernière ville, journée perdue.',prot:'Pneus renforcés'},
 mechanical:{text:'Il répare avec son kit. Sans kit : retour à la dernière ville, journée perdue.',prot:'Outils multifonctions'},
 headwind_next:{text:'Son prochain trajet coûte 2 énergie de plus.'},
 storm_next:{text:'−1 énergie et pas de trajet au prochain tour.'},
 wrong_turn:{text:'Pas de trajet au prochain tour.',prot:'GPS de randonnée'},
 fall:{text:'−2 énergie. Il se soigne avec sa trousse ; sinon retour à la dernière ville, journée perdue.'},
 food_poisoning:{text:'−2 énergie tout de suite.'},
 road_closed:{text:'2 cases de moins au prochain tour (détour).',prot:'GPS de randonnée'},
 torn_bag:{text:'−1 repas, ou −1 énergie s’il n’en a pas.'},
 damage_bonus:{text:'Il défausse un bonus permanent, sinon −1 énergie.'},
 headwind_now:{text:'Le trajet en cours coûte 2 énergie de plus.'},
 heatwave:{text:'−2 énergie tout de suite.'},
 storm_now:{text:'Le trajet s’arrête sur la case atteinte.'},
 fog:{text:'−1 énergie ; il s’arrête avant la première case hors route.'},
 mountain_snow:{text:'Montagnes et cols interdits à son prochain tour.',tags:['Montagne','Col']},
 heavy_rain:{text:'Sur une case sans route : −2 énergie.',tags:['Sans route']},
 crosswind:{text:'2 cases de moins sur le trajet en cours.'},
 morning_frost:{text:'Ses cartes de déplacement ne marchent pas ce tour.'},
 coastal_storm:{text:'Sur la côte : −2 énergie et fin du trajet.',tags:['Côte']},
 freezing_cold:{text:'Il dépense 1 repas ou perd 2 énergie.'},
 puncture_immunity:{text:'Protège de la Crevaison.'},
 mechanical_immunity:{text:'Protège de la Casse mécanique.'},
 food_capacity:{text:'+3 places pour les repas.'},
 solar:{text:'+1 énergie à la fin de chacun de tes tours.'},
 gps_immunity:{text:'Protège d’Erreur d’itinéraire et de Route barrée. Hors route sans pénalité.'},
 efficient_stove:{text:'Chaque repas rend 3 énergie au lieu de 2.'},
 comfortable_tent:{text:'Nuit sous tente : +2 énergie au lieu de +1.'},
 light_bike:{text:'−1 sur le premier surcoût de terrain de chaque tour.'},
 travel_journal:{text:'+1 pièce à chaque nouvelle ville visitée.'},
 warmshowers:{text:'+1 énergie en arrivant dans une ville (une fois par tour).'}
};
function shortEffect(card){const s=SHORT[card.effectType];if(!s)return {text:card.effectText,tags:[],prot:''};
 return {text:typeof s.text==='function'?s.text(card.effectValue):s.text,tags:s.tags||[],prot:s.prot||''};}

// ---------- La scène : la carte du jeu autour de la case du joueur ----------
let ctx={href:'assets/terrain/europe-terrain.webp',x:455.7,y:458.45,color:'#b8432e'},uidN=0;
export function setCardSceneContext(c={}){if(Number.isFinite(c.x)&&Number.isFinite(c.y))ctx={...ctx,...c};else if(c.color)ctx={...ctx,color:c.color};}
const now0=()=>typeof performance!=='undefined'?performance.now():0;
function sceneMarkup(card,uid){try{return encounterSceneSvg(cardScene(card.id,card.category),99,{...ctx,uid,now:now0()});}catch{return '';}}

export function eventFace(card,actions='',compact=false){if(!card)return '';
 const uid='ec'+(++uidN),fx=shortEffect(card),who=card.id==='evt-07'?'Pour toi · en réaction à une attaque':WHO[card.category]||'';
 return `<article class="event-face ${card.category}${compact?' compact':''}" style="--event-color:${card.color}" aria-label="Carte événement ${esc(card.name)}">
 <div class="event-face-banner"><span class="sr-only">CARTE ÉVÉNEMENT · </span>${FAMILY[card.category]||''} <span>№ ${String(card.number).padStart(2,'0')}</span></div>
 <div class="event-face-scene"><svg class="ecard-scene" viewBox="-48 0 416 150" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Scène : ${esc(card.name)}" data-card="${esc(card.id)}" data-cat="${esc(card.category)}" data-uid="${uid}">${sceneMarkup(card,uid)}</svg></div>
 <div class="event-face-body"><h3>${esc(card.name)}</h3><p class="event-face-flavour">${esc(card.description)}</p><div class="event-face-effect"><strong>EFFET</strong><p>${esc(fx.text)}</p>${fx.tags.length?`<div class="event-face-tags">${fx.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}${fx.prot?`<small>Protection : ${esc(fx.prot)}</small>`:''}</div></div>
 <div class="event-face-who"><i></i>${esc(who)}</div>
 ${actions?`<div class="event-face-actions">${actions}</div>`:''}</article>`;
}

// ---------- Animation : toutes les scènes de cartes visibles, une seule boucle ----------
// Seule la carte survolée s'anime (ou une carte montrée en grand dans une fenêtre) ; les autres restent sur leur image.
const starts=new Map();let raf=0,last=0;
function reduced(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch{return false;}}
function tick(now){raf=0;if(typeof document==='undefined'||!document.querySelectorAll)return;
 const els=[...document.querySelectorAll('svg.ecard-scene')];if(!els.length)return;
 if(now-last>=40){last=now;const many=els.length>8;
  for(const el of els){const id=el.dataset.card,cat=el.dataset.cat,face=el.closest('.event-face');
   // Fluidité (audit ordinateur, 23 oct.) : une carte ne s'anime que survolée, ou montrée en grand dans une fenêtre (3 cartes au plus).
   const box=el.closest('.modal');const inModal=box&&box.getClientRects().length&&box.querySelectorAll('svg.ecard-scene').length<=3;
   const live=!document.hidden&&(face?.matches(':hover,:focus-within')||(!many&&inModal));
   if(!live){if(el.dataset.still!=='1'){el.dataset.still='1';el.style.opacity='';starts.delete(id);}continue;}
   el.dataset.still='';if(!starts.has(id))starts.set(id,now);
   const sc=cardScene(id,cat),cyc=sceneHold(sc)+2.2,t=((now-starts.get(id))/1000)%cyc;
   el.innerHTML=encounterSceneSvg(sc,t,{...ctx,uid:el.dataset.uid,now});
   el.style.opacity=String(t<.3?t/.3:t>cyc-.4?Math.max(0,(cyc-t)/.4):1);}}
 raf=requestAnimationFrame(tick);}
export function startCardScenes(){if(raf||typeof requestAnimationFrame!=='function'||reduced())return;raf=requestAnimationFrame(tick);}

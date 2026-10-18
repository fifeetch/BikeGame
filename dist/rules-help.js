// Règles du jeu expliquées au joueur : le résumé « Comment on joue » (avant le jour 1)
// et les règles détaillées (bouton « 📖 Règles »). Les nombres viennent des règles de la partie,
// donc le texte suit toujours les réglages choisis (vélos, météo, rencontres, fin de partie…).
import {VOYAGE_POINTS} from './voyages.js';
import {ruleVisuals} from './rules-visuals.js';
const VP=Object.entries(VOYAGE_POINTS).filter(([k])=>k!=='apprentissage').map(([,v])=>v),VMIN=Math.min(...VP.map(v=>v[1])),VMAX=Math.max(...VP.map(v=>v[1]));
import {WEATHER} from './weather.js';
import {NIGHT,DEMAND_NIGHT} from './immersion.js';
import {ULTRA_RACE,ULTRA_HOURS,ULTRA_NIGHT,ULTRA_STEP_MAX,ULTRA_SLEEP,ULTRA_DEBT,ULTRA_SHOP_HOURS,ULTRA_RESTO_HOURS,ULTRA_FOOD,ULTRA_FERRY_MAX,ULTRA_RIVALS,ULTRA_WEIGHT,ULTRA_NEEDS} from './ultra.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plural=(n,one,many)=>`${n} ${n>1?many:one}`;
const bikeDays=r=>Object.values(r.bikes).map(b=>`${esc(b.name)} ${Math.min(5,Math.max(1,r.distance+(b.extraDistance||0)))}`).join(', ');
const victory=r=>{const v=r.victory||{};if(v.mode!=='multi')return v.mode==='points'?`${v.points} points d’aventure`:v.mode==='turns'?`${v.turns} jours`:'le premier voyage réussi';
 const parts=[];if(v.points)parts.push(`<b>${v.points} points</b> d’aventure`);if(v.voyages)parts.push(`<b>${plural(v.voyages,'voyage réussi','voyages réussis')}</b>`);if(v.days)parts.push(`<b>${v.days} jours</b>`);return parts.join(', ou ');};
const opts=r=>({forecast:Boolean(r.weather?.forecast),encounters:Boolean(r.encounters?.enabled),cards:!r.encounters?.enabled,offroad:Boolean(r.offroad?.enabled)});
const mealEnergy=(r,eventGame)=>eventGame?r.cardBalance?.foodEnergy??2:r.food.energy;
// Nuits, repas et sacoches (règles de Fi, 17 octobre) : mêmes chiffres dans tous les modes.
const nights=()=>`bivouac +${NIGHT.bivouac.energy} (gratuit, tente), camping +${NIGHT.camping.energy} (1 pièce), hôtel +${NIGHT.hotel.energy} (3 pièces, en ville), chez l’habitant +${DEMAND_NIGHT.grand.energy} au plus`;
const foodMax=r=>Object.values(r.bikes).map(b=>`${esc(b.name)} ${b.maxFood??r.maxFood}`).join(', ');
const meals=r=>`repas froid <b>+${r.food.coldEnergy??2}</b> partout, repas chaud <b>+${r.food.hotEnergy??3}</b> avec le réchaud`;

// ---------- Résumé avant le départ ----------
export function rulesIntro(r,{btn,eventGame=true}={}){if(r.immersion?.ultra)return ultraIntro(r,{btn});const o=opts(r),t=r.terrain;
 const box=(icon,title,text)=>`<div class="ri-box"><b>${icon} ${title}</b><p>${text}</p></div>`;
 return `<div class="rules-intro"><span class="eyebrow">AVANT LE DÉPART · L’ESSENTIEL EN 1 MINUTE</span><h2>Comment on joue</h2><div class="ri-grid">
  ${box('🎯','Le but',`Réussir des <b>voyages de ville à ville</b> et gagner des <b>points d’aventure</b>. La partie s’arrête à ${victory(r)}.${r.victory?.mode==='multi'&&r.victory.voyages?` Le premier à ${r.victory.voyages} voyages gagne +${r.victory.voyagesBonus??5} points ; à la fin, <b>le plus de points gagne</b>.`:''}`)}
  ${box('🚲','Ta journée',`Cases par jour : ${bikeDays(r)}. Chaque case coûte de l’énergie : plaine et côte ${t.plaine}, moyenne montagne ${t.moyenne_montagne}, montagne et col ${t.montagne}, ville ${t.ville}.`)}
  ${box('⚡','Énergie et repos',`${r.startEnergy} au départ, ${r.maxEnergy} au plus. On roule, puis on dort : <b>dormir termine la journée</b>. Nuits : ${nights()} ; une journée sans rouler, la nuit rend deux fois plus. Repas : ${meals(r)}. Repas au maximum : ${foodMax(r)} (+2 avec les sacoches), ${r.startFood} au départ.${r.fatigue?.enabled?` Chaque jour de route fatigue : −${r.fatigue.maxEnergyPenalty} d’énergie maximum par niveau, jusqu’à une vraie nuit.`:''}`)}
  ${o.offroad?box('🛣','Route ou hors route',`Sans ${esc(r.equipment[r.offroad.item]?.name||'GPS')}, quitter la route limite la journée à ${Object.entries(r.offroad.maxDistance).map(([id,n])=>`${n} cases (${esc(r.bikes[id]?.name||id)})`).join(' ou ')}.`):box('🛣','Routes','Routes et chemins : on roule partout, la route ne change rien.')}
  ${box('⭐','Les points',`Voyage réussi +${VMIN} à +${VMAX} selon la carte (moins si tu arrives sans tous les objectifs) · col mythique +${r.points.col} · ${r.adventure.climberCols} cols +${r.adventure.climberBonus} · jeton « ? » +1 à +3.`)}
  ${r.immersion?.enabled?box('🧭','Le mode Immersion','Plus de cartes : la route décide. Des scènes en route (plus souvent, et plus de galères, quand tu es fatigué), des imprévus visibles sur la carte, et chaque soir tu choisis où dormir : bivouac, camping, hôtel ou « Demander ». Dormir termine la journée, et chaque nuit est un pari.'):o.encounters?box('🤝','Les rencontres','Chaque soir, une rencontre liée à l’endroit où tu t’arrêtes : tu choisis ce que tu fais.'):box('🃏','Les cartes',`Fin de tour : pioche ${r.eventCards.drawPerTurn}, garde-en 1. Positives pour toi, négatives contre un autre (il la découvre au début de son tour)${o.forecast?'':', météo pendant son trajet'}, bonus posés devant toi.`)}
 </div><p class="muted">${o.forecast?'Météo annoncée : chaque soir, le bulletin du lendemain pour 5 régions. ':''}Toutes les règles sont dans « 📖 Règles », à tout moment de la partie.</p>
 <div class="ri-actions">${btn('C’est parti →','intro-close')}${btn('📖 Règles détaillées','help','light')}</div>
 <label class="ri-hide"><input type="checkbox" id="intro-hide"/> Ne plus afficher ce résumé au départ</label></div>`;}

// ---------- Règles détaillées ----------
export const HELP_TABS=[['route','Se déplacer'],['repos','Manger & dormir'],['voyages','Voyages & points'],['cartes','Cartes'],['meteo','Météo'],['fin','Fin de partie']];
export function rulesHelp(r,tab='route',{btn,eventGame=true}={}){const o=opts(r),t=r.terrain,tabs=HELP_TABS.map(([id,label])=>id==='cartes'&&o.encounters?['cartes',r.immersion?.enabled?'Immersion':'Rencontres']:[id,label]);
 const li=a=>`<ul>${a.filter(Boolean).map(x=>`<li>${x}</li>`).join('')}</ul>`;let body='';
 if(tab==='route')body=`<h3>Se déplacer</h3>${li([
  `Cases par jour : <b>${bikeDays(r)}</b>, de case voisine en case voisine.`,
  `Coût en énergie : plaine ${t.plaine} · côte ${t.cote} · moyenne montagne ${t.moyenne_montagne} · montagne ${t.montagne} · col ${t.col} · ville ${t.ville}.`,
  'Trace ton étape en cliquant les cases <b>entourées</b> de la carte, puis le gros bouton « 🚴 Rouler ». « 🌙 Finir ma journée » ouvre « Où dormir ce soir ? » ; dormir termine la journée et passe au joueur suivant.',
  o.offroad&&`Les <b>routes</b> sont les traits clairs. Sans ${esc(r.equipment[r.offroad.item]?.name||'GPS')}, un seul pas hors route limite toute la journée à ${Object.entries(r.offroad.maxDistance).map(([id,n])=>`${n} cases (${esc(r.bikes[id]?.name||id)})`).join(' ou ')} — les cases de route déjà faites comptent dedans.`,
  o.offroad&&`Avec le ${esc(r.equipment[r.offroad.item]?.name||'GPS')} (au garage) ou la carte bonus « GPS de randonnée » : pas de limite hors route.`,
  `<b>Bateaux</b> : ${r.ferryPrice} pièces la traversée ; la journée s’arrête au port d’arrivée.`])}`;
 else if(tab==='repos')body=`<h3>Manger & dormir</h3>${li([
  `Énergie : ${r.startEnergy} au départ, ${r.maxEnergy} au plus.`,
  `<b>Banque</b> (en ville, ou dans la fenêtre du train) : un prêt de ${r.loan?.amount??5} pièces, sans intérêts, un seul à la fois ; on le rembourse en une fois dans une banque. Non remboursé à la fin : −${r.loan?.penalty??3} points d’aventure.`,
  `<b>Manger</b> un repas des sacoches, ${r.food.maxPerTurn} par jour, partout : <b>repas froid +${r.food.coldEnergy??2}</b> énergie (sandwich, burek…) ou, avec le réchaud, <b>repas chaud +${r.food.hotEnergy??3}</b>.`,
  `<b>Repas dans les sacoches</b> : ${r.startFood} au départ ; au plus ${foodMax(r)}. Les <b>Sacoches</b> (équipement) ajoutent 2 repas et 2 places (elles en prennent 1).`,
  `<b>Provisions</b> : ${r.food.quantity} repas pour ${r.food.price} pièce${r.food.cityOnly?', en ville':''}. <b>Restaurant</b> : +${r.food.restaurantEnergy} énergie pour ${r.food.restaurantPrice} pièce, en ville.`,
  `<b>On roule, puis on dort.</b> « Finir ma journée » ouvre « Où dormir ce soir ? » : ${nights()}. Une journée sans rouler : la nuit rend deux fois plus. Matelas et duvet : +1 la nuit.`,
  `<b>Demander l’hospitalité</b> : gratuit, mais un pari. Grand accueil (+${DEMAND_NIGHT.grand.energy}, un repas, +1 point), jardin (+${DEMAND_NIGHT.jardin.energy}) ou refus poli (camping de dernière minute à 2 pièces, +${DEMAND_NIGHT.refusCamping.energy} ; sans pièces, nuit dehors +0).`,
  r.fatigue?.enabled&&`<b>Fatigue</b> : +1 par journée de route (+${r.fatigue.colExtra} le jour d’un col). Chaque niveau de fatigue baisse ton énergie maximum de ${r.fatigue.maxEnergyPenalty} (${Array.from({length:r.fatigue.days},(_,i)=>`${i+1} → ${r.maxEnergy-r.fatigue.maxEnergyPenalty*(i+1)}`).join(', ')}). À ${r.fatigue.days}, tu es <b>fourbu</b>. Camping, hôtel et grand accueil effacent la fatigue ; le bivouac, non ; le jardin l’enlève de 1 ; une nuit dehors l’augmente de 1.`,
  `Budget : +${r.budget.amount} pièces tous les ${r.budget.every} tours.`])}`;
 else if(tab==='voyages')body=`<h3>Voyages & points</h3>${li([
  'Ta <b>carte Voyage</b> donne une ville d’arrivée et des objectifs de cases (villes, côtes, montagnes…). Remplis-les, puis rejoins la ville d’arrivée.',
  'Un <b>col</b> compte comme une montagne. Pour les objectifs « consécutives », une case déjà traversée ne compte pas mais ne casse pas la série ; un autre terrain la casse.',
  `Points du voyage écrits sur la carte : de +${VMIN} à +${VMAX} avec tous les objectifs, selon l’effort demandé.`,
  'Arrivé sans tous les objectifs : « 🏁 Terminer le voyage ici », avec les points mini écrits sur la carte.',
  'Voyage réussi : au début de ton tour suivant, tire 3 cartes Voyage et garde-en 1. Tu pars d’où tu es ; seules les cases parcourues ensuite comptent.',
  `Col mythique : +${r.points.col} · ${r.adventure.climberCols} cols franchis : +${r.adventure.climberBonus} (une fois).`,
  'Jetons « ? » (lieux cachés, loin des routes) : le premier qui passe dessus gagne +1, +2 ou +3.'])}`;
 else if(tab==='cartes')body=r.immersion?.enabled?`<h3>Mode Immersion</h3>${li(['Plus de cartes Événement : ce qui arrive dépend du <b>terrain</b>, de la <b>zone</b>, de la <b>météo du jour</b> et de ta fatigue.','<b>En route</b> : environ un jour sur deux, une scène s’ouvre quand tu entres sur une case. Tu choisis, puis ta journée continue. Jamais deux galères de suite.','Certains choix sont des <b>paris</b> : « ça marche 2 sur 3 »… tu connais le risque, pas le résultat.','<b>Dormir termine la journée</b> : « Finir ma journée » ouvre « Où dormir ce soir ? ». Bivouac (gratuit, tente) +1 énergie, camping (1 pièce) +2 et fatigue −1, hôtel (3 pièces, en ville) +3 et fatigue effacée. Une journée sans rouler : la nuit rend deux fois plus.','<b>Chaque nuit est un pari</b> : nuit tranquille, galère ou belle surprise. Le bivouac est le plus risqué (surtout sous la pluie ou l’orage), l’hôtel le plus sûr. Le <b>carnet du soir</b> raconte ta journée.','<b>Imprévus qui durent</b> : une zone hachurée sur la carte pendant quelques jours (côte en août, canicule, feu de forêt, col fermé, vendanges, fête…). À toi de changer de cap… ou pas.','<b>Demander l’hospitalité</b> : gratuit, mais un pari. Grand accueil 1 sur 4 (+2 énergie, un repas, fatigue effacée), jardin 2 sur 5 (+2, fatigue −1), refus 1 sur 3 (camping de dernière minute à 2 pièces, ou nuit dehors sans pièce).','<b>Compagnons de route</b> : certains voyageurs reviennent plus loin. Rouler ensemble trois jours : la fatigue monte moins vite.','Une guêpe ou un repas qui passe mal peuvent imposer un <b>jour de repos forcé</b>.'])}`:o.encounters?`<h3>Rencontres</h3>${li(['Plus de cartes Événement : chaque soir, une <b>rencontre</b> liée à l’endroit où tu t’arrêtes (ville, montagne, côte, région).','Tu choisis ce que tu fais : énergie, repas, pièces, points, une case de plus ou de moins le lendemain…','Certains choix demandent quelque chose (par exemple 1 pièce ou 1 repas).'])}`
  :`<h3>Cartes Événement</h3>${li([
  `Main de ${r.eventCards.handLimit} cartes au plus. Fin de tour : pioche ${r.eventCards.drawPerTurn}, garde-en 1.`,
  '<b>Positives</b> (vertes) : pour toi, pendant ton tour, une par tour.',
  '<b>Négatives</b> (rouges) : contre un autre joueur, pendant ton tour ; il la découvre au début de son propre tour et y répond à ce moment-là. Crevaison et casse : il répare avec le kit ou retourne à la dernière ville ; chute : trousse de secours ou retour.',
  !o.forecast&&'<b>Climatiques</b> (bleues) : quand un autre joueur annonce son trajet, tu peux en jouer une sur lui.',
  `<b>Bonus permanents</b> (jaunes) : posés devant toi, ${r.eventCards.bonusLimit} au plus.`,
  '« Coup de pouce » annule une carte jouée contre toi.'])}`;
 else if(tab==='meteo')body=o.forecast?`<h3>Météo annoncée</h3>${li(['Chaque soir, le bulletin du lendemain pour 5 régions (Ouest, Alpes, Nord, Est, Balkans). Les pastilles sont sur la carte.',...Object.values(WEATHER).map(w=>`${w.icon} <b>${esc(w.name)}</b> : ${esc(w.effect)}.`)])}`
  :`<h3>Météo</h3>${li([o.encounters?'Dans ce mode, pas de météo : les rencontres remplacent les cartes.':'La météo arrive par les <b>cartes climatiques</b> : les autres joueurs peuvent en jouer une quand tu annonces ton trajet (vent, pluie, orage, neige, brouillard…).','On peut choisir « Météo annoncée » au début d’une partie : un bulletin chaque soir, sans cartes climatiques.'])}`;
 else body=`<h3>Fin de partie</h3>${li([`La partie s’arrête dès qu’un cycliste atteint ${victory(r)}.`,r.victory?.voyages?`Le premier qui réussit ${r.victory.voyages} voyages arrête la partie et gagne <b>+${r.victory.voyagesBonus??5} points</b> d’aventure ; c’est ensuite celui qui a <b>le plus de points</b> qui gagne.`:'',r.victory?.days?`Au bout de ${r.victory.days} jours, celui qui a le plus de points gagne.`:'',`Un prêt de la banque non remboursé : −${r.loan?.penalty??3} points d’aventure à la fin.`,'Ces conditions se choisissent avant la partie (0 = condition non utilisée).'])}`;
 return `<div class="rules-help"><span class="eyebrow">RÈGLES DÉTAILLÉES</span><div class="rh-tabs" role="tablist">${tabs.map(([id,label])=>`<button type="button" role="tab" data-action="help-tab-${id}" aria-selected="${id===tab}" class="${id===tab?'on':''}">${esc(label)}</button>`).join('')}</div><div class="rh-body">${body}${ruleVisuals(tab)}</div>${btn('Fermer et reprendre la partie','close','light')}</div>`;}

// ---------- Résumé avant le départ : mode Ultra (18 octobre) ----------
// Tous les nombres viennent de dist/ultra.js : le texte suit les réglages de la course.
function ultraIntro(r,{btn}){const R=ULTRA_RACE,H=ULTRA_HOURS,N=ULTRA_NEEDS,t=r.terrain;
 const box=(icon,title,text)=>`<div class="ri-box"><b>${icon} ${title}</b><p>${text}</p></div>`;
 const lvl=k=>N[k].levels.filter(l=>l[2]).map(l=>`<b>${l[1]}</b> dès ${l[0]} (+${l[2]} h et −${l[3]} énergie par case)`).join(', ');
 const sleep=ULTRA_SLEEP.map(o=>`${o.name.toLowerCase()} ${o.hours<1?Math.round(o.hours*60)+' min':String(o.hours).replace('.',',')+' h'}`).join(', ');
 const stops=[...R.checkpoints.map((c,i)=>`<b>${c}</b> avant la fin du jour ${R.barriers[i]}`),`<b>${R.to}</b> avant la fin du jour ${R.barriers.at(-1)}`].join(', puis ');
 return `<div class="rules-intro"><span class="eyebrow">MODE ULTRA · EN DÉVELOPPEMENT · L’ESSENTIEL EN 1 MINUTE</span><h2>Comment on court</h2><div class="ri-grid">
  ${box('🏁','La course',`Une course d’ultra-distance contre <b>${ULTRA_RIVALS.length} coureurs</b>, en autonomie, de <b>${R.from}</b> au <b>${R.to}</b> (environ 6 000 km). Passe les contrôles dans l’ordre : ${stops}. Il faut aussi franchir <b>${R.cols} cols mythiques</b> au choix. <b>On gagne à l’ordre d’arrivée.</b> Une barrière ratée, c’est hors course.`)}
  ${box('⏱','L’horloge ne s’arrête jamais',`Départ lundi à ${R.startHour} h. Une case ≈ 100 km et prend du temps : ville ${H.ville} h, plaine et côte ${H.plaine} h, moyenne montagne ${H.moyenne_montagne} h, montagne ${H.montagne} h, col ${H.col} h. De nuit (${ULTRA_NIGHT[0]} h – ${ULTRA_NIGHT[1]} h) et hors route, c’est plus long. Une étape = jusqu’à ${ULTRA_STEP_MAX} cases, puis tu t’arrêtes pour dormir. Le chrono est à côté du jour, sur ta fiche.`)}
  ${box('⚡','L’énergie',`Chaque case coûte de l’énergie : plaine et côte ${t.plaine}, moyenne montagne ${t.moyenne_montagne}, montagne et col ${t.montagne}. <b>Trois besoins te la rendent : dormir, manger et boire.</b> On ne peut se passer d’aucun : chacun a sa dette, et une dette trop haute te ralentit et te vide.`)}
  ${box('💤','Le sommeil',`Tu choisis quand et combien : ${sleep} (hôtel en ville seulement). La dette de sommeil, c’est ta fatigue : elle monte avec les heures sans dormir (paliers ${ULTRA_DEBT.join(', ')} h) et baisse ton énergie maximale. Dès ${ULTRA_DEBT[2]} h : hallucinations ; dès ${ULTRA_DEBT[3]} h : micro-sommeils et chutes.`)}
  ${box('🍽','La faim',`+${N.faim.per} de faim par case. Un repas froid : <b>+${r.food.coldEnergy??2} énergie</b> et −${N.faim.meal} de faim (15 min). ${lvl('faim')}. Ravitaillement : supérette ${ULTRA_SHOP_HOURS[0]} h – ${ULTRA_SHOP_HOURS[1]} h (+${ULTRA_FOOD.superette} repas), station-service la nuit et épicerie de hameau (+${ULTRA_FOOD.station}), restaurant ${ULTRA_RESTO_HOURS[0]} h – ${ULTRA_RESTO_HOURS[1]} h. Fermé le dimanche dans beaucoup de pays.`)}
  ${box('💧','La soif',`+${N.soif.per} de soif par case. Dès ${N.soif.auto}, une gourde se boit toute seule : <b>+${N.soif.energy} énergie</b> et −${N.soif.drink} de soif. Gourdes vides : ${lvl('soif')}. Remplis-les en ville, aux fontaines des hameaux (💧 sur la carte), aux rivières et torrents (avec un filtre, sinon risque d’eau contaminée).`)}
  ${box('🚲','Ton vélo',`Choisi au garage. La route va vite sur le goudron mais souffre hors route ; le VTT, l’inverse ; le gravel passe partout. Chaque pièce d’équipement a son effet. Ici la monnaie, c’est <b>le poids</b> : dès ${ULTRA_WEIGHT.light} kg les cols coûtent +1 h, dès ${ULTRA_WEIGHT.heavy} kg la montagne aussi.`)}
  ${box('🎒','L’autonomie','Comme dans les vraies courses : pas d’argent à compter, pas de train, pas de « Demander ». '+`${ULTRA_FERRY_MAX===1?'Un seul bateau':`${ULTRA_FERRY_MAX} bateaux`} pour toute la course. L’onglet « Course » de la fiche montre le classement en direct, les contrôles et les cols ; tu peux y abandonner.`)}
 </div><p class="muted">Le mode Ultra est en développement : les chiffres peuvent changer à chaque mise à jour. Toutes les règles sont dans « 📖 Règles ».</p>
 <div class="ri-actions">${btn('C’est parti →','intro-close')}${btn('📖 Règles détaillées','help','light')}</div>
 <label class="ri-hide"><input type="checkbox" id="intro-hide"/> Ne plus afficher ce résumé au départ</label></div>`;}

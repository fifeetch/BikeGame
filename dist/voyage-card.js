// Cartes Voyage illustrées (17 octobre 2026) : image de Fi en haut, partie basse « carnet crème »
// avec le titre, le trajet, les objectifs (petite image de case + texte), la longueur et les points.
import {voyageTier,VOYAGE_LENGTHS} from './voyages.js';

// Illustrations de Fi : une par carte Voyage (assets/voyages/cartes/<id>.webp, recadrées en 800 × 500).
export const CARD_ART=['traversee','soleil','alpes','campagne','nord','atlantique','est','balkans','iberique','manche','iles','rhin','danube','adriatique','grece','anatolie','fjords','baltique','riviera','carpates'];
export const cardArtUrl=v=>CARD_ART.includes(v?.id)?`assets/voyages/cartes/${v.id}.webp`:'';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pl=(n,one,many)=>n>1?many:one;

// Petites images des objectifs, dans les couleurs des cases de la carte.
const ICON={
 ville:`<rect width="44" height="30" fill="#e9dfc2"/>${[[12,22,'#f0dfbf'],[22,18,'#e9cfa4'],[32,22,'#f6e7c1']].map(([x,y,c])=>`<g transform="translate(${x} ${y}) scale(.7)"><rect x="-9" y="-10" width="18" height="12" fill="${c}" stroke="#8a6a44" stroke-width=".8"/><path d="M-11 -10 L0 -18 L11 -10Z" fill="#b8432e"/></g>`).join('')}`,
 montagne:`<rect width="44" height="30" fill="#cfe2ea"/><path d="M0 30 L14 8 L24 22 L32 10 L44 30Z" fill="#7c8c98"/><path d="M11 13 L14 8 L17 13Z M29 14 L32 10 L35 14Z" fill="#fbf6ea"/>`,
 chaine:`<rect width="44" height="30" fill="#cfe2ea"/><path d="M0 30 L9 12 L16 22 L22 9 L29 21 L35 11 L44 30Z" fill="#7c8c98"/><path d="M7 16 L9 12 L11 16Z M20 13 L22 9 L24 13Z M33 15 L35 11 L37 15Z" fill="#fbf6ea"/>`,
 moyenne:`<rect width="44" height="30" fill="#d9e8cf"/><path d="M0 30 Q10 10 22 20 Q32 8 44 22 V30Z" fill="#7fa36a"/><circle cx="12" cy="19" r="2.6" fill="#4b7a55"/><circle cx="31" cy="16" r="2.6" fill="#4b7a55"/>`,
 cote:`<rect width="44" height="30" fill="#3f86b0"/><path d="M0 0 H22 Q30 10 24 18 Q18 26 26 30 H0Z" fill="#8db06c"/><path d="M22 0 Q30 10 24 18 Q18 26 26 30" stroke="#e8d8a8" stroke-width="3" fill="none"/><path d="M32 12 q3 -2 6 0" stroke="#cfeaf5" fill="none"/>`,
 plaine:`<rect width="44" height="30" fill="#9db86a"/><path d="M0 10 L44 6 M0 20 L44 17" stroke="#b9cf86" stroke-width="4"/><circle cx="34" cy="22" r="4" fill="#4b7a55"/>`,
 col:`<rect width="44" height="30" fill="#cfe2ea"/><path d="M0 30 L22 6 L44 30Z" fill="#7c8c98"/><path d="M17 12 L22 6 L27 12Z" fill="#fbf6ea"/><path d="M8 30 Q16 24 20 20 Q26 16 24 12" stroke="#e8d8a8" stroke-width="2" fill="none"/><path d="M22 6 V0 M22 0 h7 v4 h-7" stroke="#5a4232" fill="#f2a541" stroke-width=".8"/>`};
export const objectiveIcon=k=>`<svg viewBox="0 0 44 30" aria-hidden="true">${ICON[k]||ICON.plaine}</svg>`;

// Les objectifs de la carte, dans une phrase courte + une précision (mêmes chiffres que les règles).
export function voyageObjectives(v){
 const o=[];
 if(v.cities)o.push(['ville',`${v.cities} ${pl(v.cities,'ville','villes')}`,pl(v.cities,'intermédiaire','intermédiaires')]);
 if(v.mountain&&v.mountainRun)o.push(['montagne',`${v.mountain} montagnes`,`dont ${v.mountainRun} d’affilée`]);
 else if(v.mountainRun)o.push(['montagne',`${v.mountainRun} montagnes d’affilée`,'une chaîne sans coupure']);
 else if(v.mountain)o.push(['montagne',`${v.mountain} ${pl(v.mountain,'montagne','montagnes')}`,pl(v.mountain,'case montagne','cases montagne')]);
 if(v.chains)o.push(['chaine',`${v.chains} chaînes de montagnes`,'2 montagnes à la suite, chaque fois']);
 if(v.coast&&v.coastRun)o.push(['cote',`${v.coast} côtes`,`dont ${v.coastRun} d’affilée`]);
 else if(v.coastRun)o.push(['cote',`${v.coastRun} côtes d’affilée`,'le long de la mer']);
 else if(v.coast)o.push(['cote',`${v.coast} ${pl(v.coast,'côte','côtes')}`,pl(v.coast,'case côtière','cases côtières')]);
 if(v.plain&&v.plainRun)o.push(['plaine',`${v.plain} plaines`,`dont ${v.plainRun} d’affilée`]);
 else if(v.plainRun)o.push(['plaine',`${v.plainRun} plaines d’affilée`,'de longues lignes droites']);
 else if(v.plain)o.push(['plaine',`${v.plain} ${pl(v.plain,'plaine','plaines')}`,pl(v.plain,'case plaine','cases plaine')]);
 if(v.hills)o.push(['moyenne',`${v.hills} ${pl(v.hills,'moyenne montagne','moyennes montagnes')}`,'collines et piémonts']);
 if(v.cols)o.push(['col',`${v.cols} ${pl(v.cols,'col mythique','cols mythiques')}`,'à franchir en selle']);
 return o;
}

// La carte complète. opts.rows : progression (cases cochées) ; opts.compact : version plus petite.
export function voyageCard(v,opts={}){
 const t=voyageTier(v),art=cardArtUrl(v),len=VOYAGE_LENGTHS[v.id],done=opts.done||[];
 const objs=voyageObjectives(v);
 return `<article class="vcard${opts.compact?' vcard-compact':''}" style="--vc:${esc(v.color)}">
  <div class="vcard-in">
   <div class="vcard-art"${art?` style="background-image:url('${art}')"`:''} role="img" aria-label="${esc(v.title)} : de ${esc(v.from)} à ${esc(v.to)}"><span class="vcard-tag">Carte voyage</span></div>
   <header class="vcard-head"><h3>${esc(v.title)}</h3><p class="vcard-route">${esc(v.from)}<i aria-hidden="true"></i>${esc(v.to)}</p></header>
   <ul class="vcard-obj">${objs.map(([k,a,b],i)=>`<li class="${done[i]?'done':''}">${objectiveIcon(k)}<span>${esc(a)}<b>${esc(b)}</b></span><em aria-hidden="true"></em></li>`).join('')}</ul>
   <footer class="vcard-foot"><span>${len?`Environ ${len} cases`:''}</span><span class="vcard-tier">${esc(t.name)}</span><span class="vcard-pts"><b>${t.points}</b> points</span></footer>
  </div>
 </article>`;
}

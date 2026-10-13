const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const categoryLabel={positive:'Positive',negative:'Négative',climatic:'Climatique',permanent:'Bonus permanent'};
function cardIconSvg(card){let shape='';
 if(card.category==='positive')shape='<circle cx="24" cy="14" r="6"/><circle cx="34" cy="23" r="6"/><circle cx="24" cy="32" r="6"/><circle cx="14" cy="23" r="6"/><path d="M24 27v17"/>';
 else if(card.category==='negative')shape='<path d="M24 5 45 42H3Z"/><path d="M24 17v13"/><circle cx="24" cy="36" r="1"/>';
 else if(card.category==='permanent')shape='<path d="m24 4 5.5 13 14 1.2-10.6 9.2L36 42 24 34l-12 8 3.1-14.6L4.5 18.2l14-1.2Z"/><circle cx="24" cy="24" r="4"/>';
 else if(['heatwave'].includes(card.effectType))shape='<circle cx="24" cy="24" r="10"/><path d="M24 3v7m0 28v7M3 24h7m28 0h7M9 9l5 5m20 20 5 5M39 9l-5 5M14 34l-5 5"/>';
 else if(['mountain_snow','morning_frost','freezing_cold'].includes(card.effectType))shape='<path d="M24 3v42M5 14l38 20M5 34l38-20M17 9l7 7 7-7M17 39l7-7 7 7"/>';
 else if(['headwind_now','crosswind'].includes(card.effectType))shape='<path d="M3 15h31c8 0 8-10 0-10-4 0-6 3-6 5M3 25h40M3 35h27c8 0 8 10 0 10-4 0-6-3-6-5"/>';
 else shape='<path d="M10 29a9 9 0 0 1 3-17 13 13 0 0 1 23 5 8 8 0 0 1 2 16H10Z"/><path d="m15 36-2 7m12-7-2 7m12-7-2 7"/>';
 return `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">${shape}</svg>`;
}
export function eventFace(card,actions='',compact=false){if(!card)return '';
 return `<article class="event-face ${card.category}${compact?' compact':''}" style="--event-color:${card.color}" aria-label="Carte événement ${esc(card.name)}">
 <div class="event-face-banner">CARTE ÉVÉNEMENT <span>№ ${String(card.number).padStart(2,'0')}</span></div>
 <div class="event-face-body"><span class="event-face-category">${categoryLabel[card.category]}</span><div class="event-face-icon" aria-hidden="true">${cardIconSvg(card)}</div><h3>${esc(card.name)}</h3><p class="event-face-flavour">« ${esc(card.description)} »</p><div class="event-face-effect"><strong>EFFET</strong><p>${esc(card.effectText)}</p></div></div>
 ${actions?`<div class="event-face-actions">${actions}</div>`:''}</article>`;
}

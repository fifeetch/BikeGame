// Écran « Partie terminée » (17 octobre, planche « Statistiques de fin » validée par Fi) :
// pour chaque joueur, d'où viennent ses points (avec le détail de chaque point d'aventure, jour par jour),
// ses voyages, sa route par terrain, ses nuits, ses repas et ses cartes. Tout est tiré du journal de la partie.
import {findVoyage} from './voyages.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CATS=[
 ['voyages','Voyages','#f2a541'],['cols','Cols','#7d8790'],['lieux','Lieux cachés','#b74732'],['cartes','Cartes','#9cc25a'],
 ['accueil','Hospitalité','#267b91'],['rencontres','Rencontres','#8a5ab0'],['pret','Prêt','#5a4a2c'],['autres','Autres','#c9a46a']];
const CAT=Object.fromEntries(CATS.map(([id,name,color])=>[id,{name,color}]));
const TERRAINS=[['plaine','Plaine','#9cc25a'],['ville','Ville','#b74732'],['moyenne_montagne','Moy. montagne','#c9a46a'],['cote','Côte','#3e8fb0'],['col','Col','#f2a541'],['montagne','Montagne','#7d8790']];
const NIGHTS=[['demander','chez l’habitant','#c9a46a','M4 18 L4 9 L13 3 L22 9 L22 18Z'],['hotel','hôtel','#e0913a','M5 18 V5 H21 V18Z'],['camping','camping','#3e8fb0','M3 18 L13 4 L23 18Z'],['bivouac','bivouac','#9cc25a','M3 18 L13 5 L23 18Z'],['dehors','dehors','#f2c14e','M2 18 H24']];

function category(h){const k=h.kind||'';
 if(k==='col'||k==='climber')return 'cols';
 if(k==='objective'||k==='voyage'||k==='bonus')return 'voyages';
 if(k==='landmark')return 'lieux';
 if(k.startsWith('card'))return 'cartes';
 if(k==='rest'||k==='night')return 'accueil';
 if(k==='loan')return 'pret';
 if(/encounter|scene|situation|carnet|companion/.test(k))return 'rencontres';
 return 'autres';}
// Anciennes parties (avant le 17 octobre) : les points se lisent dans le texte du journal.
function parsedPoints(h){const t=String(h.text||'');let r=t.match(/Gagne immédiatement (\d+) points? Aventure/i);if(r)return +r[1];
 r=t.match(/\(\+(\d+) points?/);if(r)return +r[1];r=t.match(/([+−-])\s?(\d+) points? d’aventure/);if(r)return (r[1]==='+'?1:-1)*(+r[2]);
 r=t.match(/[,:]\s*\+(\d+) points?/);return r?+r[1]:0;}
function cleanLabel(h){let t=String(h.text||'').replace(/\s*\(\+\d+ points?[^)]*\)/,'');if(String(h.kind).startsWith('card')&&t.includes(' : '))t=t.split(' : ')[0];if(h.name&&t.startsWith(h.name+' '))t=t.slice(h.name.length+1);t=t.replace(/^joue /,'Carte jouée : ');t=t.replace(/^Voyage terminé sans tous les objectifs : (.*)$/,'$1 (objectifs incomplets, −40 %)').replace(/^Objectif accompli : /,'Voyage réussi : ');t=t.replace(/\s*:\s*[+−-]\s?\d+ points? d’aventure\.?$/,'').replace(/,\s*\+\d+ points? d’aventure\.?$/,'').replace(/\.$/,'');
 if(h.kind==='rest'&&/accueil/i.test(t))t='Grand accueil chez l’habitant';
 return t.length>90?t.slice(0,88)+'…':t;}

export function pointLines(m,p){const H=m.history||[],start=H.findIndex(h=>h.ptsInit),stamped=H.some(h=>h.pts),out=[];
 H.forEach((h,i)=>{let d=0;if(stamped&&(start<0||i>=start))d=h.pts?.[p.id]||0;else if(h.player===p.id)d=parsedPoints(h);
  if(d)out.push({day:h.round,pts:d,cat:category(h),label:cleanLabel(h)});});
 return out;}

export function playerStats(m,p){const H=(m.history||[]).filter(h=>h.player===p.id),lines=pointLines(m,p);
 const byCat={};for(const l of lines)byCat[l.cat]=(byCat[l.cat]||0)+l.pts;
 const listed=lines.reduce((n,l)=>n+l.pts,0);if(p.points!==listed&&lines.length)byCat.autres=(byCat.autres||0)+(p.points-listed);
 const terrain={};for(const s of p.travelHistory||[])terrain[s.type]=(terrain[s.type]||0)+1;
 const nights={};for(const n of p.nights||[])nights[n.kind]=(nights[n.kind]||0)+1;
 const train=H.filter(h=>h.kind==='fast-travel').reduce((n,h)=>n+(+(String(h.text).match(/\((\d+) cases/)?.[1]||0)),0);
 const cols=H.filter(h=>h.kind==='col').map(h=>String(h.text).split(' franchi')[0]);
 const voyages=(p.voyagesDone||[]).map(v=>({title:findVoyage(v.id)?.title||v.id,points:v.points,partial:Boolean(v.partial)||H.some(h=>h.kind==='objective'&&/sans tous/.test(h.text)&&h.text.includes(findVoyage(v.id)?.title||'§'))}));
 if(p.voyage&&!p.completed)voyages.push({title:findVoyage(p.voyage)?.title||p.voyage,current:true});
 const played=H.filter(h=>h.kind==='card-play'||h.kind==='card-bonus'||h.kind==='card-attack-sent'||(h.kind==='card-attack'&&String(h.text).startsWith(p.name+' joue'))).length;
 const suffered=H.filter(h=>h.kind==='card-result'&&String(h.text).startsWith(p.name+' subit')).length;
 return {lines,byCat,terrain,cases:(p.travelHistory||[]).length,offroad:p.stats?.offroad||0,train,cols,nights,nightsTotal:(p.nights||[]).length,
  meals:H.filter(h=>h.kind==='food').length,energy:p.stats?.energySpent||0,played,suffered,voyages};}

const bar=(parts,label)=>{const total=parts.reduce((n,x)=>n+Math.max(0,x.v),0)||1;return `<div class="es-bar" role="img" aria-label="${esc(label)}">${parts.filter(x=>x.v>0).map(x=>`<span style="width:${(x.v/total*100).toFixed(1)}%;background:${x.c}"></span>`).join('')}</div>`;};
const legend=parts=>`<div class="es-legend">${parts.filter(x=>x.v).map(x=>`<span><i style="background:${x.c}"></i>${esc(x.n)} <b>${x.v}</b></span>`).join('')}</div>`;

function card(m,p,rank,st){
 const cats=CATS.map(([id,name,c])=>({n:name,c,v:st.byCat[id]||0}));
 const ter=TERRAINS.map(([id,name,c])=>({n:name,c,v:st.terrain[id]||0}));
 const grouped=CATS.map(([id])=>[id,st.lines.filter(l=>l.cat===id)]).filter(([,ls])=>ls.length);
 const nightCells=NIGHTS.filter(([id])=>st.nights[id]||['demander','camping','bivouac','dehors'].includes(id)).map(([id,name,c,d])=>`<div class="es-night"><svg viewBox="0 0 26 20" aria-hidden="true"><path d="${d}" fill="${id==='dehors'?'none':c}" stroke="#1b3b38" stroke-width="1.5"/>${id==='dehors'?'<circle cx="18" cy="7" r="4" fill="#f2c14e" stroke="#1b3b38" stroke-width="1.2"/>':''}</svg><b>${st.nights[id]||0}</b><span>${name}</span></div>`).join('');
 return `<article class="es-card">
  <div class="es-top"><span class="es-rank" style="background:${esc(p.color)}">${rank}</span><div><h3>${esc(p.name)}</h3><small>${esc(m.rules.bikes[p.bike]?.name||'')}${p.items?.length?' · '+esc(p.items.map(i=>m.rules.equipment[i]?.name||i).join(', ')):''}</small></div><div class="es-pts">${p.points}<small>points aventure</small></div></div>
  <div class="es-sec"><h4>D’où viennent les points</h4>${bar(cats,'Répartition des points')}${legend(cats)}
   <details class="es-detail"><summary>Le détail de chaque point (${st.lines.length} gain${st.lines.length>1?'s':''})</summary>${grouped.map(([id,ls])=>`<div class="es-group"><b style="color:${CAT[id].color}">${CAT[id].name}</b><ul>${ls.map(l=>`<li><span class="es-day">J${l.day}</span><span class="es-what">${esc(l.label)}</span><span class="es-gain ${l.pts<0?'neg':''}">${l.pts>0?'+':''}${l.pts}</span></li>`).join('')}</ul></div>`).join('')||'<p class="es-none">Aucun point gagné.</p>'}</details></div>
  <div class="es-sec"><h4>Les voyages</h4><div class="es-rows">${st.voyages.map(v=>`<div class="es-row"><span>${esc(v.title)}</span><span class="${v.partial?'warn':''}">${v.current?'en cours':`+${v.points} · ${v.partial?'objectifs incomplets −40 %':'complet ✓'}`}</span></div>`).join('')||'<div class="es-row"><span>Aucun voyage</span><span></span></div>'}</div></div>
  <div class="es-sec"><h4>La route · ${st.cases} cases${st.train?` + ${st.train} en train`:''}</h4>${bar(ter,'Cases par terrain')}${legend(ter)}
   <div class="es-rows">${st.cols.length?`<div class="es-row"><span>Cols mythiques</span><span>${esc(st.cols.join(' · '))}</span></div>`:''}${st.offroad?`<div class="es-row"><span>Hors route</span><span>${st.offroad} cases</span></div>`:''}</div></div>
  ${st.nightsTotal?`<div class="es-sec"><h4>Les nuits · ${st.nightsTotal}</h4><div class="es-nights">${nightCells}</div></div>`:''}
  <div class="es-sec"><h4>Le reste</h4><div class="es-mini"><div><b>${st.meals}</b><span>repas</span></div><div><b>${st.energy}</b><span>énergie dépensée</span></div><div><b>${st.played}</b><span>cartes jouées</span></div><div><b>${st.suffered}</b><span>cartes subies</span></div></div></div>
 </article>`;}

function highlights(m,stats){if(m.players.length<2)return '';const best=(f,min=1)=>{let w=null,v=-1;for(const p of m.players){const x=f(stats[p.id],p);if(x>v){v=x;w=p;}}return v>=min?{p:w,v}:null;};
 const out=[];const cols=best(s=>(s.terrain.col||0));if(cols)out.push(['Roi des cols',`${cols.p.name} · ${cols.v} col${cols.v>1?'s':''}`,stats[cols.p.id].cols.length?`dont ${stats[cols.p.id].cols.length} mythique${stats[cols.p.id].cols.length>1?'s':''}`:'']);
 const cote=best(s=>s.terrain.cote||0);if(cote)out.push(['Le plus de côtes',`${cote.p.name} · ${cote.v}`,'cases au bord de la mer']);
 let bv=null;for(const p of m.players)for(const v of stats[p.id].voyages)if(!v.current&&(!bv||v.points>bv.v.points))bv={p,v};if(bv)out.push(['Plus beau voyage',bv.v.title,`${bv.p.name} · +${bv.v.points}${bv.v.partial?' (objectifs incomplets)':', tous les objectifs remplis'}`]);
 const out4=best(s=>s.nights.dehors||0);if(out4)out.push(['Plus de nuits dehors',`${out4.p.name} · ${out4.v}`,'à la belle étoile']);
 const far=best(s=>s.cases);if(far)out.push(['Plus longue route',`${far.p.name} · ${far.v} cases`,'']);
 return `<div class="es-sec es-moments"><span class="eyebrow">Les moments de la partie</span><div class="es-hl">${out.slice(0,4).map(([k,v,s])=>`<div><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span>${s?`<span class="s">${esc(s)}</span>`:''}</div>`).join('')}</div></div>`;}

export function endStatsHtml(m,ranking){const stats=Object.fromEntries(m.players.map(p=>[p.id,playerStats(m,p)]));
 return `<div class="es-players">${ranking.map((p,i)=>card(m,p,i+1,stats[p.id])).join('')}</div>${highlights(m,stats)}`;}

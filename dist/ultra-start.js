// Le grand départ de l'ultra à Lisbonne (planche « Ultra · garage, départ, chrono », validée par Fi le 18 octobre) :
// la rue de la ville en fond (même dessin que l'arrivée en ville), le compte à rebours, puis le peloton s'élance. Toi en orange.
// Dessin seulement : aucune règle ici. Rien ne touche la page tant qu'on n'appelle pas ultraStartOpen.
import {townSvg} from './town-scene.js';
const JER=['#c8483a','#6fa8c9','#7fb28a','#f6e7c1','#9b6fc9','#d8c060','#e07a9a','#4d8c8c','#b06a3a','#5a7ac9'];
const n=v=>(+v).toFixed(2);
function rider(x,y,col,me,ph){const k=Math.sin(ph)*1.4,w=(cx)=>`<circle cx="${cx}" cy="5.6" r="5.4" fill="none" stroke="#1b1406" stroke-width="1.5"/>`;
 return `<g transform="translate(${n(x)} ${n(y)}) scale(.62)">${w(-8)}${w(8)}<path d="M-8 5.6 L-3 -1 L6 -1 L8 5.6 M-3 -1 L0 5.6 L6 -1 M0 5.6 L-8 5.6" fill="none" stroke="${me?'#f2a541':'#26343c'}" stroke-width="1.7" stroke-linejoin="round"/><path d="M-2.6 -3.5 L${n(1+k)} 3" stroke="#26343c" stroke-width="2" stroke-linecap="round"/><path d="M-3 -3.5 L2 -10" stroke="${col}" stroke-width="3.6" stroke-linecap="round"/><path d="M1 -9 L6 -5" stroke="#d9a37f" stroke-width="1.5" stroke-linecap="round"/><circle cx="4" cy="-12.6" r="2.6" fill="#f2d1a8" stroke="#1b1406" stroke-width=".6"/><path d="M1.4 -13.4 a2.7 2.7 0 0 1 5.3 0Z" fill="${me?'#c8483a':'#1b1406'}"/>${me?'<text x="3" y="-19" text-anchor="middle" font-size="6" font-weight="800" fill="#f2a541" stroke="#1b1406" stroke-width=".4" font-family="Barlow Condensed, sans-serif">TOI</text>':''}</g>`;}
function pack(){let s=7;const r=()=>(s=(s*9301+49297)%233280)/233280,out=[];
 for(let i=0;i<40;i++){const lane=i%3,col=Math.floor(i/3);out.push({x:-44-col*6.2-lane*2,y:8+lane*2.6,lane,v:1.4+r()*1.1,col:JER[Math.floor(r()*JER.length)],me:false,ph:r()*6});}
 out.push({x:-46,y:10.6,lane:1.5,v:2.7,col:'#f2a541',me:true,ph:0});return out.sort((a,b)=>a.y-b.y);}
const arch=`<g><rect x="-41" y="-28" width="2" height="34" fill="#f6e7c1" stroke="#1b1406" stroke-width=".6"/><rect x="-41" y="-28" width="2" height="34" fill="url(#usck)"/><rect x="-62" y="-36" width="44" height="9" rx="1.4" fill="#f2a541" stroke="#1b1406" stroke-width=".7"/><text x="-40" y="-29.6" text-anchor="middle" font-size="5.4" font-weight="800" fill="#1b1406" font-family="Barlow Condensed, sans-serif">PARTIDA · LISBOA</text><rect x="-61" y="-28" width="1.6" height="34" fill="#26343c"/><rect x="-20.6" y="-28" width="1.6" height="34" fill="#26343c"/><path d="M-40 5.6 V20" stroke="#f6e7c1" stroke-width="2.4" stroke-dasharray="1.4 1.4"/></g>`;
let raf=0;
export function ultraStartOpen({names=41,onClose}={}){ultraStartClose();if(typeof document==='undefined')return;
 const back=document.createElement('div');back.className='us-back';back.setAttribute('role','dialog');back.setAttribute('aria-label','Le grand départ');
 back.innerHTML=`<div class="us-modal"><div class="us-stage">${townSvg({region:'ouest',seed:3,signs:['Madrid 6','Porto 3']})}<svg class="us-over" viewBox="0 0 640 300" aria-hidden="true"><defs><pattern id="usck" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="#1b1406"/><rect x="1" y="1" width="1" height="1" fill="#1b1406"/></pattern></defs><rect class="us-dawn" width="640" height="300" fill="#2a3a5a"/><g transform="translate(320 240) scale(3)">${arch}<g class="us-pack"></g></g><g class="us-hud"></g></svg></div>
  <div class="us-bar"><div><span class="eyebrow">LUNDI · 6 H 00 · LISBONNE</span><h2>Le grand départ</h2><p>${names} coureurs sur la ligne. L’horloge démarre au premier coup de pédale et ne s’arrêtera plus.</p></div><button type="button" class="us-go">C’est parti →</button></div></div>`;
 document.body.appendChild(back);back.querySelector('.tw-dyn')?.remove();
 const P=pack(),g=back.querySelector('.us-pack'),hud=back.querySelector('.us-hud'),dawn=back.querySelector('.us-dawn'),t0=performance.now(),reduce=matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const frame=now=>{const t=reduce?9:(now-t0)/1000;let s='';
  for(const q of P){const go=Math.max(0,t-3-q.lane*.06),x=q.x+q.v*go*go*8;if(x<140)s+=rider(x,q.y,q.col,q.me,go*q.v*5+q.ph);}
  g.innerHTML=s;dawn.setAttribute('opacity',n(Math.max(0,.55-t*.06)));
  hud.innerHTML=t<3.2?`<rect width="640" height="300" fill="#102226" opacity=".45"/><text x="320" y="190" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="900" font-size="${t<3?120:84}" fill="${t<3?'#f6e7c1':'#f2a541'}" stroke="#1b1406" stroke-width="3">${t<3?3-Math.floor(t):'PARTEZ !'}</text>`:`<rect x="12" y="12" width="150" height="30" rx="8" fill="#102226" opacity=".85"/><text x="24" y="33" font-family="Barlow Condensed, sans-serif" font-weight="700" font-size="18" fill="#f2a541">⏱ Lun. 6 h 0${Math.min(9,Math.floor((t-3)*1.5))}</text>`;
  if(t<9)raf=requestAnimationFrame(frame);};
 raf=requestAnimationFrame(frame);
 const close=()=>{ultraStartClose();onClose?.();};back.querySelector('.us-go').onclick=close;back.querySelector('.us-go').focus?.();}
export function ultraStartClose(){if(typeof document==='undefined')return;cancelAnimationFrame(raf);document.querySelectorAll('.us-back').forEach(e=>e.remove());}

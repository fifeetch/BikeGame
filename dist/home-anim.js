// Écran d'accueil vivant (planche « Accueil plus vivant », choix B de Fi, 18 octobre) :
// la caméra suit un cycliste de Paris à Istanbul, la trace orange se dessine, les villes s'allument,
// le soir tombe puis le jour revient ; à l'arrivée des confettis, puis le voyage recommence.
import {MAP_CELLS} from './assets/europe/board-data.js';
const WAY=['Paris','Zurich','Vienne','Budapest','Belgrade','Sofia','Istanbul'];
const CITY=Object.fromEntries(MAP_CELLS.filter(c=>c.name).map(c=>[c.name,[c.x,c.y]]));
const NS='http://www.w3.org/2000/svg',n=v=>Math.round(v*10)/10;
 function riderFree(a,o={}){const f=(x,y)=>`${x.toFixed(2)} ${y.toFixed(2)}`;
  const W=cx=>{let s=`<circle class="rider-wheel" cx="${cx}" cy="5.6" r="5.4"/>`;for(let i=0;i<2;i++){const t=a+i*Math.PI/2,dx=Math.cos(t)*5.4,dy=Math.sin(t)*5.4;s+=`<line class="rider-spoke" x1="${(cx+dx).toFixed(2)}" y1="${(5.6+dy).toFixed(2)}" x2="${(cx-dx).toFixed(2)}" y2="${(5.6-dy).toFixed(2)}"/>`;}return s;};
  const stand=o.stand?1:0,tuck=o.tuck?1:0,low=o.low?1:0,hipX=-2.6+stand*2.4+tuck*.5,hipY=-3.5-stand*3.2+tuck,p1=f(Math.cos(a)*2.8,2+Math.sin(a)*2.8),p2=f(-Math.cos(a)*2.8,2-Math.sin(a)*2.8);
  const shX=2+stand*2.6+tuck*3,shY=-10-stand*2.2+tuck*4+low*1.2,hx=shX+2+tuck*1.6+low*1.4,hy=shY-2.6+low*2.4;
  let s=W(-8)+W(8)+'<path class="rider-frame" d="M-8 5.6 L-3 -1 L6 -1 L8 5.6 M-3 -1 L0 5.6 L6 -1 M0 5.6 L-8 5.6 M6 -1 L7 -5 L9.4 -5.3"/>'
   +'<rect class="rider-pannier" x="-13.4" y="-1.6" width="6.2" height="6.2" rx="1.3"/><rect class="rider-tent" x="-12.8" y="-5.2" width="9" height="3.6" rx="1.8"/>';
  if(o.noRider)return s;
  s+=`<path class="rider-leg back" d="M${f(hipX,hipY)} L${p2}"/><path class="rider-leg" d="M${f(hipX,hipY)} L${p1}"/>`;
  s+=o.cape?`<path class="rider-cape" d="M${f(hipX-3,hipY+1)} Q${f(shX-4,shY-1)} ${f(shX+1,shY-1)} L${f(shX+2,shY+3)} Q${f(hipX+2,hipY)} ${f(hipX-3,hipY+1)}Z"/>`:`<path class="rider-body" d="M${f(hipX-.4,hipY)} L${f(shX,shY)}"/>`;
  if(o.cheer){const w=Math.sin(o.cheer*10)*1.2;s+=`<path class="rider-arm" d="M${f(shX,shY+.5)} L${f(shX-2+w,shY-6)} M${f(shX,shY+.5)} L${f(shX+3-w,shY-6)}"/>`;}
  else if(o.eat){const up=(Math.sin(o.eat*5)+1)/2;s+=`<path class="rider-arm" d="M${f(shX,shY+.5)} L${f(shX+6,shY-1-up*1.5)}"/><circle class="rider-apple" cx="${(shX+7.6).toFixed(2)}" cy="${(shY-2-up*1.5).toFixed(2)}" r="2.2"/>`;}
  else s+=`<path class="rider-arm" d="M${f(shX,shY+.5)} L7.6 -5"/>`;
  s+=`<circle class="rider-head" cx="${hx.toFixed(2)}" cy="${hy.toFixed(2)}" r="2.6"/><path class="rider-helmet${o.cape?' cape':''}" d="M${f(hx-2.7,hy-.2)} A2.8 2.8 0 0 1 ${f(hx+2.7,hy-.4)} Z"/>`;
  if(o.sweat)s+=`<path class="rider-sweat" d="M${f(hx+3.6,hy-1)} q1 2 0 2.6 q-1 -.6 0 -2.6Z" style="opacity:${o.sweat}"/>`;
  return s;}

function route(){const pts=WAY.map(k=>CITY[k]).filter(Boolean),out=[];
 for(let i=0;i<pts.length-1;i++){const [x1,y1]=pts[i],[x2,y2]=pts[i+1],mx=(x1+x2)/2+(y2-y1)*.12,my=(y1+y2)/2-(x2-x1)*.12;for(let t=0;t<1;t+=.02){const a=(1-t)*(1-t),b=2*(1-t)*t,c=t*t;out.push([a*x1+b*mx+c*x2,a*y1+b*my+c*y2,i]);}}
 out.push([...pts.at(-1),pts.length-1]);const L=[0];for(let i=1;i<out.length;i++)L.push(L[i-1]+Math.hypot(out[i][0]-out[i-1][0],out[i][1]-out[i-1][1]));return {pts:out,L,total:L.at(-1)};}
function at(r,d){d=Math.max(0,Math.min(r.total,d));let i=1;while(i<r.L.length-1&&r.L[i]<d)i++;const k=(d-r.L[i-1])/((r.L[i]-r.L[i-1])||1),a=r.pts[i-1],b=r.pts[i];return {x:a[0]+(b[0]-a[0])*k,y:a[1]+(b[1]-a[1])*k,dir:b[0]>=a[0]?1:-1,leg:a[2]};}
let running=null;
export function homeAnimOn(){return Boolean(running&&document.contains(running.world));}
export function startHomeAnim(root){
 const world=root?.querySelector('.mc-world'),svg=world?.querySelector('svg');if(!world||!svg)return;
 if(running?.world===world)return;stopHomeAnim();
 if(matchMedia?.('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('reduce-motion'))return;
 world.classList.add('mc-live');const night=document.createElement('div');night.className='mc-night';world.after(night);
 const g=document.createElementNS(NS,'g');g.setAttribute('class','mc-live-layer');svg.append(g);
 const trace=document.createElementNS(NS,'path');trace.setAttribute('class','mc-trace');g.append(trace);
 const labels=WAY.map((nm,i)=>{const [x,y]=CITY[nm]||[0,0],t=document.createElementNS(NS,'text');t.setAttribute('class','mc-city');t.setAttribute('x',x+8);t.setAttribute('y',y-8);t.textContent=nm;t.style.opacity=i?0:1;g.append(t);return t;});
 const fx=document.createElementNS(NS,'g');g.append(fx);
 const rider=document.createElementNS(NS,'g');rider.setAttribute('class','rider-token free mc-live-rider');rider.innerHTML='<g class="rider-inner" style="--sym:1"><ellipse class="rider-shadow" cx="0" cy="10" rx="13" ry="3.4"></ellipse><g class="rider-flip" style="--rider:#b8432e"></g></g>';g.append(rider);
 const flip=rider.querySelector('.rider-flip'),r=route();
 const st={world,night,layer:g,raf:0};running=st;
 let d=0,last=performance.now(),crank=0,leg=0,hold=0;
 const confetti=()=>{const [x,y]=CITY.Istanbul||[0,0];for(let i=0;i<16;i++)setTimeout(()=>{if(running!==st)return;const c=document.createElementNS(NS,'rect');c.setAttribute('x',x);c.setAttribute('y',y);c.setAttribute('width',4);c.setAttribute('height',3);c.setAttribute('fill',['#f2a541','#b8432e','#5f8a6a','#f6e7c1'][i%4]);fx.append(c);const a=Math.random()*6.28,s=20+Math.random()*30;c.animate([{transform:'translate(0,0)'},{transform:`translate(${n(Math.cos(a)*s)}px,${n(Math.sin(a)*s-20)}px) rotate(${Math.round(Math.random()*360)}deg)`,opacity:0}],{duration:1400}).onfinish=()=>c.remove();},i*40);};
 const loop=now=>{if(running!==st)return;if(!document.contains(world)){stopHomeAnim();return;}
  const dt=Math.min(.05,(now-last)/1000);last=now;crank+=dt*9;
  if(hold>0){hold-=dt;if(hold<=0){d=0;leg=0;labels.forEach((l,i)=>l.style.opacity=i?0:1);}}else d+=38*dt;
  if(d>=r.total&&hold<=0){d=r.total;hold=3;labels.at(-1).style.opacity=1;confetti();}
  const p=at(r,d);rider.setAttribute('transform',`translate(${n(p.x)} ${n(p.y)}) scale(1.15)`);flip.innerHTML=riderFree(hold>0?0:crank);flip.setAttribute('transform',p.dir<0?'scale(-1 1)':'');
  if(p.leg>leg){leg=p.leg;labels[leg].style.opacity=1;labels[leg].animate?.([{transform:'scale(1.35)'},{transform:'scale(1)'}],{duration:500});}
  let dd='';for(let i=0;i<r.pts.length&&r.L[i]<=d;i++)dd+=(i?'L':'M')+n(r.pts[i][0])+' '+n(r.pts[i][1]);trace.setAttribute('d',dd||'M0 0');
  // caméra : zoom sur le cycliste, placé à droite du titre ; l'image remplit .mc-world comme le SVG (slice)
  const w=world.clientWidth,h=world.clientHeight,sc=Math.max(w/1261,h/842),ox=(w-1261*sc)/2,oy=(h-842*sc)/2,z=2.1,cx=ox+p.x*sc,cy=oy+p.y*sc;
  const vw=world.parentElement.clientWidth,vh=world.parentElement.clientHeight,left=world.offsetLeft,top=world.offsetTop;
  world.style.transform=`translate(${n(vw*.66-left-cx*z)}px,${n(vh*.55-top-cy*z)}px) scale(${z})`;
  night.style.opacity=(.38*(1-Math.cos(d/r.total*Math.PI*4))/2).toFixed(3);
  st.raf=requestAnimationFrame(loop);};
 st.raf=requestAnimationFrame(loop);
}
export function stopHomeAnim(){if(!running)return;cancelAnimationFrame(running.raf);running.layer?.remove();running.night?.remove();running.world?.classList.remove('mc-live');if(running.world)running.world.style.transform='';running=null;}

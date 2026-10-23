// Arrivée en ville : le carrefour (planche « Le carrefour de la ville », validée par Fi le 17 octobre).
// Dessin seulement : aucune règle ici. Même trait que les scènes du soir (night-scenes.js), en plein jour.
let C='#b8432e';
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),seg=(k,a,b)=>cl((k-a)/(b-a)),n=v=>(+v).toFixed(2);
const ease=t=>1-(1-t)*(1-t);
const wheel=(cx,cy,r)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1b1406" stroke-width="1.5"/>`;
const bike=()=>wheel(-8,5.6,5.4)+wheel(8,5.6,5.4)+`<path d="M-8 5.6 L-3 -1 L6 -1 L8 5.6 M-3 -1 L0 5.6 L6 -1 M0 5.6 L-8 5.6 M6 -1 L7 -5 L9.4 -5.3" fill="none" stroke="${C}" stroke-width="1.7" stroke-linejoin="round"/><rect x="-13.4" y="-1.6" width="6.2" height="6.2" rx="1.3" fill="#b8432e" stroke="#1b1406" stroke-width=".5"/><rect x="-12.8" y="-5.2" width="9" height="3.6" rx="1.8" fill="#5f8a6a" stroke="#1b1406" stroke-width=".5"/>`;
const riding=(x,dir=1)=>`<g transform="translate(${n(x)} 0) scale(${dir} 1)">${bike()}<path d="M-2.6 -3.5 L1 3" stroke="#26343c" stroke-width="2" stroke-linecap="round"/><path d="M-3 -3.5 L2 -10" stroke="${C}" stroke-width="3.4" stroke-linecap="round"/><path d="M1 -9 L6 -5" stroke="#d9a37f" stroke-width="1.5" stroke-linecap="round"/><circle cx="4" cy="-12.6" r="2.6" fill="#f2d1a8" stroke="#1b1406" stroke-width=".5"/><path d="M1.3 -12.8 A2.8 2.8 0 0 1 6.7 -13 Z" fill="#f6e7c1"/></g>`;
const parked=(x,rot=-8)=>`<g transform="translate(${n(x)} 0) rotate(${rot} -8 5.6)">${bike()}</g>`;
function person(x,{f=1,pose='stand',op=1,col,y=0,hair,s=1}={}){const torso=col||C;let legs='M0 -3 L-2 10 M0 -3 L2 10',arm=`M0 -10 L${-1*f} -4`,dy=0;
 if(pose==='walk'){const w=Math.sin(performance.now()/90+x)*2;legs=`M0 -3 L${n(-w)} 10 M0 -3 L${n(w)} 10`;}
 if(pose==='reach')arm=`M0 -10 L${6*f} -9`;
 if(pose==='knock'){const w=Math.sin(performance.now()/70)>0?0:1.4;arm=`M0 -10 L${n((5-w)*f)} -12`;}
 if(pose==='wave'){const w=Math.sin(performance.now()/120)*2;arm=`M0 -10 L${n(4*f)} ${n(-15+w)}`;}
 if(pose==='sit'){dy=6;legs=`M0 -3 L${6*f} -2 L${7*f} 4`;arm=`M0 -9 L${5*f} -5`;}
 const head=hair?`<path d="M-2.7 -14 Q0 -18 2.7 -14" fill="${hair}"/>`:`<path d="M-2.7 -13.8 A2.8 2.8 0 0 1 2.7 -14 Z" fill="#f6e7c1" stroke="#1b1406" stroke-width=".5"/>`;
 return `<g transform="translate(${n(x)} ${n(y+dy)}) scale(${s})" opacity="${n(op)}"><path d="${legs}" stroke="#26343c" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M0 -3 L0 -11" stroke="${torso}" stroke-width="3.4" stroke-linecap="round"/><path d="${arm}" stroke="#d9a37f" stroke-width="1.6" stroke-linecap="round" fill="none"/><circle cx="0" cy="-13.6" r="2.6" fill="#f2d1a8" stroke="#1b1406" stroke-width=".5"/>${head}</g>`;}
const tree=(x,y=0)=>`<g transform="translate(0 ${y})"><rect x="${x-1.2}" y="-6" width="2.4" height="17" fill="#5b4228"/><circle cx="${x}" cy="-12" r="8" fill="#3f6b4a"/><circle cx="${x-5}" cy="-7" r="5.5" fill="#4b7a55"/><circle cx="${x+5}" cy="-8" r="5.5" fill="#355c40"/></g>`;
const coin=(x,y,txt,p)=>p<=0||p>=1?'':`<g transform="translate(${n(x)} ${n(y-p*18)})" opacity="${n(1-p*p)}"><circle r="3.2" fill="#f2c14e" stroke="#8a5a14" stroke-width=".6"/><text x="5" y="1.4" font-size="4.4" font-weight="800" fill="#f6e7c1" stroke="#1b1406" stroke-width=".25" font-family="Barlow, sans-serif">${txt}</text></g>`;
const bubble=(x,y,txt)=>{const w=txt.length*1.9+5;return `<g transform="translate(${n(x)} ${n(y)})"><rect x="${n(-w/2)}" y="-5.4" width="${n(w)}" height="7.4" rx="2.4" fill="#fffaf0" stroke="#1b1406" stroke-width=".4"/><path d="M-1 2 L0 4.4 L1.6 2Z" fill="#fffaf0"/><text y=".2" text-anchor="middle" font-size="3.6" font-weight="700" fill="#1b3b38" font-family="Barlow, sans-serif">${txt}</text></g>`;};
const O='stroke="#1b1406" stroke-width=".6"',o4='stroke="#1b1406" stroke-width=".4"';

// ---- régions ----
const REG={
 ouest:{town:'Bordeaux',signs:['Paris 4','Madrid 6'],walls:['#ecdcb6','#e3cc9e','#f2e6c8','#d9c29a'],roof:'#b74732',type:'tile',shut:['#4a7fa8','#6f8f9c','#5f8a6a'],hills:'low',land:'spire'},
 alpes:{town:'Zurich',signs:['Milan 3','Vienne 5'],walls:['#f3ede0','#ebe2cd','#efe6d3'],wood:'#8a5a2e',roof:'#5a3a22',type:'chalet',shut:['#3f6a3a','#8a2f25','#4a6b8a'],hills:'alps',land:'chapel'},
 nord:{town:'Stockholm',signs:['Oslo 4','Tallinn 3'],walls:['#c8743a','#b5523b','#e3b65c','#8aa3ad','#d98f5a'],roof:'#3a3530',type:'step',shut:null,hills:'sea',land:'copper'},
 est:{town:'Varsovie',signs:['Vilnius 4','Kiev 6'],walls:['#cfe0c8','#f0cfc4','#f2e1a6','#c9d6e8','#e9c9a0'],roof:'#466457',type:'parapet',shut:null,hills:'low',land:'onion'},
 balkans:{town:'Sarajevo',signs:['Belgrade 3','Skopje 4'],walls:['#f4eee2','#ece1c9','#e2d2b2'],wood:'#5e3b22',roof:'#b9592e',type:'hip',shut:['#5e3b22'],hills:'green',land:'minaret'}
};
const SHOPS=[
 {id:'velo',x:-92,w:36,h:50,name:'Magasin de vélo',sign:'VÉLOS',ico:'🚲',col:'#5f8a6a',door:'right'},
 {id:'superette',x:-52,w:31,h:40,name:'Supérette',sign:'SUPÉRETTE',ico:'🛒',col:'#e0913a',door:'left'},
 {id:'resto',x:21,w:33,h:46,name:'Restaurant',sign:'RESTAURANT',ico:'🍽',col:'#b74732',door:'right'},
 {id:'hotel',x:58,w:36,h:60,name:'Hôtel',sign:'HÔTEL',ico:'🏨',col:'#4a7fa8',door:'mid'}
];
SHOPS.forEach(s=>{s.dx=s.door==='right'?s.x+s.w-12:s.door==='left'?s.x+5:s.x+s.w/2-3.5;s.dc=s.dx+3;});
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let region='ouest',seed=7,rnd=mulberry(seed),R=REG[region],signs=['',''];
const pick=a=>a[Math.floor(rnd()*a.length)];

// ---- ciel, montagnes, collines (repères du cadre des scènes de nuit, version jour) ----
function skyLayer(){let s=`<defs><linearGradient id="twday" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8cc2d6"/><stop offset="1" stop-color="#f6e2b4"/></linearGradient></defs><rect width="640" height="300" fill="url(#twday)"/><circle cx="560" cy="48" r="16" fill="#ffe7a0"/><circle cx="560" cy="48" r="24" fill="#ffe7a0" opacity=".3"/>`;
 if(R.hills==='alps')s+=`<path d="M0 150 L70 70 L120 115 L190 40 L260 120 L330 60 L400 110 L470 30 L540 100 L600 55 L640 85 L640 300 L0 300Z" fill="#7b8a96"/><path d="M175 57 L190 40 L206 58 L196 54 L188 60 Z M318 72 L330 60 L344 74 L334 70Z M455 47 L470 30 L487 49 L476 45 L468 51Z M590 64 L600 55 L612 66Z" fill="#f6f2e6"/><path d="M0 190 Q160 140 320 175 T640 160 L640 300 L0 300Z" fill="#6f9a5a"/>`;
 else if(R.hills==='sea')s+=`<rect y="168" width="640" height="30" fill="#6f9fb0"/><path d="M0 172 Q90 150 180 168 T380 162 T640 170 L640 176 L0 176Z" fill="#5d7f6a"/><path d="M40 182 h40 M300 188 h50 M500 180 h30" stroke="#d6eaf0" stroke-width="2" stroke-linecap="round"/>`;
 else if(R.hills==='green')s+=`<path d="M0 160 Q100 90 220 140 T430 115 T640 130 L640 300 L0 300Z" fill="#6f8f5a"/><path d="M0 190 Q140 140 300 170 T640 165 L640 300 L0 300Z" fill="#7fa266"/>`;
 else s+=`<path d="M0 170 L90 110 L170 160 L260 95 L350 150 L440 105 L540 160 L640 120 L640 300 L0 300Z" fill="#6f7d7f"/><path d="M0 195 Q160 160 320 185 T640 180 L640 300 L0 300Z" fill="#7f9a62"/>`;
 return s;}

// ---- monument au bout de la petite rue ----
function landmark(){const b=-12;switch(R.land){
 case 'spire':return `<rect x="-5" y="${b-22}" width="10" height="22" fill="#e3cc9e" ${O}/><path d="M-5 ${b-22} L0 ${b-42} L5 ${b-22}Z" fill="#6f7d84" ${O}/><circle cx="0" cy="${b-16}" r="2" fill="#f6e7c1" ${o4}/><path d="M0 ${b-42} v-4 M-1.5 ${b-44.5} h3" stroke="#1b1406" stroke-width=".6"/>`;
 case 'chapel':return `<rect x="-7" y="${b-12}" width="14" height="12" fill="#f3ede0" ${O}/><path d="M-9 ${b-12} L0 ${b-19} L9 ${b-12}Z" fill="#5a3a22" ${O}/><rect x="-2.5" y="${b-28}" width="5" height="11" fill="#f3ede0" ${O}/><path d="M-3.5 ${b-28} L0 ${b-36} L3.5 ${b-28}Z" fill="#5a3a22" ${O}/><circle cx="0" cy="${b-24}" r="1.2" fill="#2a3a46"/>`;
 case 'copper':return `<rect x="-5" y="${b-26}" width="10" height="26" fill="#b5523b" ${O}/><path d="M-5 ${b-26} L0 ${b-30} L5 ${b-26}Z M-3 ${b-30} L0 ${b-46} L3 ${b-30}Z" fill="#6fa89a" ${O}/><circle cx="0" cy="${b-18}" r="2" fill="#f6e7c1" ${o4}/>`;
 case 'onion':return `<rect x="-6" y="${b-18}" width="12" height="18" fill="#f2e1a6" ${O}/><rect x="-3" y="${b-26}" width="6" height="8" fill="#f2e1a6" ${O}/><path d="M-4.5 ${b-26} Q-6 ${b-31} 0 ${b-36} Q6 ${b-31} 4.5 ${b-26}Z" fill="#c8a43a" ${O}/><path d="M0 ${b-36} v-4 M-1.5 ${b-38.5} h3" stroke="#1b1406" stroke-width=".6"/><rect x="-1.5" y="${b-7}" width="3" height="7" fill="#5a3412"/>`;
 case 'minaret':return `<path d="M-14 ${b} L-14 ${b-8} Q-7 ${b-18} 0 ${b-8} L0 ${b}Z" fill="#e2d2b2" ${O}/><path d="M-13 ${b-9} Q-7 ${b-19} -1 ${b-9}" fill="#6f7d84" ${o4}/><rect x="5" y="${b-36}" width="4" height="36" fill="#f4eee2" ${O}/><rect x="4" y="${b-26}" width="6" height="1.6" fill="#e2d2b2" ${o4}/><path d="M5 ${b-36} L7 ${b-44} L9 ${b-36}Z" fill="#6f7d84" ${O}/>`;}}

// petites maisons du fond, de part et d'autre de la petite rue
function backRow(){let s='';const b=-12;[[-44,9,11],[-34,8,14],[-25,9,10],[-15,8,12],[7,8,13],[16,9,10],[26,8,14],[35,9,11]].forEach(([x,w,h])=>{const c=pick(R.walls),r=R.roof;
 s+=`<rect x="${x}" y="${b-h}" width="${w}" height="${h}" fill="${c}" ${o4}/>`;
 if(R.type==='step'){for(let i=0;i<3;i++)s+=`<rect x="${x+i*1.5}" y="${b-h-3*(i+1)+3}" width="${w-i*3}" height="3" fill="${c}" ${o4}/>`;}
 else s+=`<path d="M${x-1} ${b-h} L${x+w/2} ${b-h-(R.type==='chalet'?6:R.type==='hip'||R.type==='parapet'?3:4.5)} L${x+w+1} ${b-h}Z" fill="${r}" ${o4}/>`;
 s+=`<rect x="${x+2}" y="${b-h+3}" width="2" height="2.6" fill="#2a3a46"/><rect x="${x+w-4}" y="${b-h+3}" width="2" height="2.6" fill="#2a3a46"/>`;});
 return s;}

// ---- une boutique (dessin au même trait que l'hôtel et la maison du toc toc) ----
function windowAt(x,y,wall,sh){let s='';const lit=rnd()<.25;
 if(R.type==='est'||R.type==='parapet')s+=`<path d="M${x-1} ${y-.6} L${x+2.5} ${y-2.6} L${x+6} ${y-.6}Z" fill="${wall}" ${o4}/>`;
 if(sh)s+=`<rect x="${x-2}" y="${y}" width="2" height="6" fill="${sh}" ${o4}/><rect x="${x+5}" y="${y}" width="2" height="6" fill="${sh}" ${o4}/>`;
 s+=`<rect x="${x}" y="${y}" width="5" height="6" fill="${lit?'#f3d79a':'#2a3a46'}" stroke="#1b1406" stroke-width=".4"/><path d="M${x+2.5} ${y} v6 M${x} ${y+3} h5" stroke="${R.type==='step'?'#f6efe0':'#cdbf9f'}" stroke-width=".4"/>`;
 if(rnd()<.3)s+=`<rect x="${x-.6}" y="${y+6}" width="6.2" height="1.4" fill="#7a4a2c"/>`+[0,1.6,3.2,4.8].map(d=>`<circle cx="${x+.2+d}" cy="${y+5.6}" r=".8" fill="${pick(['#d9453a','#f2a541','#e46a9a'])}"/>`).join('');
 return s;}
function shop(s){const top=3-s.h,wall=pick(R.walls),sh=R.shut?pick(R.shut):null,x=s.x,w=s.w,X2=x+w;let g='';
 const chx=x+w*.7;g+=`<rect x="${n(chx)}" y="${top-8}" width="3.5" height="8" fill="${R.type==='step'?'#5d4a3e':'#7a4a2c'}" ${o4}/>`;
 // toit
 if(R.type==='tile')g+=`<path d="M${x-2} ${top} L${x+w/2} ${top-7} L${X2+2} ${top}Z" fill="${R.roof}" ${O}/><path d="M${x+2} ${top-1.4} L${X2-2} ${top-1.4} M${x+6} ${top-3} L${X2-6} ${top-3}" stroke="#8f3b26" stroke-width=".4"/>`;
 if(R.type==='chalet')g+=`<path d="M${x-5} ${top+1} L${x+w/2} ${top-10} L${X2+5} ${top+1}Z" fill="${R.roof}" ${O}/><path d="M${x+1} ${top} L${x+w/2} ${top-7.5} L${X2-1} ${top}Z" fill="${R.wood}" ${o4}/>`;
 if(R.type==='hip')g+=`<path d="M${x-3} ${top} L${x+5} ${top-6} L${X2-5} ${top-6} L${X2+3} ${top}Z" fill="${R.roof}" ${O}/>`;
 if(R.type==='parapet')g+=`<path d="M${x+2} ${top} L${x+6} ${top-6} L${X2-6} ${top-6} L${X2-2} ${top}Z" fill="${R.roof}" ${O}/>`;
 g+=`<rect x="${x}" y="${top}" width="${w}" height="${s.h}" fill="${wall}" ${O}/>`;
 if(R.type==='step'){let st='';for(let i=0;i<4;i++)st+=`<rect x="${n(x+i*w/9)}" y="${top-2.6*(i+1)}" width="${n(w-2*i*w/9)}" height="2.8" fill="${wall}" ${o4}/>`;g=g.replace(/<rect x="[^"]*" y="[^"]*" width="3.5"[^>]*>/,'')+st+`<circle cx="${x+w/2}" cy="${top-5}" r="1.6" fill="#2a3a46" ${o4}/>`;}
 if(R.type==='parapet')g+=`<rect x="${x-1}" y="${top-1}" width="${w+2}" height="2" fill="#efe6d3" ${o4}/>`+Array.from({length:Math.floor(w/6)},(_,i)=>`<rect x="${x+2+i*6}" y="${top-3}" width="2.4" height="2" fill="#efe6d3" ${o4}/>`).join('');
 if(R.type==='chalet')g+=`<rect x="${x}" y="${top}" width="${w}" height="${n((s.h-17)/2+1)}" fill="${R.wood}" ${o4}/>`+Array.from({length:Math.floor(w/3)},(_,i)=>`<path d="M${x+1.5+i*3} ${top} v${n((s.h-17)/2+1)}" stroke="#5a3a22" stroke-width=".3"/>`).join('');
 if(R.type==='tile'&&rnd()<.6){const yy=top+(s.h-17)/2;g+=`<path d="M${x} ${n(yy)} H${X2} M${x+w/3} ${top} V${n(yy)} M${x+2*w/3} ${top} V${n(yy)} M${x} ${top} L${x+w/3} ${n(yy)} M${X2} ${top} L${x+2*w/3} ${n(yy)}" stroke="#7a4a2c" stroke-width=".8"/>`;}
 // fenêtres des étages
 const cols=Math.max(2,Math.floor((w-4)/9)),gap=(w-cols*5)/(cols+1);
 for(let y=top+4;y+6<=-19;y+=10)for(let c=0;c<cols;c++)g+=windowAt(+n(x+gap+c*(5+gap)),y,wall,R.type==='tile'||R.type==='chalet'||R.type==='hip'?sh:null);
 if(R.type==='chalet')g+=`<path d="M${x+1} ${top+(s.h-17)/2+1} h${w-2}" stroke="#5a3a22" stroke-width="1"/>`+Array.from({length:Math.floor(w/2)},(_,i)=>`<path d="M${x+1.5+i*2} ${n(top+(s.h-17)/2+1)} v-2.6" stroke="#5a3a22" stroke-width=".35"/>`).join('');
 if(R.type==='hip'){const by=top+3,bh=Math.min(16,s.h-26);g+=`<rect x="${x+w*.18}" y="${by}" width="${n(w*.64)}" height="${bh}" fill="${R.wood}" ${O}/>`+Array.from({length:4},(_,i)=>`<rect x="${n(x+w*.22+i*w*.15)}" y="${by+3}" width="${n(w*.1)}" height="${bh-6}" fill="#f3d79a" ${o4}/><path d="M${n(x+w*.27+i*w*.15)} ${by+3} v${bh-6}" stroke="${R.wood}" stroke-width=".4"/>`).join('')+`<path d="M${x+w*.18} ${by+bh} l3 4 M${x+w*.82} ${by+bh} l-3 4" stroke="${R.wood}" stroke-width="1"/>`;}
 // devanture : enseigne, store qui bouge, vitrine, porte
 g+=`<rect x="${x+2}" y="-18" width="${w-4}" height="4.4" rx=".6" fill="#1b3b38" ${o4}/><text x="${x+w/2}" y="-14.7" text-anchor="middle" font-size="3.1" font-weight="800" fill="#f2a541" font-family="Fraunces, serif" letter-spacing=".15">${s.sign}</text>`;
 let aw='';const nb=Math.ceil(w/3);for(let i=0;i<nb;i++){const c=i%2?'#f6e7c1':s.col,ww=Math.min(3,w+1-i*3);aw+=`<rect x="${x-.5+i*3}" y="-13.4" width="${ww}" height="3.4" fill="${c}"/><circle cx="${x+1+i*3}" cy="-10" r="1.5" fill="${c}"/>`;}
 g+=`<g class="tw-awn">${aw}<path d="M${x-.5} -13.4 h${w+1}" stroke="#1b1406" stroke-width=".5"/></g>`;
 const winX=s.door==='left'?x+13:x+2,winW=s.door==='mid'?0:w-15;
 if(winW)g+=`<rect x="${winX}" y="-7.4" width="${winW}" height="8.6" fill="#cfe3e6" ${o4}/><path d="M${winX} -3 h${winW}" stroke="#a7c3c8" stroke-width=".3"/>`;
 g+=`<rect x="${s.dx}" y="-8" width="${s.door==='mid'?7:6}" height="11" fill="#5a3412" ${O}/><circle cx="${s.dx+(s.door==='mid'?5.6:4.8)}" cy="-2" r=".5" fill="#f2c14e"/><rect x="${s.dx-.6}" y="-8.8" width="${s.door==='mid'?8.2:7.2}" height="1" fill="${s.col}" ${o4}/>`;
 // ce qui fait chaque boutique
 if(s.id==='velo'){C=pick(['#b8432e','#4a7fa8','#c46f0e']);g+=`<g transform="translate(${winX+winW/2} -5.4) scale(.42)">${bike()}</g>`;C='#5f8a6a';g+=`<g transform="translate(${x-1} -1) scale(.42)">${parked(0,0)}</g>`;C='#b8432e';g+=`<circle cx="${x+w-4}" cy="-25" r="3" fill="none" stroke="#1b1406" stroke-width="1.1"/><path d="M${x+w-4} -28 v-2" stroke="#1b1406" stroke-width=".5"/>`;}
 if(s.id==='superette'){[[x+w-11,'#c94a3a'],[x+w-6,'#6f9a3a'],[x+w-1,'#f2a541']].forEach(([cx,fc],i)=>{g+=`<rect x="${cx-2}" y="0" width="4.6" height="3" fill="#a8774a" ${o4}/>`+[0,1.5,3].map(d=>`<circle cx="${cx-1.2+d}" cy="-.3" r=".9" fill="${fc}"/>`).join('');});g+=`<path d="M${winX+1} -5 h${winW-2} M${winX+1} -1.6 h${winW-2}" stroke="#a8774a" stroke-width=".6"/>`+Array.from({length:6},(_,i)=>`<rect x="${winX+1.5+i*2.4}" y="${i%2?-4.6:-1.2}" width="1.6" height="${i%2?1.6:2.2}" fill="${pick(['#c94a3a','#4a7fa8','#f2a541','#6f9a3a'])}"/>`).join('');}
 if(s.id==='resto'){g+=`<g><path d="M${x+6} -8 L${x+1} -5 L${x+11} -5Z" fill="#b74732" ${o4}/><path d="M${x+6} -5 v8" stroke="#1b1406" stroke-width=".4"/><rect x="${x+2.5}" y="-.4" width="7" height="1" fill="#f6e7c1" ${o4}/><path d="M${x+3.5} .6 v2.4 M${x+8.5} .6 v2.4" stroke="#1b1406" stroke-width=".4"/></g><rect x="${x+w-3}" y="-4" width="4" height="6" fill="#26343c" ${o4}/><path d="M${x+w-2.2} -2.4 h2.4 M${x+w-2.2} -1 h1.8 M${x+w-2.2} .4 h2" stroke="#f6e7c1" stroke-width=".3"/>`;}
 if(s.id==='hotel'){g+=`<rect x="${x+w/2-.3}" y="${top-14}" width=".6" height="14" fill="#26343c"/><path d="M${x+2} -24 h${w-4}" stroke="#1b1406" stroke-width=".8"/>`+Array.from({length:Math.floor((w-4)/1.6)},(_,i)=>`<path d="M${x+2.6+i*1.6} -24 v2.6" stroke="#1b1406" stroke-width=".3"/>`).join('')+`<path d="M${x+2} -21.4 h${w-4}" stroke="#1b1406" stroke-width=".5"/><circle cx="${s.dx-3}" cy="1" r="2" fill="#3f6b4a"/><rect x="${s.dx-4.4}" y="1.4" width="2.8" height="1.8" fill="#a8774a"/><circle cx="${s.dx+10}" cy="1" r="2" fill="#3f6b4a"/><rect x="${s.dx+8.6}" y="1.4" width="2.8" height="1.8" fill="#a8774a"/>`;
  g+=`<g transform="translate(${x+w-7} -20)" opacity=".95"><path d="M0 0 L-1.6 -1.4" stroke="#1b1406" stroke-width=".3"/><ellipse cx="0" cy="-.6" rx="1.4" ry="1" fill="#26343c"/><circle cx=".9" cy="-1.8" r=".8" fill="#26343c"/><path d="M.5 -2.4 l.2 -.6 l.4 .5 M1.1 -2.4 l.3 -.6 l.3 .6" fill="#26343c"/></g>`;}
 // contour orange au survol + étiquette
 const tagW=s.name.length*1.75+8;
 return `<g class="tw-shop" data-shop="${s.id}" data-action="market-go-${s.id}" tabindex="0" role="button" aria-label="Entrer : ${s.name}"><rect class="tw-hl" x="${x-2.5}" y="${top-13}" width="${w+5}" height="${s.h+16.5}" rx="2" fill="#f2a541" fill-opacity=".12" stroke="#f2a541" stroke-width="1"/>${g}</g>`;}

function worldLayer(){rnd=mulberry(seed*97+Object.keys(REG).indexOf(region));let s='';
 s+=`<rect x="-120" y="-20" width="240" height="25" fill="#c9b48e"/>`; // place au fond
 s+=landmark()+backRow();
 s+=tree(-50,-21)+tree(46,-22);
 s+=`<path d="M-9 3 L9 3 L4 -12 L-4 -12Z" fill="#c4ae86" ${o4}/>`+[-9,-6,-3].map(y=>`<path d="M${-6+y*.33} ${y} h${12-y*.66*-1+y*.66}" stroke="#ad9670" stroke-width=".3"/>`).join('');
 s+=`<g><ellipse cx="0" cy="-3" rx="6.5" ry="1.8" fill="#bfb6a2" ${o4}/><rect x="-.8" y="-9" width="1.6" height="6" fill="#bfb6a2" ${o4}/><ellipse cx="0" cy="-9" rx="2.8" ry=".8" fill="#bfb6a2" ${o4}/><ellipse cx="0" cy="-3.2" rx="5.4" ry="1.1" fill="#7fb6c8"/></g>`;
 SHOPS.forEach(sh=>s+=shop(sh));
 // trottoir, route pavée, passage piéton
 s+=`<rect x="-120" y="3" width="240" height="2.6" fill="#ddc9a0" ${o4}/><rect x="-120" y="5.6" width="240" height="20" fill="#bda781"/>`+Array.from({length:40},(_,i)=>`<path d="M${-118+i*6} ${8+(i%3)*4} h3" stroke="#a8916b" stroke-width=".4"/>`).join('')+[-8,-4,0,4,8].map(x=>`<rect x="${x-1.2}" y="6.4" width="2.4" height="3.6" fill="#efe3c6" opacity=".8"/>`).join('');
 // réverbère (celui de l'hôtel du soir) et panneau des villes voisines
 s+=`<rect x="-15.6" y="-18" width="1.2" height="21" fill="#26343c"/><rect x="-17.2" y="-20" width="4.4" height="2.4" rx="1" fill="#26343c"/>`;
 const [a,b]=signs;s+=`<rect x="14.4" y="-15" width="1.2" height="18" fill="#7a4a2c"/><path d="M15.6 -14 h${a.length*1.6+3} l2 1.6 l-2 1.6 h-${a.length*1.6+3}Z" fill="#f6e7c1" ${o4}/><text x="16.4" y="-11.6" font-size="2.3" font-weight="800" fill="#1b3b38" font-family="Barlow, sans-serif">${a} →</text><path d="M14.4 -9.6 h-${b.length*1.6+3} l-2 1.6 l2 1.6 h${b.length*1.6+3}Z" fill="#f6e7c1" ${o4}/><text x="13.6" y="-7.2" text-anchor="end" font-size="2.3" font-weight="800" fill="#1b3b38" font-family="Barlow, sans-serif">← ${b}</text>`;
 s+=`<g class="tw-fountain" role="button" aria-label="Fontaine : remplir les gourdes"><ellipse class="tw-fill-ring" cx="0" cy="-3" rx="9" ry="3.4" fill="none" stroke="#7cc4ee" stroke-width=".8"/><g class="tw-fill-hint"><rect x="-6" y="-21" width="18" height="5.6" rx="2.8" fill="#102226" stroke="#7cc4ee" stroke-width=".5"/><text x="3" y="-17.1" text-anchor="middle" font-size="3.2" font-weight="700" fill="#f6e7c1" font-family="Barlow, sans-serif">💧 Remplir</text></g><rect x="-9" y="-13" width="18" height="13" fill="transparent"/></g>`;// fontaine cliquable (Bêta), par-dessus le panneau
 return s;}

// ---- animation de la rue ----
let st={phase:'arrive',t0:0,x:-120};
const kk=()=>(performance.now()-st.t0)/1000;
const shopById=id=>SHOPS.find(s=>s.id===id);
let riderColor='#b8432e';
function rideDur(dx){return Math.max(.5,Math.abs(dx)/42);}
function dynLayer(){const k=kk(),t=performance.now()/1000,Q=.74;let s='',front='';
 // eau de la fontaine, pigeons
 s+=Array.from({length:6},(_,i)=>{const p=(t*1.2+i/6)%1,dir=i%2?1:-1;return `<circle cx="${n(dir*p*4)}" cy="${n(-9+p*p*6-p*2)}" r=".45" fill="#bfe3ef" opacity="${n(1-p)}"/>`;}).join('');
 [[-4.5,1.7],[4,2.2],[6.2,1.6]].forEach(([px,py],i)=>{const b=Math.max(0,Math.sin(t*3+i*2))*.8;s+=`<g transform="translate(${px} ${py})"><ellipse cx="0" cy="0" rx="1.1" ry=".7" fill="#7d8790"/><circle cx="${i%2?-1:1}" cy="${n(-.6+b)}" r=".5" fill="#6a7480"/></g>`;});
 // fumée du restaurant, drapeau de l'hôtel
 const r=shopById('resto'),rx=r.x+r.w*.7+1.75,ry=3-r.h-8;s+=[0,1,2].map(i=>{const p=((t*.5+i/3)%1);return `<circle cx="${n(rx+p*4)}" cy="${n(ry-p*12)}" r="${n(1.2+p*2)}" fill="#e8e6dc" opacity="${n(.6*(1-p))}"/>`;}).join('');
 const h=shopById('hotel'),fx=h.x+h.w/2,fy=3-h.h-14,wv=Math.sin(t*4)*1.2;s+=`<path d="M${fx+.3} ${fy} q3 ${n(wv)} 7 0 v4 q-3.5 ${n(-wv)} -7 0Z" fill="#f2a541" ${o4}/>`;
 // passants sur le trottoir
 [['#6b4a8a',8,0,'#3a2a1c'],['#3f6b4a',-6,90,'#8a5a2e'],['#c46f0e',5,170,'#1b1406']].forEach(([col,sp,off,hair])=>{const x=((t*sp+off)%240+240)%240-120;front+=person(x,{f:Math.sign(sp),pose:'walk',col,hair,y:-1.4,s:.43});});
 // porte qui s'allume quand le cycliste entre
 const sh=st.shop&&shopById(st.shop);let doorGlow=0;
 C=riderColor;
 // cycliste (un peu plus petit que dans les scènes de nuit, pour tenir dans la rue)
 const RI=(x,d)=>riding(x/Q,d),PK=(x,r)=>parked(x/Q,r),PE=(x,o)=>person(x/Q,{...o,y:(o.y||0)/Q});
 let rider='';
 if(st.phase==='arrive'){const p=ease(seg(k,0,2.4));st.x=-120+120*p;rider=RI(st.x);if(k>=2.4){st={phase:'idle',t0:performance.now(),x:0};}}
 else if(st.phase==='idle'){rider=RI(st.x);if(k<3)rider+=bubble(st.x/Q+4,-21,'Où aller ?');}
 else if(st.phase==='go'){const bx=st.bx,d=st.dur,dir=bx>=st.x0?1:-1;
  if(k<d){rider=RI(st.x0+(bx-st.x0)*ease(k/d),dir);}
  else{rider=PK(bx,0);const w=seg(k,d+.35,d+1.15),px=bx+6+(sh.dc-bx-6)*w,py=-7.6*w;const fade=1-seg(k,d+1.5,d+1.9);
   const pose=k<d+.35?'stand':k<d+1.15?'walk':k<d+1.5?'knock':'walk';
   rider+=PE(px,{f:1,pose,y:py,s:1-.1*w,op:fade});
   if(k>=d+1.15&&k<d+1.5)rider+=`<text x="${n((sh.dc-6)/Q)}" y="-14" font-size="3.6" font-weight="800" fill="#f6e7c1" stroke="#1b1406" stroke-width=".3" font-family="Barlow, sans-serif">toc toc</text>`;
   doorGlow=seg(k,d+1.4,d+1.6);if(k>=d+2.1){const cb=st.done;st={phase:'inside',t0:performance.now(),x:bx,bx,shop:st.shop};cb?.();}}}
 else if(st.phase==='inside'){rider=PK(st.bx,0);doorGlow=1;}
 else if(st.phase==='out'){const bx=st.bx,w=seg(k,.3,1),px=sh.dc+(bx+6-sh.dc)*w,py=-7.6*(1-w);doorGlow=1-seg(k,.6,1);
  if(k<1.2)rider=PK(bx,0)+PE(px,{f:-1,pose:k<.3?'stand':'walk',y:py,s:.9+.1*w,op:seg(k,0,.3)});
  else{const d=rideDur(bx),q=ease(seg(k,1.2,1.2+d));rider=RI(bx+(0-bx)*q,bx>0?-1:1);if(k>=1.2+d)st={phase:'idle',t0:performance.now()-3000,x:0};}}
 if(sh&&doorGlow>0)s+=`<rect x="${sh.dx}" y="-8" width="${sh.door==='mid'?7:6}" height="11" fill="#ffd27a" opacity="${n(doorGlow*.9)}"/><path d="M${sh.dx} 3 L${sh.dx-4} 6 L${sh.dx+(sh.door==='mid'?11:10)} 6 L${sh.dx+(sh.door==='mid'?7:6)} 3Z" fill="#ffd27a" opacity="${n(doorGlow*.35)}"/>`;
 return s+front+`<g transform="translate(0 ${n(11*(1-Q))}) scale(${Q})">${rider}</g>`;}
function skyDyn(){const t=performance.now()/1000;return [[40,30,1],[260,50,.7],[470,26,1.2]].map(([x,y,sc],i)=>{const xx=((x+t*(6+i*2))%760)-60;return `<g transform="translate(${n(xx)} ${y}) scale(${sc})" fill="#fffaf0" opacity=".9"><ellipse cx="0" cy="0" rx="18" ry="6"/><ellipse cx="10" cy="-4" rx="10" ry="6"/><ellipse cx="-9" cy="-2" rx="8" ry="5"/></g>`;}).join('');}

// ---- intérieurs (même cadre que les scènes de nuit : 640 × 300, monde à l'échelle 4) ----
let act=null,actT=0;
function interior(id,k){const t=performance.now()/1000,a=act?(performance.now()-actT)/1000:-1;let s=`<rect width="640" height="226" fill="${id==='hotel'?'#e7d3ae':id==='resto'?'#efd7b0':id==='banque'?'#e3dccb':'#efe0bf'}"/><rect y="186" width="640" height="40" fill="${id==='resto'?'#b74732':'#c9b48e'}" opacity=".55"/><rect y="226" width="640" height="74" fill="#a8774a"/>`+[0,1,2,3,4,5,6,7].map(i=>`<path d="M${i*90} 226 v74" stroke="#8a5a2e" stroke-width="1.5"/>`).join('')+`<path d="M0 252 h640 M0 278 h640" stroke="#8a5a2e" stroke-width="1"/>`;
 s+=`<rect x="380" y="40" width="80" height="70" fill="#9cc9d8" stroke="#1b1406" stroke-width="2.4"/><path d="M420 40 v70 M380 75 h80" stroke="#1b1406" stroke-width="2"/><path d="M380 92 Q420 80 460 96 L460 110 L380 110Z" fill="#7f9a62"/>`;
 let w=`<rect x="-80" y="-34" width="14" height="45" fill="#5a3412" stroke="#1b1406" stroke-width=".6"/><rect x="-80" y="-34" width="14" height="45" fill="#ffd27a" opacity=".45"/>`;
 let keeper='',fx='';const enter=ease(seg(k,0,1.2)),cx=-73+63*enter;
 if(id==='velo'){w+=`<rect x="-50" y="-44" width="40" height="22" fill="#c9b48e" stroke="#1b1406" stroke-width=".6"/>`+Array.from({length:7},(_,i)=>`<path d="M${-46+i*5.4} -40 v${6+i%3*3}" stroke="#26343c" stroke-width="1.1" stroke-linecap="round"/>`).join('');
  C='#4a7fa8';w+=`<g transform="translate(-30 -12) scale(.9)">${bike()}</g>`;C='#5f8a6a';w+=`<g transform="translate(64 -24) rotate(-10) scale(.9)">${bike()}</g>`;C='#b8432e';
  w+=[0,1,2].map(i=>`<circle cx="62" cy="${7-i*3.2}" r="5" fill="none" stroke="#26343c" stroke-width="2"/>`).join('');
  w+=`<rect x="8" y="-6" width="40" height="17" fill="#8a5a2e" stroke="#1b1406" stroke-width=".6"/><rect x="6" y="-8" width="44" height="2.6" fill="#a8774a" stroke="#1b1406" stroke-width=".5"/>`;
  keeper=`<g transform="translate(0 -8)">${person(30,{f:-1,pose:a>=0&&a<1.4?'reach':'stand',col:'#3f6b4a',hair:'#3a2a1c'})}</g><rect x="26.6" y="-17" width="6.8" height="7" rx="1" fill="#5d7f6a" opacity=".9"/>`;}
 if(id==='superette'){[-55,-30].forEach(x=>{w+=`<rect x="${x}" y="-40" width="22" height="51" fill="#c9b48e" stroke="#1b1406" stroke-width=".6"/>`+[-28,-16,-4].map(y=>`<path d="M${x} ${y} h22" stroke="#1b1406" stroke-width=".5"/>`+Array.from({length:6},(_,i)=>`<rect x="${x+1.5+i*3.4}" y="${y-(i%2?5:6.5)}" width="2.6" height="${i%2?5:6.5}" fill="${['#c94a3a','#4a7fa8','#f2a541','#6f9a3a','#e46a9a','#f6e7c1'][(i+x)%6<0?(i+6+x%6)%6:(i+x)%6]}" stroke="#1b1406" stroke-width=".25"/>`).join('')).join('');});
  [[58,'#c94a3a'],[68,'#6f9a3a']].forEach(([x,c])=>{w+=`<rect x="${x-4}" y="5" width="9" height="6" fill="#a8774a" stroke="#1b1406" stroke-width=".5"/>`+[-2,0,2].map(d=>`<circle cx="${x+d}" cy="4.4" r="1.6" fill="${c}"/>`).join('');});
  w+=`<rect x="12" y="-4" width="32" height="15" fill="#7d8790" stroke="#1b1406" stroke-width=".6"/><rect x="34" y="-10" width="8" height="6" fill="#26343c" stroke="#1b1406" stroke-width=".5"/><rect x="35.2" y="-9" width="5.6" height="2.4" fill="#9fe0a8"/>`;
  keeper=`<g transform="translate(0 -8)">${person(26,{f:-1,pose:a>=0&&a<1.4?'reach':'stand',col:'#e0913a',hair:'#8a5a2e'})}</g>`;}
 if(id==='resto'){[-34,44].forEach(x=>{w+=`<rect x="${x-9}" y="0" width="18" height="2" fill="#f6e7c1" stroke="#1b1406" stroke-width=".5"/>`+Array.from({length:6},(_,i)=>`<rect x="${x-9+i*3}" y="0" width="1.5" height="2" fill="#b74732"/>`).join('')+`<path d="M${x-7} 2 v9 M${x+7} 2 v9" stroke="#5a3412" stroke-width="1"/>`;});
  [-34,44].forEach(x=>{w+=`<path d="M${x} -53 v14" stroke="#1b1406" stroke-width=".5"/><path d="M${x-4} -36 L${x} -40 L${x+4} -36Z" fill="#f2a541" stroke="#1b1406" stroke-width=".5"/>`;fx+=`<circle cx="${x}" cy="-34" r="9" fill="#ffd27a" opacity=".25"/>`;});
  w+=`<rect x="0" y="-30" width="26" height="14" fill="#5a3412" stroke="#1b1406" stroke-width=".6"/><rect x="2" y="-28" width="22" height="10" fill="#26343c"/>`;
  fx+=[0,1,2].map(i=>{const p=((t*.6+i/3)%1);return `<circle cx="${n(13+Math.sin(p*6)*2)}" cy="${n(-28-p*10)}" r="${n(1+p*2)}" fill="#f6f2e6" opacity="${n(.6*(1-p))}"/>`;}).join('');
  keeper=`<g>${person(a>=0&&a<1.6?44-seg(a,0,1)*70:20,{f:a>=0&&a<1?-1:1,pose:a>=0&&a<1?'walk':'stand',col:'#26343c',hair:'#1b1406'})}</g><rect x="${a>=0&&a<1.6?n(46-seg(a,0,1)*70):22}" y="-11" width="5" height="1" fill="#f6e7c1"/>`;}
 if(id==='hotel'){w+=`<rect x="-52" y="-42" width="28" height="22" fill="#7a4a2c" stroke="#1b1406" stroke-width=".6"/>`+Array.from({length:12},(_,i)=>`<path d="M${-49+(i%6)*4.4} ${-39+Math.floor(i/6)*9} v2" stroke="#1b1406" stroke-width=".4"/><rect x="${-49.8+(i%6)*4.4}" y="${-37+Math.floor(i/6)*9}" width="1.6" height="3" fill="#f2c14e"/>`).join('');
  w+=`<path d="M50 11 L50 -30 L78 -30" fill="none" stroke="#5a3412" stroke-width="1.6"/>`+Array.from({length:8},(_,i)=>`<path d="M${50+i*3.5} ${11-i*5} h3.5 v-5" fill="none" stroke="#1b1406" stroke-width=".6"/>`).join('');
  w+=`<rect x="10" y="-4" width="34" height="15" fill="#5a3412" stroke="#1b1406" stroke-width=".6"/><rect x="8" y="-6" width="38" height="2.4" fill="#8a5a2e" stroke="#1b1406" stroke-width=".5"/><path d="M38 -6 a2 2 0 0 1 4 0Z" fill="#f2c14e" stroke="#1b1406" stroke-width=".4"/><circle cx="-4" cy="5" r="5" fill="#3f6b4a"/><rect x="-7" y="6" width="6" height="5" fill="#a8774a" stroke="#1b1406" stroke-width=".4"/>`;
  keeper=`<g transform="translate(0 -8)">${person(26,{f:-1,pose:a>=0&&a<1.4?'reach':'stand',col:'#4a7fa8',hair:'#5a3a22'})}</g>`;}
 if(id==='banque'){// La banque (17 octobre) : guichet vitré, coffre-fort, banquier ; même trait que les autres boutiques.
  w+=`<rect x="-56" y="-46" width="30" height="40" rx="2" fill="#7d8790" stroke="#1b1406" stroke-width=".7"/><circle cx="-41" cy="-26" r="7" fill="#a9b3bb" stroke="#1b1406" stroke-width=".6"/><path d="M-41 -33 v14 M-48 -26 h14" stroke="#1b1406" stroke-width=".6"/><rect x="-54" y="-8" width="26" height="3" fill="#5c656d"/>`;
  w+=`<rect x="4" y="-40" width="48" height="6" fill="#1b3b38" stroke="#1b1406" stroke-width=".5"/><text x="28" y="-35.4" font-size="4.6" text-anchor="middle" fill="#f6e7c1" font-family="Barlow Condensed,sans-serif" font-weight="700" letter-spacing=".6">BANQUE</text>`;
  w+=`<rect x="6" y="-34" width="44" height="22" fill="#cfe6ee" opacity=".55" stroke="#1b1406" stroke-width=".6"/><path d="M28 -34 v22" stroke="#1b1406" stroke-width=".5"/>`;
  w+=`<rect x="2" y="-12" width="52" height="23" fill="#8a5a2e" stroke="#1b1406" stroke-width=".6"/><rect x="0" y="-14" width="56" height="2.6" fill="#a8774a" stroke="#1b1406" stroke-width=".5"/>`;
  w+=[0,1,2].map(i=>`<ellipse cx="${44+i*1.2}" cy="${-15-i*1.4}" rx="3" ry="1" fill="#f2c14e" stroke="#1b1406" stroke-width=".35"/>`).join('');
  keeper=`<g transform="translate(0 -14)">${person(18,{f:-1,pose:a>=0&&a<1.4?'reach':'stand',col:'#26343c',hair:'#8a8f94'})}</g><path d="M16.5 -27.5 l1.5 2 l1.5 -2" fill="#b74732" stroke="#1b1406" stroke-width=".3"/>`;}
 C=riderColor;
 // le cycliste entre puis agit
 let me;if(id==='resto'&&a>=1){me=person(-34+2,{f:1,pose:'sit',y:-7});fx+=`<ellipse cx="-31" cy="-.6" rx="3" ry=".9" fill="#f6e7c1" stroke="#1b1406" stroke-width=".3"/>`+[0,1].map(i=>{const p=((t*.7+i/2)%1);return `<path d="M${-32+i*2} ${n(-2-p*6)} q1 -1.5 0 -3" stroke="#f6f2e6" stroke-width=".5" fill="none" opacity="${n(1-p)}"/>`;}).join('');}
 else me=person(id==='resto'&&a>=0?cx-seg(a,0,1)*0:cx,{f:1,pose:k<1.2?'walk':'stand'});
 if(a>=0){fx+=coin(-6,-18,act.cost,seg(a,.2,1.4));if(a<2.6&&act.say)fx+=bubble(id==='resto'?20:26,-28,act.say);if(act.item&&a>=1&&a<3)fx+=`<text x="-14" y="${n(-20-seg(a,1,3)*6)}" font-size="8" opacity="${n(1-seg(a,2,3))}">${act.item}</text>`;}
 s+=`<g transform="translate(320 214) scale(4)">${w}${keeper}${me}${fx}</g>`;
 if(act&&a>=1.2&&act.badge)s+=`<g transform="translate(24 24)"><rect width="${act.badge.length*9.2+26}" height="34" rx="17" fill="#f6e7c1" stroke="#1b3b38" stroke-width="2"/><text x="13" y="23" font-size="17" font-weight="800" fill="#c46f0e" font-family="Barlow, sans-serif">${act.badge}</text></g>`;
 return s;}


// ---------- ce que le jeu utilise ----------
export const TOWN_SHOPS=SHOPS.map(({id,name,ico})=>({id,name,ico}));
export function townSvg({region:rg='ouest',seed:sd=1,signs:sg=['',''],color='#b8432e'}={}){region=REG[rg]?rg:'ouest';seed=sd;R=REG[region];signs=sg;riderColor=color||'#b8432e';
 return `<svg class="tw-street" viewBox="0 0 640 300" role="group" aria-label="Le carrefour de la ville : clique sur une boutique"><g>${skyLayer()}</g><g class="tw-skydyn"></g><g transform="translate(320 240) scale(3)">${worldLayer()}</g><g class="tw-dyn" transform="translate(320 240) scale(3)" pointer-events="none">${dynLayer()}</g></svg>`;}
export const townInsideSvg=id=>`<svg class="tw-inside" data-shop="${id}" viewBox="0 0 640 300" aria-hidden="true">${interior(id,9)}</svg>`;
let insideT=0;
// le cycliste arrive au carrefour
export function townArrive(){st={phase:'arrive',t0:performance.now(),x:-120};act=null;}
// reprendre là où il en était (après un nouvel affichage)
export const townBusy=()=>st.phase==='go'||st.phase==='out'||st.phase==='arrive';
export function townGo(id,done){const s=shopById(id);if(!s)return false;if(st.phase==='go')return false;const x0=st.phase==='idle'?st.x:0;const bx=s.dx-10;
 st={phase:'go',t0:performance.now(),x0,bx,dur:rideDur(bx-x0),shop:id,x:x0,done:()=>{insideT=performance.now();act=null;done?.();}};return true;}
export function townOut(){const s=st.shop&&shopById(st.shop);if(!s){st={phase:'idle',t0:performance.now()-3000,x:0};return;}st={phase:'out',t0:performance.now(),bx:st.bx,shop:st.shop,x:st.bx};act=null;}
export function townSkip(id){const s=shopById(id);st={phase:'inside',t0:performance.now(),x:s.dx-10,bx:s.dx-10,shop:id};insideT=performance.now()-9000;act=null;}
export function townAct(o){act=o;actT=performance.now();}
// Fluidité (23 oct.) : on ne réécrit une couche que si son dessin a changé.
function put(el,html){if(el.__art!==html){el.__art=html;el.innerHTML=html;}}
export function townTick(root=document){const dyn=root.querySelector('.tw-dyn');if(dyn)put(dyn,dynLayer());const sky=root.querySelector('.tw-skydyn');if(sky)put(sky,skyDyn());
 const ins=root.querySelector('.tw-inside');if(ins)put(ins,interior(ins.dataset.shop,(performance.now()-insideT)/1000));return Boolean(dyn||ins);}

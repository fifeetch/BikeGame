// Scènes du soir (planche « La nuit en images », validée par Fi le 16 octobre) : bivouac, camping, hôtel, demander.
// Dessin seulement : aucune règle ici. nightSceneSvg(id,k,{rain,outcome,color,badge}) rend l'image au temps k (secondes).
let C='#b8432e',rain=false;
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),seg=(k,a,b)=>cl((k-a)/(b-a)),n=v=>(+v).toFixed(2);
const wheel=(cx,cy,r)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1b1406" stroke-width="1.5"/>`;
const bike=()=>wheel(-8,5.6,5.4)+wheel(8,5.6,5.4)+`<path d="M-8 5.6 L-3 -1 L6 -1 L8 5.6 M-3 -1 L0 5.6 L6 -1 M0 5.6 L-8 5.6 M6 -1 L7 -5 L9.4 -5.3" fill="none" stroke="${C}" stroke-width="1.7" stroke-linejoin="round"/><rect x="-13.4" y="-1.6" width="6.2" height="6.2" rx="1.3" fill="#b8432e" stroke="#1b1406" stroke-width=".5"/><rect x="-12.8" y="-5.2" width="9" height="3.6" rx="1.8" fill="#5f8a6a" stroke="#1b1406" stroke-width=".5"/>`;
const riding=(x,dir=1)=>`<g transform="translate(${n(x)} 0) scale(${dir} 1)">${bike()}<path d="M-2.6 -3.5 L1 3" stroke="#26343c" stroke-width="2" stroke-linecap="round"/><path d="M-3 -3.5 L2 -10" stroke="${C}" stroke-width="3.4" stroke-linecap="round"/><path d="M1 -9 L6 -5" stroke="#d9a37f" stroke-width="1.5" stroke-linecap="round"/><circle cx="4" cy="-12.6" r="2.6" fill="#f2d1a8" stroke="#1b1406" stroke-width=".5"/><path d="M1.3 -12.8 A2.8 2.8 0 0 1 6.7 -13 Z" fill="#f6e7c1"/></g>`;
const parked=(x,rot=-8)=>`<g transform="translate(${n(x)} 0) rotate(${rot} -8 5.6)">${bike()}</g>`;
function person(x,{f=1,pose='stand',op=1}={}){let legs='M0 -3 L-2 10 M0 -3 L2 10',arm=`M0 -10 L${-1*f} -4`,dy=0;
 if(pose==='walk'){const s=Math.sin(performance.now()/90)*2;legs=`M0 -3 L${n(-s)} 10 M0 -3 L${n(s)} 10`;}
 if(pose==='reach')arm=`M0 -10 L${6*f} -9`;
 if(pose==='knock'){const s=Math.sin(performance.now()/70)>0?0:1.4;arm=`M0 -10 L${n((5-s)*f)} -12`;}
 if(pose==='shrug')arm='M0 -10 L-5 -14 M0 -10 L5 -14';
 if(pose==='point')arm=`M0 -10 L${7*f} -12`;
 if(pose==='sit'){dy=6;legs=`M0 -3 L${6*f} -2 L${7*f} 4`;arm=`M0 -9 L${5*f} -5`;}
 return `<g transform="translate(${n(x)} ${dy})" opacity="${n(op)}"><path d="${legs}" stroke="#26343c" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M0 -3 L0 -11" stroke="${C}" stroke-width="3.4" stroke-linecap="round"/><path d="${arm}" stroke="#d9a37f" stroke-width="1.6" stroke-linecap="round" fill="none"/><circle cx="0" cy="-13.6" r="2.6" fill="#f2d1a8" stroke="#1b1406" stroke-width=".5"/><path d="M-2.7 -13.8 A2.8 2.8 0 0 1 2.7 -14 Z" fill="#f6e7c1" stroke="#1b1406" stroke-width=".5"/></g>`;}
function tent(x,p,{col='#e0913a',glow=0,shake=0,w=10}={}){if(p<=0)return {b:'',l:''};const h=11*p,dx=shake?Math.sin(performance.now()/60)*.5:0;
 const b=`<path d="M${n(x-w)} 11 L${n(x+dx)} ${n(11-h)} L${n(x+w)} 11Z" fill="${col}" stroke="#1b1406" stroke-width=".6" stroke-linejoin="round"/><path d="M${n(x-3)} 11 L${n(x+dx*.6)} ${n(11-h*.62)} L${n(x+3)} 11Z" fill="#5a3412"/><path d="M${n(x-w-2)} 11.4 L${n(x-w)} 11 M${n(x+w)} 11 L${n(x+w+2)} 11.4" stroke="#1b1406" stroke-width=".5"/>`;
 const l=glow>0?`<path d="M${n(x-3)} 11 L${n(x+dx*.6)} ${n(11-h*.62)} L${n(x+3)} 11Z" fill="#ffd27a" opacity="${n(glow)}"/><path d="M${n(x-w)} 11 L${n(x+dx)} ${n(11-h)} L${n(x+w)} 11Z" fill="#ffd27a" opacity="${n(glow*.28)}"/>`:'';return {b,l};}
function fire(x,on){if(!on)return {b:'',l:''};const t=performance.now()/120,h=3+Math.sin(t)*.8+Math.sin(t*2.3)*.4;
 return {b:`<path d="M${x-3} 11 L${x+3} 9.6 M${x-3} 9.6 L${x+3} 11" stroke="#5b4228" stroke-width="1.2" stroke-linecap="round"/>`,
  l:`<circle cx="${x}" cy="8" r="13" fill="GLOW"/><path d="M${x-2} 10 Q${x-2.2} ${n(10-h*.6)} ${x} ${n(10-h)} Q${n(x+2.2)} ${n(10-h*.6)} ${x+2} 10Z" fill="#f2a541"/><path d="M${x-1} 10 Q${x-1} ${n(10-h*.4)} ${x} ${n(10-h*.7)} Q${x+1} ${n(10-h*.4)} ${x+1} 10Z" fill="#ffe08a"/>`};}
const tree=x=>`<rect x="${x-1.2}" y="-6" width="2.4" height="17" fill="#5b4228"/><circle cx="${x}" cy="-12" r="8" fill="#3f6b4a"/><circle cx="${x-5}" cy="-7" r="5.5" fill="#4b7a55"/><circle cx="${x+5}" cy="-8" r="5.5" fill="#355c40"/>`;
const coin=(x,y,txt,p,big)=>p<=0||p>=1?'':`<g transform="translate(${n(x)} ${n(y-p*18)})" opacity="${n(1-p*p)}"><circle r="3.2" fill="#f2c14e" stroke="#8a5a14" stroke-width=".6"/><text x="5" y="1.4" font-size="4.4" font-weight="800" fill="#f6e7c1" stroke="#1b1406" stroke-width=".25" font-family="Barlow, sans-serif">${txt}</text></g>`;
const zzz=(x,y,k)=>[0,1,2].map(i=>{const p=((k*0.6+i/3)%1);return `<text x="${n(x+p*6)}" y="${n(y-p*12)}" font-size="${n(3+p*2)}" font-weight="800" fill="#f6e7c1" opacity="${n(1-p)}" font-family="Fraunces, serif">z</text>`;}).join('');
const bubble=(x,y,txt)=>{const w=txt.length*1.9+5;return `<g transform="translate(${n(x)} ${n(y)})"><rect x="${n(-w/2)}" y="-5.4" width="${n(w)}" height="7.4" rx="2.4" fill="#fffaf0" stroke="#1b1406" stroke-width=".4"/><path d="M-1 2 L0 4.4 L1.6 2Z" fill="#fffaf0"/><text y=".2" text-anchor="middle" font-size="3.6" font-weight="700" fill="#1b3b38" font-family="Barlow, sans-serif">${txt}</text></g>`;};
// cadre commun : ciel du soir qui s'assombrit, étoiles, lune, montagnes, sol, voile de nuit, pluie
function frame(id,k,{dark,body,lights='',badge='',sub=''}){const night=rain?Math.min(1,dark+.25):dark;
 let s=`<defs><linearGradient id="sk${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${rain?'#7d8b96':'#e9a86b'}"/><stop offset="1" stop-color="${rain?'#b9c1c4':'#f6d9a8'}"/></linearGradient><radialGradient id="gl${id}"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient><linearGradient id="nt${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1834"/><stop offset="1" stop-color="#2a3a5c"/></linearGradient></defs>`;
 s+=`<rect width="640" height="300" fill="url(#sk${id})"/><rect width="640" height="300" fill="url(#nt${id})" opacity="${n(night)}"/>`;
 if(!rain){s+=[[60,40],[140,70],[210,30],[330,55],[420,25],[520,60],[590,35],[260,90],[480,95]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%3?1.2:1.8}" fill="#fffbe8" opacity="${n(cl(dark*1.6-.6)*(.6+.4*Math.sin(performance.now()/500+i)))}"/>`).join('');
  s+=`<g opacity="${n(cl(dark*1.4-.3))}"><circle cx="560" cy="58" r="16" fill="#f6ecc8"/><circle cx="567" cy="52" r="14" fill="url(#nt${id})"/></g>`;}
 else s+=`<g fill="#5e6a72" opacity=".85"><ellipse cx="160" cy="50" rx="90" ry="22"/><ellipse cx="420" cy="40" rx="120" ry="26"/><ellipse cx="600" cy="62" rx="80" ry="18"/></g>`;
 s+=`<path d="M0 170 L90 110 L170 160 L260 95 L350 150 L440 105 L540 160 L640 120 L640 300 L0 300Z" fill="#6f7d7f"/><rect y="226" width="640" height="80" fill="#7f9a62"/>`;
 s+=`<g transform="translate(320 214) scale(4)">${body}</g>`;
 s+=`<rect width="640" height="300" fill="#0b1630" opacity="${n(night*.42)}"/>`;
 s+=`<g transform="translate(320 214) scale(4)">${lights.replaceAll('GLOW',`url(#gl${id})`)}</g>`;
 if(rain){const t=performance.now()/1000;s+=`<g stroke="#cfe3f1" stroke-width="1.4" opacity=".55">`+Array.from({length:46},(_,i)=>{const x=(i*53.7)%660-10,y=((t*420+i*71)%340)-30;return `<path d="M${n(x)} ${n(y)} l-4 12"/>`;}).join('')+`</g>`;}
 if(badge)s+=`<g transform="translate(24 24)"><rect width="${badge.length*9.2+26}" height="34" rx="17" fill="#f6e7c1" stroke="#1b3b38" stroke-width="2"/><text x="13" y="23" font-size="17" font-weight="800" fill="#c46f0e" font-family="Barlow, sans-serif">${badge}</text></g>`;
 if(sub)s+=`<text x="616" y="284" text-anchor="end" font-size="15" font-weight="700" fill="#f6e7c1" font-family="Barlow, sans-serif">${sub}</text>`;
 return s;}

const L={bivouac:8,camping:8.6,hotel:8,demander:9.6};
function bivouac(k){const dark=cl((k-3)/2.6)*.88,ride=k<1.4,bx=ride?-92+k*45:-29;
 const tp=seg(k,2.0,3.4),inside=k>=5.4,f=fire(30,!rain&&k>=3.6),t=tent(6,tp,{glow:inside?.9:0,shake:rain&&k>3.4});
 let px=k<2?-14+seg(k,1.4,2)*10:k<3.4?-4:k<3.9?-4+seg(k,3.4,3.9)*44:40;
 let pose=k<2||(k>=3.4&&k<3.9)?'walk':k<3.4?'reach':'sit';if(rain&&k>=3.9){pose='stand';px=k<4.6?40-seg(k,3.9,4.6)*30:10;}
 const pop=inside?0:k>=5?1-seg(k,5,5.4):1;
 let body=tree(-46)+t.b+f.b+(ride?riding(bx):parked(bx))+(k>=1.4?person(px,{f:pose==='sit'?-1:1,pose,op:pop}):'');
 let lights=t.l+f.l+(inside&&k>=5.8?zzz(10,-2,k):'');
 return {dark,body,lights,badge:k>=6.1?(rain?'Nuit ? … le résultat arrive':'+1 ⚡ reposé'):'',sub:rain&&k>=6.1?'Sous la pluie, le bivouac reste un pari':''};}
function camping(k){const dark=cl((k-3.6)/2.6)*.8,bar=seg(k,2.2,2.7);
 let bx=k<1.2?-96+k*36:k<2.6?-52.8:k<3.6?-52.8+seg(k,2.6,3.6)*55:2;const rideNow=k<3.6;
 const hut=`<rect x="-46" y="-12" width="18" height="23" fill="#c9a36b" stroke="#1b1406" stroke-width=".6"/><path d="M-48 -12 L-37 -19 L-26 -12Z" fill="#8f3b26" stroke="#1b1406" stroke-width=".6"/><rect x="-42" y="-7" width="8" height="6" fill="#2a3a46"/><rect x="-47" y="-31" width="20" height="8" rx="1.5" fill="#f6e7c1" stroke="#1b3b38" stroke-width=".6"/><text x="-37" y="-25.6" text-anchor="middle" font-size="3.6" font-weight="800" fill="#1b3b38" font-family="Barlow, sans-serif">CAMPING</text><rect x="-37.6" y="-23" width="1.2" height="11" fill="#5b4228"/>`;
 const barrier=`<rect x="-27" y="2" width="2" height="9" fill="#26343c"/><g transform="rotate(${n(-bar*80)} -26 3)"><rect x="-26" y="2" width="22" height="1.8" fill="#f6e7c1" stroke="#b8432e" stroke-width=".5" stroke-dasharray="2 2"/></g>`;
 const t1=tent(54,1,{col:'#5d86b8',w:8,glow:dark>.4?.7:0}),t2=tent(72,1,{col:'#6f9a63',w:7,glow:dark>.5?.5:0});
 const tp=seg(k,3.9,5.0),inside=k>=5.8,t=tent(22,tp,{glow:inside?.9:0,shake:rain&&k>5});
 const px=k<3.9?14:k<5?32:k<5.6?32-seg(k,5,5.6)*8:24,pose=k<3.9?'walk':k<5?'reach':'walk',pop=inside?0:1;
 const lamp=`<rect x="38.4" y="-22" width="1.2" height="33" fill="#26343c"/><rect x="36.6" y="-24" width="4.8" height="2.4" rx="1" fill="#26343c"/>`;
 let body=hut+barrier+lamp+t1.b+t2.b+t.b+(rideNow?riding(bx):parked(bx))+(k>=3.6?person(px,{f:pose==='reach'?-1:1,pose,op:pop}):'');
 let lights=t1.l+t2.l+t.l+(dark>.3?`<circle cx="39" cy="-21" r="12" fill="GLOW" opacity="${n(dark)}"/><circle cx="39" cy="-21.4" r="1.6" fill="#ffe9a8"/>`:'')+`<rect x="-42" y="-7" width="8" height="6" fill="#ffd27a" opacity="${n(cl(dark*1.5))}"/>`+coin(-48+seg(k,1.3,2.1)*8,-14,'−1',seg(k,1.3,2.1))+(inside&&k>=6.2?zzz(26,-2,k):'');
 return {dark,body,lights,badge:k>=6.5?'+2 ⚡ reposé · −1 🪙':''};}
function hotel(k){const dark=cl((k-3)/2.6)*.85;let bx=k<2?-92+k*53:20;const enter=seg(k,2.8,3.6),door=k>=2.4&&k<3.9;
 const win=(x,y,on)=>`<rect x="${x}" y="${y}" width="6" height="7" fill="${on?'#ffd27a':'#2a3a46'}" stroke="#1b1406" stroke-width=".4"/>`;
 const wx=[30,40,50],wy=[-36,-24];
 let bld=`<rect x="24" y="-44" width="40" height="55" fill="#d9c4a0" stroke="#1b1406" stroke-width=".6"/><path d="M22 -44 L44 -52 L66 -44Z" fill="#8f3b26" stroke="#1b1406" stroke-width=".6"/><rect x="29" y="-15" width="30" height="7" rx="1.4" fill="#1b3b38"/><text x="44" y="-9.8" text-anchor="middle" font-size="4.6" font-weight="800" fill="#f2a541" font-family="Fraunces, serif">HÔTEL</text>`;
 wy.forEach(y=>wx.forEach(x=>bld+=win(x,y,false)));bld+=`<rect x="39" y="-3" width="9" height="14" fill="${door?'#ffd27a':'#5a3412'}" stroke="#1b1406" stroke-width=".5"/>`;
 const lit=k>=4.2&&k<6.2;
 let body=bld+`<rect x="4" y="-18" width="1.2" height="29" fill="#26343c"/><rect x="2.4" y="-20" width="4.4" height="2.4" rx="1" fill="#26343c"/>`+(k<2?riding(bx):`<g opacity="${n(1-enter)}" transform="translate(${n(enter*18)} 0)">${parked(bx,0)}${person(bx+12,{f:1,pose:k<2.8?'reach':'walk'})}</g>`);
 let lights=`<circle cx="5" cy="-18.8" r="11" fill="GLOW" opacity="${n(dark)}"/><circle cx="4.6" cy="-18.6" r="1.4" fill="#ffe9a8" opacity="${n(cl(dark*2))}"/>`+(lit?win(40,-36,true)+`<circle cx="43" cy="-32.5" r="9" fill="GLOW"/>`:'')+(door?`<rect x="39" y="-3" width="9" height="14" fill="#ffd27a" opacity=".6"/>`:'')+wy.map(y=>wx.map(x=>x===40&&y===-36?'':(dark>.5&&(x+y)%3===0?win(x,y,true):'')).join('')).join('')+coin(30,-6,'−3',seg(k,2.0,2.8))+(k>=6.2?zzz(44,-38,k):'');
 return {dark,body,lights,badge:k>=6.4?'+3 ⚡ reposé · −3 🪙':''};}
function demander(k,o){const dark=cl((k-2.6)/3)*.78;let bx=k<1.6?-92+k*56:-2;const open=k>=3.2&&!(o!==1&&k>=4.6+(o===2?-0.4:0)),warm=open;
 let house=`<rect x="20" y="-28" width="34" height="39" fill="#e6d2a8" stroke="#1b1406" stroke-width=".6"/><path d="M17 -28 L37 -42 L57 -28Z" fill="#7a4a2c" stroke="#1b1406" stroke-width=".6"/><rect x="47" y="-44" width="5" height="9" fill="#7a4a2c"/><rect x="26" y="-4" width="8" height="15" fill="${warm?'#ffd27a':'#5a3412'}" stroke="#1b1406" stroke-width=".5"/><rect x="40" y="-20" width="8" height="7" fill="#2a3a46" stroke="#1b1406" stroke-width=".4"/>`;
 house+=`<path d="M58 4 H82 M58 8 H82" stroke="#8a6a3a" stroke-width=".8"/>`+[58,64,70,76,82].map(x=>`<rect x="${x-.6}" y="1" width="1.2" height="10" fill="#8a6a3a"/>`).join('');
 const host=open?`<g transform="translate(30 0)"><path d="M0 -3 L-1.5 10 M0 -3 L1.5 10" stroke="#3a2a1c" stroke-width="2"/><path d="M0 -3 L0 -11" stroke="#6b4a8a" stroke-width="3.2" stroke-linecap="round"/>${o===1&&k>=3.6&&k<4.6?'<path d="M0 -10 L7 -13" stroke="#d9a37f" stroke-width="1.5" stroke-linecap="round"/>':''}<circle cx="0" cy="-13.6" r="2.4" fill="#e8c39a" stroke="#1b1406" stroke-width=".5"/><path d="M-2.6 -14.4 Q0 -18 2.6 -14.4" fill="#5a3a22"/></g>`:'';
 let px=k<1.6?0:k<2.2?10+seg(k,1.6,2.2)*8:18,pose=k<2.2?'walk':k<3.2?'knock':'stand',pop=1,riding2='';
 if(k>=3.6){if(o===0){pose=k<4.4?'stand':'walk';px=18+seg(k,4.4,5)*10;pop=1-seg(k,4.6,5);}
  else if(o===1){px=k<4.4?18:k<5.2?18+seg(k,4.4,5.2)*48:66;pose=k<4.4?'stand':k<5.2?'walk':'reach';if(k>=6.2)pop=0;}
  else{pose=k<4.4?'stand':k<5.2?'shrug':'walk';if(k>=5.6){pop=0;riding2=riding(-2-seg(k,5.6,7.2)*80,-1);}}}
 const t=o===1?tent(72,seg(k,5.2,6.2),{w:8,glow:k>=6.2?.9:0}):{b:'',l:''};
 let body=house+t.b+host+(k<1.6?riding(bx):(riding2?'':parked(bx)))+riding2+(k>=1.6&&pop>0?person(px,{f:1,pose,op:pop}):'');
 const smoke=o===0&&k>=5?[0,1,2].map(i=>{const p=((k*.5+i/3)%1);return `<circle cx="${n(49.5+p*4)}" cy="${n(-46-p*12)}" r="${n(1.4+p*2)}" fill="#d8d8d0" opacity="${n(.6*(1-p))}"/>`;}).join(''):'';
 let lights=t.l+smoke+(warm?`<rect x="26" y="-4" width="8" height="15" fill="#ffd27a" opacity=".5"/>`:'')+(o===0&&k>=5?`<rect x="40" y="-20" width="8" height="7" fill="#ffd27a"/>`:'')+(dark>.4?`<rect x="40" y="-20" width="8" height="7" fill="#ffd27a" opacity=".55"/>`:'');
 if(k>=2.2&&k<3.2)lights+=`<text x="20" y="-8" font-size="4" font-weight="800" fill="#f6e7c1" stroke="#1b1406" stroke-width=".3" font-family="Barlow, sans-serif">toc toc</text>`;
 if(k>=3.5&&k<4.8)lights+=bubble(30,-20,['Entrez donc !','Le jardin ?','Désolé…'][o]);
 if(o===0&&k>=5.6)lights+=zzz(46,-22,k);if(o===1&&k>=6.6)lights+=zzz(76,-4,k);
 const badge=k>=6.6?['+3 ⚡ chambre d’amis','+2 ⚡ coin du jardin','Refus → camping −3 🪙'][o]:'';
 return {dark,body,lights,badge};}

const SCENES={bivouac,camping,hotel,demander};
export const NIGHT_SCENE_LENGTH=L;
export function nightSceneSvg(id,k,{rain:wet=false,outcome=0,color='#b8432e',badge,sub,key=id}={}){C=color||'#b8432e';rain=Boolean(wet);
 const fn=SCENES[id];if(!fn)return '';const r=fn(Math.max(0,k),outcome);if(badge!==undefined)r.badge=badge;if(sub!==undefined)r.sub=sub;return frame(key,k,r);}

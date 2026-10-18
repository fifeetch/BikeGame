// Petites règles en images dans l'écran « Règles » (planche « Les petites règles en images », validée par Fi le 18 octobre).
const R=27,W=Math.sqrt(3)*R,COL={p:'#7fb05a',c:'#e6c779',mm:'#c19a63',m:'#8d8d8d',v:'#c8483a',s:'#2c6f86',col:'#8d8d8d'};
const at=(q,r)=>({x:36+W*q+W/2*(r%2),y:36+R*1.5*r});
const hex=(q,r,t,lab='',o={})=>{const {x,y}=at(q,r),pts=[...Array(6)].map((_,i)=>{const a=(60*i-90)*Math.PI/180;return `${(x+R*Math.cos(a)).toFixed(1)},${(y+R*Math.sin(a)).toFixed(1)}`;}).join(' ');
 return `<polygon points="${pts}" fill="${COL[t]}" stroke="#0c1b1f" stroke-width="2"/>${t==='col'?`<path d="M${x-2} ${y+8}V${y-10}l9 3-9 3" stroke="#f6e7c1" stroke-width="1.6" fill="#f2a541"/>`:''}${lab?`<text x="${x}" y="${y+5}" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="700" font-size="${o.fs||16}" fill="${o.fill||'#1b1406'}">${lab}</text>`:''}`;};
const line=(cells,color='#f2a541',dash='',dy=15)=>`<path d="${cells.map(([q,r],i)=>{const {x,y}=at(q,r);return (i?'L':'M')+x.toFixed(1)+' '+(y+dy).toFixed(1);}).join('')}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" ${dash?`stroke-dasharray="${dash}"`:''} opacity=".9"/>`;
const badge=(q,r,txt,ok=true)=>{const {x,y}=at(q,r);return `<circle cx="${x+14}" cy="${y-14}" r="9" fill="${ok?'#7fc8a9':'#e46a50'}" stroke="#0c1b1f" stroke-width="1.5"/><text x="${x+14}" y="${y-10}" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="700" font-size="12" fill="#0c1b1f">${txt}</text>`;};
const note=(x,y,txt,color)=>`<text x="${x}" y="${y}" font-family="Barlow, sans-serif" font-size="13" fill="${color}">${txt}</text>`;
const svg=(h,inner)=>`<svg viewBox="0 0 330 ${h}" role="img" aria-hidden="true">${inner}</svg>`;
const V={
 cote:{title:'Une côte touche la mer',text:'Toute case qui touche la mer est une côte, même si elle paraît verte sur le dessin.',
  draw:()=>svg(160,[hex(0,1,'p','Plaine',{fs:12}),hex(1,1,'p','Plaine',{fs:12}),hex(2,1,'c','Côte',{fs:12}),hex(3,1,'s'),hex(4,1,'s'),hex(2,0,'p'),hex(3,0,'c','Côte',{fs:12}),hex(4,0,'s'),hex(1,2,'p'),hex(2,2,'c','Côte',{fs:12}),hex(3,2,'s')].join(''))},
 col:{title:'Un col compte comme une montagne',text:'Le col mythique (drapeau) coûte 3 d’énergie et compte pour « montagne » et « montagnes d’affilée ». Il garde son bonus de col.',
  draw:()=>svg(135,[hex(0,1,'v'),hex(1,1,'m','1'),hex(2,1,'col'),hex(3,1,'m','3'),hex(4,1,'p'),hex(5,1,'v')].join('')+line([[0,1],[1,1],[2,1],[3,1],[4,1],[5,1]])+badge(2,1,'2')+badge(3,1,'✓')+note(110,128,'col = montagne n° 2, +2 points','#f2a541'))},
 unique:{title:'Une case ne compte qu’une fois',text:'Repasser sur une case déjà traversée pendant ce voyage ne la compte pas une 2ᵉ fois. Un nouveau voyage repart de zéro.',
  draw:()=>svg(135,[hex(0,1,'v'),hex(1,1,'p','1'),hex(2,1,'p','2'),hex(3,1,'p'),hex(4,1,'p'),hex(5,1,'v')].join('')+line([[0,1],[1,1],[2,1]])+line([[2,1],[1,1]],'#e46a50','5 5',23)+badge(1,1,'✓')+badge(2,1,'✓')+note(20,128,'retour sur la 1 : ne compte pas','#e46a50'))},
 suite:{title:'« D’affilée » : sans coupure',text:'Un autre terrain au milieu remet le compteur à zéro. Repasser sur une case déjà vue ne coupe pas la série.',
  draw:()=>svg(90,[hex(0,0,'m','1'),hex(1,0,'m','2'),hex(2,0,'p'),hex(3,0,'m','1'),hex(4,0,'m','2'),hex(5,0,'m','3')].join('')+line([[0,0],[1,0],[2,0],[3,0],[4,0],[5,0]])+badge(2,0,'0',false)+badge(5,0,'✓'))},
 villes:{title:'Départ et arrivée ne comptent pas',text:'Les « villes intermédiaires » sont celles entre le départ et l’arrivée.',
  draw:()=>svg(120,[hex(0,1,'v','Départ',{fs:10,fill:'#f6e7c1'}),hex(1,1,'p'),hex(2,1,'v','1',{fill:'#f6e7c1'}),hex(3,1,'p'),hex(4,1,'v','2',{fill:'#f6e7c1'}),hex(5,1,'v','Arrivée',{fs:10,fill:'#f6e7c1'})].join('')+line([[0,1],[1,1],[2,1],[3,1],[4,1],[5,1]])+badge(0,1,'–',false)+badge(2,1,'✓')+badge(4,1,'✓')+badge(5,1,'–',false))},
 points:{title:'Points maxi, points mini',text:'Chaque carte Voyage montre deux nombres : tous les objectifs remplis, ou arrivé sans tous les objectifs (« 🏁 Terminer le voyage ici »).',
  draw:()=>svg(120,`<rect x="20" y="14" width="140" height="92" rx="10" fill="#f6e7c1"/><text x="90" y="40" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="900" font-size="15" fill="#1b1406">Cap vers le Nord</text><text x="90" y="74" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="900" font-size="28" fill="#2c7a5b">22</text><text x="90" y="96" text-anchor="middle" font-family="Barlow, sans-serif" font-size="12" fill="#1b1406">· 10 sans les objectifs</text><path d="M172 46h30" stroke="#7fc8a9" stroke-width="3"/>${note(208,51,'tous les objectifs','#7fc8a9')}<path d="M172 92h30" stroke="#e46a50" stroke-width="3"/>${note(208,97,'arrivé sans','#e46a50')}`)}
};
const BY_TAB={route:['cote','col'],voyages:['unique','suite','villes','points']};
export function ruleVisuals(tab){const ids=BY_TAB[tab];if(!ids)return '';
 return `<div class="rv-grid">${ids.map(id=>{const v=V[id];return `<figure class="rv-card">${v.draw()}<figcaption><b>${v.title}</b>${v.text}</figcaption></figure>`;}).join('')}</div>`;}

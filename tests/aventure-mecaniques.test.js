import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../dist/simulator.js';
import {CLASSIC,clone,energyCap,isExhausted} from '../dist/rules.js';
import {europeBoard,NAMED_COLS,axialDistance} from '../dist/europe.js';
import {voyages} from '../dist/voyages.js';
const VOY=voyages[0].id;

const roster=n=>Array.from({length:n},(_,i)=>({name:'J'+(i+1),bike:'randonneur',voyage:VOY,items:[]}));
const match=(n=2,r=CLASSIC,seed=42)=>{const m=S.createMatch(roster(n),'plateau',r,seed);m.cardVersion=2;m.pendingAttack=null;for(const p of m.players)p.cardHand=[];return m;};
const near=(m,from,pred)=>m.board[from].links.map(k=>m.board[k]).find(pred);

test('les cols nommés sont sur de vraies cases de montagne, avec leur nom',()=>{
 const {board}=europeBoard('Paris','Istanbul'),cols=Object.values(board).filter(t=>t.type==='col');
 assert.equal(cols.length,NAMED_COLS.length);
 for(const c of cols){assert(c.colName);assert(!c.name,'un col n’est pas une ville');assert(c.links.length>0);}
 assert(cols.some(c=>c.colName==='Col du Galibier'));
});

test('lieux cachés : 24 jetons espacés, hors villes et cols, valeurs 1/2/3 environ 50/30/20',()=>{
 const m=match(),marks=Object.entries(m.landmarks);assert.equal(marks.length,24);
 const values=marks.map(([,l])=>l.value);assert.deepEqual([1,2,3].map(v=>values.filter(x=>x===v).length),[12,7,5]);
 for(const [k]of marks){const t=m.board[k];assert(!t.name&&!t.colName&&t.type!=='mer');}
 for(const [a]of marks)for(const [b]of marks)if(a!==b)assert(axialDistance(m.board[a],m.board[b])>=3);
 assert.deepEqual(match(2,CLASSIC,42).landmarks,m.landmarks,'même graine, mêmes jetons');
});

test('le premier cycliste qui passe sur un lieu caché gagne ses points, le jeton disparaît',()=>{
 const m=match(),p=S.player(m),from=p.pos,t=m.board[from].links.map(k=>m.board[k]).find(t=>t.type!=='mer');
 m.landmarks={[t.key]:{value:3,name:'Lac secret',found:''}};p.energy=10;
 const before=p.points;assert(S.move(m,t.key));
 assert.equal(p.points,before+m.rules.points[t.type]+3);assert.equal(m.landmarks[t.key].found,p.id);
 assert(m.history.some(h=>h.kind==='landmark'&&h.text.includes('Lac secret')));
 const again=p.points;p.pos=from;m.moved=0;assert(S.move(m,t.key));assert.equal(p.points,again,'pas de deuxième récompense');
});

test('col nommé : 2 points, premier de cordée +3, titre Grimpeur +5 au 3e col',()=>{
 const m=match(),p=S.player(m),cols=Object.values(m.board).filter(t=>t.type==='col');
 assert.equal(m.rules.points.col,2);assert.equal(m.rules.terrain.col,3);
 for(const [i,c]of cols.slice(0,3).entries()){const from=c.links[0];p.pos=from;m.moved=0;p.energy=10;const before=p.points;assert(S.move(m,c.key),c.colName);
  assert.equal(p.points-before,2+3+(i===2?5:0)+(m.landmarks[c.key]?.value||0),c.colName);}
 assert(p.climber);
 const q=m.players[1],c=cols[0];m.activeIndex=1;q.pos=c.links[0];m.moved=0;q.energy=10;const before=q.points;assert(S.move(m,c.key));
 assert.equal(q.points-before,2,'le second au col ne gagne que les points du col');
});

test('fatigue : +1 par jour de route, +1 avec un col, fourbu à 3 (énergie max −2), camping ou hôtel la remet à 0',()=>{
 const m=match(1),p=S.player(m);
 const ride=()=>{const t=near(m,p.pos,t=>t.type==='plaine'||t.type==='cote'||t.type==='ville');p.energy=Math.max(p.energy,5);assert(S.move(m,t.key));assert(S.endTurn(m));if(m.phase==='card-choice')S.chooseCard(m,0);if(m.phase==='event')S.resolve(m,'decline');};
 ride();assert.equal(p.fatigue,1);ride();assert.equal(p.fatigue,2);assert(!isExhausted(m,p));
 ride();assert.equal(p.fatigue,3);assert(isExhausted(m,p));assert.equal(energyCap(m,p),8);assert(p.energy<=8);
 p.items.push('tente');assert(S.rest(m,'bivouac'));if(m.phase==='card-choice')S.chooseCard(m,0);assert.equal(p.fatigue,3,'le bivouac ne repose pas vraiment');
 assert(S.rest(m,'camping'));assert.equal(p.fatigue,0);assert.equal(energyCap(m,p),10);
 const m2=match(1),p2=S.player(m2),col=Object.values(m2.board).find(t=>t.type==='col');p2.pos=col.links[0];p2.energy=10;assert(S.move(m2,col.key));assert(S.endTurn(m2));assert.equal(p2.fatigue,2,'un col fatigue deux fois plus');
});

test('budget : 5 pièces après le matériel, puis 5 pièces tous les 5 tours ; plus de travail',()=>{
 const r=clone(CLASSIC),m=S.createMatch([{name:'A',bike:'randonneur',voyage:VOY,items:['tente']}],'plateau',r,7),p=S.player(m);
 m.cardVersion=2;p.cardHand=[];m.pendingAttack=null;
 assert.equal(p.money,r.startMoney-r.bikes.randonneur.price-r.equipment.tente.price+5);assert.equal(r.bikes.gravel.price,5);assert.equal(r.bikes.randonneur.price,3);assert.equal(r.startMoney,10);assert(!S.work(m),'le travail est retiré');
 const start=p.money;let pays=0;for(let i=0;i<10;i++){S.endTurn(m);if(m.phase==='card-choice')S.chooseCard(m,0);if(m.phase==='event')S.resolve(m,'decline');}
 pays=m.history.filter(h=>h.kind==='budget').length;assert.equal(pays,2);assert.equal(p.money,start+10);
});

test('l’Est a de vraies villes, et les jetons cachés restent près des routes des voyages',()=>{
 const {board}=europeBoard('Paris','Istanbul');
 for(const n of ['Minsk','Kharkiv','Odessa','Kazan','Volgograd','Tbilissi','Ankara','Helsinki'])assert(board['city-'+n]?.type==='ville',n);
 const m=match(),ends=voyages.map(v=>[m.board['city-'+v.from],m.board['city-'+v.to]]);
 const far=Object.keys(m.landmarks).map(k=>m.board[k]).filter(t=>t.x>1000);assert.equal(far.length,0,'pas de jeton au fond de la Russie');
});

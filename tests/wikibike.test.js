import test from 'node:test';
import assert from 'node:assert/strict';
import {CLASSIC,clone} from '../dist/rules.js';
import {createMatch} from '../dist/simulator.js';
import {voyages,VOYAGE_POINTS} from '../dist/voyages.js';
import {WIKI_CATEGORIES,wikiEntries} from '../dist/wikibike.js';

const profile=(name)=>{
 const r=clone(CLASSIC);
 r.immersion={enabled:name!=='Original',beta:['Bêta','Ultra'].includes(name),ultra:name==='Ultra',level:'voyage'};
 return r;
};

test('WikiBike couvre ses rubriques, toutes les cartes Voyage et le garage Ultra',()=>{
 const entries=wikiEntries(profile('Original'));
 assert.equal(new Set(entries.map(e=>e.id)).size,entries.length);
 assert.ok(entries.length>=120);
 assert.equal(entries.filter(e=>e.category==='catalogue').length,voyages.length);
 for(const voyage of voyages){
  const article=entries.find(e=>e.id===`carte-${voyage.id}`);
  assert.ok(article,voyage.id);
  assert.match(article.short,new RegExp(`${VOYAGE_POINTS[voyage.id][0]} à ${VOYAGE_POINTS[voyage.id][1]} points`),voyage.id);
 }
 for(const e of entries){
  assert.ok(WIKI_CATEGORIES.some(c=>c.id===e.category),e.id);
  assert.ok(e.name&&e.short&&e.body,e.id);
  assert.doesNotMatch(e.short+e.body,/undefined|NaN/,e.id);
 }
});

test('le col annonce les points exacts et suit les règles personnalisées',()=>{
 const r=profile('Original');
 r.points.col=4;r.adventure.climberCols=2;r.adventure.climberBonus=7;r.adventure.colFirstBonus=3;
 const col=wikiEntries(r).find(e=>e.id==='col');
 assert.match(col.short,/\+4 points d’aventure/);
 assert.match(col.body,/premier passage de chaque cycliste/);
 assert.match(col.body,/2 cols distincts.*\+7 points/);
 assert.match(col.body,/\+3 points de Premier de cordée/);
});

test('les explications essentielles changent selon Original, Immersion, Bêta et Ultra',()=>{
 const original=wikiEntries(profile('Original'));
 const immersion=wikiEntries(profile('Immersion'));
 const beta=wikiEntries(profile('Bêta'));
 const ultra=wikiEntries(profile('Ultra'));
 const get=(list,id)=>list.find(e=>e.id===id);
 assert.match(get(original,'fatigue').body,/2 énergie/);
 assert.match(get(immersion,'fatigue').body,/0 à 5.*1 point/);
 assert.match(get(beta,'eau').body,/gourdes/);
 assert.match(get(ultra,'col').body,/3 cols mythiques/);
 assert.match(get(ultra,'points').body,/ordre d’arrivée/);
 assert.match(get(ultra,'randonneuse').body,/garage Ultra/);
 assert.match(get(ultra,'gps').body,/pas le temps supplémentaire/);
});

test('le WikiBike accepte les règles réellement créées pour les quatre modes',()=>{
 for(const name of ['Original','Immersion','Bêta','Ultra']){
  const match=createMatch([{name:'Test',bike:'gravel',voyage:name==='Ultra'?'ultra-lcn':'traversee',items:['tente']}],'plateau',profile(name),1378);
  const entries=wikiEntries(match.rules);
  assert.ok(entries.length>=120,name);
  assert.ok(entries.every(e=>!(/undefined|NaN/.test(e.name+e.short+e.body))),name);
  assert.match(entries.find(e=>e.id==='energie').body,new RegExp(`commences avec ${match.rules.startEnergy} énergie`),name);
 }
});

test('le mode Tuiles n’affiche pas les règles de nuit et de ferry du plateau',()=>{
 const match=createMatch([{name:'Test',bike:'gravel',voyage:'traversee',items:['tente']}],'tuiles',profile('Original'),1378);
 const entries=wikiEntries(match.rules,{boardMode:match.mode});
 const get=id=>entries.find(e=>e.id===id);
 assert.match(get('bivouac').body,/1 énergie de base/);
 assert.match(get('camping').body,/5 énergie/);
 assert.match(get('ferry').body,/ne propose pas/);
 assert.match(get('hors-route').body,/mode Tuiles/);
 assert.match(get('meteo').body,/pas de bulletin régional/);
});

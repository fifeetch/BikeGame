import {test} from 'node:test';
import assert from 'node:assert/strict';

test('new game offers both modes, launches fixed board and resumes saved choice',async()=>{
 const app={innerHTML:''},storage=new Map(),elements=new Map();
 globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 globalThis.document={querySelector:s=>s==='#app'?app:null,querySelectorAll:s=>{
  const attr=s.slice(1,-1),key=attr.replace(/^data-/,'').replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
  const found=[...app.innerHTML.matchAll(new RegExp(attr+'="([^"]+)"','g'))].map(m=>({dataset:{[key]:m[1]}}));elements.set(attr,found);return found;
 }};
 const click=(attr,value)=>{const el=elements.get(attr)?.find(e=>Object.values(e.dataset).includes(value));assert(el,attr+' '+value);el.onclick();};
 await import('../dist/app.js');
 click('data-action','new');assert(app.innerHTML.includes('data-mode="plateau"'));assert(app.innerHTML.includes('data-mode="tuiles"'));
 click('data-mode','plateau');assert(app.innerHTML.includes('Autour de la table'));
 click('data-action','start');assert.equal(elements.get('data-voyage').length,3);
 click('data-voyage',elements.get('data-voyage')[0].dataset.voyage);
 const saved=JSON.parse(storage.get('velo-save'));assert.equal(saved.mode,'plateau');assert.equal(saved.version,2);assert.equal(saved.players.length,1);assert(app.innerHTML.includes('europe-world'));assert(!app.innerHTML.includes('data-place='));assert(app.innerHTML.includes('CARTE VOYAGE'));assert(app.innerHTML.includes('Itinéraire libre'));assert(app.innerHTML.includes('⚙️ Règles'));assert(app.innerHTML.includes('0/5 cases aujourd’hui'));
 click('data-action','home');click('data-action','continue');assert(app.innerHTML.includes('europe-world'));
 click('data-action','home');click('data-action','new');click('data-action','selectbike');click('data-mode','tuiles');click('data-action','start');click('data-voyage',elements.get('data-voyage')[0].dataset.voyage);
 assert.equal(JSON.parse(storage.get('velo-save')).mode,'tuiles');assert(app.innerHTML.includes('data-place='));assert(!app.innerHTML.includes('europe-world'));
});

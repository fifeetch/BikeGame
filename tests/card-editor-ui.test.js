import test from 'node:test';
import assert from 'node:assert/strict';

test('menu opens the catalogue and a negative effect can be saved',async()=>{
 const storage=new Map(),app={innerHTML:''},elements=new Map(),controls={kind:{value:'positive'},preset:{value:'coup-boost'},title:{value:''}};
 globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 globalThis.document={
  querySelector(selector){if(selector==='#app')return app;if(selector==='#card-editor-kind'&&app.innerHTML.includes('id="card-editor-kind"'))return controls.kind;if(selector==='#card-editor-preset'&&app.innerHTML.includes('id="card-editor-preset"'))return controls.preset;if(selector==='#card-editor-title'&&app.innerHTML.includes('id="card-editor-title"'))return controls.title;return null;},
  querySelectorAll(selector){const attr=selector.slice(1,-1),key=attr.replace(/^data-/,'').replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());const found=[...app.innerHTML.matchAll(new RegExp(attr+'="([^"]*)"','g'))].map(match=>({dataset:{[key]:match[1]}}));elements.set(attr,found);return found;},
  createElement(){return {click(){}};}
 };
 await import('../dist/app.js');
 elements.get('data-action').find(el=>el.dataset.action==='card-editor-open').onclick();
 assert(app.innerHTML.includes('Catalogue des cartes'));
 assert(app.innerHTML.includes('Anciennes cartes conservées'));
 controls.kind.value='negative';controls.kind.onchange();
 assert(app.innerHTML.includes('value="pluie-battante"'));
 controls.preset.value='pluie-battante';controls.preset.onchange();
 controls.title.value='Grosse averse';controls.title.oninput();
 elements.get('data-action').find(el=>el.dataset.action==='card-editor-save').onclick();
 const saved=JSON.parse(storage.get('velo-custom-cards'));
 assert.equal(saved.length,1);
 assert.equal(saved[0].title,'Grosse averse');
 assert.equal(saved[0].template,'pluie-battante');
 assert(app.innerHTML.includes('Grosse averse'));
});

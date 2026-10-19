import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../dist/simulator.js';
import * as T from '../dist/tutorial.js';
import {voyages,progress,findVoyage} from '../dist/voyages.js';
import {weatherOn} from '../dist/weather.js';

// La partie guidée « Apprendre à jouer » : Budapest → Athènes en 5 jours, toutes les étapes du guide.
test('partie guidée : la carte du didacticiel reste hors des 20 cartes Voyage',()=>{
 assert.equal(voyages.length,21);assert.ok(!voyages.some(v=>v.id==='apprentissage'));
 assert.equal(findVoyage('apprentissage').from,'Budapest');assert.equal(findVoyage('apprentissage').to,'Athènes');
});

test('partie guidée : départ préparé, sans cartes ni météo',()=>{
 const m=T.createTutorialMatch(),p=m.players[0];
 assert.equal(m.board[p.pos].name,'Budapest');assert.equal(p.bike,'gravel');assert.deepEqual(p.items,['tente']);
 assert.equal(p.cardHand.length,0);assert.equal(m.pendingAttack,null);assert.equal(m.forecast,false);
 assert.deepEqual(Object.keys(m.landmarks),[T.TUTORIAL_LANDMARK]);
 for(let d=1;d<=5;d++)assert.equal(weatherOn(m.seed,d,'balkans'),'beau');
});

test('partie guidée (mode Immersion, 19 octobre) : le chemin conseillé mène au voyage réussi en 5 jours',()=>{
 const m=T.createTutorialMatch(),p=m.players[0],ui={route:[]};
 assert.equal(m.rules.immersion.enabled,true);assert.equal(m.rules.immersion.level,'voyage');
 const tick=()=>T.tutorialTick(m,ui),manual=()=>{while(T.currentStep(m)&&!T.currentStep(m).wait&&!T.currentStep(m).final)T.tutorialNext(m,ui);};
 // scènes de la journée et du soir : on prend le premier choix (le guide les prépare à l'avance)
 const scenes=()=>{for(let k=0;k<6&&m.phase==='encounter';k++)S.resolveEncounter(m,0);tick();};
 const ride=day=>{const r=T.TUTORIAL_PLAN[day];ui.route=r;tick();assert.ok(S.routeCheck(m,r).ok,'jour '+day);assert.ok(S.beginEventRoute(m,r).ok);ui.route=[];scenes();manual();};
 const sleep=id=>{assert.ok(S.rest(m,id),id);scenes();tick();manual();};
 manual();ride(1);assert.ok(S.eat(m));tick();sleep('hotel');
 assert.equal(m.round,2);assert.equal(m.forecast,true);
 ride(2);assert.ok(m.tutorial.scene.done,'la scène préparée du jour 2');sleep('bivouac');
 ride(3);assert.ok(S.buyFood(m));assert.ok(S.eat(m));tick();sleep('camping');
 assert.equal(m.round,4);
 // jour 4 : repos si fatigué, sinon on roule directement (19 octobre)
 if(T.currentStep(m).id==='repos'){sleep('camping');assert.equal(m.round,5);}else assert.equal(T.currentStep(m).id,'cotes');
 ride(5);assert.ok(p.completed);assert.ok(progress(S.view(m,p)).rows.every(r=>r.done));
 assert.equal(T.currentStep(m).id,'bravo');
 T.endTutorial(m);assert.equal(T.tutorialOn(m),false);
});

test('guide 2 (mode Original, 19 octobre) : deux cyclistes, mains et pioche préparées, Max joué par l’ordinateur',()=>{
 const m=T.createTutorialMatch2(),[p,q]=m.players;
 assert.equal(m.players.length,2);assert.equal(q.name,'Max');assert.ok(q.bot);assert.equal(m.rules.immersion.enabled,false);
 assert.deepEqual(p.cardHand,['evt-03','evt-15','evt-21']);assert.deepEqual(q.cardHand,['evt-11','evt-02']);
 assert.equal(m.eventDeck.at(-1),'evt-06');assert.equal(T.steps(m),T.STEPS2);assert.equal(T.currentStep(m).id,'g2-bienvenue');
 assert.ok(S.routeCheck(m,T.PLAN2[1]).ok);
});

test('guide express (19 octobre) : 13 bulles courtes, même partie préparée',()=>{
 const m=T.createTutorialMatch3();assert.equal(m.tutorial.guide,3);assert.equal(T.steps(m),T.STEPS3);assert.equal(T.STEPS3.length,13);
 for(const s of T.STEPS3){const words=s.text(m).replace(/<span class="tuto-hexes">.*<\/span>/s,'').replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;assert.ok(words<=40,s.id+' : '+words+' mots');}
});

test('on apprend en jouant (19 octobre) : pas de bulles, conseils au bon moment, chacun une seule fois',async()=>{
 const {tipTick}=await import('../dist/tips.js');
 const m=T.createTipsMatch();assert.equal(T.tutorialOn(m),false);assert.deepEqual(m.tips.seen,[]);
 let st=tipTick(m,{route:[],modal:''},null);assert.equal(st.id,'tracer');
 st=tipTick(m,{route:['hex-18-30'],modal:''},st);assert.equal(st.id,'rouler');assert.ok(m.tips.seen.includes('tracer'));
 st=tipTick(m,{route:[],modal:''},st);assert.equal(st,null);assert.ok(m.tips.seen.includes('rouler'));
 m.tips.off=true;assert.equal(tipTick(m,{route:[],modal:'night'},null),null);
});

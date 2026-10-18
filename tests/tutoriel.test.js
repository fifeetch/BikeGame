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

test('partie guidée : le chemin conseillé mène au voyage réussi en 5 jours',()=>{
 const m=T.createTutorialMatch(),p=m.players[0],ui={route:[]};
 const tick=()=>T.tutorialTick(m,ui),manual=()=>{while(T.currentStep(m)&&!T.currentStep(m).wait&&!T.currentStep(m).final)T.tutorialNext(m,ui);};
 const ride=day=>{const r=T.TUTORIAL_PLAN[day];ui.route=r;tick();assert.ok(S.routeCheck(m,r).ok,'jour '+day);assert.ok(S.beginEventRoute(m,r).ok);ui.route=[];tick();manual();};
 manual();ride(1);assert.ok(S.eat(m));tick();S.endTurn(m);tick();
 assert.equal(m.round,2);assert.equal(m.forecast,true);manual();
 assert.ok(S.eat(m));tick();manual();ride(2);assert.equal(p.points,2);S.endTurn(m);tick();manual();
 ride(3);assert.ok(S.buyFood(m),'2 repas au plus pour la Gravel : on rachète à Thessalonique');assert.ok(S.eat(m));tick();S.endTurn(m);tick();manual();
 assert.equal(p.fatigue,3);assert.equal(T.currentStep(m).id,'fourbu');
 assert.ok(S.rest(m,'camping'));tick();assert.equal(p.fatigue,0);assert.equal(m.round,5);
 const i=p.cardHand.indexOf(T.TUTORIAL_CARD);assert.ok(i>=0);assert.ok(S.playCard(m,i,p.id));tick();
 ride(5);assert.ok(p.completed);assert.ok(progress(S.view(m,p)).rows.every(r=>r.done));
 assert.equal(T.currentStep(m).id,'bravo');assert.equal(p.points,10);
 T.endTutorial(m);assert.equal(m.tutorial.cardsOff,false);assert.equal(T.tutorialOn(m),false);
});

// Météo annoncée (option choisie au début de la partie, mode Plateau).
// Le plateau est découpé en 5 régions. Chaque jour, chaque région a un temps, tiré au hasard à partir de la graine
// de la partie : le même jour donne toujours le même temps, donc on peut annoncer celui du lendemain dès la veille.
// Quand l'option est choisie, les cartes Événement « climatiques » sont retirées de la pioche.
import {MAP_CELLS} from './assets/europe/board-data.js';

export const REGIONS={
 ouest:{name:'Ouest',cities:['Lisbonne','Madrid','Barcelone','Bordeaux','Paris','Lille','Calais','Bruxelles','Amsterdam','Londres','Douvres','Holyhead','Dublin','Marseille','Lyon']},
 alpes:{name:'Alpes',cities:['Zurich','Milan','Venise','Rome','Ancona','Vienne','Prague','Berlin','Zagreb','Budapest']},
 nord:{name:'Nord',cities:['Copenhague','Helsingør','Helsingborg','Hirtshals','Kristiansand','Oslo','Bergen','Trondheim','Stockholm','Narvik','Cap Nord','Helsinki','Tallinn','Riga','Arkhangelsk','Petrozavodsk','Saint-Pétersbourg']},
 est:{name:'Est',cities:['Varsovie','Vilnius','Minsk','Kiev','Lviv','Moscou','Smolensk','Novgorod','Iaroslavl','Kharkiv','Voronej','Kazan','Perm','Nijni Novgorod','Ekaterinbourg','Oufa','Samara','Orenburg','Volgograd','Rostov-sur-le-Don','Astrakhan','Odessa','Chișinău','Krasnodar']},
 balkans:{name:'Balkans',cities:['Belgrade','Sarajevo','Split','Skopje','Sofia','Bucarest','Constanța','Thessalonique','Athènes','Istanbul','Izmir','Ankara','Trabzon','Tbilissi','Bakou']}
};
export const WEATHER={
 beau:{name:'Beau temps',effect:'aucun effet',icon:'☀️'},
 vent:{name:'Vent de face',effect:'1re case du jour : +1 énergie',icon:'💨'},
 pluie:{name:'Pluie',effect:'case hors route : +1 énergie',icon:'🌧️'},
 orage:{name:'Orage',effect:'3 cases maximum',icon:'⛈️'},
 neige:{name:'Neige',effect:'montagne et col : +1 énergie',icon:'❄️'}
};
// Chances (en %) de chaque temps selon la région : plus de neige au Nord et dans les Alpes, plus d'orages aux Balkans.
export const CLIMATE={
 ouest:{beau:45,vent:20,pluie:25,orage:10,neige:0},
 alpes:{beau:35,vent:10,pluie:20,orage:15,neige:20},
 nord:{beau:30,vent:25,pluie:20,orage:5,neige:20},
 est:{beau:40,vent:20,pluie:15,orage:10,neige:15},
 balkans:{beau:50,vent:10,pluie:15,orage:20,neige:5}
};
export const STORM_MAX=3;

const SEEDS=Object.entries(REGIONS).flatMap(([id,r])=>r.cities.map(name=>{const c=MAP_CELLS.find(c=>c.name===name);return c&&{id,x:c.x,y:c.y};}).filter(Boolean));
// Région d'une case : celle de la ville repère la plus proche.
export function regionOf(t){if(!t)return 'ouest';let best=SEEDS[0],d=Infinity;for(const s of SEEDS){const e=(s.x-t.x)**2+(s.y-t.y)**2;if(e<d){d=e;best=s;}}return best.id;}
// Où poser l'icône de chaque région sur la carte : à côté d'une ville repère, décalée pour ne pas cacher son nom.
const BADGE_SPOTS={ouest:['Bordeaux',-70,-10],alpes:['Zurich',-20,32],nord:['Stockholm',-40,-46],est:['Smolensk',30,40],balkans:['Skopje',-80,22]};
export const REGION_CENTRES=Object.fromEntries(Object.entries(BADGE_SPOTS).map(([id,[name,dx,dy]])=>{const c=MAP_CELLS.find(c=>c.name===name);return [id,{x:c.x+dx,y:c.y+dy}];}));
function hash(seed,day,salt){let h=(seed>>>0)^Math.imul(day+1,0x9e3779b1)^Math.imul(salt+7,0x85ebca6b);h=Math.imul(h^(h>>>15),0x2c1b3c6d);h=Math.imul(h^(h>>>12),0x297a2d39);return ((h^(h>>>15))>>>0)/4294967296;}
// Temps d'une région un jour donné (toujours le même pour la même partie).
export function weatherOn(seed,day,region){const odds=CLIMATE[region]||CLIMATE.ouest;let n=hash(seed,day,Object.keys(REGIONS).indexOf(region))*100;for(const [id,p]of Object.entries(odds)){n-=p;if(n<0)return id;}return 'beau';}
export function forecast(seed,day){return Object.fromEntries(Object.keys(REGIONS).map(r=>[r,weatherOn(seed,day,r)]));}

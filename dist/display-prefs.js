// Préférences d'affichage du plateau (propres à ce navigateur, jamais enregistrées dans une partie).
//  - reduced : réduire les animations (par défaut : suit le réglage « réduire les animations » de l'appareil)
//  - weather : météo légère (nuages qui passent lentement sur la carte)
//  - minimap : mini-carte ouverte ou repliée (par défaut : ouverte sur grand écran, repliée sur téléphone)
//  - sheet   : fiche joueur dépliée ou repliée à côté du plateau
const KEY='velo-display';
const media=q=>{try{return Boolean(globalThis.matchMedia?.(q).matches);}catch{return false;}};
export function readDisplayPrefs(storage=globalThis.localStorage){
 let saved={};try{saved=JSON.parse(storage?.getItem(KEY)||'{}')||{};}catch{saved={};}
 return {
  reduced:typeof saved.reduced==='boolean'?saved.reduced:media('(prefers-reduced-motion: reduce)'),
  weather:typeof saved.weather==='boolean'?saved.weather:true,
  minimap:typeof saved.minimap==='boolean'?saved.minimap:!media('(max-width: 700px)'),
  sheet:typeof saved.sheet==='boolean'?saved.sheet:true
 };
}
export function writeDisplayPref(name,value,storage=globalThis.localStorage){
 try{const saved=JSON.parse(storage?.getItem(KEY)||'{}')||{};saved[name]=value;storage?.setItem(KEY,JSON.stringify(saved));}catch{/* stockage indisponible */}
 return readDisplayPrefs(storage);
}

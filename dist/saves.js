// « Mes parties » : plusieurs parties enregistrées sur l'appareil.
// Les parties sont rangées dans la réserve IndexedDB du navigateur (bien plus grande que localStorage :
// une partie pèse environ 700 Ko à cause du plateau). Chaque partie = { id, name, createdAt, updatedAt, summary, data }.
// Sans IndexedDB (tests, navigation privée très stricte), tout continue de marcher avec la seule sauvegarde « velo-save ».

const DB='velo-parties',STORE='saves';
export const MAX_SAVES=20;
let dbPromise=null;
const available=()=>typeof indexedDB!=='undefined';
function open(){if(!available())return Promise.reject(Error('IndexedDB indisponible'));
 return dbPromise||=new Promise((ok,ko)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'});};r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error);});}
function run(mode,fn){return open().then(db=>new Promise((ok,ko)=>{const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE),req=fn(store);tx.oncomplete=()=>ok(req?.result);tx.onerror=()=>ko(tx.error);}));}
export const putSave=rec=>run('readwrite',s=>s.put(rec));
export const getSave=id=>run('readonly',s=>s.get(id));
export const deleteSave=id=>run('readwrite',s=>s.delete(id));
export const allSaves=()=>run('readonly',s=>s.getAll()).then(list=>(list||[]).sort((a,b)=>b.updatedAt-a.updatedAt)).catch(()=>[]);
// Garde les MAX_SAVES plus récentes (sauf celle qu'on vient d'écrire).
export async function trimSaves(keepId){const list=await allSaves();const extra=list.filter(r=>r.id!==keepId).slice(MAX_SAVES-1);for(const r of extra)await deleteSave(r.id);return extra.length;}

// Identifiant d'une partie : la graine de la partie (unique à chaque nouvelle partie).
export const saveIdOf=m=>'partie-'+String(m?.seed??'0');
// Résumé affiché dans la liste (sans relire toute la partie).
export function summarize(m,{voyages=[],online=null}={}){
 const title=id=>voyages.find(v=>v.id===id);
 return {round:m.round,done:Boolean(m.done),winner:m.winner||'',mode:m.mode,forecast:Boolean(m.forecast),encounters:Boolean(m.encounters),
  online:online?{code:online.code,seat:online.seat}:null,
  players:m.players.map(p=>({id:p.id,name:p.name,color:p.color,points:p.points,voyage:p.voyage,voyageTitle:title(p.voyage)?.title||'',from:title(p.voyage)?.from||'',to:title(p.voyage)?.to||'',voyagesDone:(p.voyagesDone||[]).length}))};}
export function autoName(sum){const ps=sum.players||[];if(!ps.length)return 'Partie';
 if(sum.online)return `Partie en ligne ${sum.online.code}`;
 if(ps.length===1)return `Solo — ${ps[0].voyageTitle||ps[0].from+' → '+ps[0].to}`;
 return `${ps.map(p=>p.name).join(' & ')} — ${ps[0].voyageTitle||'voyage'}`;}

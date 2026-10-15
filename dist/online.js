// Partie en ligne : deux joueurs (ou plus), chacun sur son appareil, partie gardée en ligne (Firebase Realtime Database).
// Une partie en ligne = /games/<CODE> : { board (plateau, envoyé une seule fois), state (la partie sans le plateau),
// rev (numéro de version), seats (quel appareil joue quel cycliste), createdAt, updatedAt }.
// Le plateau (≈ 700 Ko) ne change pas pendant la partie : seul l'état léger (≈ 15 Ko) circule à chaque action.
//
// Pour tester sans Internet, ajouter ?reseau=local à l'adresse du jeu : deux onglets du même navigateur se parlent.

export const FIREBASE_CONFIG={
 apiKey:'AIzaSyCUVHvSS3CNyDm01suMGwbljJkZW6BwQaA',
 authDomain:'bikepacking-the-game.firebaseapp.com',
 databaseURL:'https://bikepacking-the-game-default-rtdb.europe-west1.firebasedatabase.app',
 projectId:'bikepacking-the-game',
 storageBucket:'bikepacking-the-game.firebasestorage.app',
 messagingSenderId:'20418405248',
 appId:'1:20418405248:web:eab27a327bb32137a79765'
};
const SDK='https://www.gstatic.com/firebasejs/13.0.0/';

// Identifiant de cet appareil (gardé dans le navigateur).
// (en test local, chaque onglet joue le rôle d'un appareil : identifiant propre à l'onglet)
export function clientId(){try{const store=isLocalTest()?sessionStorage:localStorage;let id=store.getItem('velo-client-id');if(!id){id='c'+Math.random().toString(36).slice(2,10)+Date.now().toString(36);store.setItem('velo-client-id',id);}return id;}catch{return 'c-temporaire';}}
export const makeCode=()=>'VELO-'+String(Math.floor(1000+Math.random()*9000));
export const cleanCode=text=>{const d=String(text||'').toUpperCase().replace(/[^0-9]/g,'').slice(-4);return d.length===4?'VELO-'+d:'';};

// Qui doit agir maintenant : la cible d'une attaque, le joueur qui peut intervenir, sinon le joueur actif.
export function actorId(m){if(!m)return '';if(m.pendingAttack)return m.pendingAttack.targetId;if(m.phase==='card-intervention'&&m.cardWindow)return m.cardWindow.responders?.[m.cardWindow.responderIndex]||m.players[m.activeIndex]?.id;return m.players[m.activeIndex]?.id||'';}
// La partie sans le plateau (et inversement) : ce qui circule à chaque action.
export function splitGame(m){const {board,edges,...light}=m;return {light:JSON.stringify(light),board:JSON.stringify({board,edges})};}
export function joinGame(lightText,boardText){const light=JSON.parse(lightText),{board,edges}=JSON.parse(boardText);return JSON.stringify({...light,board,edges});}

// ---------- Deux façons de communiquer : Firebase (en ligne) ou local (test dans deux onglets) ----------
function localBackend(){
 const key=code=>'velo-net-'+code,chan=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('velo-net'):null,listeners=new Map();
 const read=code=>{try{return JSON.parse(localStorage.getItem(key(code))||'null');}catch{return null;}};
 // La valeur voyage avec le message : un autre onglet peut encore lire l'ancienne valeur dans localStorage.
 const write=(code,v)=>{localStorage.setItem(key(code),JSON.stringify(v));chan?.postMessage({code,value:v});for(const cb of listeners.get(code)||[])cb(v);};
 chan&&(chan.onmessage=e=>{const {code,value}=e.data||{};for(const cb of listeners.get(code)||[])cb(value);});
 return {
  async get(code){return read(code);},
  async create(code,value){if(read(code))return false;write(code,value);return true;},
  async update(code,fn){const cur=read(code),next=fn(cur);if(next===undefined)return {committed:false,value:cur};write(code,next);return {committed:true,value:next};},
  listen(code,cb){const list=listeners.get(code)||[];list.push(cb);listeners.set(code,list);setTimeout(()=>cb(read(code)),0);return ()=>listeners.set(code,(listeners.get(code)||[]).filter(f=>f!==cb));},
  async sendChat(code,msg){const k='chat:'+code,list=[...(read(k)||[]),msg].slice(-50);write(k,list);},
  listenChat(code,cb){const k='chat:'+code;return this.listen(k,v=>cb(v||[]));}
 };
}
async function firebaseBackend(){
 const [{initializeApp},db]=await Promise.all([import(SDK+'firebase-app.js'),import(SDK+'firebase-database.js')]);
 const app=initializeApp(FIREBASE_CONFIG),base=db.getDatabase(app,FIREBASE_CONFIG.databaseURL),node=code=>db.ref(base,'games/'+code);
 return {
  async get(code){return (await db.get(node(code))).val();},
  async create(code,value){const r=await db.runTransaction(node(code),cur=>cur?undefined:value);return r.committed;},
  // Firebase appelle d'abord la fonction avec sa copie locale, parfois vide (null) : on renvoie null pour qu'il relise le serveur.
  async update(code,fn){const r=await db.runTransaction(node(code),cur=>cur===null?null:fn(cur));const v=r.snapshot.val();return {committed:r.committed&&v!==null,value:v};},
  listen(code,cb){return db.onValue(node(code),snap=>cb(snap.val()));},
  async sendChat(code,msg){await db.push(db.ref(base,'games/'+code+'/chat'),msg);},
  listenChat(code,cb){return db.onValue(db.query(db.ref(base,'games/'+code+'/chat'),db.limitToLast(50)),snap=>{const out=[];snap.forEach(c=>{out.push(c.val());});cb(out);});}
 };
}
let backendPromise=null;
export const isLocalTest=()=>{try{return new URLSearchParams(location.search).get('reseau')==='local';}catch{return false;}};
function backend(){return backendPromise||=(isLocalTest()?Promise.resolve(localBackend()):firebaseBackend());}

// ---------- Actions ----------
// Créer : on envoie la partie préparée sur cet appareil ; mySeat = le cycliste joué ici.
export async function createOnline(m,mySeat){const net=await backend(),{light,board}=splitGame(m),me=clientId();
 for(let tries=0;tries<8;tries++){const code=makeCode();
  if(await net.create(code,{board,state:light,rev:1,seats:{[mySeat]:me},names:Object.fromEntries(m.players.map(p=>[p.id,p.name])),createdAt:Date.now(),updatedAt:Date.now()}))return {code,seat:mySeat,rev:1,client:me};}
 throw Error('Impossible de créer un code de partie, réessaie.');}
// Rejoindre : lit la partie et la liste des cyclistes libres.
export async function peekOnline(code){const net=await backend(),g=await net.get(code);if(!g)throw Error('Aucune partie avec ce code.');
 const me=clientId(),names=g.names||{};return {code,seats:g.seats||{},players:Object.entries(names).map(([id,name])=>({id,name,taken:Boolean(g.seats?.[id]&&g.seats[id]!==me),mine:g.seats?.[id]===me}))};}
export async function takeSeat(code,seat){const net=await backend(),me=clientId();
 const r=await net.update(code,g=>{if(!g)return undefined;const seats=g.seats||{};if(seats[seat]&&seats[seat]!==me)return undefined;return {...g,seats:{...seats,[seat]:me}};});
 if(!r.committed)throw Error('Ce cycliste est déjà pris par un autre appareil.');return {code,seat,client:me,rev:r.value.rev};}
// Envoyer l'état après une action. Refusé si quelqu'un a joué entre-temps (rev différent).
export async function pushState(code,m,baseRev){const net=await backend(),{light}=splitGame(m);
 const r=await net.update(code,g=>{if(!g||g.rev!==baseRev)return undefined;return {...g,state:light,rev:baseRev+1,updatedAt:Date.now()};});
 return r.committed?r.value.rev:null;}
// Écouter la partie : cb(texte complet de la sauvegarde, rev) à chaque changement.
export async function listenOnline(code,cb){const net=await backend();let board=null;
 return net.listen(code,g=>{if(!g||!g.state||!g.board&&!board)return;board=board||g.board;cb(joinGame(g.state,board),g.rev,g);});}

// ---------- Salle d'attente : on crée la partie en ligne dès le départ, chacun prépare son cycliste chez soi ----------
// /games/<CODE> pendant la préparation : { status:'lobby', count, rules (texte), host, lobby:{ p1:{client,name,bike,items,voyage,ready}, … } }
// Au lancement, l'hôte crée la partie avec tous les cyclistes et la même adresse passe en status:'playing'.
export const seatIds=count=>Array.from({length:count},(_,i)=>'p'+(i+1));
export async function createLobby({count,rules,name}){const net=await backend(),me=clientId();
 for(let tries=0;tries<8;tries++){const code=makeCode();
  if(await net.create(code,{status:'lobby',count,rules:JSON.stringify(rules),host:me,lobby:{p1:{client:me,name,ready:false}},createdAt:Date.now(),updatedAt:Date.now()}))return {code,seat:'p1'};}
 throw Error('Impossible de créer un code de partie, réessaie.');}
// Rejoindre la salle d'attente : première place libre (ou la sienne si on revient).
export async function joinLobby(code,name){const net=await backend(),me=clientId();let seat='';
 const r=await net.update(code,g=>{if(!g||g.status!=='lobby')return undefined;const lobby={...(g.lobby||{})},mine=Object.keys(lobby).find(id=>lobby[id]?.client===me);
  seat=mine||seatIds(g.count).find(id=>!lobby[id]?.client)||'';if(!seat)return undefined;lobby[seat]={...(lobby[seat]||{}),client:me,name:name||lobby[seat]?.name||'Cycliste',ready:Boolean(mine&&lobby[seat]?.ready)};return {...g,lobby,updatedAt:Date.now()};});
 if(!r.committed)throw Error('Partie complète ou déjà commencée.');return {code,seat};}
export async function setLobbySeat(code,seat,data){const net=await backend(),me=clientId();
 const r=await net.update(code,g=>{if(!g||g.status!=='lobby'||g.lobby?.[seat]?.client!==me)return undefined;return {...g,lobby:{...g.lobby,[seat]:{...g.lobby[seat],...data,client:me}},updatedAt:Date.now()};});
 if(!r.committed)throw Error('Impossible d’enregistrer ton cycliste (partie déjà lancée ?).');}
// Lancer : l'hôte envoie la partie complète ; chaque appareil garde sa place.
export async function startLobby(code,m){const net=await backend(),{light,board}=splitGame(m),me=clientId();
 const r=await net.update(code,g=>{if(!g||g.status!=='lobby'||g.host!==me)return undefined;const seats=Object.fromEntries(Object.entries(g.lobby||{}).map(([id,s])=>[id,s.client]));
  return {...g,status:'playing',board,state:light,rev:1,seats,names:Object.fromEntries(m.players.map(p=>[p.id,p.name])),updatedAt:Date.now()};});
 if(!r.committed)throw Error('Lancement impossible.');return 1;}
export async function getGame(code){const net=await backend();return net.get(code);}
export async function listenRaw(code,cb){const net=await backend();return net.listen(code,g=>cb(g));}
// Quitter la salle d'attente : la place redevient libre (l'hôte, lui, ferme la partie).
export async function leaveLobby(code,seat){const net=await backend(),me=clientId();
 await net.update(code,g=>{if(!g||g.status!=='lobby'||g.lobby?.[seat]?.client!==me)return undefined;
  if(g.host===me)return {...g,status:'closed',updatedAt:Date.now()};const lobby={...g.lobby};delete lobby[seat];return {...g,lobby,updatedAt:Date.now()};});}

// ---------- Petits messages entre joueurs (rangés à part de l'état de la partie) ----------
export async function sendChat(code,msg){const net=await backend();return net.sendChat(code,{...msg,text:String(msg.text||'').slice(0,200),at:Date.now()});}
export async function listenChat(code,cb){const net=await backend();return net.listenChat(code,cb);}

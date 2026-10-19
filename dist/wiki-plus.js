// WikiBike, explications plus poussées (demande de Fi, 19 octobre) :
// pour certains articles, un complément (selon le mode), une petite image et des liens « Voir aussi ».
// Rien ne change dans les règles : les chiffres viennent des règles du jeu (immersion.js, rules).
import {FATIGUE,FATIGUE_GAIN,FATIGUE_REST_DAY,NIGHT,DEMAND} from './immersion.js';
import {ruleVisual} from './rules-visuals.js';

const li=a=>`<ul>${a.filter(Boolean).map(x=>`<li>${x}</li>`).join('')}</ul>`;
const pct=n=>`${n} %`;
const table=(head,rows)=>`<table class="wiki-table"><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;

// Contenu par article : more(ctx) renvoie du HTML (texte écrit ici, jamais saisi par un joueur), see = articles liés, visual = vignette.
const EXTRA={
 journee:{see:['tracer','repas','bivouac','fatigue'],more:({imm})=>`<p><b>Une journée = un tour.</b> Dans l’ordre :</p>${li(['<b>Tracer</b> ton étape en cliquant les cases entourées.','<b>Rouler</b> : tu peux tracer et rouler encore tant qu’il te reste des cases et de l’énergie.','<b>Manger, acheter</b> : un repas des sacoches par jour, partout ; achats et restaurant en ville.','<b>Dormir</b> : « Finir ma journée » ouvre « Où dormir ce soir ? ». Dormir termine la journée et passe au joueur suivant.'])}${imm?'<p>En Immersion, une <b>scène</b> peut s’ouvrir en route, et la nuit est un petit pari.</p>':''}`},
 energie:{see:['cout-terrain','repas','fatigue','repos'],visual:'terrains',more:({imm})=>`<p>L’énergie, c’est ta <b>journée</b> : chaque case en coûte selon son terrain. Elle remonte en <b>mangeant</b> (repas froid +2, chaud +3 avec le réchaud, restaurant +4) et en <b>dormant</b>.</p><p>La fatigue, c’est ta <b>semaine</b> : elle baisse ton énergie maximale (${imm?'1 case par niveau':'2 par niveau'}).</p>`},
 'cout-terrain':{see:['energie','col','hors-route'],visual:'terrains'},
 cote:{see:['mer','ferry','cout-terrain'],visual:'cote',more:()=>`<p>Toute case qui <b>touche la mer</b> est une côte, même si le dessin la montre verte. Elle compte pour les objectifs « côtes ».</p>`},
 col:{see:['col-montagne','grimpeur','points'],visual:'col'},
 'col-montagne':{see:['col','consecutives'],visual:'col'},
 consecutives:{see:['objectif','col-montagne'],visual:'suite'},
 'villes-intermediaires':{see:['objectif','voyage'],visual:'villes'},
 objectif:{see:['consecutives','villes-intermediaires','score-voyage'],visual:'unique',more:()=>`<p><b>Une case ne compte qu’une fois par voyage</b> : repasser dessus ne la compte pas une 2ᵉ fois. Un nouveau voyage repart de zéro.</p>`},
 'score-voyage':{see:['arrivee-partielle','points','fin-partie'],visual:'points'},
 'arrivee-partielle':{see:['score-voyage'],visual:'points'},
 fatigue:{see:['fourbu','repos','camping','bivouac'],more:({imm,orig})=>imm?`<p><b>6 niveaux, de 0 à 5.</b> Chaque niveau bloque 1 case en haut de ta barre d’énergie.</p>${table(['Niveau','Énergie max','Ce qui change'],FATIGUE.map((f,i)=>[`${i} · ${f.name}`,`${10-i}`,[f.meal&&`repas −${f.meal}`,f.bet&&'paris plus durs',f.less&&`${f.less} case de moins par jour`,f.forced&&'repos forcé le lendemain',`galères : ${f.risk}`].filter(Boolean).join(' · ')]))}<p><b>Ce qui la fait monter</b> : +${FATIGUE_GAIN.day} par jour où tu roules, +${FATIGUE_GAIN.hard} de plus si tu passes un col ou fais ${FATIGUE_GAIN.hardCases} cases ; une nuit dehors ou une mauvaise nuit +1.</p><p><b>Ce qui la fait baisser</b> : camping −${-NIGHT.camping.fatigue}, hôtel −${-NIGHT.hotel.fatigue}, grand accueil chez l’habitant ; une <b>journée sans rouler</b> suivie d’une nuit : ${FATIGUE_REST_DAY.plain} (${FATIGUE_REST_DAY.city} en ville). Le bivouac ne la baisse pas.</p>`:orig?`<p><b>3 niveaux.</b> Chaque niveau baisse ton énergie maximale de <b>2</b> : 1 → 8, 2 → 6, 3 → 4. Au niveau 3, tu es <b>fourbu</b>.</p><p><b>Ce qui la fait monter</b> : +1 par journée de route, +1 de plus le jour d’un col ; une nuit dehors +1.</p><p><b>Ce qui l’efface</b> : camping, hôtel ou grand accueil. Le jardin l’enlève de 1. Le bivouac ne l’efface pas.</p>`:''},
 fourbu:{see:['fatigue','repos'],more:({imm,orig})=>imm?`<p>En Immersion, <b>Fourbu</b> est le niveau <b>5</b> : énergie maximale 5, repas −1, 1 case de moins, et <b>repos forcé le lendemain</b>. Avant d’y arriver, prévois un camping, un hôtel ou une journée sans rouler.</p>`:orig?`<p>En Original, tu es fourbu au niveau <b>3</b> : énergie maximale 4. Une nuit au camping ou à l’hôtel efface toute la fatigue.</p>`:''},
 repos:{see:['fatigue','camping','bivouac'],more:({imm})=>`<p>Ne trace rien et choisis tout de suite où dormir : la nuit rend <b>deux fois plus d’énergie</b>.${imm?` En Immersion, la fatigue baisse aussi de ${-FATIGUE_REST_DAY.plain} (${-FATIGUE_REST_DAY.city} en ville).`:''}</p><p>Exemple : camping après une journée de repos = +4 énergie au lieu de +2.</p>`},
 bivouac:{see:['camping','demander','nuit-dehors','pari'],more:({imm})=>imm?`${table(['Nuit','Prix','Énergie','Fatigue','Nuit calme','Galère','Belle surprise'],[['⛺ Bivouac','gratuit (tente)',`+${NIGHT.bivouac.energy}`,'=',pct(NIGHT.bivouac.odds.calm),pct(NIGHT.bivouac.odds.galere),pct(NIGHT.bivouac.odds.belle)],['⛺ sous la pluie','','','',pct(NIGHT.bivouac.stormy.calm),pct(NIGHT.bivouac.stormy.galere),pct(NIGHT.bivouac.stormy.belle)],['🏕 Camping','1 pièce',`+${NIGHT.camping.energy}`,`${NIGHT.camping.fatigue}`,pct(NIGHT.camping.odds.calm),pct(NIGHT.camping.odds.galere),pct(NIGHT.camping.odds.belle)],['🏨 Hôtel','3 pièces',`+${NIGHT.hotel.energy}`,`${NIGHT.hotel.fatigue}`,pct(NIGHT.hotel.odds.calm),pct(NIGHT.hotel.odds.galere),pct(NIGHT.hotel.odds.belle)]])}<p>En Immersion, <b>chaque nuit est un pari</b>. Chances du niveau Voyage ; elles changent avec le niveau.</p>`:`${table(['Nuit','Prix','Énergie','Fatigue'],[['⛺ Bivouac','gratuit (tente)','+1','gardée'],['🏕 Camping','1 pièce','+2','effacée'],['🏨 Hôtel','3 pièces, en ville','+3','effacée'],['🚪 Demander','gratuit','+2 au plus','selon l’accueil']])}<p>En Original, les nuits sont <b>sans surprise</b>.</p>`},
 camping:{see:['bivouac','demander','repos','fatigue']},
 demander:{see:['bivouac','nuit-dehors','pari'],more:({imm})=>imm?`<p>Chances de base : grand accueil ${pct(DEMAND.base.grand)}, jardin ${pct(DEMAND.base.jardin)}, refus ${pct(DEMAND.base.refus)}. Le refus est plus fréquent en ville, moins dans les Balkans ; demander plusieurs soirs de suite le rend plus fréquent. En cas de refus : camping de dernière minute à ${DEMAND.lateCampingPrice} pièces, ou nuit dehors.</p>`:''},
 pari:{see:['scenes','bivouac','demander','difficulte'],more:()=>`<p>Un pari affiche ses chances (« 2 sur 3 ») : tu connais le risque, pas le résultat. La fatigue (dès « Épuisé ») et le niveau de difficulté baissent les chances. En Expédition, les chances sont cachées.</p>`},
 repas:{see:['provisions','restaurant','rechaud','energie'],more:()=>`<p><b>On achète en ville, on mange partout.</b> Les repas dans tes sacoches se mangent n’importe où, un par jour : froid +2, chaud +3 avec le <b>réchaud</b>. Le bouton 🍎 Manger ouvre tous les choix.</p>`},
 'hors-route':{see:['route','gps','tracer']},
 meteo:{see:['temps','bivouac'],more:({imm})=>`${li(['💨 <b>Vent de face</b> : +1 énergie sur la première case du jour.','🌧 <b>Pluie</b> : +1 énergie hors route.','⛈ <b>Orage</b> : 3 cases au plus.','❄ <b>Neige</b> : +1 énergie en montagne et sur les cols.'])}${imm?'<p>Sous la pluie ou l’orage, le bivouac devient plus risqué.</p>':''}`},
 cartes:{see:['positive','negative','climatique','permanent'],more:({orig})=>orig?`${table(['Carte','Pour qui','Quand'],[['🟢 Positive','toi','pendant ton tour, une par tour'],['🔴 Négative','un autre cycliste','pendant ton tour ; il la découvre au début du sien'],['🔵 Climatique','un autre cycliste','quand il annonce son trajet (sans bulletin météo)'],['🟡 Bonus permanent','toi','posé devant toi, 2 au plus']])}<p>Main de 3 cartes au plus. Fin de journée : <b>pioche 2, garde-en 1</b>. « Coup de pouce » annule une carte jouée contre toi.</p>`:''},
 tutoriel:{see:['but','journee','original','immersion'],more:()=>`<p>Deux guides : <b>Apprendre à jouer</b> (mode Immersion, 5 jours, Budapest → Athènes) pour les bases, puis <b>Le mode Original et ses cartes</b> (3 jours, Lyon → Venise).</p>`},
 but:{see:['voyage','points','fin-partie']},
 points:{see:['score-voyage','col','lieu-cache','fin-partie']},
 original:{see:['cartes','fatigue','bivouac']},
 immersion:{see:['scenes','pari','fatigue','bivouac']}
};

// Complète les articles (sans les modifier) : extra = HTML, see = [{id,name}], visual = HTML.
export function wikiExtra(entry,entries,rules){const x=EXTRA[entry?.id];if(!x)return {extra:'',see:[],visual:''};
 const imm=Boolean(rules?.immersion?.enabled&&!rules?.immersion?.ultra),orig=!rules?.immersion?.enabled;
 let extra='';try{extra=x.more?x.more({imm,orig,rules}):'';}catch{extra='';}
 const see=(x.see||[]).map(id=>entries.find(e=>e.id===id)).filter(Boolean).map(e=>({id:e.id,name:e.name,icon:e.icon}));
 return {extra,see,visual:x.visual?ruleVisual(x.visual):''};}

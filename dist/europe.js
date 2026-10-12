// Fixed, simplified travel network on the illustrated Europe board.
// Coordinates refer to the 1536 × 1024 artwork, not a road-navigation map.
const cities=[
['Lisbonne',130,775],['Madrid',270,750],['Barcelone',439,740],
['Bordeaux',389,608],['Paris',477,498],['Lyon',572,581],['Marseille',552,664],
['Londres',463,370],['Dublin',300,325],['Bruxelles',579,435],['Amsterdam',587,371],
['Berlin',833,393],['Prague',863,472],['Vienne',911,536],['Zurich',692,541],
['Venise',795,613],['Rome',828,733],['Copenhague',785,312],['Oslo',741,214],
['Stockholm',875,205],['Varsovie',1094,410],['Budapest',1022,550],
['Zagreb',969,622],['Bucarest',1241,640],['Athènes',1147,817],['Istanbul',1351,744],
['Bergen',653,203],['Trondheim',778,143],['Narvik',858,79],['Cap Nord',923,25]
];
// Each route names endpoints followed by individual terrain spaces.
const routes=[
['Lisbonne','Madrid',[[162,753,'plaine'],[196,743,'plaine'],[230,746,'plaine']]],
['Madrid','Barcelone',[[307,735,'plaine'],[344,730,'montagne'],[380,730,'montagne'],[411,740,'plaine']]],
['Barcelone','Bordeaux',[[449,707,'montagne'],[427,681,'montagne'],[402,655,'montagne'],[393,632,'plaine']]],
['Barcelone','Marseille',[[474,708,'cote'],[497,692,'cote'],[519,683,'cote'],[539,688,'cote']]],
['Bordeaux','Paris',[[417,586,'plaine'],[438,563,'plaine'],[457,541,'plaine'],[467,518,'plaine']]],
['Bordeaux','Lyon',[[429,609,'plaine'],[466,600,'montagne'],[502,593,'plaine'],[538,590,'plaine']]],
['Paris','Lyon',[[500,518,'plaine'],[524,538,'plaine'],[547,560,'plaine']]],
['Lyon','Marseille',[[568,609,'plaine'],[560,637,'plaine']]],
['Paris','Bruxelles',[[502,472,'plaine'],[528,451,'plaine'],[554,442,'plaine']]],
['Bruxelles','Amsterdam',[[582,407,'plaine']]],
['Amsterdam','Berlin',[[636,370,'plaine'],[684,371,'plaine'],[733,380,'plaine'],[781,386,'plaine']]],
['Bruxelles','Prague',[[634,437,'plaine'],[690,449,'plaine'],[748,458,'plaine'],[805,466,'plaine']]],
['Berlin','Prague',[[843,420,'plaine'],[853,446,'plaine']]],
['Berlin','Varsovie',[[893,390,'plaine'],[954,397,'plaine'],[1015,403,'plaine']]],
['Prague','Vienne',[[880,495,'plaine'],[895,516,'plaine']]],
['Lyon','Zurich',[[595,567,'montagne'],[619,551,'montagne'],[643,541,'montagne'],[669,540,'montagne']]],
['Zurich','Vienne',[[734,534,'montagne'],[777,531,'montagne'],[820,530,'montagne'],[865,533,'montagne']]],
['Prague','Zurich',[[823,490,'plaine'],[781,505,'montagne'],[738,522,'plaine']]],
['Zurich','Venise',[[716,563,'montagne'],[742,582,'montagne'],[767,600,'plaine']]],
['Marseille','Venise',[[600,651,'cote'],[647,640,'cote'],[695,627,'cote'],[744,618,'cote']]],
['Venise','Rome',[[798,642,'plaine'],[810,670,'montagne'],[823,698,'montagne']]],
['Vienne','Budapest',[[948,540,'plaine'],[985,545,'plaine']]],
['Vienne','Zagreb',[[929,562,'plaine'],[949,592,'plaine']]],
['Budapest','Bucarest',[[1060,565,'plaine'],[1098,583,'montagne'],[1137,600,'montagne'],[1176,616,'montagne'],[1209,629,'plaine']]],
['Varsovie','Budapest',[[1080,448,'plaine'],[1065,484,'montagne'],[1042,520,'plaine']]],
['Zagreb','Bucarest',[[1020,634,'plaine'],[1072,644,'montagne'],[1126,646,'montagne'],[1182,643,'plaine']]],
['Zagreb','Athènes',[[998,653,'montagne'],[1026,688,'montagne'],[1055,722,'montagne'],[1084,754,'plaine'],[1113,786,'plaine']]],
['Bucarest','Istanbul',[[1259,673,'plaine'],[1283,700,'plaine'],[1306,719,'cote'],[1329,733,'cote']]],
['Athènes','Istanbul',[[1174,787,'cote'],[1198,758,'cote'],[1227,736,'cote'],[1263,731,'plaine'],[1307,745,'plaine']]],
['Berlin','Copenhague',[[819,370,'plaine'],[805,347,'plaine'],[793,330,'cote']]],
['Copenhague','Stockholm',[[816,300,'cote'],[838,280,'cote'],[853,256,'cote'],[867,231,'plaine']]],
['Stockholm','Oslo',[[841,209,'plaine'],[808,212,'plaine'],[775,215,'plaine']]],
['Oslo','Bergen',[[711,208,'montagne'],[682,204,'montagne']]],
['Bergen','Trondheim',[[665,176,'cote'],[696,155,'cote'],[732,142,'cote']]],
['Oslo','Trondheim',[[744,189,'montagne'],[759,166,'montagne']]],
['Trondheim','Narvik',[[798,128,'montagne'],[817,111,'montagne'],[838,96,'montagne']]],
['Narvik','Cap Nord',[[878,65,'cote'],[896,48,'cote'],[911,35,'cote']]],
['Copenhague','Oslo',[],true],['Londres','Paris',[[472,434,'cote']],true],
['Dublin','Londres',[],true]
];
export function europeBoard(from,to){
 const board={},byName={},edges=[];let next=1;
 const node=(key,name,x,y,type)=>{board[key]={id:next++,key,name,x,y,type,roads:[],rotation:0,links:[]};return key;};
 for(const [name,x,y] of cities){const k='city-'+name;byName[name]=node(k,name,x,y,name==='Cap Nord'?'cote':'ville');}
 const link=(a,b,ferry=false)=>{board[a].links.push(b);board[b].links.push(a);edges.push({a,b,ferry});};
 routes.forEach(([a,b,spaces,ferry],i)=>{let prev=byName[a];spaces.forEach(([x,y,type],j)=>{const k=node(`route-${i}-${j}`,'',x,y,type);link(prev,k,!!ferry);prev=k;});link(prev,byName[b],!!ferry);});
 const start=byName[from],arrival=byName[to];if(!start||!arrival)throw new Error('Ville du voyage absente du plateau');
 board[start].id=0;
 return {board,edges,start,arrivalId:board[arrival].id};
}

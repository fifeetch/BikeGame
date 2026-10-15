// Données géographiques du plateau Europe (longitude, latitude en degrés ; distances en km).
// Projection : voir projection.mjs. Cylindrique (méridiens verticaux, parallèles horizontaux, comme les cartes
// habituelles) avec une « loupe » douce sur l'Europe de l'Ouest pour que les pays denses restent lisibles.
// Cadrage : cap Nord en haut, Athènes en bas, Lisbonne à gauche du plateau (1261 × 842).
export const PROJECTION={centre:[10,46],loupe:{focus:[8,50],mx:1.35,x0:3000,my:1.15,y0:3000},cadrage:{top:['Cap Nord',36],bottom:['Athènes',790],left:['Lisbonne',180]}};

// Ordre = priorité de placement (une case par ville). port : doit toucher la mer.
// with : le port doit être sur la même terre que cette ville (avant ferries).
export const CITIES=[
 {name:'Paris',lon:2.35,lat:48.86},{name:'Londres',lon:-0.13,lat:51.51,inland:true},{name:'Madrid',lon:-3.70,lat:40.42},{name:'Rome',lon:12.50,lat:41.90},
 {name:'Berlin',lon:13.40,lat:52.52},{name:'Moscou',lon:37.62,lat:55.76},{name:'Istanbul',lon:28.98,lat:41.01,port:true},{name:'Vienne',lon:16.37,lat:48.21},
 {name:'Lisbonne',lon:-9.14,lat:38.72,port:true},{name:'Barcelone',lon:2.17,lat:41.39,port:true},{name:'Marseille',lon:5.37,lat:43.30,port:true},
 {name:'Lyon',lon:4.84,lat:45.76},{name:'Bordeaux',lon:-0.58,lat:44.84},{name:'Lille',lon:3.06,lat:50.63},{name:'Bruxelles',lon:4.35,lat:50.85},
 {name:'Amsterdam',lon:4.90,lat:52.37,port:true},{name:'Zurich',lon:8.54,lat:47.38},{name:'Milan',lon:9.19,lat:45.46},{name:'Venise',lon:12.32,lat:45.44,port:true},
 {name:'Prague',lon:14.42,lat:50.08},{name:'Budapest',lon:19.04,lat:47.50},{name:'Varsovie',lon:21.01,lat:52.23},{name:'Copenhague',lon:12.57,lat:55.68,port:true,cell:[6,19]},
 {name:'Oslo',lon:10.75,lat:59.91,port:true},{name:'Stockholm',lon:18.07,lat:59.33,port:true},{name:'Bergen',lon:5.32,lat:60.39,port:true},{name:'Trondheim',lon:10.40,lat:63.43,port:true},
 {name:'Narvik',lon:17.43,lat:68.44,port:true},{name:'Cap Nord',lon:25.78,lat:71.17,port:true},{name:'Saint-Pétersbourg',lon:30.31,lat:59.94,port:true},{name:'Tallinn',lon:24.75,lat:59.44,port:true},
 {name:'Riga',lon:24.11,lat:56.95,port:true},{name:'Vilnius',lon:25.28,lat:54.69},{name:'Kiev',lon:30.52,lat:50.45},{name:'Dublin',lon:-6.26,lat:53.35,port:true},
 {name:'Zagreb',lon:15.98,lat:45.81},{name:'Belgrade',lon:20.46,lat:44.79},{name:'Sarajevo',lon:18.41,lat:43.86},{name:'Sofia',lon:23.32,lat:42.70},
 {name:'Bucarest',lon:26.10,lat:44.43},{name:'Skopje',lon:21.43,lat:42.00},{name:'Thessalonique',lon:22.94,lat:40.64,port:true},{name:'Athènes',lon:23.73,lat:37.98,port:true},
 // Ports des ferries
 {name:'Douvres',lon:1.31,lat:51.13,port:true,with:'Londres'},{name:'Calais',lon:1.86,lat:50.95,port:true,with:'Paris'},
 {name:'Holyhead',lon:-4.63,lat:53.31,port:true,with:'Londres'},
 {name:'Helsingør',lon:12.59,lat:56.03,port:true,cell:[6,18]},{name:'Helsingborg',lon:12.69,lat:56.05,port:true,cell:[7,17]},
 {name:'Hirtshals',lon:9.96,lat:57.59,port:true,with:'Berlin'},{name:'Kristiansand',lon:7.99,lat:58.15,port:true,with:'Oslo'},
 {name:'Ancona',lon:13.52,lat:43.62,port:true,with:'Rome'},{name:'Split',lon:16.44,lat:43.51,port:true,with:'Zagreb'},
 {name:'Izmir',lon:27.14,lat:38.42,port:true,with:'Istanbul'},
 // Est de l'Europe, Caucase et Anatolie : vraies villes, vraies coordonnées
 {name:'Helsinki',lon:24.94,lat:60.17,port:true},{name:'Minsk',lon:27.56,lat:53.90},{name:'Lviv',lon:24.03,lat:49.84},{name:'Odessa',lon:30.73,lat:46.48,port:true},
 {name:'Chișinău',lon:28.86,lat:47.01},{name:'Kharkiv',lon:36.23,lat:49.99},{name:'Smolensk',lon:32.05,lat:54.78},{name:'Novgorod',lon:31.27,lat:58.52},
 {name:'Iaroslavl',lon:39.89,lat:57.63},{name:'Voronej',lon:39.20,lat:51.67},{name:'Rostov-sur-le-Don',lon:39.72,lat:47.22},{name:'Volgograd',lon:44.51,lat:48.71},
 {name:'Nijni Novgorod',lon:44.00,lat:56.33},{name:'Kazan',lon:49.11,lat:55.80},{name:'Samara',lon:50.10,lat:53.20},{name:'Tbilissi',lon:44.79,lat:41.72},
 {name:'Ankara',lon:32.85,lat:39.93},{name:'Trabzon',lon:39.72,lat:41.00,port:true},{name:'Arkhangelsk',lon:40.54,lat:64.54,port:true},{name:'Petrozavodsk',lon:34.35,lat:61.79},
 {name:'Constanța',lon:28.65,lat:44.17,port:true},{name:'Bakou',lon:49.87,lat:40.41,port:true},{name:'Perm',lon:56.25,lat:58.01},{name:'Oufa',lon:55.96,lat:54.74},
 {name:'Orenburg',lon:55.10,lat:51.77},{name:'Ekaterinbourg',lon:60.60,lat:56.84},{name:'Astrakhan',lon:48.03,lat:46.35},{name:'Krasnodar',lon:38.98,lat:45.04}
];
export const FERRIES=[['Calais','Douvres'],['Helsingør','Helsingborg'],['Hirtshals','Kristiansand'],['Ancona','Split'],['Thessalonique','Izmir'],['Dublin','Holyhead']];

// Bras de mer plus étroits qu'une case, gardés en mer (sinon la grille les « boucherait »).
export const STRAITS=[
 {name:'Pas de Calais',line:[[-0.6,50.25],[1.0,50.75],[1.6,51.1],[2.6,51.6]]},
 {name:'Øresund',line:[[12.3,56.7],[12.65,56.1],[12.8,55.6],[12.9,55.1]]},
 {name:'Gibraltar',line:[[-7.0,35.9],[-5.6,35.97],[-4.0,36.2]]},
 {name:'Mer d\'Irlande',line:[[-5.2,54.4],[-5.4,53.4],[-5.8,52.4],[-6.4,51.6]]},
 {name:'Canal du Nord',line:[[-6.6,55.9],[-5.75,55.05],[-5.3,54.3]]}
];
// Grands lacs absents du tracé des côtes (cercles approximatifs).
export const LAKES=[[31.6,60.8,85],[35.4,61.7,70],[13.3,58.95,40],[27.6,58.6,35]];

// Relief : ligne de crête, demi-largeur haute montagne (core) et demi-largeur collines (hills), en km.
const R=(name,core,hills,line)=>({name,core,hills,line});
export const RANGES=[
 R('Alpes',50,100,[[7.3,43.9],[6.6,44.6],[6.3,45.3],[6.9,45.9],[7.9,46.1],[8.5,46.6],[9.8,46.6],[11.3,47.0],[12.7,47.1],[14.2,47.3],[15.6,47.6]]),
 R('Pyrénées',55,95,[[-1.8,43.0],[-0.5,42.8],[0.7,42.7],[1.8,42.55],[2.8,42.45]]),
 R('Cordillère cantabrique',30,70,[[-7.2,42.9],[-5.5,43.0],[-4.0,43.05],[-2.6,43.0]]),
 R('Système central',25,70,[[-7.0,40.2],[-5.5,40.3],[-4.0,40.8],[-3.2,41.1]]),
 R('Système ibérique',20,80,[[-2.9,42.0],[-2.0,41.2],[-1.0,40.4]]),
 R('Sierra Nevada',30,80,[[-5.0,36.8],[-3.6,37.05],[-2.5,37.2]]),
 R('Meseta',0,120,[[-5.5,39.3],[-3.0,39.4]]),
 R('Sierra Morena',0,50,[[-7.0,38.0],[-4.0,38.3],[-2.5,38.5]]),
 R('Massif central',0,125,[[2.4,44.8],[2.9,45.4],[3.4,45.9]]),
 R('Jura',0,45,[[5.6,46.3],[6.6,46.9],[7.6,47.5]]),
 R('Vosges et Forêt-Noire',0,55,[[6.9,47.9],[7.1,48.6],[8.2,48.5],[8.1,47.9]]),
 R('Massif schisteux rhénan',0,70,[[6.3,50.3],[7.6,50.4],[8.6,50.8]]),
 R('Massifs allemands',0,55,[[10.6,51.8],[10.8,50.7],[12.3,50.5],[13.5,50.6]]),
 R('Bohême',0,60,[[12.6,49.3],[14.0,48.8],[16.0,50.6]]),
 R('Apennins',35,95,[[8.6,44.4],[10.4,44.2],[12.3,43.4],[13.6,42.4],[14.6,41.4],[15.6,40.4],[16.2,39.3],[15.9,38.3]]),
 R('Sicile',0,90,[[13.0,37.8],[15.0,37.6]]),
 R('Sardaigne',0,90,[[9.0,41.0],[9.1,39.3]]),
 R('Corse',40,60,[[9.2,42.9],[9.1,41.7]]),
 R('Alpes dinariques',45,110,[[14.3,45.7],[15.9,44.6],[17.6,43.6],[19.3,42.6],[20.2,41.6]]),
 R('Pinde',35,85,[[20.6,40.4],[21.3,39.2],[22.0,38.5]]),
 R('Péloponnèse',0,80,[[22.0,37.6],[22.5,37.1]]),
 R('Balkan',30,70,[[22.4,43.6],[24.0,42.8],[25.5,42.75],[27.0,42.75]]),
 R('Rila et Rhodopes',40,80,[[23.2,42.1],[24.5,41.8],[25.6,41.6]]),
 R('Carpates',40,95,[[17.6,48.8],[19.5,49.2],[21.5,49.1],[23.5,48.3],[24.8,47.6],[25.6,46.6],[25.8,45.6],[24.5,45.45],[22.6,45.3],[22.1,44.7]]),
 R('Alpes scandinaves',60,140,[[6.8,59.2],[7.6,60.6],[8.8,61.7],[10.5,62.6],[12.4,63.6],[14.0,65.0],[15.8,66.6],[17.8,68.0],[20.5,69.0],[23.0,69.8]]),
 R('Highlands',40,95,[[-5.6,56.6],[-4.6,57.1],[-3.4,57.1],[-4.6,58.2]]),
 R('Hautes terres du Sud',0,55,[[-4.8,55.2],[-3.2,55.5]]),
 R('Pennines',0,45,[[-2.4,55.0],[-2.1,54.0],[-1.9,53.2]]),
 R('Pays de Galles',0,60,[[-3.9,53.0],[-3.6,52.2],[-3.4,51.8]]),
 R('Kerry et Wicklow',0,40,[[-9.6,51.9],[-8.3,52.2]]),
 R('Islande',40,140,[[-21.5,64.8],[-18.0,64.9],[-15.5,64.9]]),
 R('Atlas',45,100,[[-8.0,31.0],[-5.6,32.6],[-3.0,34.0],[0.5,35.6],[4.0,36.2],[7.5,36.4],[9.0,36.6]]),
 R('Crimée',0,45,[[33.6,44.6],[35.0,44.85]]),
 R('Caucase',55,110,[[37.3,44.7],[39.5,43.7],[41.5,43.3],[43.5,42.9],[45.5,42.2],[47.5,41.4]]),
 R('Pontiques',35,85,[[31.5,41.1],[34.0,41.2],[36.5,41.0],[39.0,40.7],[41.5,40.8]]),
 R('Taurus',45,95,[[29.0,36.9],[31.5,36.9],[33.5,36.9],[35.5,37.4],[37.5,37.9],[40.0,38.3],[42.5,38.2]]),
 R('Plateau anatolien',0,150,[[30.5,39.0],[33.0,39.0],[36.0,39.0],[39.5,39.5]]),
 R('Arménie',50,120,[[42.5,40.0],[44.5,39.5],[46.0,38.9]]),
 R('Zagros',50,110,[[44.5,37.0],[46.5,35.0],[48.5,33.0]]),
 R('Liban',30,60,[[35.8,33.5],[36.3,34.5]]),
 R('Oural',45,110,[[59.3,52.0],[59.6,55.0],[59.4,58.0],[59.2,61.0],[59.6,64.0]]),
 R('Valdaï',0,70,[[32.0,57.2],[33.5,57.5]]),
 R('Massif de Kola',0,80,[[32.5,67.6],[34.0,67.8]])
];

// Retouches case par case, valables pour la projection ci-dessus (q, r de la grille du jeu).
// Danemark : à cette échelle, Seeland disparaissait. On le recrée (Helsingør au nord, Copenhague au sud-est), relié au
// Jutland comme par les ponts du Grand Belt, et Helsingborg en Scanie de l'autre côté du Sund (Øresund), qui reste en mer.
export const RETOUCHES=[
 // Seeland (3 cases) relié au Jutland par la case (4,18) comme par les ponts du Grand Belt
 {q:5,r:18,type:'plaine'},{q:6,r:18,type:'plaine'},{q:6,r:19,type:'plaine'},
 // Øresund et mer Baltique autour de Seeland (sinon Seeland toucherait la Suède ou l'Allemagne)
 {q:7,r:18,type:'mer'},{q:6,r:20,type:'mer'},{q:7,r:20,type:'mer'},{q:5,r:19,type:'mer'},
 // Jutland un peu moins large ; Scanie (Helsingborg) bien en face d'Helsingør
 {q:2,r:18,type:'mer'},{q:7,r:17,type:'plaine'}
];

// Noms des mers (texte, longitude, latitude, taille, angle) : placés par la projection sur la carte peinte.
export const SEA_LABELS=[
 ['OCÉAN ATLANTIQUE',-18.5,52,17,78],['MER DU NORD',3.5,56.3,10,8],['MER DE NORVÈGE',1.5,66,12,-20],['MER BALTIQUE',19,57.3,10,-30],
 ['MANCHE',-3.6,49.9,8,8],['MER MÉDITERRANÉE',5.5,39.2,14,0],['MER TYRRHÉNIENNE',12.2,39.8,8,-30],['MER ADRIATIQUE',15.2,43.2,7,-35],
 ['MER IONIENNE',18.5,37.5,8,0],['MER ÉGÉE',25.0,38.8,8,-70],['MER NOIRE',34,43.4,11,-6],['MER DE BARENTS',40,71.4,10,0],['MER CASPIENNE',50.5,42,9,-70]
];
// Grands fleuves (longitude, latitude), de la source vers l'embouchure. Décor uniquement.
export const RIVERS={
 Danube:[[8.5,47.95],[10,48.4],[11.4,48.75],[13.4,48.57],[14.3,48.3],[16.37,48.21],[17.1,48.1],[18.8,47.8],[19.04,47.5],[18.9,46.3],[19.9,45.3],[20.46,44.79],[22.5,44.6],[24.2,43.7],[26.0,43.9],[27.9,44.2],[28.2,45.4],[29.6,45.2]],
 Rhin:[[9.5,47.5],[8.6,47.6],[7.6,47.6],[7.8,48.6],[8.4,49.0],[8.3,50.0],[7.6,50.4],[6.95,50.94],[6.6,51.8],[5.9,51.9],[4.1,51.95]],
 Seine:[[4.6,47.8],[3.9,48.4],[2.35,48.86],[1.5,49.1],[0.2,49.45]],
 Loire:[[4.0,45.2],[3.2,46.9],[2.4,47.2],[1.7,47.9],[0.7,47.4],[-0.5,47.4],[-2.1,47.3]],
 Rhône:[[8.0,46.4],[6.15,46.2],[5.6,45.9],[4.84,45.76],[4.8,44.9],[4.7,44.1],[4.7,43.4]],
 Garonne:[[0.7,42.8],[1.44,43.6],[0.6,44.2],[-0.58,44.84],[-1.1,45.6]],
 Elbe:[[15.6,50.4],[14.4,50.6],[13.7,51.05],[12.3,51.9],[11.6,52.6],[10.0,53.55],[8.7,53.9]],
 Oder:[[17.6,49.8],[17.0,51.1],[15.6,51.9],[14.6,52.6],[14.4,53.5]],
 Vistule:[[19.0,49.6],[20.0,50.05],[21.0,51.3],[21.01,52.23],[19.6,52.6],[18.6,53.0],[18.8,54.3]],
 Pô:[[7.1,44.7],[7.7,45.05],[9.0,45.15],[10.5,45.0],[11.9,44.95],[12.5,44.95]],
 Tage:[[-1.9,40.4],[-3.7,40.0],[-5.0,39.85],[-7.0,39.6],[-8.6,39.2],[-9.1,38.7]],
 Douro:[[-2.9,41.8],[-4.7,41.5],[-6.4,41.2],[-8.6,41.15]],
 Èbre:[[-4.0,43.0],[-2.4,42.5],[-0.9,41.65],[0.6,40.9],[0.85,40.7]],
 Guadalquivir:[[-3.0,38.0],[-4.8,37.9],[-6.0,37.4],[-6.3,36.8]],
 Dniepr:[[33.0,55.0],[30.9,54.4],[30.3,53.0],[30.52,50.45],[32.0,49.4],[35.1,47.8],[33.4,46.8],[32.2,46.5]],
 Dniestr:[[23.5,49.3],[26.5,48.6],[28.8,47.0],[30.2,46.4]],
 Don:[[38.3,53.8],[39.2,51.0],[41.0,49.5],[42.0,48.2],[39.6,47.2]],
 Volga:[[33.0,57.3],[36.0,56.9],[38.8,57.5],[40.4,57.6],[43.9,56.3],[48.5,55.8],[49.1,55.0],[48.0,51.5],[45.8,48.6],[47.8,46.4]],
 Daugava:[[28.0,55.9],[26.5,55.9],[24.1,56.95]],
 Niémen:[[26.0,53.6],[24.3,54.6],[22.0,55.1],[21.2,55.3]],
 Tamise:[[-1.6,51.7],[-0.13,51.51],[0.6,51.48]]
};

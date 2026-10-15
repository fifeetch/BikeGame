// Rencontres de la route (mode « Rencontres », choisi au début de la partie à la place des cartes Événement).
// Chaque soir, le cycliste vit une rencontre liée à l'endroit où il s'arrête, et choisit ce qu'il fait.
// Fi peut modifier ces textes, ou ajouter ses vraies rencontres de voyage, en gardant la même forme.
//
// where : où la rencontre peut arriver — 'partout', un type de case ('ville', 'montagne', 'cote', 'plaine')
//         ou une région de la météo ('ouest', 'alpes', 'nord', 'est', 'balkans').
// Chaque choix : label (le bouton), text (ce qui se passe), effect (ce que ça change) :
//   energy, food (repas), money (pièces), points (aventure), fatigue (−1 = un peu de repos),
//   tomorrow (+1 = une case de plus demain, −1 = une case de moins demain).
// need : ce qu'il faut avoir pour choisir (ex. {money:1} ou {food:1}).
export const ENCOUNTERS=[
 {id:'berger',where:'montagne',title:'Le berger de l’alpage',scene:'montagne',quote:'« Par le sentier des bergers, tu gagnes du temps. Mais c’est raide, et ça ne passe que par les pierres. »',choices:[
  {label:'Prendre le sentier demain',text:'Une case de plus demain, mais ça se paie en jambes.',effect:{tomorrow:1,energy:-2,points:2}},
  {label:'Partager son repas',text:'Fromage, pain et histoires de montagne.',need:{food:1},effect:{food:-1,energy:3,points:1}},
  {label:'Saluer et continuer',text:'Un signe de la main, et la route reprend.',effect:{}}]},
 {id:'grange',where:'plaine',title:'La grange ouverte',scene:'plaine',quote:'« Il va pleuvoir cette nuit. Ma grange est sèche, si tu veux. »',choices:[
  {label:'Dormir dans la grange',text:'Une nuit au sec sur la paille.',effect:{energy:2,fatigue:-1}},
  {label:'Aider à rentrer le foin',text:'Une heure de travail, un vrai merci.',effect:{energy:-1,money:2}},
  {label:'Remercier et repartir',text:'La tente fera l’affaire.',effect:{}}]},
 {id:'boulangerie',where:'ville',title:'La boulangerie du coin',scene:'ville',quote:'Une odeur de pain chaud à l’heure où la ville s’endort.',choices:[
  {label:'Acheter des viennoiseries',text:'De quoi tenir la route demain.',need:{money:1},effect:{money:-1,food:2}},
  {label:'Discuter avec la boulangère',text:'Elle connaît un raccourci par les chemins.',effect:{tomorrow:1,points:1}},
  {label:'Passer son chemin',text:'Le ventre peut attendre.',effect:{}}]},
 {id:'pecheurs',where:'cote',title:'Les pêcheurs du port',scene:'cote',quote:'Les bateaux rentrent, les filets sont pleins.',choices:[
  {label:'Aider à décharger',text:'Le patron t’offre du poisson grillé.',effect:{energy:-1,food:2,points:1}},
  {label:'Regarder le coucher de soleil',text:'Rien à faire, juste la mer. Ça repose.',effect:{fatigue:-1,points:1}},
  {label:'Filer au camping',text:'Une bonne nuit avant tout.',effect:{}}]},
 {id:'cycliste-perdu',where:'partout',title:'Un cycliste égaré',scene:'plaine',quote:'Un voyageur à vélo tourne en rond, sa carte à l’envers.',choices:[
  {label:'Faire un bout de route ensemble',text:'Vous roulez à deux, c’est plus léger.',effect:{tomorrow:1,points:2}},
  {label:'Lui prêter ta chambre à air',text:'Il crevait depuis ce matin. Il te paie le dîner.',effect:{money:1,points:2}},
  {label:'Lui indiquer la route',text:'Un sourire, et chacun repart.',effect:{points:1}}]},
 {id:'crevaison-nuit',where:'partout',title:'Le pneu dégonflé',scene:'plaine',quote:'Au moment de ranger le vélo : le pneu arrière est mou.',choices:[
  {label:'Réparer tout de suite',text:'Une demi-heure à la frontale.',effect:{energy:-1}},
  {label:'Réparer demain matin',text:'Tu pars plus tard.',effect:{tomorrow:-1}}]},
 {id:'fete-village',where:'ville',title:'La fête du village',scene:'ville',quote:'Musique sur la place, lampions et grandes tablées.',choices:[
  {label:'Danser jusqu’à minuit',text:'Inoubliable. Les jambes, un peu moins.',effect:{points:3,fatigue:1}},
  {label:'Manger au banquet',text:'On te sert sans même demander.',effect:{energy:3,food:1}},
  {label:'Dormir tôt',text:'La musique berce la tente.',effect:{energy:1}}]},
 {id:'orage-col',where:'montagne',title:'L’orage sur le col',scene:'montagne',quote:'Le ciel noircit au-dessus des sommets.',choices:[
  {label:'Attendre au refuge',text:'Tu repars plus tard demain, mais au sec.',effect:{tomorrow:-1,energy:2}},
  {label:'Descendre avant la pluie',text:'Une descente à toute allure.',effect:{energy:-2,points:2}}]},
 {id:'source',where:'partout',title:'La source fraîche',scene:'plaine',quote:'Une fontaine au bord du chemin, l’eau la plus froide du voyage.',choices:[
  {label:'Faire une vraie pause',text:'Pieds dans l’eau, dos à l’ombre.',effect:{energy:2}},
  {label:'Remplir les gourdes et repartir',text:'Demain, tu pars plus vite.',effect:{tomorrow:1}}]},
 {id:'marche',where:'ville',title:'Le marché du soir',scene:'ville',quote:'Les maraîchers bradent leurs derniers cageots.',choices:[
  {label:'Faire le plein pour pas cher',text:'Trois repas pour une pièce.',need:{money:1},effect:{money:-1,food:3}},
  {label:'Vendre un coup de main',text:'Tu remballes les étals.',effect:{energy:-1,money:2}},
  {label:'Juste flâner',text:'Les couleurs, les voix, les odeurs.',effect:{points:1}}]},
 {id:'chien',where:'plaine',title:'Le chien de ferme',scene:'plaine',quote:'Un gros chien court après le vélo en aboyant.',choices:[
  {label:'Sprinter',text:'Tu le sèmes, mais ça pique.',effect:{energy:-2,points:1}},
  {label:'S’arrêter et lui parler',text:'Il remue la queue. Le fermier t’offre un café.',effect:{energy:1,points:1}}]},
 {id:'phare',where:'cote',title:'Le gardien du phare',scene:'cote',quote:'« Tu peux monter voir la vue. 224 marches. »',choices:[
  {label:'Monter au sommet',text:'Toute la côte d’un coup d’œil.',effect:{energy:-1,points:3}},
  {label:'Boire un thé avec lui',text:'Il raconte quarante ans de tempêtes.',effect:{energy:1,points:1}}]},
 {id:'auberge-nord',where:'nord',title:'Le sauna du camping',scene:'cote',quote:'Ici, on finit la journée par un sauna et un plongeon dans le lac.',choices:[
  {label:'Essayer le sauna',text:'Les muscles fondent.',need:{money:1},effect:{money:-1,fatigue:-1,energy:2}},
  {label:'Plonger dans le lac',text:'Un froid qui réveille pour trois jours.',effect:{points:2,energy:1}},
  {label:'Rester sous la tente',text:'Le soleil ne se couche presque pas.',effect:{}}]},
 {id:'babouchka',where:'est',title:'L’accueil de la babouchka',scene:'ville',quote:'Une vieille dame t’invite à entrer : soupe, pain noir, thé.',choices:[
  {label:'Accepter l’invitation',text:'Une soirée chaude et une vraie nuit.',effect:{energy:3,fatigue:-1,points:1}},
  {label:'Offrir un coup de main au potager',text:'Elle te remplit les sacoches.',effect:{energy:-1,food:3}}]},
 {id:'balkans-cafe',where:'balkans',title:'Le café sur la place',scene:'ville',quote:'Des anciens jouent au tavla. On te fait signe de t’asseoir.',choices:[
  {label:'Jouer une partie',text:'Tu perds, mais tout le monde rit.',effect:{points:2}},
  {label:'Demander la route',text:'Ils te dessinent un raccourci sur une serviette.',effect:{tomorrow:1}}]},
 {id:'alpes-fromager',where:'alpes',title:'La fromagerie d’alpage',scene:'montagne',quote:'Une meule de la taille d’une roue de vélo.',choices:[
  {label:'Acheter un morceau',text:'Lourd dans les sacoches, mais quel repas.',need:{money:1},effect:{money:-1,food:2,energy:1}},
  {label:'Visiter la cave',text:'L’odeur te suit jusqu’au soir.',effect:{points:1}}]},
 {id:'ouest-vigneron',where:'ouest',title:'Le vigneron',scene:'plaine',quote:'« Tu as soif ? Viens goûter, c’est la vendange. »',choices:[
  {label:'Aider aux vendanges',text:'Une journée de paie, des mains violettes.',effect:{energy:-2,money:3}},
  {label:'Goûter et dormir sur place',text:'Une nuit au milieu des vignes.',effect:{energy:2,points:1}}]},
 {id:'panne-camion',where:'partout',title:'Le camion en panne',scene:'plaine',quote:'Un routier attend la dépanneuse au bord de la route.',choices:[
  {label:'Lui tenir compagnie',text:'Il partage ses sandwichs et ses histoires.',effect:{food:1,points:1}},
  {label:'Proposer d’appeler à la prochaine ville',text:'Il te remercie d’un billet.',effect:{money:1}}]},
 {id:'nuit-etoiles',where:'partout',title:'La nuit étoilée',scene:'montagne',quote:'Pas un nuage. La Voie lactée au-dessus du vélo.',choices:[
  {label:'Veiller pour regarder',text:'Une étoile filante. Tu dors moins.',effect:{points:2,fatigue:1}},
  {label:'Dormir tôt',text:'La meilleure nuit depuis longtemps.',effect:{energy:2}}]},
 {id:'mecano',where:'ville',title:'L’atelier vélo',scene:'ville',quote:'Un mécanicien regarde ta chaîne en grimaçant.',choices:[
  {label:'Faire réviser le vélo',text:'Tout tourne rond : tu pars vite demain.',need:{money:2},effect:{money:-2,tomorrow:1}},
  {label:'Huiler la chaîne soi-même',text:'Les mains noires, mais ça roule.',effect:{energy:-1}}]}
];
export const SCENES=['montagne','plaine','ville','cote'];

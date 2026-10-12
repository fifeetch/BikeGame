import {readFile,writeFile} from 'node:fs/promises';
import {europeBoard} from '../dist/europe.js';
import {playableMap} from '../dist/europe-map.js';
const {board,edges,start,arrivalId}=europeBoard('Paris','Istanbul');
const css=await readFile(new URL('../dist/style.css',import.meta.url),'utf8');
const style=css.slice(css.indexOf('/* Equal-size hexagonal Europe board.'));
const svg=playableMap({board,edges,pos:start,arrivalId,visited:[],energy:10,phase:'preview'},[],()=>1);
await writeFile(new URL('../dist/assets/europe/hex-board.svg',import.meta.url),svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ').replace('>\n <rect','><style>'+style+'</style>\n <rect'));
console.log('Hexagonal Europe preview generated.');

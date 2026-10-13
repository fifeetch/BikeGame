// Each illustration has the same centered road exits as the rules engine.
export const shapes = [[0,2],[0,1],[0,1,2],[0,1,2,3]];
export const families = ['plaine','montagne','ville','cote'];
export function artFor(t) {
  const family = ({camping:'plaine',auberge:'ville',col:'montagne',decouverte:'cote',moyenne_montagne:'montagne'})[t.type] || t.type;
  const actual = t.roads.map(d=>(d+t.rotation)%4).sort().join(',');
  for(let shape=0;shape<shapes.length;shape++) for(let rotation=0;rotation<4;rotation++) {
    if(shapes[shape].map(d=>(d+rotation)%4).sort().join(',')===actual)
      return {src:`assets/tiles/${family}-${shape}.webp`,rotation,shape,family};
  }
  return null;
}

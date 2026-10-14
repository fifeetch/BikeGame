// Variantes d'apparence proposées dans l'éditeur. Purement visuel : le type de terrain (donc les règles) ne change pas.
export const TERRAIN_VARIANTS={
 mer:[['profonde','Mer profonde'],['cotiere','Eaux peu profondes'],['lac','Lac']],
 cote:[['plage','Plage de sable'],['falaise','Falaises'],['verte','Côte verte'],['port','Port']],
 plaine:[['prairie','Prairie fleurie'],['champs','Champs cultivés'],['foret','Forêt']],
 moyenne_montagne:[['ocre','Collines ocre'],['verte','Collines vertes'],['boisee','Collines boisées']],
 montagne:[['rocheuse','Roches grises'],['boisee','Montagne boisée'],['enneigee','Montagne enneigée']],
 ville:[['village','Village'],['ville','Ville'],['grande','Grande ville']]
};
export const variantsFor=type=>TERRAIN_VARIANTS[type]||[];
export const validVariant=(type,variant)=>Boolean(variant)&&variantsFor(type).some(([id])=>id===variant);

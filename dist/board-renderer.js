import {createSVGBoardRenderer} from './board-renderer-svg.js';
import {playableMap} from './europe-map.js';

// Renderer choice is a browser preference, never part of a saved match.
export function createBoardRenderer(container,options={}){
 if(options.kind&&options.kind!=='svg')throw Error('Seul le renderer SVG est disponible à cette étape.');
 return createSVGBoardRenderer(container);
}
export function boardSnapshotMarkup(state){
 return playableMap(state.g,state.reachable,state.cost,state.selected,state.route,state.nextSteps,state.editMode);
}

// Projection du plateau Europe : longitude/latitude → coordonnées du plateau (1261 × 842), et inverse.
// 1. Projection cylindrique (méridiens verticaux, parallèles horizontaux), comme les cartes habituelles :
//    le Portugal reste au sud de l'Espagne, la côte turque reste horizontale.
// 2. « Loupe » séparable centrée sur l'Europe de l'Ouest : agrandissement mx (est-ouest) et my (nord-sud) au centre,
//    qui diminue doucement avec la distance (f(t) = m·t / (1 + (m−1)·|t|/t0)). Le cœur de l'Europe a donc des cases
//    plus petites en km que la Russie ou le Grand Nord, sans pencher les côtes.
// 3. Cadrage : trois villes de repère fixent l'échelle et la position.
export function makeProjection(P,coordOf){
 // Base cylindrique (méridiens verticaux, parallèles horizontaux, comme les cartes habituelles), en km,
 // avec parallèle de référence lat0 (échelle est-ouest juste à cette latitude).
 const D=Math.PI/180,RT=6371,[lon0,lat0]=P.centre,cx=RT*Math.cos(lat0*D)*D;
 const base=([lon,lat])=>[(lon-lon0)*cx,-(lat-lat0)*RT*D],baseInv=([x,y])=>[lon0+x/cx,lat0-y/(RT*D)];
 const {mx,my,x0,y0,focus}=P.loupe,F=base(focus);
 const f=(t,m,t0)=>Math.sign(t)*m*Math.abs(t)/(1+(m-1)*Math.abs(t)/t0),fi=(u,m,t0)=>Math.sign(u)*Math.abs(u)*t0/(m*t0-(m-1)*Math.abs(u));
 const warp=([x,y])=>[F[0]+f(x-F[0],mx,x0),F[1]+f(y-F[1],my,y0)],unwarp=([x,y])=>[F[0]+fi(x-F[0],mx,x0),F[1]+fi(y-F[1],my,y0)];
 const {top,bottom,left}=P.cadrage,T=warp(base(coordOf(top[0]))),B=warp(base(coordOf(bottom[0]))),L=warp(base(coordOf(left[0])));
 const K=(bottom[1]-top[1])/(B[1]-T[1]),TY=top[1]-T[1]*K,TX=left[1]-L[0]*K;
 return Object.assign(p=>{const [x,y]=warp(base(p));return [x*K+TX,y*K+TY];},{invert:([x,y])=>baseInv(unwarp([(x-TX)/K,(y-TY)/K]))});
}

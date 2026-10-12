const sharp=require('sharp');
const fs=require('node:fs');
const source=process.argv[2];
const xs=[0,313,628,941,1254],ys=[0,307,623,930,1254];
const endpoints=[[[171,169],[466,142],[782,142,782],[1096,142,1096,142]],[[168,159],[466,445],[783,446,783],[1096,446,1096,446]],[[160,158],[466,770],[783,778,783],[1096,778,1096,778]],[[157,159],[466,1071],[783,1071,783],[1096,1071,1096,1071]]];
const families=['plaine','montagne','ville','cote'],shapes=[[0,2],[0,1],[0,1,2],[0,1,2,3]],N=384;
(async()=>{for(let r=0;r<4;r++)for(let c=0;c<4;c++){
 const w=xs[c+1]-xs[c],h=ys[r+1]-ys[r];
 const input=await sharp(source).extract({left:xs[c],top:ys[r],width:w,height:h}).resize(N,N).removeAlpha().raw().toBuffer();
 const centers={};shapes[c].forEach((d,i)=>centers[d]=(endpoints[r][c][i]-(d%2?ys[r]:xs[c]))/(d%2?h:w));
 const out=Buffer.alloc(N*N*3);
 // Fade an edge coordinate calibration into the untouched interior.
 function map(v,center){const target=.5,half=.055;const oldhalf=.065;if(v<target-half)return v*(center-oldhalf)/(target-half);if(v>target+half)return center+oldhalf+(v-target-half)*(1-center-oldhalf)/(1-target-half);return center+(v-target)*oldhalf/half;}
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  let u=x/(N-1),v=y/(N-1),su=u,sv=v;
  if(centers[0]!=null)su+=(map(u,centers[0])-u)*Math.max(0,1-v/.24);
  if(centers[2]!=null)su+=(map(u,centers[2])-u)*Math.max(0,1-(1-v)/.24);
  if(centers[3]!=null)sv+=(map(v,centers[3])-v)*Math.max(0,1-u/.24);
  if(centers[1]!=null)sv+=(map(v,centers[1])-v)*Math.max(0,1-(1-u)/.24);
  const ix=Math.max(0,Math.min(N-1,Math.round(su*(N-1)))),iy=Math.max(0,Math.min(N-1,Math.round(sv*(N-1))));
  for(let k=0;k<3;k++)out[(y*N+x)*3+k]=input[(iy*N+ix)*3+k];
 }
 // Standard short asphalt connectors give every open edge the same width.
 const defs=shapes[c].map(d=>{const ends=[[50,0,50,4],[100,50,96,50],[50,100,50,96],[0,50,4,50]][d];return ['shoulder','asphalt'].map(kind=>`<linearGradient id="${kind}${d}" gradientUnits="userSpaceOnUse" x1="${ends[0]}" y1="${ends[1]}" x2="${ends[2]}" y2="${ends[3]}"><stop offset="0" stop-color="${kind==='asphalt'?'#999793':'#d5c6a8'}"/><stop offset="1" stop-color="${kind==='asphalt'?'#999793':'#d5c6a8'}" stop-opacity="0"/></linearGradient>`).join('');}).join('');
 const lines=shapes[c].map(d=>{const ends=[[50,0,50,4],[100,50,96,50],[50,100,50,96],[0,50,4,50]][d];return `<path d="M${ends[0]} ${ends[1]} L${ends[2]} ${ends[3]}" stroke="url(#shoulder${d})" stroke-width="10"/><path d="M${ends[0]} ${ends[1]} L${ends[2]} ${ends[3]}" stroke="url(#asphalt${d})" stroke-width="7.5"/>`;}).join('');
 const overlay=Buffer.from(`<svg width="${N}" height="${N}" viewBox="0 0 100 100"><defs>${defs}</defs>${lines}</svg>`);
 await sharp(out,{raw:{width:N,height:N,channels:3}}).composite([{input:overlay}]).webp({quality:88}).toFile(`dist/assets/tiles/${families[r]}-${c}.webp`);
}console.log('16 calibrated tile assets ready');})();

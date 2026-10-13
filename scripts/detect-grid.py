"""Locate equal-size hex centres from the actual borders in the supplied map."""
from PIL import Image
import numpy as np
import math
from pathlib import Path
import re
import json

image=Image.open('dist/assets/europe/nouvelle-carte.png').convert('RGB')
rgb=np.asarray(image,dtype=np.int16)
light=rgb.min(axis=2)
radius=25/1.5
offsets=[]
for i in range(6):
 a=(i*60-90)*math.pi/180;b=((i+1)*60-90)*math.pi/180
 for t in (.25,.5,.75):
  offsets.append((round(radius*(math.cos(a)*(1-t)+math.cos(b)*t)),round(radius*(math.sin(a)*(1-t)+math.sin(b)*t))))
edge_sum=np.zeros_like(light,dtype=np.int32)
edge_hits=np.zeros_like(light,dtype=np.int16)
for dx,dy in offsets:
 src=light[max(0,dy):light.shape[0]+min(0,dy),max(0,dx):light.shape[1]+min(0,dx)]
 dest_y=slice(max(0,-dy),light.shape[0]-max(0,dy))
 dest_x=slice(max(0,-dx),light.shape[1]-max(0,dx))
 edge_sum[dest_y,dest_x]+=src
 edge_hits[dest_y,dest_x]+=src>140
score=edge_sum/len(offsets)-light
score[edge_hits<10]=-1000
score[:30,:]=-1000;score[770:,:]=-1000;score[:,:25]=-1000;score[:,1220:]=-1000
def kind(x,y):
 # Evaluate a ring, not the centre, which may be hidden by a city icon.
 votes={}
 for dx,dy in [(-7,-6),(7,-6),(-7,6),(7,6),(-3,-10),(3,-10),(-3,10),(3,10)]:
  r,g,b=[int(v) for v in rgb[y+dy,x+dx]]
  k=None
  if b>g+17 and b>r+45 and g>95:k='cote'
  elif g>r+9 and g>b+24 and r>70:k='plaine'
  elif r>g+9 and g>b+23 and r>125:k='moyenne_montagne'
  elif max(r,g,b)<180 and min(r,g,b)>55 and max(r,g,b)-min(r,g,b)<50:k='montagne'
  if k:votes[k]=votes.get(k,0)+1
 return max(votes,key=votes.get) if votes and max(votes.values())>=3 else None
order=np.argsort(score.ravel())[::-1]
chosen=[]
occupied=np.zeros_like(light,dtype=np.uint8)
for idx in order:
 y,x=divmod(int(idx),light.shape[1])
 if score[y,x]<30 or len(chosen)>=1100:break
 if occupied[y,x]:continue
 k=kind(x,y)
 if not k:continue
 chosen.append((x,y,k,round(float(score[y,x]),1)))
 # A real tile's closest neighbour is about 29 px away.
 yy,xx=np.ogrid[max(0,y-23):min(light.shape[0],y+24),max(0,x-23):min(light.shape[1],x+24)]
 occupied[max(0,y-23):min(light.shape[0],y+24),max(0,x-23):min(light.shape[1],x+24)][(xx-x)**2+(yy-y)**2<23**2]=1
source=Path('dist/europe.js').read_text(encoding='utf8')
anchors={m.group(1) or m.group(2):(int(m.group(3)),int(m.group(4))) for m in re.finditer(r"(?:'([^']+)'|([A-Za-zÀ-ÿ-]+)):\[(\d+),(\d+)\]",source)}
for name,(x,y) in anchors.items():
 i=min(range(len(chosen)),key=lambda i:(chosen[i][0]-x)**2+(chosen[i][1]-y)**2)
 nearest=math.hypot(chosen[i][0]-x,chosen[i][1]-y)
 if nearest<18:
  chosen[i]=(x,y,'ville' if name!='Cap Nord' else 'cote',chosen[i][3],name)
 else:chosen.append((x,y,'ville' if name!='Cap Nord' else 'cote',0,name))
cells=[{'x':x,'y':y,'type':kind,'name':name if len(cell)>4 else ''} for cell in sorted(chosen,key=lambda c:(c[1],c[0])) for x,y,kind in [cell[:3]] for name in [cell[4] if len(cell)>4 else '']]
Path('dist/assets/europe/board-data.js').write_text('export const MAP_CELLS='+json.dumps(cells,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
print('aligned cells',len(cells),'named cities',sum(bool(c['name']) for c in cells))

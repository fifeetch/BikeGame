"""Locate hex centres from the coloured tile interiors of the supplied map."""
from pathlib import Path
import json
import math
import re
import runpy

data=runpy.run_path('scripts/segment-grid.py')
components=data['components']
rgb=data['rgb']
h,w=rgb.shape[:2]
names={1:'cote',2:'plaine',3:'moyenne_montagne',4:'montagne'}
seeds=[]
for area,x,y,x0,y0,x1,y1,label in components:
 if 120<=area<=850 and 15<=x1-x0<=36 and 15<=y1-y0<=38:
  seeds.append((area,x,y,names[label]))
centres=[]
for _,x,y,kind in sorted(seeds,reverse=True):
 if all(math.hypot(x-a,y-b)>=23 for a,b,_ in centres):centres.append([x,y,kind])

def terrain_at(x,y):
 votes={}
 for radius in (6,9):
  for i in range(12):
   xx=round(x+radius*math.cos(i*math.pi/6))
   yy=round(y+radius*math.sin(i*math.pi/6))
   if not (0<=xx<w and 0<=yy<h):continue
   r,g,b=map(int,rgb[yy,xx]);label=0
   if b>g+12 and b>r+60 and g>115 and r<135:label=1
   elif g>r+4 and g>b+20 and r>95 and b<125:label=2
   elif r>g+12 and g>b+17 and r>160 and b<125:label=3
   elif max(r,g,b)-min(r,g,b)<60 and max(r,g,b)<200 and min(r,g,b)>50:label=4
   if label:votes[label]=votes.get(label,0)+1
 if not votes:return (0,None)
 label=max(votes,key=votes.get)
 return votes[label],names[label]

directions=((29,0),(-29,0),(14.5,25),(-14.5,25),(14.5,-25),(-14.5,-25))
for _ in range(5):
 additions=[]
 for sx,sy,_kind in centres:
  for dx,dy in directions:
   px,py=round(sx+dx),round(sy+dy)
   if not (25<px<w-25 and 30<py<770):continue
   if any(math.hypot(px-x,py-y)<21 for x,y,_ in centres+additions):continue
   candidates=[]
   for yy in range(py-5,py+6):
    for xx in range(px-5,px+6):
     score,kind=terrain_at(xx,yy)
     if kind:candidates.append((score,-math.hypot(xx-px,yy-py),xx,yy,kind))
   if not candidates:continue
   score,_,x,y,kind=max(candidates)
   if score>=12 and all(math.hypot(x-a,y-b)>=23 for a,b,_ in centres+additions):
    additions.append([x,y,kind])
 if not additions:break
 centres+=additions

source=Path('dist/europe.js').read_text(encoding='utf8')
anchors={m.group(1) or m.group(2):(int(m.group(3)),int(m.group(4))) for m in re.finditer(r"(?:'([^']+)'|([A-Za-zÀ-ÿ-]+)):\[(\d+),(\d+)\]",source)}
city=[[x,y,'cote' if name=='Cap Nord' else 'ville',name] for name,(x,y) in anchors.items()]
centres=[c for c in centres if all(math.hypot(c[0]-x,c[1]-y)>=23 for x,y,_,_ in city)]
cells=[{'x':x,'y':y,'type':kind,'name':''} for x,y,kind in centres]
cells += [{'x':x,'y':y,'type':kind,'name':name} for x,y,kind,name in city]
cells.sort(key=lambda c:(c['y'],c['x']))
Path('dist/assets/europe/board-data.js').write_text('export const MAP_CELLS='+json.dumps(cells,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
print('aligned cells',len(cells),'named cities',len(city))

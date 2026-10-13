"""Segment the coloured interiors of the supplied map into tile candidates."""
from collections import deque
from PIL import Image
import numpy as np

im=Image.open('dist/assets/europe/nouvelle-carte.png').convert('RGB')
rgb=np.asarray(im,dtype=np.int16)
r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
kind=np.zeros(r.shape,dtype=np.uint8)
kind[(b>g+12)&(b>r+60)&(g>115)&(r<135)]=1
kind[(g>r+4)&(g>b+20)&(r>95)&(b<145)&(g<220)]=2
kind[(r>g+12)&(g>b+17)&(r>160)&(b<145)&(g<220)]=3
kind[((rgb.max(axis=2)-rgb.min(axis=2))<60)&(rgb.max(axis=2)<200)&(rgb.min(axis=2)>50)]=4
eroded=np.zeros_like(kind)
for label in (1,2,3,4):
 mask=(kind==label)
 for dy,dx in ((-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)):
  mask &= np.roll(kind==label,(dy,dx),axis=(0,1))
 eroded[mask]=label
kind=eroded
h,w=kind.shape
flat=kind.ravel()
seen=np.zeros(flat.shape,dtype=np.uint8)
components=[]
for start in np.flatnonzero(flat):
 if seen[start]:continue
 label=flat[start]
 queue=deque([int(start)]);seen[start]=1
 count=sx=sy=0;minx=miny=99999;maxx=maxy=0
 while queue:
  p=queue.popleft();y,x=divmod(p,w)
  count+=1;sx+=x;sy+=y;minx=min(minx,x);miny=min(miny,y);maxx=max(maxx,x);maxy=max(maxy,y)
  for n in (p-1,p+1,p-w,p+w):
   if n<0 or n>=len(flat) or (n==p-1 and x==0) or (n==p+1 and x==w-1):continue
   if not seen[n] and flat[n]==label:seen[n]=1;queue.append(n)
 if count>=80:components.append((count,round(sx/count),round(sy/count),minx,miny,maxx,maxy,int(label)))

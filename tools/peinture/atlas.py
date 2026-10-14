# Fabrique les deux fichiers dont l'éditeur a besoin pour redessiner une case modifiée :
#  - europe-ground.webp : le fond peint SANS arbres/collines/montagnes/maisons
#  - patches.webp + terrain-patches.js : les motifs de chaque case d'origine + des morceaux de sol par type
import json, math, random, sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
import base as B, glyphs as G
SC=B.SC; AS=3; S=B.S; R=B.R
t0=__import__('time').time()
P=B.build(); arr=B.finish(P)
ground0=Image.fromarray((arr*255).astype('uint8')).convert('RGBA')
ground0=G.waves(ground0,P)                       # sol + vagues (sert aussi de source pour les morceaux de sol)
ground=G.boats(ground0.copy(),P); ground=G.labels(ground)
ground.convert('RGB').save('ground.png')
print('sol',round(__import__('time').time()-t0))
cells=B.cells; idx={(c['q'],c['r']):i for i,c in enumerate(cells)}
D=[[1,0],[1,1],[0,1],[-1,0],[-1,-1],[0,-1]]
nb=lambda c:[cells[idx[(c['q']+a,c['r']+b)]] for a,b in D if (c['q']+a,c['r']+b) in idx]
# ---- motifs de chaque case ----
items=G.place(P); per={}
for fy,sp,x,y,ci in items: per.setdefault(ci,[]).append((fy,sp,x,y))
packs=[]   # (clé, image, ox, oy, wu, hu)
for ci,lst in per.items():
    c=cells[ci]; x0=min(x for _,_,x,_ in lst); y0=min(y for _,_,_,y in lst)
    x1=max(x+sp.width for _,sp,x,_ in lst); y1=max(y+sp.height for _,sp,_,y in lst)
    im=Image.new('RGBA',(x1-x0,y1-y0),(0,0,0,0))
    for fy,sp,x,y in sorted(lst,key=lambda t:t[0]): im.alpha_composite(sp,(x-x0,y-y0))
    packs.append((f"{c['q']},{c['r']}",im,x0/SC-c['x'],y0/SC-c['y'],im.width/SC,im.height/SC))
print('motifs',len(packs))
# ---- morceaux de sol ----
sea_depth={}
frontier=[c for c in cells if c['cls']!='mer']
for c in frontier: sea_depth[(c['q'],c['r'])]=0
while frontier:
    nxt=[]
    for c in frontier:
        for n in nb(c):
            k=(n['q'],n['r'])
            if k not in sea_depth: sea_depth[k]=sea_depth[(c['q'],c['r'])]+1; nxt.append(n)
    frontier=nxt
def interior(c,cls,need=6):
    ns=nb(c); return len(ns)==6 and sum(n['cls']==cls for n in ns)>=need
rng=random.Random(3)
def pick(cls,pred,n,need=6):
    cand=[c for c in cells if c['cls']==cls and pred(c) and interior(c,cls,need)]
    rng.shuffle(cand); return cand[:n]
groups={}
groups['plaine']=pick('plaine',lambda c:True,14)
groups['colline']=pick('colline',lambda c:True,14)
m=pick('montagne',lambda c:True,12)
if len(m)<8: m=pick('montagne',lambda c:True,12,need=4)
groups['montagne']=m
groups['mer0']=pick('mer',lambda c:sea_depth[(c['q'],c['r'])]<=2,10)
groups['mer1']=pick('mer',lambda c:3<=sea_depth[(c['q'],c['r'])]<=5,10)
groups['mer2']=pick('mer',lambda c:sea_depth[(c['q'],c['r'])]>=6,10)
print({k:len(v) for k,v in groups.items()})
Rc=R*1.12
def mask_img(w,h,cx,cy):
    mk=Image.new('L',(w,h),0); d=ImageDraw.Draw(mk)
    pts=[(cx+math.cos(math.radians(-90+60*k))*Rc*SC,cy+math.sin(math.radians(-90+60*k))*Rc*SC) for k in range(6)]
    d.polygon(pts,fill=255)
    return mk.filter(ImageFilter.GaussianBlur(S*SC*0.07))
hw=int(S*SC*0.64); hh=int(R*SC*1.3)
gpacks=[]; ginfo={}
for name,lst in groups.items():
    ginfo[name]=[]
    for c in lst:
        cx,cy=int(c['x']*SC),int(c['y']*SC)
        crop=ground0.crop((cx-hw,cy-hh,cx+hw,cy+hh)).convert('RGBA')
        crop.putalpha(mask_img(2*hw,2*hh,hw,hh))
        gpacks.append((name,crop,-hw/SC,-hh/SC,2*hw/SC,2*hh/SC))

# ---- lacs : une case de mer entourée de terre devient un petit lac (sable + eau claire), pas un hexagone bleu ----
def lake(variant,which):
    w,h=2*hw,2*hh; yy,xx=np.mgrid[0:h,0:w].astype(np.float32); xx-=hw; yy-=hh
    th=np.arctan2(yy,xx); d=np.sqrt(xx*xx+yy*yy)
    rr=random.Random(100+variant); p1,p2,p3=[rr.uniform(0,6.28) for _ in range(3)]
    wob=1+0.10*np.sin(3*th+p1)+0.06*np.sin(5*th+p2)+0.04*np.sin(7*th+p3)
    e=3.0
    def blob(r0): rt=r0*S*SC*wob; return np.clip((rt-d)/e+0.5,0,1),rt
    out=np.zeros((h,w,4),np.float32)
    if which=='rim':
        a1,_=blob(0.50); a2,_=blob(0.455)
        sand=np.array([226,212,156],np.float32); pale=np.array([215,233,241],np.float32)
        out[...,:3]=sand; out[...,3]=a1
        out[...,:3]=out[...,:3]*(1-a2[...,None])+pale*a2[...,None]; out[...,3]=np.maximum(a1,a2)
    else:
        a,rt=blob(0.40); t=np.clip(d/rt,0,1)[...,None]
        c0=np.array([60,147,203],np.float32); c1=np.array([104,176,214],np.float32)
        out[...,:3]=c0*(1-t**1.6)+c1*t**1.6; out[...,3]=a
    out[...,3]*=255
    return Image.fromarray(np.clip(out,0,255).astype('uint8'),'RGBA')
for v in range(4):
    gpacks.append(('lacRim',lake(v,'rim'),-hw/SC,-hh/SC,2*hw/SC,2*hh/SC))
    gpacks.append(('lacWater',lake(v,'water'),-hw/SC,-hh/SC,2*hw/SC,2*hh/SC))

# ---- rivages : bande de sable + eau peu profonde le long d'un côté d'hexagone qui touche la mer ----
K=int(S*SC*1.1)
def shore(i,cliff=False):
    ang=math.radians(60*i)            # 0=E, 60=SE, 120=SO, 180=O, 240=NO, 300=NE (y vers le bas)
    n=(math.cos(ang),math.sin(ang)); t=(-n[1],n[0])
    def strip(inner,outer,half,fill,blur):
        lay=Image.new('RGBA',(2*K,2*K),(0,0,0,0)); d=ImageDraw.Draw(lay)
        m=S*SC/2
        pts=[(K+n[0]*(m+o)+t[0]*h,K+n[1]*(m+o)+t[1]*h) for o,h in [(inner,-half),(outer,-half),(outer,half),(inner,half)]]
        d.polygon(pts,fill=fill)
        return lay.filter(ImageFilter.GaussianBlur(blur*SC))
    halo=strip(-0.05*S*SC,0.46*S*SC,R*SC*0.62,(150,214,232,95),0.14*S)
    if cliff:
        shade=strip(0.0,0.22*S*SC,R*SC*0.58,(24,52,82,90),0.06*S); halo.alpha_composite(shade)
        rock_=strip(-0.14*S*SC,0.05*S*SC,R*SC*0.52,(112,100,86,235),0.03*S); halo.alpha_composite(rock_)
        top=strip(-0.17*S*SC,-0.07*S*SC,R*SC*0.48,(188,174,150,230),0.02*S); halo.alpha_composite(top); return halo
    sand=strip(-0.10*S*SC,0.06*S*SC,R*SC*0.50,(232,218,164,215),0.05*S)
    halo.alpha_composite(sand); return halo
for i in range(6):
    gpacks.append(('shore',shore(i),-K/SC,-K/SC,2*K/SC,2*K/SC))
    gpacks.append(('shoreCliff',shore(i,True),-K/SC,-K/SC,2*K/SC,2*K/SC))
# ---- variantes de terrain (éditeur) ----
import variants as V
crops={}
for name,crop,*_ in gpacks:
    if name in('plaine','colline','montagne'): crops.setdefault(name,[]).append(crop)
vg,vm=V.build(crops)
for key,img in vg: gpacks.append((key,img,-hw/SC,-hh/SC,2*hw/SC,2*hh/SC))
print('variantes',len(vg),len(vm))
# ---- planche ----
allp=[('c',)+p for p in packs]+[('g',)+p for p in gpacks]+[('m',)+p for p in vm]
def scaled(im): return im.resize((max(1,round(im.width*AS/SC)),max(1,round(im.height*AS/SC))),Image.LANCZOS)
sc=[(kind,key,scaled(im),ox,oy,wu,hu) for kind,key,im,ox,oy,wu,hu in allp]
sc.sort(key=lambda t:-t[2].height)
WA=4096; x=y=rowh=0; place=[]
for kind,key,im,ox,oy,wu,hu in sc:
    if x+im.width>WA: x=0; y+=rowh; rowh=0
    place.append((kind,key,im,x,y,ox,oy,wu,hu)); x+=im.width; rowh=max(rowh,im.height)
HA=y+rowh
atlas=Image.new('RGBA',(WA,HA),(0,0,0,0))
cellsidx={}; gidx={}; midx={}
r2=lambda v:round(v,2)
for kind,key,im,px,py,ox,oy,wu,hu in place:
    atlas.paste(im,(px,py))
    rec=[px,py,im.width,im.height,r2(ox),r2(oy),r2(wu),r2(hu)]
    if kind=='c': cellsidx[key]=rec
    elif kind=='m': midx.setdefault(key,[]).append(rec)
    else: gidx.setdefault(key,[]).append(rec)
print('planche',atlas.size)
out=sys.argv[1] if len(sys.argv)>1 else '.'
atlas.save(out+'/patches.webp','WEBP',quality=86,alpha_quality=100,method=5)
ground.convert('RGB').save(out+'/europe-ground.webp','WEBP',quality=82,method=5)
open(out+'/terrain-patches.js','w').write("// Généré par tools/peinture/atlas.py : ne pas modifier à la main.\nexport const PATCH_SCALE=%d;\nexport const CELL_PATCHES=%s;\nexport const GROUND_PATCHES=%s;\nexport const MOTIF_PATCHES=%s;\n"%(AS,json.dumps(cellsidx,separators=(',',':')),json.dumps(gidx,separators=(',',':')),json.dumps(midx,separators=(',',':'))))
print('fini',round(__import__('time').time()-t0))

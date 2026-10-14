# Variantes de terrain pour l'éditeur : sols colorés + motifs propres à chaque variante.
import math, random, zlib, numpy as np
from PIL import Image, ImageDraw, ImageFilter
import base as B, glyphs as G
SC=B.SC; S=B.S; R=B.R; S_=S*SC
VARIANTS={  # type -> [(id, libellé)]  (même liste que dist/terrain-variants.js)
 'plaine':[('prairie','Prairie fleurie'),('champs','Champs cultivés'),('foret','Forêt')],
 'moyenne_montagne':[('ocre','Collines ocre'),('verte','Collines vertes'),('boisee','Collines boisées')],
 'montagne':[('rocheuse','Roches grises'),('boisee','Montagne boisée'),('enneigee','Montagne enneigée')],
 'ville':[('village','Village'),('ville','Ville'),('grande','Grande ville')],
 'cote':[('plage','Plage de sable'),('falaise','Falaises'),('verte','Côte verte'),('port','Port')],
}
def mixc(a,b,t): return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
# ---------- sols ----------
def grade(img,color,amt,keep=1.0):
    """Mélange vers une couleur en gardant le relief (luminosité) du sol d'origine."""
    a=np.asarray(img).astype(np.float32).copy(); rgb=a[...,:3]; al=a[...,3]>128
    lum=rgb.mean(axis=2); ref=lum[al].mean() if al.any() else 128
    ratio=(lum/ref)**keep; tgt=np.array(color,np.float32)[None,None,:]*ratio[...,None]
    a[...,:3]=np.clip(rgb*(1-amt)+tgt*amt,0,255)
    return Image.fromarray(a.astype('uint8'),'RGBA')
def fields(img,rng):
    w,h=img.size; yy,xx=np.mgrid[0:h,0:w].astype(np.float32); xx-=w/2; yy-=h/2
    seeds=[(rng.uniform(-.32,.32)*w,rng.uniform(-.32,.32)*h) for _ in range(4)]
    d=np.stack([(xx-sx)**2+(yy-sy)**2 for sx,sy in seeds]); pid=d.argmin(0)
    a=np.asarray(img).astype(np.float32).copy(); out=a[...,:3].copy()
    cols=[(222,198,98),(148,184,72),(180,140,80),(200,208,112),(120,168,70)]; rng.shuffle(cols)
    for i in range(4):
        ang=rng.uniform(0,math.pi); fr=2*math.pi/(S_*0.085)
        st=0.5+0.5*np.sin((xx*math.cos(ang)+yy*math.sin(ang))*fr)
        c=np.array(cols[i],np.float32); par=c[None,None,:]*(0.86+0.18*st[...,None])
        m=(pid==i)[...,None]; out=np.where(m,out*0.15+par*0.85,out)
    edge=(np.abs(np.diff(pid,axis=0,prepend=pid[:1]))+np.abs(np.diff(pid,axis=1,prepend=pid[:,:1])))>0
    edge=np.asarray(Image.fromarray((edge*255).astype('uint8')).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8)))/255.0
    out=out*(1-0.7*edge[...,None])+np.array((84,124,56),np.float32)*(0.7*edge[...,None])
    a[...,:3]=np.clip(out,0,255); return Image.fromarray(a.astype('uint8'),'RGBA')
def speckle(img,rng,color,n,rad):
    lay=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(lay); w,h=img.size
    for _ in range(n):
        x=rng.uniform(0.15,0.85)*w; y=rng.uniform(0.15,0.85)*h; r=rad*rng.uniform(0.6,1.4)
        d.ellipse([x-r,y-r,x+r,y+r],fill=color+(rng.randint(60,140),))
    a=img.copy(); a.alpha_composite(lay)
    al=img.getchannel('A'); a.putalpha(al); return a
def ground_variant(base,key,rng):
    if key=='plaine:prairie': g=grade(base,(150,196,78),0.28); return speckle(g,rng,(250,244,160),26,S_*0.014)
    if key=='plaine:champs': return fields(base,rng)
    if key=='plaine:foret': g=grade(base,(62,110,56),0.55,0.8); return speckle(g,rng,(34,74,40),40,S_*0.03)
    if key=='moyenne_montagne:ocre': return base
    if key=='moyenne_montagne:verte': return grade(base,(132,176,82),0.62,0.7)
    if key=='moyenne_montagne:boisee': return speckle(grade(base,(104,140,70),0.5,0.7),rng,(40,80,44),22,S_*0.03)
    if key=='montagne:rocheuse': return base
    if key=='montagne:boisee': return speckle(grade(base,(92,124,80),0.45),rng,(40,80,44),20,S_*0.03)
    if key=='montagne:enneigee': return grade(base,(214,222,232),0.55,0.6)
    if key=='cote:plage': return speckle(grade(base,(234,216,162),0.78,0.5),rng,(196,170,118),30,S_*0.012)
    if key=='cote:falaise': return speckle(grade(base,(168,152,128),0.5),rng,(110,98,84),24,S_*0.02)
    if key=='cote:verte': return grade(base,(132,184,84),0.22)
    if key=='cote:port': return speckle(grade(base,(206,194,162),0.55,0.6),rng,(150,134,104),30,S_*0.012)
    return base
# ---------- sprites supplémentaires ----------
def rock(w,rng):
    h=w*0.75
    def fn(d,s):
        W_=w*s;H_=h*s
        d.ellipse([W_*0.0,H_*0.78,W_*1.0,H_*1.02],fill=(60,52,44,70))
        P=[(W_*0.04,H_*0.88),(W_*0.14,H_*0.40),(W_*0.40,H_*0.06),(W_*0.72,H_*0.14),(W_*0.96,H_*0.50),(W_*0.92,H_*0.88)]
        d.polygon(P,fill=(138,130,120,255))
        d.polygon([P[0],P[1],P[2],(W_*0.46,H_*0.50),(W_*0.30,H_*0.88)],fill=(176,168,156,255))
        d.polygon([(W_*0.46,H_*0.50),P[3],P[4],P[5],(W_*0.62,H_*0.88)],fill=(104,98,92,255))
        d.line(P+[P[0]],fill=(70,64,58,255),width=max(1,int(s*0.7)))
    return G.sprite(w,h,fn)
def palm(h,rng):
    w=h*0.9
    def fn(d,s):
        W_=w*s;H_=h*s; bx=W_*0.45
        d.ellipse([W_*0.18,H_*0.90,W_*0.80,H_*1.0],fill=(60,50,30,60))
        pts=[(bx,H_*0.96),(bx+W_*0.05,H_*0.70),(bx+W_*0.04,H_*0.46),(bx+W_*0.10,H_*0.30)]
        d.line(pts,fill=(120,86,52,255),width=max(2,int(s*1.6)),joint='curve')
        tx,ty=pts[-1]
        for a in (-160,-125,-90,-55,-20,15):
            ar=math.radians(a); L=W_*0.46
            ex,ey=tx+math.cos(ar)*L,ty+math.sin(ar)*L*0.55+L*0.22
            d.line([(tx,ty),((tx+ex)/2,(ty+ey)/2-H_*0.08),(ex,ey)],fill=(52,128,64,255),width=max(2,int(s*1.5)),joint='curve')
        d.ellipse([tx-s*1.4,ty-s*1.2,tx+s*1.4,ty+s*1.4],fill=(96,66,40,255))
    return G.sprite(w,h,fn)
def parasol(w,rng):
    h=w*1.0
    def fn(d,s):
        W_=w*s;H_=h*s
        d.ellipse([W_*0.1,H_*0.88,W_*0.95,H_*1.0],fill=(60,50,30,60))
        d.line([(W_*0.5,H_*0.30),(W_*0.5,H_*0.95)],fill=(110,84,56,255),width=max(1,int(s*0.9)))
        for i,c in enumerate([(214,60,52),(250,246,240),(214,60,52),(250,246,240),(214,60,52)]):
            x0=W_*(0.06+i*0.176); x1=W_*(0.06+(i+1)*0.176)
            d.polygon([(W_*0.5,H_*0.06),(x0,H_*0.34),(x1,H_*0.34)],fill=c+(255,))
        d.arc([W_*0.06,H_*0.24,W_*0.94,H_*0.46],0,180,fill=(150,40,36,255),width=max(1,int(s*0.5)))
    return G.sprite(w,h,fn)
def jetty(w,rng):
    h=w*0.34
    def fn(d,s):
        W_=w*s;H_=h*s
        d.rectangle([0,H_*0.30,W_,H_*0.72],fill=(150,112,72,255))
        for i in range(1,9): d.line([(W_*i/9,H_*0.30),(W_*i/9,H_*0.72)],fill=(104,76,48,255),width=max(1,int(s*0.5)))
        for x in (0.04,0.5,0.96): d.rectangle([W_*x-s,H_*0.60,W_*x+s,H_*1.0],fill=(86,62,40,255))
    return G.sprite(w,h,fn)
def flowers(rng):
    w=S_*0.5;h=S_*0.3
    def fn(d,s):
        for _ in range(8):
            x=rng.uniform(0.05,0.95)*w*s; y=rng.uniform(0.1,0.9)*h*s; c=rng.choice([(255,250,210),(255,214,90),(246,160,190),(255,255,255)])
            d.ellipse([x-s*0.8,y-s*0.8,x+s*0.8,y+s*0.8],fill=c+(255,))
    return G.sprite(w,h,fn)
GREEN={'body':(104,158,70),'lit':(150,198,96),'shade':(74,122,54),'line':(52,92,40),'shadow':(40,70,30)}
GOLD={'body':(214,184,96),'lit':(240,216,130),'shade':(170,140,70),'line':(140,108,50),'shadow':(110,80,40)}
# ---------- motifs ----------
def pts(r,n,dmin,kx=0.38,ky=0.30,oy=0.02):
    out=[]
    for _ in range(80):
        if len(out)>=n: break
        x=r.uniform(-kx,kx); y=r.uniform(-ky,ky)+oy
        if all((x-a)**2+(y-b)**2>dmin**2 for a,b in out): out.append((x,y))
    return out
def trees(r,n,dmin,pine=0.5,lo=0.15,hi=0.20,ky=0.34):
    it=[]
    for x,y in pts(r,n,dmin,0.40,ky,0.05):
        sz=S_*r.uniform(lo,hi); it.append((G.tree_pine(sz,r) if r.random()<pine else G.tree_round(sz,r),x*S_,y*S_))
    return it
def motifs(key,r):
    t,v=key.split(':'); it=[]
    if key=='plaine:prairie':
        it+=trees(r,r.choice([0,1,2]),0.3,0.2); it.append((flowers(r),r.uniform(-.15,.15)*S_,r.uniform(.0,.25)*S_))
    elif key=='plaine:champs':
        for x,y in pts(r,r.choice([1,2,2]),0.4):
            w=S_*r.uniform(0.18,0.26); it.append((G.mound(w,w*0.7,r,GOLD),x*S_,y*S_+w*0.25))
        it+=trees(r,r.choice([0,1]),0.3,0.1)
    elif key=='plaine:foret': it+=trees(r,r.randint(9,12),0.15,0.55,0.16,0.22)
    elif key=='moyenne_montagne:ocre':
        for x,y in pts(r,r.choice([2,3,3]),0.26,0.36,0.30,0.04):
            w=S_*r.uniform(0.46,0.86);h=w*r.uniform(0.30,0.50); it.append((G.mound(w,h,r),x*S_,y*S_+h*0.40))
        it+=trees(r,r.choice([0,1,2]),0.2,0.6)
    elif key=='moyenne_montagne:verte':
        for x,y in pts(r,r.choice([2,3,3]),0.26,0.36,0.30,0.04):
            w=S_*r.uniform(0.46,0.86);h=w*r.uniform(0.30,0.50); it.append((G.mound(w,h,r,GREEN),x*S_,y*S_+h*0.40))
        it+=trees(r,r.choice([1,2]),0.2,0.2)
    elif key=='moyenne_montagne:boisee':
        for x,y in pts(r,r.choice([2,2,3]),0.28,0.36,0.26,0.0):
            w=S_*r.uniform(0.46,0.80);h=w*r.uniform(0.30,0.46); it.append((G.mound(w,h,r,GREEN),x*S_,y*S_+h*0.40-S_*0.08))
        it+=trees(r,r.randint(5,7),0.15,0.85,0.15,0.21,0.36)
    elif key=='montagne:rocheuse':
        for x,y in pts(r,r.choice([3,4,4,5]),0.20,0.34,0.30,0.02):
            w=S_*r.uniform(0.50,0.82);h=w*r.uniform(0.85,1.35); it.append((G.peak(w,h,r),x*S_+0,y*S_+h*0.34))
        it+=trees(r,r.randint(1,2),0.2,1.0,0.14,0.19)
    elif key=='montagne:boisee':
        for x,y in pts(r,r.choice([2,2,3]),0.26,0.30,0.22,-0.06):
            w=S_*r.uniform(0.44,0.66);h=w*r.uniform(0.85,1.2); it.append((G.peak(w,h,r),x*S_,y*S_+h*0.34))
        it+=trees(r,r.randint(6,8),0.15,0.9,0.15,0.2,0.38)
    elif key=='montagne:enneigee':
        for x,y in pts(r,r.choice([3,4,4]),0.22,0.34,0.30,0.02):
            w=S_*r.uniform(0.50,0.82);h=w*r.uniform(0.95,1.4); it.append((G.peak(w,h,r,snow=True),x*S_,y*S_+h*0.34))
    elif t=='ville':
        n={'village':r.randint(3,4),'ville':r.randint(5,7),'grande':r.randint(8,9)}[v]
        rad={'village':0.8,'ville':1.0,'grande':1.0}[v]
        halo=Image.new('RGBA',(int(S_*1.5),int(S_*1.5)),(0,0,0,0)); ImageDraw.Draw(halo).ellipse([S_*(0.75-0.61*rad),S_*(0.75-0.61*rad),S_*(0.75+0.61*rad),S_*(0.75+0.61*rad)],fill=(226,210,174,170)); halo=halo.filter(ImageFilter.GaussianBlur(S_*0.10))
        it.append((halo,0,0,'halo'))
        hs=[(-0.30,-0.12),(0.12,-0.22),(0.32,0.04),(-0.12,0.12),(0.16,0.24),(-0.36,0.22),(0.0,-0.02),(-0.28,-0.30),(0.30,-0.30),(0.34,0.28)]
        if v=='grande': hs=[(-0.34,-0.24),(-0.12,-0.28),(0.12,-0.28),(0.34,-0.22),(-0.38,0.0),(0.38,0.02),(-0.24,0.2),(0.0,0.22),(0.26,0.2),(-0.1,-0.04)]
        r.shuffle(hs)
        for dx,dy in hs[:n]: it.append((G.house(S_*r.uniform(0.26,0.34)*(0.9 if v=='grande' else 1),r),dx*S_,(dy+0.18)*S_))
        if v!='village': it.append((G.church(S_*0.24,r),r.uniform(-.05,.08)*S_,(-0.04+0.18)*S_))
    elif key=='cote:plage':
        for x,y in pts(r,r.choice([1,2]),0.34,0.32,0.28,0.02): it.append((palm(S_*r.uniform(0.40,0.52),r),x*S_,y*S_+S_*0.12))
        for x,y in pts(r,r.choice([2,3]),0.22,0.34,0.26,0.12): it.append((parasol(S_*r.uniform(0.17,0.22),r),x*S_,y*S_+S_*0.08))
    elif key=='cote:falaise':
        for x,y in pts(r,r.randint(3,5),0.2,0.36,0.30,0.04): it.append((rock(S_*r.uniform(0.18,0.34),r),x*S_,y*S_+S_*0.06))
        it+=trees(r,r.choice([0,1]),0.3,0.5,0.13,0.17)
    elif key=='cote:verte':
        it+=trees(r,r.randint(3,5),0.2,0.3,0.16,0.22)
    elif key=='cote:port':
        for dx,dy in r.sample([(-0.30,-0.14),(0.06,-0.22),(0.32,0.0),(-0.10,0.0)],r.randint(3,4)): it.append((G.house(S_*r.uniform(0.24,0.30),r),dx*S_,(dy+0.14)*S_))
        it.append((jetty(S_*0.46,r),r.uniform(-.06,.06)*S_,S_*0.34))
        for bx in (-0.22,0.24):
            if r.random()<0.8: it.append((G.boat(S_*r.uniform(0.30,0.38),r),bx*S_,S_*r.uniform(0.34,0.40)))
    return it
def compose(items,K):
    """items : (sprite,dx,dy_pieds) relatifs au centre de la case, en px. Renvoie (image rognée, ox, oy, wu, hu) en unités."""
    lay=Image.new('RGBA',(2*K,2*K),(0,0,0,0)); lst=[]
    for it in items:
        if len(it)==4: lst.append((-1e9,it[0],int(K-it[0].width/2),int(K-it[0].height/2))); continue
        sp,fx,fy=it; lst.append((fy,sp,int(K+fx-sp.width/2),int(K+fy-sp.height*0.92)))
    for fy,sp,x,y in sorted(lst,key=lambda t:t[0]): lay.alpha_composite(sp,(max(0,x),max(0,y))) if (x>=0 and y>=0 and x+sp.width<=2*K and y+sp.height<=2*K) else lay.paste(sp,(x,y),sp)
    bb=lay.getbbox()
    if not bb: return None
    im=lay.crop(bb); return im,(bb[0]-K)/SC,(bb[1]-K)/SC,im.width/SC,im.height/SC
def build(crops,per_ground=6,per_motif=8):
    gp=[];mp=[]; K=int(S_*1.1)
    for t,lst in VARIANTS.items():
        for v,_ in lst:
            key=f'{t}:{v}'; rng=random.Random(zlib.crc32(key.encode()))
            src=crops['plaine' if t in('ville','cote') else {'moyenne_montagne':'colline'}.get(t,t)]
            if t!='ville':
                for i in range(per_ground):
                    gp.append((key,ground_variant(src[i%len(src)],key,random.Random(rng.random()))))
            for i in range(per_motif):
                res=compose(motifs(key,random.Random(i*7919+len(key))),K)
                if res: mp.append((key,)+res)
    return gp,mp

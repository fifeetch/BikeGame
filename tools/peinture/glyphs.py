# Motifs dessinés posés sur le fond peint : montagnes, collines, arbres, villages, bateaux, noms de mers
import math, random, numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import base as B
SC=B.SC; SS=3            # SS = sur-échantillonnage des sprites
def sprite(w,h,fn):
    im=Image.new('RGBA',(int(w*SS),int(h*SS)),(0,0,0,0)); d=ImageDraw.Draw(im); fn(d,SS)
    return im.resize((int(w),int(h)),Image.LANCZOS)
def mix(a,b,t): return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
def rnd(c,salt=0): return random.Random((c['q']*73856093)^(c['r']*19349663)^(salt*83492791))
# ---------- sprites ----------
def tree_round(size,rng):
    w=h=size
    def fn(d,s):
        cx=w*s/2; r=w*s*0.36
        d.ellipse([cx-r*0.9,h*s*0.80-r*0.30,cx+r*0.9,h*s*0.80+r*0.24],fill=(30,60,30,70))      # ombre
        d.rectangle([cx-s*0.9,h*s*0.52,cx+s*0.9,h*s*0.82],fill=(92,66,42,255))
        g=rng.choice([(58,118,58),(68,128,52),(48,104,60)])
        d.ellipse([cx-r,h*s*0.50-r,cx+r,h*s*0.50+r],fill=g+(255,))
        d.ellipse([cx-r*0.95,h*s*0.50-r*0.95,cx+r*0.4,h*s*0.50+r*0.4],fill=mix(g,(150,190,90),0.45)+(255,))
        d.ellipse([cx-r*0.55,h*s*0.50-r*0.8,cx+r*0.05,h*s*0.50-r*0.3],fill=mix(g,(190,220,110),0.55)+(255,))
        d.arc([cx-r,h*s*0.50-r,cx+r,h*s*0.50+r],0,360,fill=mix(g,(10,40,20),0.5)+(255,),width=max(1,int(s*0.5)))
    return sprite(w,h,fn)
def tree_pine(size,rng):
    w=size*0.8; h=size*1.25
    def fn(d,s):
        cx=w*s/2
        d.ellipse([cx-w*s*0.30,h*s*0.88,cx+w*s*0.32,h*s*0.97],fill=(30,50,30,70))
        d.rectangle([cx-s*0.8,h*s*0.80,cx+s*0.8,h*s*0.94],fill=(88,62,40,255))
        g=rng.choice([(36,92,64),(42,100,58),(32,84,62)])
        for i,(top,bot,half) in enumerate([(0.38,0.82,0.46),(0.18,0.62,0.36),(0.00,0.40,0.26)]):
            P=[(cx,top*h*s),(cx+half*w*s,bot*h*s),(cx-half*w*s,bot*h*s)]
            d.polygon(P,fill=g+(255,))
            d.polygon([(cx,top*h*s),(cx-half*w*s,bot*h*s),(cx-half*w*s*0.15,bot*h*s)],fill=mix(g,(120,170,100),0.35)+(255,))
            d.line(P+[P[0]],fill=mix(g,(8,30,20),0.55)+(255,),width=max(1,int(s*0.5)))
    return sprite(w,h,fn)
def mound(wid,hei,rng,pal=None):
    pal=pal or {}
    cb=pal.get('body',(203,172,102));cl=pal.get('lit',(228,201,134));cs=pal.get('shade',(160,128,70));cn=pal.get('line',(132,98,52));cg=pal.get('shadow',(110,80,40))
    w=wid; h=hei*1.15
    def fn(d,s):
        base=hei*s*1.0+hei*s*0.10
        d.ellipse([w*s*0.04,base-hei*s*0.18,w*s*0.98,base+hei*s*0.12],fill=cg+(60,))     # ombre au sol
        # corps : demi-ellipse
        pts=[]
        for i in range(0,181,4):
            a=math.radians(i); pts.append((w*s*0.5-math.cos(a)*w*s*0.46,base-math.sin(a)*hei*s))
        body=[(w*s*0.04,base)]+pts+[(w*s*0.96,base)]
        d.polygon(body,fill=cb+(255,))
        # éclairage haut-gauche
        lit=[]
        for i in range(0,181,4):
            a=math.radians(i); lit.append((w*s*0.46-math.cos(a)*w*s*0.36,base-math.sin(a)*hei*s*0.90))
        d.polygon([(w*s*0.10,base-hei*s*0.05)]+lit+[(w*s*0.50,base-hei*s*0.10)],fill=cl+(255,))
        # ombre côté bas-droit
        sh=[]
        for i in range(100,181,4):
            a=math.radians(i); sh.append((w*s*0.5-math.cos(a)*w*s*0.46,base-math.sin(a)*hei*s))
        d.polygon(sh+[(w*s*0.96,base),(w*s*0.62,base-hei*s*0.12)],fill=cs+(255,))
        d.line(pts,fill=cn+(255,),width=max(1,int(s*0.8)),joint='curve')
        # touffes
        for _ in range(rng.randint(2,4)):
            x=rng.uniform(0.25,0.75)*w*s; y=base-rng.uniform(0.15,0.55)*hei*s
            d.line([(x-s*1.2,y),(x,y-s*1.4),(x+s*1.2,y)],fill=(120,128,60,255),width=max(1,int(s*0.6)))
    return sprite(w,h,fn)
def peak(wid,hei,rng,snow=False):
    w=wid; h=hei*1.08
    def fn(d,s):
        W_=w*s; H_=hei*s
        a=rng.uniform(0.36,0.60)
        L=(0,H_); R_=(W_,H_)
        s1=(W_*rng.uniform(0.14,0.24),H_*rng.uniform(0.55,0.70))
        apex=(W_*a,0)
        n1=(W_*(a+rng.uniform(0.08,0.14)),H_*rng.uniform(0.22,0.34))
        s2=(W_*rng.uniform(0.74,0.84),H_*rng.uniform(0.50,0.66))
        sx=W_*(a+rng.uniform(0.02,0.12))
        zig=[apex,(W_*(a+0.03),H_*0.20),(W_*(a-0.03),H_*0.38),(W_*(a+0.04),H_*0.57),(W_*(a-0.01),H_*0.78),(sx,H_)]
        d.ellipse([-W_*0.06,H_-hei*s*0.07,W_*1.06,H_+hei*s*0.07],fill=(70,64,60,80))
        lit_c=(190,183,171); sh_c=(112,107,108)
        if snow: lit_c=(247,249,252); sh_c=(186,198,218)
        d.polygon([L,s1,apex]+zig[1:],fill=lit_c+(255,))
        d.polygon([apex,n1,s2,R_,(sx,H_)]+zig[-2:0:-1],fill=sh_c+(255,))
        # strates
        for t in (0.36,0.54,0.72):
            y=H_*t; xl=s1[0]+(apex[0]-s1[0])*(1-t)*0.0+W_*0.04
            d.line([(max(W_*0.06,W_*(a-0.28*t-0.02)),y+H_*0.04),(W_*(a-0.015),y-H_*0.015)],fill=(214,208,198,255),width=max(1,int(s*0.7)))
        for t in (0.46,0.66,0.84):
            y=H_*t
            d.line([(W_*(a+0.04),y),(min(W_*0.96,W_*(a+0.04+0.30*t)),y+H_*0.05)],fill=(76,72,76,255),width=max(1,int(s*0.7)))
        d.line([L,s1,apex,n1,s2,R_],fill=(70,66,68,255),width=max(1,int(s*0.9)),joint='curve')
        d.line(zig,fill=(80,76,80,255),width=max(1,int(s*0.8)))
    return sprite(w,h,fn)
def house(w,rng,tower=False):
    h=w*1.15
    roofs=[(190,70,50),(204,86,56),(176,62,48)]; wall=(240,228,202); wall_s=(206,190,160)
    rc=rng.choice(roofs)
    def fn(d,s):
        W_=w*s; H_=h*s
        d.ellipse([W_*0.02,H_*0.80,W_*1.0,H_*1.02],fill=(70,50,30,70))
        # murs
        fw=W_*0.58; top=H_*0.44; bot=H_*0.90
        d.rectangle([W_*0.04,top,W_*0.04+fw,bot],fill=wall+(255,))
        d.polygon([(W_*0.04+fw,top),(W_*0.96,top-H_*0.06),(W_*0.96,bot-H_*0.06),(W_*0.04+fw,bot)],fill=wall_s+(255,))
        # toit
        ap=H_*0.06
        d.polygon([(0,top+H_*0.02),(W_*0.04+fw*0.5,ap),(W_*0.04+fw+W_*0.02,top+H_*0.02)],fill=mix(rc,(255,200,150),0.15)+(255,))
        d.polygon([(W_*0.04+fw*0.5,ap),(W_*1.0,ap+H_*0.02),(W_*1.0,top-H_*0.04),(W_*0.04+fw+W_*0.02,top+H_*0.02)],fill=mix(rc,(60,10,10),0.35)+(255,))
        # porte et fenêtre
        d.rectangle([W_*0.20,bot-H_*0.22,W_*0.31,bot],fill=(110,74,48,255))
        d.rectangle([W_*0.40,top+H_*0.10,W_*0.50,top+H_*0.22],fill=(96,128,150,255))
        d.line([(0,top+H_*0.02),(W_*0.04+fw*0.5,ap),(W_*0.04+fw+W_*0.02,top+H_*0.02)],fill=(90,30,24,255),width=max(1,int(s*0.7)))
        d.rectangle([W_*0.04,top,W_*0.04+fw,bot],outline=(120,100,80,255),width=max(1,int(s*0.5)))
    return sprite(w,h,fn)
def church(w,rng):
    h=w*1.9
    def fn(d,s):
        W_=w*s; H_=h*s
        d.ellipse([W_*0.0,H_*0.90,W_*1.0,H_*1.02],fill=(70,50,30,70))
        d.rectangle([W_*0.30,H_*0.34,W_*0.74,H_*0.94],fill=(236,224,200,255))
        d.rectangle([W_*0.60,H_*0.34,W_*0.74,H_*0.94],fill=(204,188,160,255))
        d.polygon([(W_*0.26,H_*0.36),(W_*0.52,H_*0.00),(W_*0.78,H_*0.36)],fill=(176,62,48,255))
        d.polygon([(W_*0.52,H_*0.00),(W_*0.78,H_*0.36),(W_*0.60,H_*0.36)],fill=(130,44,36,255))
        d.rectangle([W_*0.46,H_*0.46,W_*0.58,H_*0.58],fill=(70,50,40,255))
        d.rectangle([W_*0.40,H_*0.78,W_*0.60,H_*0.94],fill=(110,74,48,255))
    return sprite(w,h,fn)
def boat(w,rng):
    h=w*1.0
    def fn(d,s):
        W_=w*s;H_=h*s
        d.ellipse([W_*0.0,H_*0.80,W_*1.0,H_*1.0],fill=(255,255,255,90))
        d.polygon([(W_*0.12,H_*0.72),(W_*0.88,H_*0.72),(W_*0.74,H_*0.90),(W_*0.26,H_*0.90)],fill=(120,78,48,255))
        d.line([(W_*0.50,H_*0.72),(W_*0.50,H_*0.08)],fill=(80,56,40,255),width=max(1,int(s*0.9)))
        d.polygon([(W_*0.52,H_*0.12),(W_*0.52,H_*0.66),(W_*0.90,H_*0.66)],fill=(250,246,236,255))
        d.polygon([(W_*0.48,H_*0.22),(W_*0.48,H_*0.66),(W_*0.14,H_*0.66)],fill=(232,226,214,255))
    return sprite(w,h,fn)
# ---------- placement ----------
def place(P):
    fld=P['fld']; forest=P['forest']
    Fx=B.F
    land_at=lambda x,y: fld[min(int(y*Fx),fld.shape[0]-1),min(int(x*Fx),fld.shape[1]-1)]>0.56
    forest_at=lambda x,y: forest[min(int(y*Fx),forest.shape[0]-1),min(int(x*Fx),forest.shape[1]-1)]
    items=[]   # (y_feet, sprite, x_left, y_top, index_cellule)
    cur=[-1]
    S_=B.S*SC; Rr=B.R*SC
    def add(sp,fx,fy):  # fx,fy = point des pieds en px
        items.append((fy,sp,int(fx-sp.width/2),int(fy-sp.height*0.92),cur[0]))
    def inside_hex(c,jx,jy,k=0.78):
        return abs(jx)<S_*0.5*k and abs(jy)<Rr*k*0.9
    def poisson(r,n,dmin,kx=0.40,ky=0.36,oy=0.0,tries=60):
        pts=[]
        for _ in range(tries):
            if len(pts)>=n: break
            x=r.uniform(-kx,kx); y=r.uniform(-ky,ky)+oy
            if all((x-px)**2+(y-py)**2>dmin**2 for px,py in pts): pts.append((x,y))
        return pts
    for ci,c in enumerate(B.cells):
        cur[0]=ci
        cx,cy=c['x']*SC,c['y']*SC; r=rnd(c)
        cl=c['cls']
        if cl=='montagne':
            n=r.choice([3,4,4,5])
            pts=poisson(r,n,0.20,0.34,0.30,0.02)
            for (dx,dy) in pts:
                wid=S_*r.uniform(0.50,0.82); hei=wid*r.uniform(0.85,1.35)
                add(peak(wid,hei,r),cx+dx*S_,cy+dy*S_+hei*0.34)
            for _ in range(r.randint(1,3)):
                x=cx+r.uniform(-0.40,0.40)*S_; y=cy+r.uniform(0.18,0.42)*S_
                add(tree_pine(S_*r.uniform(0.14,0.19),r),x,y)
        elif cl=='colline':
            n=r.choice([2,3,3,4])
            pts=poisson(r,n,0.26,0.36,0.30,0.04)
            for (dx,dy) in pts:
                wid=S_*r.uniform(0.46,0.86); hei=wid*r.uniform(0.30,0.50)
                add(mound(wid,hei,r),cx+dx*S_,cy+dy*S_+hei*0.40)
            for _ in range(r.choice([0,1,2,3])):
                x=cx+r.uniform(-0.40,0.40)*S_; y=cy+r.uniform(-0.14,0.42)*S_
                fv=forest_at(x,y)
                if r.random()<0.6+0.3*(fv>0.3): add(tree_pine(S_*r.uniform(0.15,0.21),r),x,y)
                else: add(tree_round(S_*r.uniform(0.16,0.22),r),x,y)
        elif cl in('plaine','cote'):
            placed=0
            cap=r.randint(5,8)
            for _ in range(22):
                if placed>=cap: break
                x=cx+r.uniform(-0.42,0.42)*S_; y=cy+r.uniform(-0.34,0.44)*S_
                if not land_at(x,y): continue
                fv=forest_at(x,y) if cl=='plaine' else 0
                p=0.05+0.95*min(1,max(0,(fv-0.10)/0.7))
                if r.random()>p*0.9: continue
                sz=S_*r.uniform(0.17,0.24)
                add(tree_pine(sz,r) if (fv>0.8 and r.random()<0.5) else tree_round(sz,r),x,y); placed+=1
        elif cl=='ville':
            halo=Image.new('RGBA',(int(S_*1.5),int(S_*1.5)),(0,0,0,0)); hd=ImageDraw.Draw(halo)
            hd.ellipse([S_*0.14,S_*0.14,S_*1.36,S_*1.36],fill=(226,210,174,170)); halo=halo.filter(ImageFilter.GaussianBlur(S_*0.10))
            items.append((cy-1000,halo,int(cx-halo.width/2),int(cy-halo.height/2),ci))
            hs=[(-0.30,-0.12),(0.12,-0.22),(0.32,0.04),(-0.12,0.12),(0.16,0.24),(-0.36,0.22),(0.0,-0.02)]
            r.shuffle(hs)
            for i,(dx,dy) in enumerate(hs[:r.randint(5,7)]):
                add(house(S_*r.uniform(0.28,0.36),r),cx+dx*S_,cy+dy*S_+S_*0.18)
            add(church(S_*0.24,r),cx+r.uniform(-0.05,0.08)*S_,cy-0.04*S_+S_*0.18)
    items.sort(key=lambda t:t[0])
    return items
def run(img,P):
    W,H=img.size
    items=place(P)
    out=img.convert('RGBA')
    for fy,sp,x,y,ci in items:
        out.alpha_composite(sp,(x,y)) if (x>=0 and y>=0 and x+sp.width<=W and y+sp.height<=H) else out.paste(sp,(x,y),sp)
    return boats(out,P)
def boats(out,P):
    fld=P['fld'];Fx=B.F;S_=B.S*SC
    # bateaux au large
    rng=random.Random(5)
    placed=0;tries=0
    while placed<14 and tries<4000:
        tries+=1
        x=rng.uniform(40,1230); y=rng.uniform(30,810)
        if fld[int(y*Fx),int(x*Fx)]>0.15: continue
        # assez loin des côtes
        ys=slice(max(0,int((y-40)*Fx)),int((y+40)*Fx)); xs=slice(max(0,int((x-40)*Fx)),int((x+40)*Fx))
        if fld[ys,xs].max()>0.3: continue
        b=boat(S_*rng.uniform(0.62,0.8),rng); out.alpha_composite(b,(int(x*SC-b.width/2),int(y*SC-b.height/2))); placed+=1
    return out
def waves(img,P,n=900):
    fld=P['fld'];Fx=B.F;rng=random.Random(11);S_=B.S*SC
    def wv(w,alpha):
        h=w*0.28
        def fn(d,s):
            pts=[(i/24*w*s,(h*s*0.5)-math.sin(i/24*math.pi*2)*h*s*0.28*(1 if i<24 else 0)) for i in range(25)]
            d.line(pts,fill=(255,255,255,alpha),width=max(1,int(s*1.1)),joint='curve')
        return sprite(w,h,fn)
    cache=[wv(S_*rng.uniform(0.28,0.5),rng.randint(46,80)) for _ in range(8)]
    k=0;tries=0
    while k<n and tries<n*8:
        tries+=1
        x=rng.uniform(10,1250);y=rng.uniform(10,830)
        if fld[int(y*Fx),int(x*Fx)]>0.02: continue
        ys=slice(max(0,int((y-9)*Fx)),int((y+9)*Fx)); xs=slice(max(0,int((x-9)*Fx)),int((x+9)*Fx))
        if fld[ys,xs].max()>0.15: continue
        sp=rng.choice(cache); img.alpha_composite(sp,(int(x*SC-sp.width/2),int(y*SC-sp.height/2))); k+=1
    return img
# ---------- noms de mers et rose des vents ----------
P_ref=None
def labels(img,P=None):
    global P_ref
    P_ref=P if P is not None else P_ref
    d=ImageDraw.Draw(img,'RGBA')
    f_path='/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf'
    def text(txt,x,y,size,ang=0,fill=(235,246,252,225)):
        font=ImageFont.truetype(f_path,int(size*SC))
        sp=int(size*SC*0.18)
        tw=sum(font.getlength(ch)+sp for ch in txt)
        lay=Image.new('RGBA',(int(tw+40),int(size*SC*2)),(0,0,0,0)); ld=ImageDraw.Draw(lay)
        xx=20
        for ch in txt:
            ld.text((xx,size*SC*0.4),ch,font=font,fill=fill); xx+=font.getlength(ch)+sp
        lay=lay.rotate(ang,expand=True,resample=Image.BICUBIC)
        img.alpha_composite(lay,(int(x*SC-lay.width/2),int(y*SC-lay.height/2)))
    # Noms des mers : positions calculées par tools/carte (vraie géographie projetée), sinon liste par défaut.
    import os,json
    path=os.path.join(os.path.dirname(os.path.abspath(__file__)),'etiquettes.json')
    seas=json.load(open(path)) if os.path.exists(path) else [('OCÉAN ATLANTIQUE',120,390,17,78),('MER MÉDITERRANÉE',420,735,14,0)]
    for t,x,y,s,a in seas:
        text(t,x,y,s,a)
    # rose des vents : dans le premier coin de mer libre (loin des côtes)
    spots=[(75,735),(70,330),(1190,800)]
    fx=B.F
    def open_sea(x,y,r=60):
        ys=slice(max(0,int((y-r)*fx)),int((y+r)*fx)); xs=slice(max(0,int((x-r)*fx)),int((x+r)*fx))
        return P_ref['fld'][ys,xs].max()<0.05
    px,py=next(((x,y) for x,y in spots if open_sea(x,y)),spots[0])
    cx,cy,rr=px*SC,py*SC,46*SC
    lay=Image.new('RGBA',(int(rr*3),int(rr*3)),(0,0,0,0)); ld=ImageDraw.Draw(lay); c0=rr*1.5
    ld.ellipse([c0-rr*0.82,c0-rr*0.82,c0+rr*0.82,c0+rr*0.82],outline=(240,250,255,160),width=SC)
    for i in range(8):
        a=math.radians(i*45-90); L=rr if i%2==0 else rr*0.62; wd=rr*0.13 if i%2==0 else rr*0.09
        tip=(c0+math.cos(a)*L,c0+math.sin(a)*L); l=(c0+math.cos(a-1.57)*wd,c0+math.sin(a-1.57)*wd); rgt=(c0+math.cos(a+1.57)*wd,c0+math.sin(a+1.57)*wd)
        ld.polygon([tip,l,(c0,c0)],fill=(250,248,238,235)); ld.polygon([tip,rgt,(c0,c0)],fill=(176,160,130,235))
    ld.ellipse([c0-rr*0.08,c0-rr*0.08,c0+rr*0.08,c0+rr*0.08],fill=(120,40,30,255))
    f=ImageFont.truetype(f_path,int(11*SC)); ld.text((c0-f.getlength('N')/2,c0-rr*1.28),'N',font=f,fill=(250,248,238,240))
    img.alpha_composite(lay,(int(cx-lay.width/2),int(cy-lay.height/2)))
    return img
if __name__=='__main__':
    import time;t=time.time()
    P=B.build(); arr=B.finish(P); print('base',time.time()-t)
    img=Image.fromarray((arr*255).astype('uint8'))
    out=run(img,P); print('glyphs',time.time()-t)
    out=waves(out,P)
    out=labels(out,P); print('labels',time.time()-t)
    out=out.convert('RGB'); out.save('final.png')
    out.resize((1600,1068),Image.LANCZOS).save('final-small.png'); out.crop((1400,1000,3000,2000)).save('final-crop.png')

# Peinture de fond : côtes organiques, relief ombré, couleurs par type, mer avec profondeur
import json, math, sys, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
SC=4; F=2                      # SC = échelle finale (px/unité), F = échelle de calcul des champs
Wb,Hb=1261,842
S=29/math.sqrt(2); R=S/math.sqrt(3)
cells=json.load(open('cells2.json'))
by={(c['q'],c['r']):c for c in cells}
DIRS=[(1,0),(1,1),(0,1),(-1,0),(-1,-1),(0,-1)]
def sea_nb(c):
    for dq,dr in DIRS:
        n=by.get((c['q']+dq,c['r']+dr))
        if n is None or n['type']=='mer': return True
    return False
for c in cells:
    c['cls']={'mer':'mer','plaine':'plaine','moyenne_montagne':'colline','montagne':'montagne','ville':'ville'}.get(c['type'])
    # Une case « côte » qui ne touche aucune mer est peinte comme de la terre (et non plus en hauts-fonds).
    if c['type']=='cote': c['cls']='cote' if sea_nb(c) else 'plaine'
w,h=Wb*F,Hb*F
def hexpts(c,sc,k=1.03):
    return [(c['x']*sc+R*sc*k*math.cos(math.radians(a*60-90)),c['y']*sc+R*sc*k*math.sin(math.radians(a*60-90))) for a in range(6)]
def mask(classes,weight=255,sc=F):
    im=Image.new('L',(int(Wb*sc),int(Hb*sc)),0);d=ImageDraw.Draw(im)
    for c in cells:
        if c['cls'] in classes: d.polygon(hexpts(c,sc),fill=weight)
    return np.asarray(im,dtype=np.float32)/255
def noise(sigma,seed,shape=(h,w)):
    r=np.random.RandomState(seed).randn(*shape).astype(np.float32)
    n=ndi.gaussian_filter(r,sigma,truncate=3.0); return n/n.std()
def smooth(x,a,b): t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
def rgb(*v): return np.array(v,np.float32)
def build():
    G=lambda a,s:ndi.gaussian_filter(a,s,truncate=3.0)
    land_w=mask(['plaine','colline','montagne','ville','cote'])+0.43*mask(['haut_fond'])
    base0=G(land_w,F*3.0)
    amp=np.clip(5.0*base0*(1-base0),0,1)          # le bruit n'agit que près du trait de côte
    fld=base0+amp*(0.20*noise(F*7,1)+0.07*noise(F*2.4,2)+0.025*noise(F*1.0,3))
    land2=fld>0.5
    # appartenance douce aux types
    cls=['plaine','colline','montagne','ville','cote']
    M={c:G(mask([c]),F*1.9)+0.13*noise(F*4.5,10+i) for i,c in enumerate(cls)}
    # le littoral prend la couleur de la terre voisine : on le fond dans la plaine
    M['plaine']=M['plaine']+0.8*M['cote']; del M['cote']
    for k in M: M[k]=np.clip(M[k],0,None)**3
    M['plaine']=M['plaine']+0.9*M['ville']; del M['ville']  # les villes prennent le sol de la plaine (motif dessiné ensuite)
    tot=sum(M.values())
    W_={k:v/(tot+1e-4) for k,v in M.items()}
    W_['plaine']=W_['plaine']+np.clip(1-sum(W_.values()),0,1)
    # --- texture champs (plaine)
    rs=np.random.RandomState(7); n_seed=int(Wb*Hb/ (S*S*0.75))
    pts=np.zeros((h,w),bool); pts[rs.randint(0,h,n_seed),rs.randint(0,w,n_seed)]=True
    _,idx=ndi.distance_transform_edt(~pts,return_indices=True)
    lab=idx[0]*w+idx[1]
    uniq,inv=np.unique(lab,return_inverse=True); inv=inv.reshape(h,w)
    pal=np.array([(0.55,0.73,0.31),(0.63,0.78,0.33),(0.49,0.69,0.30),(0.72,0.79,0.36),(0.58,0.70,0.27),(0.80,0.78,0.38),(0.46,0.66,0.33)],np.float32)
    fcol=pal[rs.randint(0,len(pal),len(uniq))][inv]
    edge=(np.abs(np.diff(inv,axis=0,prepend=inv[:1]))+np.abs(np.diff(inv,axis=1,prepend=inv[:,:1])))>0
    edge=ndi.binary_dilation(edge,iterations=1).astype(np.float32)
    plain_col=(fcol*0.6+0.4*rgb(0.58,0.74,0.32))*(1-0.06*edge[...,None])
    # forêts
    fo=noise(F*5.5,21)+0.5*noise(F*2,22)
    forest=smooth(fo,0.7,1.3)
    # --- couleurs
    hill_base=rgb(0.80,0.69,0.42); hill_alt=rgb(0.67,0.66,0.37)
    hn=smooth(noise(F*9,31),-0.3,1.1)[...,None]
    hill_col=hill_base*(1-hn)+hill_alt*hn
    rock=rgb(0.64,0.62,0.59); ridged=0.5+0.15*noise(F*6,41); rock_col=rock*(0.92+0.14*noise(F*5,42)[...,None])
    city_col=rgb(0.84,0.76,0.58)
    forest_col=rgb(0.27,0.46,0.25)
    land=np.clip(W_['plaine'][...,None]*0+0,0,1)+(W_['plaine'][...,None]*plain_col+W_['colline'][...,None]*hill_col+W_['montagne'][...,None]*rock_col+0)
    fw=(forest*(W_['plaine']+0.7*W_['colline']))[...,None]*0.75
    land=land*(1-fw)+forest_col*fw
    # --- relief
    hgt=(0.10*W_['plaine']+0.45*W_['colline']+0.9*W_['montagne'])
    hgt=hgt+W_['colline']*0.06*noise(F*6,51)+W_['montagne']*0.12*noise(F*5,52)
    hgt=np.where(fld>0.35,G(hgt,F*1.0),0.10)
    gy,gx=np.gradient(G(hgt,F*0.8))
    shade=np.clip(0.5+15*(gx+gy)*0.7071,0,1)
    land=land*(0.78+0.44*shade[...,None])
    # ombre de couvert (forêts légèrement plus sombres au bord bas-droite)
    land=np.clip(land,0,1)
    return dict(fld=fld,land=land.astype(np.float32),W=W_,hgt=hgt,mask_haut=mask(['haut_fond']),forest=forest)
def finish(P,SCf=SC):
    fld=P['fld'];G=lambda a,s:ndi.gaussian_filter(a,s,truncate=3.0)
    land2=fld>0.5
    # --- mer
    dist=ndi.distance_transform_edt(~land2).astype(np.float32)/F   # unités plateau
    knots=[0,1.2,3.5,8,18,40,90]
    cols=np.array([(0.62,0.88,0.84),(0.40,0.78,0.86),(0.24,0.64,0.83),(0.17,0.52,0.77),(0.13,0.43,0.70),(0.10,0.35,0.62),(0.09,0.31,0.58)],np.float32)
    sea=np.stack([np.interp(dist,knots,cols[:,i]) for i in range(3)],-1).astype(np.float32)
    shoal=np.clip(G(P['mask_haut'],F*2.2)*1.6,0,1)[...,None]
    sea=sea*(1-0.75*shoal)+rgb(0.66,0.90,0.82)*0.75*shoal
    lab,nl=ndi.label(~land2); lake=(lab!=lab[0,0])&(~land2)
    # Une grande étendue d'eau fermée (ex. la mer Noire) reste peinte en mer ; seules les petites deviennent des lacs.
    sizes=ndi.sum(lake,lab,range(nl+1)); big=np.zeros(nl+1,bool); big[1:]=sizes[1:]>lake.size*0.005; lake=lake&~big[lab]
    lake_d=ndi.distance_transform_edt(lake).astype(np.float32)/F
    lk=np.array([(0.55,0.82,0.88),(0.36,0.70,0.85),(0.24,0.58,0.80)],np.float32)
    lake_col=np.stack([np.interp(lake_d,[0,1.5,5],lk[:,i]) for i in range(3)],-1).astype(np.float32)
    lw=lake[...,None]; sea=np.where(lw,lake_col,sea)
    # ondulations
    n=noise(F*5,61)+0.5*noise(F*2.5,62)
    ripple=np.exp(-((np.sin(n*5.0))**2)*60)*0.5
    ripple2=np.exp(-((np.sin(n*5.0+1.7+noise(F*9,63)*0.6))**2)*90)*0.35
    sea=sea+ (ripple+ripple2)[...,None]*0.045*np.clip(dist/6,0,1)[...,None]
    sea=sea+0.035*noise(F*14,64)[...,None]
    # ombre portée de la terre
    sh=np.roll(np.roll(land2.astype(np.float32),int(F*1.2),axis=0),int(F*0.9),axis=1)
    sh=G(sh,F*1.6)*(1-land2)
    sea=sea*(1-0.30*sh[...,None])
    land=P['land']
    # --- montée à l'échelle finale
    def up(a):
        if a.ndim==2: return np.asarray(Image.fromarray(a).resize((Wb*SCf,Hb*SCf),Image.BICUBIC))
        return np.stack([up(a[...,i]) for i in range(a.shape[-1])],-1)
    fld4=up(fld.astype(np.float32)); land4=up(land); sea4=up(sea)
    del land,sea
    # grain peint haute fréquence
    rs=np.random.RandomState(99)
    grain=ndi.gaussian_filter(rs.randn(Hb*SCf,Wb*SCf).astype(np.float32),0.8); grain/=grain.std()
    land4=land4*(1+0.035*grain[...,None])
    # plage et écume
    wob=ndi.gaussian_filter(np.random.RandomState(5).randn(Hb*SCf,Wb*SCf).astype(np.float32),SCf*3.0,truncate=3.0); wob/=wob.std()
    sand=smooth(0.80+0.09*wob-fld4,0.0,0.10)*(fld4>0.5)   # bande de sable irrégulière
    sand=np.clip(sand*1.1,0,1)
    land4=land4*(1-0.92*sand[...,None])+rgb(0.94,0.87,0.65)*0.92*sand[...,None]
    foam=np.clip(1-np.abs(fld4-0.455)/0.045,0,1)*(fld4<=0.5)
    foam2=np.clip(1-np.abs(fld4-0.40)/0.03,0,1)*(fld4<=0.5)*0.45
    sea4=sea4*(1-0.8*foam[...,None]-0.3*foam2[...,None])+1.0*(0.8*foam+0.3*foam2)[...,None]
    a=smooth(fld4,0.492,0.508)[...,None]
    out=land4*a+sea4*(1-a)
    # liseré sombre fin à la côte
    ink=np.clip(1-np.abs(fld4-0.5)/0.012,0,1)[...,None]*0.18
    out=out*(1-ink)
    return np.clip(out,0,1)
if __name__=='__main__':
    import time;t=time.time()
    P=build();print('build',time.time()-t)
    img=finish(P);print('finish',time.time()-t)
    im=Image.fromarray((img*255).astype('uint8'));im.save('base.png')
    im.resize((1600,1068),Image.LANCZOS).save('base-small.png');im.crop((1400,1000,3000,2000)).save('base-crop.png')

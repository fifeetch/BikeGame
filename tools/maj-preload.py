#!/usr/bin/env python3
"""Vitesse (lot 3) : met à jour dans dist/index.html la liste des fichiers à télécharger tout de suite
(modulepreload), pour que le navigateur charge les 51 modules en parallèle au lieu de les découvrir
un par un. À relancer quand on ajoute un nouveau fichier .js importé par le jeu."""
import re,os
D=os.path.join(os.path.dirname(__file__),'..','dist')
def path(p):return os.path.join(D,p)
html=open(path('index.html')).read()
ver=re.search(r'app\.js\?v=([\w-]+)',html).group(1)
seen=[];spec={};stack=['app.js']
while stack:
  f=stack.pop()
  if f in seen or not os.path.exists(path(f)):continue
  seen.append(f);src=open(path(f)).read()
  for m in re.finditer(r"""(?:import|export)\s+(?:[^'";]*?\sfrom\s+)?['"](\.[^'"]+)['"]""",src):
    raw=m.group(1);p=os.path.normpath(os.path.join(os.path.dirname(f),raw.split('?')[0]))
    if '?' in raw:spec[p]=p+'?'+raw.split('?')[1]
    stack.append(p)
urls=['app.js?v='+ver]+[spec.get(f,f) for f in seen if f!='app.js']
links=''.join(f'<link rel="modulepreload" href="{u}">' for u in urls)
block='<!--preload-->'+links+'<!--/preload-->'
html=re.sub(r'<!--preload-->.*?<!--/preload-->','',html)
html=html.replace('</head>',block+'</head>',1)
open(path('index.html'),'w').write(html)
print(len(urls),'modules préchargés')

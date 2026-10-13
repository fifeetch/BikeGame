"""Read the supplied board art and export aligned, equal-size hex tile data."""
from collections import Counter
from pathlib import Path
from PIL import Image
import json
import math
import sys

ROOT = Path(__file__).resolve().parents[1]
IMAGE = ROOT / 'dist/assets/europe/nouvelle-carte.png'
OUTPUT = ROOT / 'dist/assets/europe/board-data.js'
im = Image.open(IMAGE).convert('RGB')
DX, DY = 29, 25
RADIUS = DY / 1.5
X0, Y0 = 630, 50
OFFSETS = [(-7,-6),(7,-6),(-7,6),(7,6),(-3,-10),(3,-10),(-3,10),(3,10)]

def classify(rgb):
    red, green, blue = rgb
    if blue > green + 17 and blue > red + 45 and green > 95:
        return 'cote'
    if green > red + 9 and green > blue + 24 and red > 70:
        return 'plaine'
    if red > green + 9 and green > blue + 23 and red > 125:
        return 'moyenne_montagne'
    if max(rgb) < 180 and min(rgb) > 55 and max(rgb)-min(rgb) < 50:
        return 'montagne'
    return None

cells={}
for row in range(29):
    y=Y0+DY*row
    for col in range(-28,44):
        x=X0+DX*col-DX*row/2
        if x < 23 or x > 1215 or y > 770:
            continue
        votes=Counter(classify(im.getpixel((round(x+ox),round(y+oy)))) for ox,oy in OFFSETS)
        votes.pop(None,None)
        if not votes or votes.most_common(1)[0][1] < 3:
            continue
        terrain=votes.most_common(1)[0][0]
        cells[f'{col},{row}']={'q':col,'r':row,'x':round(x,2),'y':y,'type':terrain}

# Bergen's icon masks this yellow hex in most sample offsets. Restore it so
# the port remains connected to the rest of Norway on the visible grid.
cells['-1,5']={'q':-1,'r':5,'x':528.5,'y':175,'type':'moyenne_montagne'}

if '--inspect' in sys.argv:
    for row in range(29):
        glyph={'cote':'~','plaine':'.','moyenne_montagne':'m','montagne':'M'}
        print(f'{row:02d} '+''.join(glyph.get(cells.get(f'{col},{row}',{}).get('type'),' ') for col in range(-28,44)))
    print('cells:',len(cells),'terrain:',dict(Counter(t['type'] for t in cells.values())))
    sys.exit()

OUTPUT.write_text('export const MAP_CELLS='+json.dumps(list(cells.values()),ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
print('wrote',OUTPUT,'cells',len(cells),dict(Counter(t['type'] for t in cells.values())))

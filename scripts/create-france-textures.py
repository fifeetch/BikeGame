from pathlib import Path
from PIL import Image, ImageDraw

source = Path(r'C:/Users/Pbaes/AppData/Local/Temp/codex-clipboard-3ea089a2-6f0e-4dd8-b1aa-8401815acc5e.png')
output = Path('dist/assets/france/textures')
output.mkdir(parents=True, exist_ok=True)

image = Image.open(source).convert('RGBA')
centers_x = [203, 367, 532, 697, 865, 1034, 1202, 1378]
rows = {
    'mer': 78,
    'cote': 226,
    'plaine': 380,
    'ville': 536,
    'moyenne_montagne': 700,
    'montagne': 868,
}

size = 160
mask = Image.new('L', (size, size), 0)
draw = ImageDraw.Draw(mask)
draw.polygon([(size // 2, 1), (size - 8, 39), (size - 8, 120),
              (size // 2, size - 1), (8, 120), (8, 39)], fill=255)

for terrain, center_y in rows.items():
    for variant, center_x in enumerate(centers_x):
        left = center_x - size // 2
        top = center_y - size // 2
        tile = image.crop((left, top, left + size, top + size))
        tile.putalpha(mask)
        tile.save(output / f'{terrain}-{variant}.webp', 'WEBP', quality=86, method=6)

print(f'Created {len(rows) * len(centers_x)} France texture variants in {output}')

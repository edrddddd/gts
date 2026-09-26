"""Create web-sized copies without changing original images (requires Pillow)."""
from pathlib import Path
import json
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]

def main():
    sources = list((ROOT / 'media/cursos').rglob('*'))
    sources += [ROOT / 'media/logos' / name for name in ['fondo frase.png', 'load2.png', 'load3.png']]
    sources += [ROOT / 'media/equipodetrabajo' / name for name in ['ceo.jpg', 'Josué Guzmán Linares.jpg']]
    manifest = {}
    for source in sources:
        if source.suffix.lower() not in {'.png', '.jpg', '.jpeg'} or not source.is_file():
            continue
        relative = source.relative_to(ROOT / 'media')
        target = ROOT / 'media/optimized' / relative.with_suffix('.webp')
        target.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source) as original:
            img = ImageOps.exif_transpose(original)
            max_size = 1400 if source.name == 'fondo frase.png' else 960
            if source.name in {'load2.png', 'load3.png'}:
                max_size = 160
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            img.save(target, 'WEBP', quality=83, method=6)
            manifest[source.relative_to(ROOT).as_posix()] = {
                'src': target.relative_to(ROOT).as_posix(), 'width': img.width,
                'height': img.height, 'bytes': target.stat().st_size,
                'originalBytes': source.stat().st_size,
            }
    (ROOT / 'data').mkdir(exist_ok=True)
    (ROOT / 'data/image-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(manifest)} images: {sum(x["originalBytes"] for x in manifest.values()):,} -> {sum(x["bytes"] for x in manifest.values()):,} bytes')

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Builds the round-three play proof for ONE scene: play_template.html with data
inlined, plus assets/ (the painting, every approved painted-in sheep patch, the
shepherd pointer sprite). Patches listed in patches/<scene>/reject.json are left
out. Writes files.json -- the asset list to publish alongside the page.

  python3 tools/ninety-nine-art/build_play.py temple-study-1 --out /path/to/proofs.html
"""
import argparse
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

from generate_art import existing_raw
from process_art import key_green

HERE = Path(__file__).resolve().parent
PATCHES = HERE / 'out' / 'game' / 'patches'
SHEPHERD_DISPLAY_HEIGHT = 58  # CSS px; the sprite ships at 3x for sharp retina rendering


def build_shepherd(assets):
    sprite = Image.fromarray(key_green(Image.open(existing_raw('shepherd-sprite'))))
    sprite = sprite.crop(sprite.getbbox())
    height = SHEPHERD_DISPLAY_HEIGHT * 3
    sprite = sprite.resize((round(sprite.width * height / sprite.height), height), Image.LANCZOS)
    sprite.save(assets / 'shepherd.png', optimize=True)
    # Hotspot = tip of the crook: the highest solid point in the outer third on either side.
    alpha = np.asarray(sprite)[..., 3] > 128
    third = sprite.width // 3
    candidates = []
    for x0, x1 in ((0, third), (sprite.width - third, sprite.width)):
        ys, xs = np.nonzero(alpha[:, x0:x1])
        if len(ys):
            candidates.append((ys.min(), x0 + int(xs[ys == ys.min()].mean())))
    top_y, top_x = min(candidates)
    scale = SHEPHERD_DISPLAY_HEIGHT / height
    return {
        'src': 'assets/shepherd.png',
        'displayHeight': SHEPHERD_DISPLAY_HEIGHT,
        'displayWidth': round(sprite.width * scale, 1),
        'hotspot': [round(top_x * scale, 1), round(top_y * scale, 1)],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('scene')
    parser.add_argument('--out', required=True)
    args = parser.parse_args()

    scene = next(s for s in json.loads((HERE / 'scenes.json').read_text()) if s['id'] == args.scene)
    out = Path(args.out)
    assets = out.parent / 'assets'
    if assets.exists():
        shutil.rmtree(assets)
    (assets / 'sheep').mkdir(parents=True)

    painting = Image.open(existing_raw(f"scene-{args.scene}")).convert('RGB')
    painting.save(assets / 'painting.webp', 'WEBP', quality=90, method=6)

    patch_dir = PATCHES / args.scene
    rejected = set(json.loads((patch_dir / 'reject.json').read_text())) if (patch_dir / 'reject.json').exists() else set()
    patches = []
    for p in json.loads((patch_dir / 'patches.json').read_text()):
        if p['id'] in rejected:
            continue
        name = f"sheep/{p['id']}.webp"
        Image.open(PATCHES / p['file']).save(assets / name, 'WEBP', quality=90, alpha_quality=95, method=6)
        patches.append({k: p[k] for k in ('x', 'y', 'w', 'h', 'visible')} | {'src': f'assets/{name}'})

    data = {
        'scene': {'id': args.scene, 'title': scene['title'], 'reference': scene['reference'],
                  'img': 'assets/painting.webp', 'width': painting.width, 'height': painting.height},
        'patches': patches,
        'shepherd': build_shepherd(assets),
    }
    out.write_text((HERE / 'play_template.html').read_text().replace('__DATA__', json.dumps(data), 1))
    files = sorted(str(p.relative_to(out.parent)) for p in assets.rglob('*') if p.is_file())
    (out.parent / 'files.json').write_text(json.dumps(files))
    print(f'wrote {out.name}: {len(patches)} sheep in the pool ({len(rejected)} rejected), {len(files)} assets, '
          f"{sum((out.parent / f).stat().st_size for f in files) // 1024} KB; shepherd hotspot {data['shepherd']['hotspot']}")


if __name__ == '__main__':
    main()

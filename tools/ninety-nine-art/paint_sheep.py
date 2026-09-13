#!/usr/bin/env python3
"""Paints sheep INTO a finished scene, then lifts each one back out as its own
patch, so every sheep is unique and shares the painting's brush, light and
occlusion (a lamb behind a cage comes back with the cage's edge painted over it).

1. Each round sends the clean scene to xAI's image-edit endpoint with a list of
   hiding places, asking for ~20 sheep and nothing else changed.
   Saved as out/raw/edit-<scene>-<round>.*; existing rounds are never re-billed.
2. Extraction compares each edit to the clean scene (CIE Lab, lightly blurred
   so tiny re-render jitter doesn't count), keeps sheep-sized islands of real
   change, and saves each as an RGBA patch with a feathered mask:
     out/game/patches/<scene>/r<round>-<n>.png  +  patches.json (position, size)
   It also writes a numbered contact sheet for a human pass: any patch that
   isn't a sheep gets listed in out/game/patches/<scene>/reject.json.

  python3 tools/ninety-nine-art/paint_sheep.py temple-study-1 --rounds 1        # fidelity test
  python3 tools/ninety-nine-art/paint_sheep.py temple-study-1 --rounds 7
  python3 tools/ninety-nine-art/paint_sheep.py temple-study-1 --extract-only
"""
import argparse
import base64
import json
import sys
import time
import urllib.error
import urllib.request

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from generate_art import HERE, MODEL, RAW, extension_for, existing_raw, read_key

EDIT_URL = 'https://api.x.ai/v1/images/edits'
PATCHES = HERE / 'out' / 'game' / 'patches'

# Each round hides its sheep somewhere different, so later rounds fill new places.
HIDING_ROUNDS = [
    'curled asleep in the straw of the animal pens, peeking out from behind the stacked dove cages, '
    'lying under a money changer\'s table, half hidden behind a pilgrim\'s robe on the steps, and resting '
    'in the shadow at the base of a column',
    'tucked between the sacks of grain, under the two-wheeled handcart, beside the water jars, behind a '
    'rolled rug, and nosing at the hay bales',
    'among the crowd on the broad steps with only their backs showing, lying beside the children resting in '
    'the shade, behind the low benches, and in the dark gaps of the colonnade',
    'under the canvas awning among its folds, behind a Levite\'s basket, curled beside an old man\'s feet, '
    'half behind the pen\'s wooden rails, and in the far shade near the sanctuary doors',
    'on the reed mats half covered by a draped cloak, behind a stone step edge, nestled in a gap between '
    'people, peering around a column, and lying low in the straw so only an ear and back show',
    'in the distance at the foot of the steps, small among the crowd, behind the coin boxes, in the shadow '
    'under the dove cages, and beside a resting pilgrim\'s bundle',
    'in the corners of the pens, behind the handcart\'s wheel, in the shade of the awning, between two '
    'water jars, and at the edge of the crowd with only a head visible',
]


def edit_prompt(places):
    return (
        'Paint about twenty sheep and lambs into this exact painting, hidden the way a premium hidden-object '
        f'game hides things: {places}, and elsewhere wherever a sheep could naturally shelter. Every sheep '
        'is different -- size, age, pose, and wool from cream to dusty grey and brown, some a little dirty -- '
        'and most are partly covered by something in front of them. Paint them with exactly the same '
        'oil-study brushwork, light direction and soft shadows as the rest of the painting so they belong in '
        'it. Change nothing else: the same composition, people, objects, colors and framing.'
    )


def data_uri(path):
    return 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode()


def request_edit(key, prompt, image_path):
    body = {'model': MODEL, 'prompt': prompt, 'image': {'url': data_uri(image_path)},
            'response_format': 'b64_json', 'resolution': '2k'}
    for attempt in range(2):
        request = urllib.request.Request(
            EDIT_URL, data=json.dumps(body).encode(),
            headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
        )
        try:
            with urllib.request.urlopen(request, timeout=300) as response:
                item = json.load(response)['data'][0]
            break
        except urllib.error.HTTPError as err:
            detail = err.read().decode(errors='replace')
            if attempt == 0 and err.code in (400, 422) and 'resolution' in detail.lower():
                print('  edit endpoint rejected "resolution"; retrying without it')
                body.pop('resolution')
                continue
            sys.exit(f'HTTP {err.code}: {detail[:500]}')
    if item.get('b64_json'):
        return base64.b64decode(item['b64_json'])
    with urllib.request.urlopen(item['url'], timeout=300) as response:
        return response.read()


def run_edits(scene, rounds):
    base = existing_raw(f'scene-{scene}')
    key = None
    for r in range(1, rounds + 1):
        if existing_raw(f'edit-{scene}-{r}'):
            continue
        key = key or read_key()
        print(f'edit round {r} ...', flush=True)
        started = time.time()
        data = request_edit(key, edit_prompt(HIDING_ROUNDS[(r - 1) % len(HIDING_ROUNDS)]), base)
        path = RAW / f'edit-{scene}-{r}{extension_for(data)}'
        path.write_bytes(data)
        print(f'  saved {path.name} {Image.open(path).size[0]}x{Image.open(path).size[1]} ({time.time() - started:.0f}s)')


def lab(rgb):
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)


def extract(scene):
    base_rgb = np.asarray(Image.open(existing_raw(f'scene-{scene}')).convert('RGB'))
    height, width = base_rgb.shape[:2]
    base_lab = lab(cv2.GaussianBlur(base_rgb, (0, 0), 2.0))
    out = PATCHES / scene
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob('r*-*.png'):
        old.unlink()

    patches, fidelity = [], []
    for edit_path in sorted(RAW.glob(f'edit-{scene}-*.*')):
        r = int(edit_path.stem.rsplit('-', 1)[1])
        edit_img = Image.open(edit_path).convert('RGB')
        if edit_img.size != (width, height):
            print(f'  round {r}: edit came back {edit_img.size[0]}x{edit_img.size[1]}, resampled to {width}x{height}')
            edit_img = edit_img.resize((width, height), Image.LANCZOS)
        edit_rgb = np.asarray(edit_img)
        delta = np.linalg.norm(lab(cv2.GaussianBlur(edit_rgb, (0, 0), 2.0)) - base_lab, axis=2)
        fidelity.append((r, float(np.median(delta)), float((delta > 18).mean())))

        changed = (delta > 18).astype(np.uint8)
        changed = cv2.morphologyEx(changed, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        changed = cv2.morphologyEx(changed, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        count, labels, stats, _ = cv2.connectedComponentsWithStats(changed)
        min_area, max_area = (width * height) * 0.00008, (width * height) * 0.012
        n = 0
        for label in range(1, count):
            x, y, w, h, area = (int(v) for v in stats[label])
            if not (min_area <= area <= max_area) or w > width * 0.12 or h > height * 0.2:
                continue
            if area / (w * h) < 0.25:  # thin slivers are re-render seams, not animals
                continue
            pad = 6
            x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(width, x + w + pad), min(height, y + h + pad)
            region = cv2.dilate((labels[y0:y1, x0:x1] == label).astype(np.uint8), np.ones((5, 5), np.uint8))
            soft = np.clip((delta[y0:y1, x0:x1] - 8) / 14, 0, 1) * region
            soft = cv2.GaussianBlur(soft.astype(np.float32), (0, 0), 1.2)
            rgba = np.dstack([edit_rgb[y0:y1, x0:x1], (soft * 255).astype(np.uint8)])
            n += 1
            name = f'r{r}-{n:02d}.png'
            Image.fromarray(rgba).save(out / name, optimize=True)
            patches.append({'id': name[:-4], 'file': f'{scene}/{name}', 'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0,
                            'visible': round(float(soft.sum()), 1)})
    (out / 'patches.json').write_text(json.dumps(patches))
    for r, median, share in fidelity:
        print(f'  round {r}: median change {median:.1f} dE, {share:.1%} of pixels changed noticeably')
    print(f'  {len(patches)} candidate patches -> {out.relative_to(HERE)}')
    contact_sheet(scene, patches)


def contact_sheet(scene, patches, cell=150, cols=10):
    rows = max(1, (len(patches) + cols - 1) // cols)
    sheet = Image.new('RGB', (cols * cell, rows * cell), (58, 52, 46))
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 15)
    for i, p in enumerate(patches):
        img = Image.open(PATCHES / p['file'])
        img.thumbnail((cell - 10, cell - 26), Image.LANCZOS)
        cx, cy = (i % cols) * cell, (i // cols) * cell
        sheet.paste(img, (cx + (cell - img.width) // 2, cy + 20), img)
        draw.text((cx + 4, cy + 2), p['id'], fill=(255, 230, 120), font=font)
    path = HERE / 'out' / f'contact-{scene}.jpg'
    sheet.save(path, quality=85)
    print(f'  contact sheet: {path.relative_to(HERE)}')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('scene')
    parser.add_argument('--rounds', type=int, default=1)
    parser.add_argument('--extract-only', action='store_true')
    args = parser.parse_args()
    if not existing_raw(f'scene-{args.scene}'):
        sys.exit(f'no clean painting for {args.scene} yet')
    if not args.extract_only:
        run_edits(args.scene, args.rounds)
    extract(args.scene)


if __name__ == '__main__':
    main()

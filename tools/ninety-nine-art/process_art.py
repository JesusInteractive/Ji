#!/usr/bin/env python3
"""Turns raw xAI images (out/raw) into game-ready assets (out/game).

Per scene (native resolution -- never resized up or down):
  scenes/<id>.webp        the painting
  scenes/<id>-front.webp  foreground cut-outs (ox, cart, jars, cloth folds, hay
                          strands...) with transparency everywhere else. The game
                          draws it over the sheep, so a sheep can sit behind a
                          fold or down in the straw instead of on top of it.
  scenes/<id>-grain.webp  the painting's brushstroke texture (high-pass, half
                          size), overlaid onto each sheep so it shares the grain.
  scenes/<id>.json        light grid, placement zones/objects, and the scene's
                          own sheep sprites.
  sprites/<id>/sheep-NN.png  sheep keyed from that scene's green-screen sheet.

Placement data comes from occluders.json (hand-marked normalized rects):
  objects  -> GrabCut cut-outs sheep can hide behind
  strands  -> hay / grass / fern regions; the brightest fine strokes (about
              `density` of the region) go in front of sheep
  zones    -> open ground (or sky) where a sheep may stand unoccluded

  python3 tools/ninety-nine-art/process_art.py [--only eden,temple]
"""
import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
RAW = HERE / 'out' / 'raw'
GAME = HERE / 'out' / 'game'
GRID_COLS, GRID_ROWS = 48, 27
LUMA = np.array([0.299, 0.587, 0.114], dtype=np.float32)


def find_raw(stem):
    return next(iter(sorted(RAW.glob(f'{stem}.*'))), None)


def to_px(rect, width, height):
    x, y, w, h = rect
    return int(x * width), int(y * height), max(2, int(w * width)), max(2, int(h * height))


def light_grid(rgb):
    small = cv2.resize(rgb, (GRID_COLS, GRID_ROWS), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small.astype(np.float32), (0, 0), 0.8)
    return ['#%02x%02x%02x' % tuple(int(v) for v in px) for px in small.reshape(-1, 3)]


def grabcut_mask(bgr, rect_px, scale=0.5):
    """Foreground mask for the object inside rect_px, plus the share of the box it fills.

    Seeded with a mask rather than just the box: an ellipse filling most of the
    box is probably the object and its core certainly is. Box-only GrabCut
    loses golden animals against golden grass entirely.
    """
    small = cv2.resize(bgr, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    x, y, w, h = (int(v * scale) for v in rect_px)
    x, y = max(1, x), max(1, y)
    w, h = min(w, small.shape[1] - x - 1), min(h, small.shape[0] - y - 1)
    cx, cy = x + w // 2, y + h // 2
    mask = np.full(small.shape[:2], cv2.GC_BGD, np.uint8)
    mask[y:y + h, x:x + w] = cv2.GC_PR_BGD
    cv2.ellipse(mask, (cx, cy), (max(2, int(w * 0.42)), max(2, int(h * 0.42))), 0, 0, 360, cv2.GC_PR_FGD, -1)
    cv2.ellipse(mask, (cx, cy), (max(1, int(w * 0.14)), max(1, int(h * 0.14))), 0, 0, 360, cv2.GC_FGD, -1)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(small, mask, None, bgd, fgd, 8, cv2.GC_INIT_WITH_MASK)
    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    _count, labels = cv2.connectedComponents(fg)
    if labels[cy, cx]:  # keep only the piece connected to the object's core
        fg = (labels == labels[cy, cx]).astype(np.uint8) * 255
    share = float((fg[y:y + h, x:x + w] > 0).mean())
    return cv2.resize(fg, (bgr.shape[1], bgr.shape[0]), interpolation=cv2.INTER_LINEAR), share


def strands_mask(rgb, rect_px, density=0.35):
    """The brightest fine strokes inside rect_px (about `density` of it), so hay,
    grass or fern fronds read as in front of a sheep, faded out elliptically so
    the region never shows a rectangle."""
    x, y, w, h = rect_px
    lum = rgb[y:y + h, x:x + w].astype(np.float32) @ LUMA
    score = (lum - cv2.GaussianBlur(lum, (0, 0), 2.5)) + 0.35 * (lum - cv2.GaussianBlur(lum, (0, 0), 14.0))
    cut = np.percentile(score, 100 * (1 - density))
    strands = np.clip((score - cut) / (score.std() * 0.35 + 1e-3), 0, 1)
    strands = cv2.GaussianBlur(strands, (0, 0), 0.8)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    distance = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    fade = np.clip((1.0 - distance) / 0.35, 0, 1)
    full = np.zeros(rgb.shape[:2], np.float32)
    full[y:y + h, x:x + w] = strands * fade
    return (full * 255).astype(np.uint8)


def process_scene(scene_id, marks):
    src = find_raw(f'scene-{scene_id}')
    if not src:
        return False
    rgb = np.asarray(Image.open(src).convert('RGB'))
    height, width = rgb.shape[:2]
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    out = GAME / 'scenes'
    out.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgb).save(out / f'{scene_id}.webp', 'WEBP', quality=88, method=6)

    front = np.zeros((height, width), np.uint8)
    for obj in marks.get('objects', []):
        mask, share = grabcut_mask(bgr, to_px(obj['rect'], width, height))
        warn = '  <-- check' if share < 0.15 or share > 0.9 else ''
        print(f"    {obj['kind']:<22} fills {share:5.0%} of its box{warn}")
        front = np.maximum(front, mask)
    for region in marks.get('strands', []):
        front = np.maximum(front, strands_mask(rgb, to_px(region['rect'], width, height), region.get('density', 0.35)))
    front = cv2.GaussianBlur(front, (0, 0), 1.0)  # feather cut-out edges
    Image.fromarray(np.dstack([rgb, front])).save(out / f'{scene_id}-front.webp', 'WEBP', quality=86, alpha_quality=90, method=6)

    lum = rgb.astype(np.float32) @ LUMA
    grain = np.clip((lum - cv2.GaussianBlur(lum, (0, 0), 2.5)) * 2.2 + 128, 0, 255).astype(np.uint8)
    grain = cv2.resize(grain, (width // 2, height // 2), interpolation=cv2.INTER_AREA)
    Image.fromarray(grain).convert('RGB').save(out / f'{scene_id}-grain.webp', 'WEBP', quality=80, method=6)

    meta = {
        'id': scene_id, 'width': width, 'height': height,
        'cols': GRID_COLS, 'rows': GRID_ROWS, 'colors': light_grid(rgb),
        'horizon': marks.get('horizon', 0.3),
        'objects': marks.get('objects', []), 'strands': marks.get('strands', []), 'zones': marks.get('zones', []),
        'sheep': split_sheet(f'sheep-{scene_id}', scene_id),
    }
    (out / f'{scene_id}.json').write_text(json.dumps(meta))
    print(f'  {scene_id}: {width}x{height}, {len(meta["objects"])} objects, {len(meta["strands"])} strand regions, '
          f'{len(meta["zones"])} zones, {len(meta["sheep"])} sheep sprites, front coverage {front.mean() / 2.55:.1f}%')
    return True


def key_green(img):
    a = np.asarray(img.convert('RGB'), dtype=np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    spill = g - np.maximum(r, b)
    alpha = np.clip((70 - spill) / 50, 0, 1)  # spill <= 20 fully opaque, >= 70 fully clear
    g = np.minimum(g, np.maximum(r, b) + 8)  # neutralize green fringe on the edges
    return np.dstack([r, g, b, alpha * 255]).astype(np.uint8)


def split_sheet(stem, subdir, max_side=360, keep=None, prefix='sheep'):
    src = find_raw(stem)
    if not src:
        return []
    rgba = key_green(Image.open(src))
    solid = (rgba[..., 3] > 24).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(cv2.dilate(solid, np.ones((9, 9), np.uint8)))
    figures = [i for i in range(1, count) if stats[i, cv2.CC_STAT_AREA] >= solid.size * 0.002]
    figures.sort(key=lambda i: -stats[i, cv2.CC_STAT_AREA])
    if keep:
        figures = figures[:keep]
    figures.sort(key=lambda i: (stats[i, cv2.CC_STAT_TOP] // 160, stats[i, cv2.CC_STAT_LEFT]))

    out = GAME / 'sprites' / subdir
    out.mkdir(parents=True, exist_ok=True)
    manifest = []
    for n, label in enumerate(figures, start=1):
        x, y, w, h = (int(stats[label, k]) for k in (cv2.CC_STAT_LEFT, cv2.CC_STAT_TOP, cv2.CC_STAT_WIDTH, cv2.CC_STAT_HEIGHT))
        piece = rgba[y:y + h, x:x + w].copy()
        alpha = np.where(labels[y:y + h, x:x + w] == label, piece[..., 3], 0).astype(np.float32)
        alpha = cv2.GaussianBlur(cv2.erode(alpha, np.ones((2, 2), np.uint8)), (0, 0), 0.9)  # soft painted edge
        piece[..., 3] = alpha.astype(np.uint8)
        sprite = Image.fromarray(piece)
        sprite = sprite.crop(sprite.getbbox())
        scale = max_side / max(sprite.size)
        if scale < 1:
            sprite = sprite.resize((round(sprite.width * scale), round(sprite.height * scale)), Image.LANCZOS)
        name = f'{prefix}-{n:02d}.png'
        sprite.save(out / name, optimize=True)
        manifest.append({'file': f'{subdir}/{name}', 'width': sprite.width, 'height': sprite.height})
    return manifest


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--only', help='comma-separated scene ids')
    args = parser.parse_args()
    marks_path = HERE / 'occluders.json'
    marks = json.loads(marks_path.read_text()) if marks_path.exists() else {}
    wanted = {s.strip() for s in args.only.split(',')} if args.only else None

    for scene in json.loads((HERE / 'scenes.json').read_text()):
        if wanted and scene['id'] not in wanted:
            continue
        if scene['id'] in marks:
            process_scene(scene['id'], marks[scene['id']])

    jesus = split_sheet('jesus-sprite', 'jesus', max_side=480, keep=1, prefix='jesus')
    (GAME / 'sprites' / 'jesus.json').write_text(json.dumps(jesus[0] if jesus else None))


if __name__ == '__main__':
    main()

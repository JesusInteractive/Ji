#!/usr/bin/env python3
"""Builds the Jesus cursor for "99 and the One" from the app's own Ask Jesus
portrait, so the Shepherd the player moves has the same face they talk to.

1. Sends assets/jesus-portrait-smiling.png to xAI's image-edit endpoint and
   asks for a waist-up Good Shepherd holding a crook, on green screen.
   (Skipped if out/raw/jesus-cursor.* already exists -- never re-billed.)
2. Keys the green, crops, and writes:
     out/game/sprites/jesus/cursor.png        <= 128x128, the real mouse cursor
     out/game/sprites/jesus/cursor-touch.png  larger copy shown under a finger
     out/game/sprites/jesus/cursor.json       size + hotspot (tip of the crook)

  python3 tools/ninety-nine-art/make_cursor.py
"""
import base64
import json
import sys
import urllib.error
import urllib.request

import numpy as np
from PIL import Image

from generate_art import HERE, MODEL, RAW, REPO, extension_for, existing_raw, read_key
from process_art import key_green

EDIT_URL = 'https://api.x.ai/v1/images/edits'
PORTRAIT = REPO / 'assets' / 'jesus-portrait-smiling.png'
OUT = HERE / 'out' / 'game' / 'sprites' / 'jesus'
CURSOR_MAX = 128  # browsers ignore cursor images larger than 128px
PROMPT = (
    'Keep this exact man -- the same face, hair, beard, skin tone and kind smile -- and paint him as the '
    'Good Shepherd from the waist up, turned slightly toward the viewer, in a white robe with a deep red '
    'mantle, holding a tall wooden shepherd\'s crook in his hand, the hook of the crook rising above his '
    'head toward the upper left. Classical oil painting with warm golden light, like an old-master '
    'biblical painting. Isolated on a perfectly flat, uniform, pure bright green (#00FF00) chroma-key '
    'background: no scenery, no shadow, no gradient.'
)


def portrait_data_uri():
    img = Image.open(PORTRAIT).convert('RGBA')
    flat = Image.new('RGB', img.size, (0, 255, 0))
    flat.paste(img, mask=img.split()[3])  # green behind the transparent areas, matching the requested background
    path = HERE / 'out' / 'portrait-on-green.png'
    path.parent.mkdir(parents=True, exist_ok=True)
    flat.save(path)
    return 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode()


def edit_image(key):
    body = {'model': MODEL, 'prompt': PROMPT, 'image': {'url': portrait_data_uri()}, 'response_format': 'b64_json'}
    request = urllib.request.Request(
        EDIT_URL, data=json.dumps(body).encode(),
        headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            item = json.load(response)['data'][0]
    except urllib.error.HTTPError as err:
        sys.exit(f'HTTP {err.code}: {err.read().decode(errors="replace")[:500]}')
    if item.get('b64_json'):
        return base64.b64decode(item['b64_json'])
    with urllib.request.urlopen(item['url'], timeout=300) as response:
        return response.read()


def build_cursor(src):
    rgba = key_green(Image.open(src))
    sprite = Image.fromarray(rgba)
    sprite = sprite.crop(sprite.getbbox())
    OUT.mkdir(parents=True, exist_ok=True)

    touch = sprite.copy()
    touch.thumbnail((360, 360), Image.LANCZOS)
    touch.save(OUT / 'cursor-touch.png', optimize=True)

    cursor = sprite.copy()
    cursor.thumbnail((CURSOR_MAX, CURSOR_MAX), Image.LANCZOS)
    # A click lands on the hook of the crook: the highest solid point in the left
    # third of the figure (his hair is higher overall, but it's centered).
    alpha = np.asarray(cursor)[..., 3][:, : max(1, cursor.width // 3)]
    ys, xs = np.nonzero(alpha > 128)
    top = ys.min()
    hot_x, hot_y = int(xs[ys == top].min()), int(top)
    cursor.save(OUT / 'cursor.png', optimize=True)
    meta = {'file': 'jesus/cursor.png', 'touch': 'jesus/cursor-touch.png',
            'width': cursor.width, 'height': cursor.height, 'hotspot': [hot_x, hot_y]}
    (OUT / 'cursor.json').write_text(json.dumps(meta))
    print(f'cursor {cursor.width}x{cursor.height}, hotspot {hot_x},{hot_y}; touch {touch.width}x{touch.height}')


def main():
    raw = existing_raw('jesus-cursor')
    if not raw:
        data = edit_image(read_key())
        RAW.mkdir(parents=True, exist_ok=True)
        raw = RAW / f'jesus-cursor{extension_for(data)}'
        raw.write_bytes(data)
        print(f'saved {raw.relative_to(HERE)} {Image.open(raw).size[0]}x{Image.open(raw).size[1]}')
    build_cursor(raw)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Generates the painted artwork for "99 and the One" through xAI's image API.

Every scene in scenes.json gets two images: the backdrop itself, and (when the
scene has a "light" description) a green-screen sheet of sheep painted in that
scene's own light and brushwork, so composited sheep match the painting. Sheep
are never painted into a backdrop -- the game places them at runtime so they
can be re-hidden on every run.

Images are requested at the API's 2K tier and saved exactly as returned; a
scene that comes back under MIN_SCENE is flagged, never upscaled.

Reads XAI_API_KEY from backend/.env and never prints it. A job whose raw
output already exists is skipped, so re-running never re-bills an image.

  python3 tools/ninety-nine-art/generate_art.py --set test2 --dry-run
  python3 tools/ninety-nine-art/generate_art.py --set test2
  python3 tools/ninety-nine-art/generate_art.py --only eden,sheep-eden
"""
import argparse
import base64
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
RAW = HERE / 'out' / 'raw'
API_URL = 'https://api.x.ai/v1/images/generations'
MODEL = 'grok-imagine-image-2.0'
RESOLUTION = '2k'
QUALITY = 'medium'
PRICE_PER_IMAGE = 0.08  # 2K / medium tier, docs.x.ai pricing Sept 2026
MIN_SCENE = (1920, 1080)

STYLE = (
    'A museum-quality oil painting in the tradition of classical biblical illustration and '
    'illuminated manuscripts: deep jewel tones of lapis blue, ruby red and emerald green, warm '
    'burnished gold, glowing lantern light, dramatic chiaroscuro, atmospheric depth, rich textured '
    'brushwork, extremely detailed and sharp. Composed as a wide, busy hidden-object panorama with '
    'small details spread evenly from edge to edge. Saturated, luminous color, never muted or washed out.'
)
# Round 3 art direction: premium hidden-object oil study, not glossy AI wallpaper.
STYLE_STUDY = (
    'An oil painting in the manner of a 19th-century academic oil study, like James Tissot\'s scenes of the '
    'life of Christ: one consistent natural light source, soft believable shadows, a restrained but rich '
    'palette of ochre, raw umber, terracotta, muted lapis blue and madder red, confident visible brushwork '
    'on canvas, one artist\'s hand throughout. A dense, lived-in, detailed wide scene composed as a '
    'hidden-object picture, with many small props, nooks, shadows and overlapping figures. Naturalistic '
    'and grounded: no god rays, no glowing light beams, no lens flare, no haze, no glossy or plastic '
    'surfaces, no oversaturation, no fantasy glow.'
)
SCENE_RULES = 'No sheep, lambs or goats anywhere. No text, lettering, borders, frames, signatures or watermarks.'
CHROMA = (
    'Isolated on a perfectly flat, uniform, pure bright green (#00FF00) chroma-key background: '
    'no ground, no cast shadows, no gradient, no scenery.'
)
SHEEP_POSES = (
    'standing, grazing with head down, lying down with head up, curled up asleep, walking, looking back '
    'over its shoulder, sitting, a lamb leaping, rear view, front view, a lamb lying in profile, and one '
    'lamb peeking out with only its head and shoulders visible'
)

SPRITE_JOBS = [
    {
        'id': 'shepherd-sprite',
        'set': 'test3',
        'aspect': '2:3',
        'prompt': (
            'A single full-length figure of Jesus as the Good Shepherd walking, in a three-quarter side view, '
            'in a plain undyed wool robe and a muted madder-red mantle, leather sandals, holding a plain wooden '
            'shepherd\'s crook, head slightly bowed. Painted as a 19th-century academic oil study with natural '
            'light and visible brushwork, modest and grounded, the whole figure from head to feet in frame. ' + CHROMA
        ),
    },
    {
        'id': 'jesus-sprite',
        'set': 'test1',
        'aspect': '2:3',
        'prompt': (
            'A single full-length figure of Jesus the Good Shepherd walking gently forward in a '
            'three-quarter view, kind expression, white robe, deep red mantle, brown leather sandals, '
            'holding a wooden shepherd\'s crook. Painted as a classical oil painting with warm golden '
            'light and rich fabric folds, the whole figure from head to feet fully in frame. ' + CHROMA
        ),
    },
]


def sheep_prompt(light):
    return (
        'A sprite sheet of twelve separate sheep and lambs arranged in a loose grid with generous empty '
        'space between every figure, none touching or overlapping, each whole figure fully visible: '
        f'{SHEEP_POSES}. Painted as a classical oil painting with visible brushstrokes and canvas texture, '
        f'like figures from an old-master biblical painting, lit by {light}. Cream and warm-white wool '
        'carrying the light and shadow colors of that setting; a few have dark faces and legs. ' + CHROMA
    )


def scene_jobs():
    jobs = []
    for s in json.loads((HERE / 'scenes.json').read_text()):
        jobs.append({
            'id': f"scene-{s['id']}",
            'set': s.get('set', 'all'),
            'aspect': s.get('aspect', '16:9'),
            'prompt': f"{STYLE_STUDY if s.get('style') == 'study' else STYLE} {s['setting']} {SCENE_RULES}",
            'scene': True,
        })
        if s.get('light'):
            jobs.append({
                'id': f"sheep-{s['id']}",
                'set': s.get('set', 'all'),
                'aspect': '1:1',
                'prompt': sheep_prompt(s['light']),
            })
    return jobs


def read_key():
    for line in (REPO / 'backend' / '.env').read_text().splitlines():
        if line.startswith('XAI_API_KEY='):
            key = line.split('=', 1)[1].strip().strip('"').strip("'")
            if key.startswith('xai-'):
                return key
            break
    sys.exit('backend/.env has no real XAI_API_KEY yet (expected a value starting with "xai-").')


def existing_raw(job_id):
    return next(iter(sorted(RAW.glob(f'{job_id}.*'))), None)


def extension_for(data):
    if data[:8] == b'\x89PNG\r\n\x1a\n':
        return '.png'
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        return '.webp'
    return '.jpg'


def post(key, body):
    request = urllib.request.Request(
        API_URL,
        data=json.dumps(body).encode(),
        headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(request, timeout=300) as response:
        item = json.load(response)['data'][0]
    if item.get('b64_json'):
        return base64.b64decode(item['b64_json'])
    with urllib.request.urlopen(item['url'], timeout=300) as response:
        return response.read()


def request_image(key, prompt, aspect):
    body = {
        'model': MODEL, 'prompt': prompt, 'n': 1, 'response_format': 'b64_json',
        'aspect_ratio': aspect, 'resolution': RESOLUTION, 'quality': QUALITY,
    }
    try:
        return post(key, body)
    except urllib.error.HTTPError as err:
        detail = err.read().decode(errors='replace')
        # quality is a nice-to-have; resolution is not -- never silently fall back to a smaller image.
        if err.code in (400, 422) and 'quality' in detail.lower():
            print('  API rejected "quality"; retrying without it')
            body.pop('quality')
            return post(key, body)
        raise urllib.error.HTTPError(err.url, err.code, detail, err.headers, None)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--set', default='test2', help='a set name from scenes.json, or "all"')
    parser.add_argument('--only', help='comma-separated job ids (scene ids may omit the "scene-" prefix)')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    jobs = scene_jobs() + SPRITE_JOBS
    if args.only:
        wanted = {w.strip() for w in args.only.split(',')}
        jobs = [j for j in jobs if j['id'] in wanted or j['id'].removeprefix('scene-') in wanted]
    elif args.set != 'all':
        jobs = [j for j in jobs if j['set'] == args.set]

    pending = [j for j in jobs if not existing_raw(j['id'])]
    print(f'{len(jobs)} jobs, {len(pending)} to generate, est. ${len(pending) * PRICE_PER_IMAGE:.2f}')
    if args.dry_run:
        for job in pending:
            print(f"\n[{job['id']}] {job['aspect']} ({len(job['prompt'])} chars)\n{job['prompt']}")
        return

    key = read_key()
    RAW.mkdir(parents=True, exist_ok=True)
    made, undersized = 0, []
    for job in pending:
        print(f"generating {job['id']} ...", flush=True)
        started = time.time()
        try:
            data = request_image(key, job['prompt'], job['aspect'])
        except urllib.error.HTTPError as err:
            print(f'  HTTP {err.code}: {str(err.msg)[:500]}')
            sys.exit(1)
        path = RAW / f"{job['id']}{extension_for(data)}"
        path.write_bytes(data)
        made += 1
        width, height = Image.open(path).size
        flag = ''
        if job.get('scene') and (width < MIN_SCENE[0] or height < MIN_SCENE[1]):
            undersized.append(job['id'])
            flag = f'  <-- BELOW {MIN_SCENE[0]}x{MIN_SCENE[1]}'
        print(f'  saved {path.relative_to(HERE)} {width}x{height} ({len(data) // 1024} KB, {time.time() - started:.0f}s){flag}')
    print(f'done: {made} images, est. ${made * PRICE_PER_IMAGE:.2f}')
    if undersized:
        sys.exit(f'undersized scenes (not upscaled): {", ".join(undersized)}')


if __name__ == '__main__':
    main()

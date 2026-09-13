#!/usr/bin/env python3
"""Builds the art-proof page: preview_template.html with scene data inlined,
plus an assets/ folder (paintings, foreground cut-outs, grain maps, sprites)
next to it, referenced by relative path so full-resolution art isn't bloated
into base64. Also writes files.json -- the asset list to publish alongside.

  python3 tools/ninety-nine-art/build_preview.py --set test2 --out /path/to/proofs.html
"""
import argparse
import json
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
GAME = HERE / 'out' / 'game'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--set', default='test2')
    parser.add_argument('--out', default=str(HERE / 'out' / 'preview' / '99-and-the-one-proofs.html'))
    args = parser.parse_args()

    out = Path(args.out)
    assets = out.parent / 'assets'
    if assets.exists():
        shutil.rmtree(assets)
    (assets / 'sprites').mkdir(parents=True)

    def publish(src, rel):
        dest = assets / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        return f'assets/{rel}'

    data = {'scenes': [], 'jesus': None}
    for scene in json.loads((HERE / 'scenes.json').read_text()):
        meta_path = GAME / 'scenes' / f"{scene['id']}.json"
        if scene.get('set') != args.set or not meta_path.exists():
            continue
        sid = scene['id']
        meta = json.loads(meta_path.read_text())
        for sprite in meta['sheep']:
            sprite['src'] = publish(GAME / 'sprites' / sprite['file'], f"sprites/{sprite['file']}")
        data['scenes'].append({
            'id': sid, 'title': scene['title'], 'reference': scene['reference'],
            'img': publish(GAME / 'scenes' / f'{sid}.webp', f'{sid}.webp'),
            'front': publish(GAME / 'scenes' / f'{sid}-front.webp', f'{sid}-front.webp'),
            'grain': publish(GAME / 'scenes' / f'{sid}-grain.webp', f'{sid}-grain.webp'),
            'meta': meta,
        })

    cursor = json.loads((GAME / 'sprites' / 'jesus' / 'cursor.json').read_text())
    data['cursor'] = {
        **cursor,
        'src': publish(GAME / 'sprites' / cursor['file'], f"sprites/{cursor['file']}"),
        'touch': publish(GAME / 'sprites' / cursor['touch'], f"sprites/{cursor['touch']}"),
    }

    html = (HERE / 'preview_template.html').read_text().replace('__DATA__', json.dumps(data), 1)
    out.write_text(html)
    files = sorted(str(p.relative_to(out.parent)) for p in assets.rglob('*') if p.is_file())
    (out.parent / 'files.json').write_text(json.dumps(files))
    total = sum((out.parent / f).stat().st_size for f in files) // 1024
    print(f"wrote {out.name} ({out.stat().st_size // 1024} KB) + {len(files)} assets ({total} KB), {len(data['scenes'])} scenes")


if __name__ == '__main__':
    main()

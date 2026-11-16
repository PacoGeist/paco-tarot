"""Prepares the web (iPhone) app in ../iphone for publishing. Run it after changing anything in iphone/:
   python3 tools/build_web.py
 - writes iphone/js/version.js from iphone/version.json (the one place the version number lives)
 - writes iphone/files.json: every file the app needs offline, with a fingerprint of their contents,
   which is what Settings → Check for updates → Update now downloads
 - makes the home-screen icons in iphone/icons from tools/icon512.png"""
import json, os, hashlib
from PIL import Image
T = os.path.dirname(os.path.abspath(__file__)); W = os.path.join(T, '..', 'iphone')
v = json.load(open(os.path.join(W, 'version.json')))
open(os.path.join(W, 'js', 'version.js'), 'w').write(
    '/* made by tools/build_web.py from version.json */\nwindow.APP_VERSION = %s;\n' % json.dumps({'version': v['version'], 'code': v['androidVersionCode'], 'date': v.get('date', '')}))

os.makedirs(os.path.join(W, 'icons'), exist_ok=True)
src = Image.open(os.path.join(T, 'icon512.png')).convert('RGBA')
bg = (11, 8, 18, 255)
def flat(size, pad=0):
    im = Image.new('RGBA', (size, size), bg); inner = size - 2 * pad
    ic = src.resize((inner, inner), Image.LANCZOS); im.alpha_composite(ic, (pad, pad)); return im.convert('RGB')
flat(180).save(os.path.join(W, 'icons', 'apple-touch-icon.png'))
flat(192).save(os.path.join(W, 'icons', 'icon-192.png'))
flat(512).save(os.path.join(W, 'icons', 'icon-512.png'))
flat(512, 52).save(os.path.join(W, 'icons', 'icon-maskable-512.png'))   # safe zone for round masks

SKIP = {'sw.js', 'files.json', 'version.json', '.nojekyll'}
files, h = [], hashlib.sha256()
for root, dirs, names in os.walk(W):
    dirs[:] = sorted(d for d in dirs if not d.startswith('.'))
    for n in sorted(names):
        rel = os.path.relpath(os.path.join(root, n), W).replace(os.sep, '/')
        if rel in SKIP or n.startswith('.'): continue
        files.append(rel); h.update(rel.encode()); h.update(open(os.path.join(root, n), 'rb').read())
json.dump({'version': v['version'], 'hash': h.hexdigest()[:12], 'files': files}, open(os.path.join(W, 'files.json'), 'w'), indent=0)
print('web app', v['version'], '-', len(files), 'files, fingerprint', h.hexdigest()[:12])

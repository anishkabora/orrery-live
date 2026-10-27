#!/usr/bin/env python3
"""Build Orrery Live into a single self-contained page.

    python3 build.py            -> dist/index.html  (website build)
    python3 build.py --artifact -> dist/artifact.html (body-only, for hosts that add their own <head>)

No dependencies beyond the Python standard library. Libraries (three.js,
satellite.js, topojson-client) load from public CDNs at runtime.
"""
import json
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
DATA = os.path.join(ROOT, 'data')
DIST = os.path.join(ROOT, 'dist')

# Order matters: later files use globals defined by earlier ones.
MODULES = ['data', 'astro', 'textures', 'surfaces', 'shaders', 'satmodels', 'scene', 'deep',
           'controls', 'sims', 'ui', 'info', 'explore', 'skyview', 'tour', 'main']

LIBS = [
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdn.jsdelivr.net/npm/satellite.js@5.0.0/dist/satellite.min.js',
    'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js',
]

RESET = ('html,body{margin:0;padding:0}body{font:14px system-ui,sans-serif}'
         ':root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
         'img{max-width:100%}[hidden]{display:none!important}')

META = '''<meta name="description" content="Orrery Live: an interactive 3D Solar System and deep-sky explorer with live planet, Moon and satellite positions computed in your browser.">
<meta property="og:title" content="Orrery Live">
<meta property="og:description" content="Explore the Solar System as it is right now: live planets, satellites, sliceable interiors, a sky view from anywhere on Earth, and black-hole simulations.">
<meta property="og:type" content="website">
<meta name="theme-color" content="#03060d">'''


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def build(artifact=False):
    page = read(os.path.join(SRC, 'page.html'))
    split = page.index('<div id="orr">')
    head_part, body_part = page[:split], page[split:]

    countries = json.load(open(os.path.join(DATA, 'countries-110m.json'), encoding='utf-8'))
    land = json.load(open(os.path.join(DATA, 'land-50m.json'), encoding='utf-8'))
    data_js = ('<script>window.COUNTRIES_TOPO=' + json.dumps(countries, separators=(',', ':')) + ';</script>\n'
               '<script>window.LAND50=' + json.dumps(land, separators=(',', ':')) + ';</script>\n')
    libs = ''.join(f'<script src="{u}"></script>\n' for u in LIBS)
    app = '<script>\n' + '\n'.join(read(os.path.join(SRC, m + '.js')) for m in MODULES) + '\n</script>\n'

    os.makedirs(DIST, exist_ok=True)
    if artifact:
        out, name = page + '\n' + libs + data_js + app, 'artifact.html'
    else:
        out = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
               '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
               f'<style>{RESET}</style>\n{META}\n{head_part}\n</head>\n<body>\n{body_part}\n'
               f'{libs}{data_js}{app}</body>\n</html>\n')
        name = 'index.html'
        tle = os.path.join(DATA, 'tle.json')
        if os.path.exists(tle):
            os.makedirs(os.path.join(DIST, 'data'), exist_ok=True)
            shutil.copy(tle, os.path.join(DIST, 'data', 'tle.json'))
    with open(os.path.join(DIST, name), 'w', encoding='utf-8') as f:
        f.write(out)
    print(f'wrote dist/{name} ({len(out) / 1024:.0f} KB)')


if __name__ == '__main__':
    build(artifact='--artifact' in sys.argv)

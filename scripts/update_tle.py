#!/usr/bin/env python3
"""Fetch fresh two-line elements from CelesTrak for the satellites shown in Orrery Live.

Writes data/tle.json. Each line's checksum is verified; a satellite that cannot be
fetched keeps its previous elements, so a CelesTrak outage never breaks the site.

    python3 scripts/update_tle.py
"""
import datetime
import json
import os
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'tle.json')

# app id -> NORAD catalogue number
SATS = {
    'iss': 25544, 'css': 48274, 'hst': 20580, 'insat3dr': 41752, 'irnss1i': 43286,
    'cartosat3': 44804, 'goes16': 41866, 'goes18': 51850, 'gps72': 40294,
    'sentinel2a': 40697, 'aqua': 27424, 'sl32298': 61525, 'sl1063': 44768,
}
URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR={}&FORMAT=TLE'


def checksum_ok(line):
    if len(line) < 69:
        return False
    total = sum(int(c) if c.isdigit() else (1 if c == '-' else 0) for c in line[:68])
    return total % 10 == int(line[68])


def fetch(catnr):
    req = urllib.request.Request(URL.format(catnr), headers={'User-Agent': 'orrery-live/1.0 (+https://github.com)'})
    with urllib.request.urlopen(req, timeout=20) as r:
        lines = [l.rstrip() for l in r.read().decode('ascii', 'replace').splitlines() if l.strip()]
    l1 = next((l for l in lines if l.startswith('1 ')), None)
    l2 = next((l for l in lines if l.startswith('2 ')), None)
    if l1 and l2 and checksum_ok(l1) and checksum_ok(l2):
        return l1, l2
    raise ValueError('no valid TLE returned')


def main():
    old, old_date = {}, None
    if os.path.exists(OUT):
        with open(OUT, encoding='utf-8') as f:
            prev = json.load(f)
        old = {s['id']: s for s in prev.get('sats', [])}
        old_date = prev.get('date')
    sats, fresh = [], 0
    for sid, catnr in SATS.items():
        try:
            l1, l2 = fetch(catnr)
            sats.append({'id': sid, 'l1': l1, 'l2': l2})
            fresh += 1
        except Exception as e:  # keep previous elements on any failure
            print(f'{sid}: {e}')
            if sid in old:
                sats.append(old[sid])
    date = datetime.datetime.now(datetime.timezone.utc).strftime('%d %b %Y')
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump({'date': date if fresh else (old_date or date), 'sats': sats}, f, indent=1)
    print(f'updated {fresh}/{len(SATS)} satellites -> data/tle.json')


if __name__ == '__main__':
    main()

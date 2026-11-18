#!/usr/bin/env python3
"""Stamps a new build number into index.html and version.json.
The running game compares its own number with version.json and offers a reload when a newer one is live."""
import json, os, re, time
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = os.path.join(root, 'index.html')
s = open(p, encoding='utf-8').read()
v = int(time.time())
s, n = re.subn(r'const BUILD=\d+;', 'const BUILD=%d;' % v, s, count=1)
assert n == 1, 'BUILD constant not found in index.html'
open(p, 'w', encoding='utf-8').write(s)
json.dump({'v': v}, open(os.path.join(root, 'version.json'), 'w'))
print('build', v)

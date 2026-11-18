# Embeds the trimmed sounds and the game font into index.html (idempotent).
import base64, re, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = os.path.join(root, 'index.html')
s = open(p).read()
snd = {}
gd = os.path.join(root, 'sounds', 'game')
for f in sorted(os.listdir(gd)):
    if f.endswith('.mp3'):
        snd[f[:-4]] = base64.b64encode(open(os.path.join(gd, f), 'rb').read()).decode()
js = 'const SND={' + ','.join('%s:"%s"' % (k, v) for k, v in snd.items()) + '};//SND'
s, n1 = re.subn(r'const SND=\{.*?\};//SND', lambda m: js, s, count=1, flags=re.S)
font = base64.b64encode(open(os.path.join(root, 'fonts', 'LuckiestGuy.woff2'), 'rb').read()).decode()
css = '/*FONT*/@font-face{font-family:"PG";src:url(data:font/woff2;base64,' + font + ') format("woff2");font-display:swap}/*FONT*/'
s, n2 = re.subn(r'/\*FONT\*/.*?/\*FONT\*/', lambda m: css, s, count=1, flags=re.S)
assert n1 == 1 and n2 == 1, (n1, n2)
open(p, 'w').write(s)
print('embedded', len(snd), 'sounds, font', len(font), 'chars; file', len(s))

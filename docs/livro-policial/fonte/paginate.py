# Descobre a página impressa de cada capítulo no PDF e grava toc.json
import json, re, subprocess, sys, glob, os
pdf = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout).group(1))
norm = lambda s: re.sub(r'\s+', '', s)
pages = [norm(subprocess.run(['pdftotext', '-f', str(i), '-l', str(i), pdf, '-'], capture_output=True, text=True).stdout) for i in range(1, n + 1)]
chaps = []
for f in sorted(glob.glob(os.path.join(here, 'cap*.txt'))):
    for l in open(f):
        if l.startswith('CAP|'):
            _, label, title = l.strip().split('|'); chaps.append((label, title))
toc, start, offset = {}, 0, None
for label, title in chaps:
    key = f"{label.replace('Capítulo ', '')}. {title}"
    probe = norm(label.upper()) + norm(title)[:20]
    for i in range(start, n):
        if pages[i].startswith(probe):
            if offset is None: offset = i
            toc[key] = i - offset + 1; start = i + 1; break
    else:
        sys.exit('não achei: ' + key)
json.dump(toc, open(os.path.join(here, 'toc.json'), 'w'), ensure_ascii=False, indent=0)
print(len(toc), 'capítulos; total de páginas', n, '; páginas numeradas', n - offset)

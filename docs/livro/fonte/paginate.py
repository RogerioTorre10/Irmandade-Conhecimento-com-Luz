# Descobre a página impressa de cada capítulo no PDF e grava toc.json
import json, re, subprocess, sys
pdf = sys.argv[1]
n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout).group(1))
norm = lambda s: re.sub(r'\s+', '', s)
pages = [norm(subprocess.run(['pdftotext', '-f', str(i), '-l', str(i), pdf, '-'], capture_output=True, text=True).stdout) for i in range(1, n + 1)]
blocks = json.load(open('blocks.json'))
toc, start, offset = {}, None, None
for b in blocks:
    if b['t'] != 'chap': continue
    key = f"{b['label'].replace('Capítulo ', '')}. {b['title']}" if b['label'] else b['title']
    probe = norm(b['title'])[:30]
    lo = (start or 1)
    for i in range(lo, n):
        if pages[i].startswith(norm(b['label'].upper()) + probe):
            if offset is None: offset = i  # prólogo = página 1
            toc[key] = i - offset + 1; start = i + 1; break
    else:
        sys.exit('não achei: ' + key)
json.dump(toc, open('toc.json', 'w'), ensure_ascii=False, indent=0)
print(len(toc), 'capítulos; total de páginas', n, '; última página numerada', n - offset)

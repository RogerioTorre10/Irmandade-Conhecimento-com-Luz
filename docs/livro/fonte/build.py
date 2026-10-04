#!/usr/bin/env python3
"""Monta o livro a partir de src/*.txt.

Marcação das fontes:
  PARTE|Parte I|Subtítulo        -> página de abertura de parte
  CAP|Rótulo|Título              -> capítulo (Rótulo pode ser vazio, ex.: Prólogo)
  SUB|Texto                      -> intertítulo
  QUOTE|Texto                    -> citação em destaque
  @123                           -> parágrafo 123 do texto original (livro.md)
  @123|antigo=>novo              -> idem, com substituição de trecho
  qualquer outra linha           -> parágrafo novo
"""
import glob, json, re, sys

orig = {}
for i, line in enumerate(open('livro.md', encoding='utf-8'), 1):
    line = line.rstrip('\n')
    m = re.match(r'^\[(?:normal|Heading \d)\] ?(.*)$', line)
    if m:
        orig[i] = m.group(1).strip()

# resíduos de citação colados no fim do parágrafo: "família.pepsic.bvsalud+3"
JUNK = re.compile(r'([.!?…”"\)])\s*[a-z][\w.\-]*(?:\+\d+)?[a-z]*$')

def clean(t):
    t = t.strip()
    for _ in range(2):
        t = JUNK.sub(r'\1', t)
    t = re.sub(r'\s+', ' ', t)
    return t

blocks, used = [], {}
for path in sorted(glob.glob('src/*.txt')):
    for raw in open(path, encoding='utf-8'):
        line = raw.strip()
        if not line or line.startswith('//'):
            continue
        if line.startswith('@'):
            ref, *rep = line[1:].split('|')
            n = int(ref)
            if n not in orig or not orig[n]:
                sys.exit(f'{path}: referência inválida @{n}')
            if n in used:
                sys.exit(f'{path}: @{n} já usado em {used[n]}')
            used[n] = path
            text = clean(orig[n])
            for r in rep:
                a, b = r.split('=>')
                if a not in text:
                    sys.exit(f'{path}: @{n}: trecho não encontrado: {a!r}')
                text = text.replace(a, b, 1)
            blocks.append({'t': 'p', 'text': text})
        elif '|' in line and line.split('|')[0] in ('PARTE', 'CAP', 'SUB', 'QUOTE'):
            kind, *rest = line.split('|')
            if kind == 'PARTE':
                blocks.append({'t': 'part', 'label': rest[0], 'title': rest[1]})
            elif kind == 'CAP':
                blocks.append({'t': 'chap', 'label': rest[0], 'title': rest[1]})
            elif kind == 'SUB':
                blocks.append({'t': 'sub', 'text': rest[0]})
            else:
                blocks.append({'t': 'quote', 'text': rest[0]})
        else:
            blocks.append({'t': 'p', 'text': line})

json.dump(blocks, open('blocks.json', 'w', encoding='utf-8'), ensure_ascii=False)
words = sum(len(b.get('text', '').split()) for b in blocks)
new = sum(len(b['text'].split()) for b in blocks if b['t'] == 'p') - sum(
    len(clean(orig[n]).split()) for n in used)
print(f'blocos={len(blocks)} palavras={words} originais_usados={len(used)} palavras_novas~{new}')

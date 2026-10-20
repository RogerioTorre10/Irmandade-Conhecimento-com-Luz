#!/usr/bin/env python3
"""Monta Os Dois Lados do Mesmo Pensamento a partir de src/*.txt.

Marcação das fontes:
  PARTE|Parte I|Título      -> página de abertura de parte
  CAP|Rótulo|Título         -> capítulo (Rótulo pode ser vazio, ex.: Prólogo)
  SUB|Texto                 -> intertítulo
  QUOTE|Texto               -> citação em destaque
  // comentário             -> ignorado
  qualquer outra linha      -> parágrafo
"""
import glob, json, re

blocks = []
for path in sorted(glob.glob('src/*.txt')):
    for raw in open(path, encoding='utf-8'):
        line = re.sub(r'\s+', ' ', raw.strip())
        if not line or line.startswith('//'):
            continue
        kind, *rest = line.split('|')
        if kind == 'PARTE':
            blocks.append({'t': 'part', 'label': rest[0], 'title': rest[1]})
        elif kind == 'CAP':
            blocks.append({'t': 'chap', 'label': rest[0], 'title': rest[1]})
        elif kind == 'SUB':
            blocks.append({'t': 'sub', 'text': rest[0]})
        elif kind == 'QUOTE':
            blocks.append({'t': 'quote', 'text': rest[0]})
        else:
            if line.startswith('[SUA VOZ'):
                line = '**' + line + '**'   # destaque para o autor completar
            blocks.append({'t': 'p', 'text': line})

json.dump(blocks, open('blocks.json', 'w', encoding='utf-8'), ensure_ascii=False)
words = sum(len((b.get('text') or b.get('title', '')).split()) for b in blocks)
print(f'blocos={len(blocks)} palavras={words}')

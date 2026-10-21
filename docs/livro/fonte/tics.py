import json,re,sys
b=json.load(open(sys.argv[1] if len(sys.argv)>1 else 'blocks.json'))
T=' '.join(x.get('text','') for x in b if x['t']=='p')
pats={'não porque':r'[Nn]ão porque','ao invés de':r'[Aa]o invés de','em vez de':r'[Ee]m vez de','não se trata':r'[Nn]ão se trata','não é X; é/mas':r'[Nn]ão é [^.;]{1,60}[;,] (?:mas )?(?:é|ela é|ele é)\b','não apenas/mas':r'não (?:apenas|só) [^.]{1,80}, mas','travessão':r'—','talvez':r'[Tt]alvez','justamente':r'justamente','no fundo':r'[Nn]o fundo','por isso':r'[Pp]or isso','há quem':r'[Hh]á quem','ponto e vírgula':r';','é nesse ponto/aqui':r'É (?:nesse|neste) ponto|É aqui que|É por isso que|É nesse','um X; o outro':r'[Uu]m[a]? [^.;]{1,30}; (?:o|a) outr[oa]'}
w=len(T.split())
print('palavras',w)
for k,p in pats.items():
    n=len(re.findall(p,T)); print(f'{k:22s} {n:5d}  ({n*1000/w:.1f}/mil)')
# anáforas: frases consecutivas começando com mesmas 2 palavras
an=0
for x in b:
    if x['t']!='p': continue
    s=[t.strip() for t in re.split(r'(?<=[.!?])\s+',x['text']) if t.strip()]
    st=[' '.join(t.split()[:2]).lower() for t in s]
    an+=sum(1 for i in range(1,len(st)) if st[i]==st[i-1])
print('anáforas (frases seguidas c/ mesmo início)',an)
